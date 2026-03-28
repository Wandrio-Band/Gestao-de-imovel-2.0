'use server';

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { revalidatePath } from 'next/cache';
import { generateContractNumber } from '@/utils/generators';
import { logAudit } from '@/lib/audit';
import { requireAuth } from '@/lib/auth-guard';
import { contractSchema } from '@/lib/action-schemas';

/**
 * @module actions/contract-management
 * @description Server Actions para criação e edição de contratos de aluguel.
 * Gerencia o fluxo completo: upsert de inquilino, upsert de contrato,
 * sincronização com o modelo Lease (legado) e atualização do status do ativo.
 * 
 * @remarks
 * Este módulo mantém compatibilidade com o modelo Lease (legado) enquanto
 * o módulo novo (Contract + Tenant) é a fonte principal de dados.
 * Ao salvar um contrato, também recria o Lease correspondente.
 */

interface MinimalContractData {
    id?: string;
    assetId?: string;
    contractNumber?: string;
    nomeInquilino: string;
    documentoInquilino: string;
    emailInquilino: string;
    valorAluguel: string;
    diaVencimento: string;
    tipoGarantia: string;
    inicioVigencia: string;
    fimContrato: string;
    indexador: string;
    contractFile?: { name: string; data: string } | null;
}

/**
 * Cria ou atualiza um contrato de aluguel com todos os relacionamentos.
 * 
 * Fluxo:
 * 1. Valida input com contractSchema (Zod)
 * 2. Upsert do inquilino (busca por documento ou nome)
 * 3. Upsert do contrato (Contract)
 * 4. Sincroniza com Lease legado (delete + recreate)
 * 5. Atualiza Asset.status para 'Locado' e Asset.rentalValue
 * 6. Registra auditoria
 * 
 * @param {MinimalContractData} data - Dados do contrato vindos do formulário
 * @returns {Promise<{success: boolean, error?: string}>}
 * 
 * @remarks
 * - Parse de moeda: remove tudo exceto dígitos e divide por 100 (ex: "269000" → 2690.00)
 * - Datas: adiciona T12:00:00Z para evitar problemas de timezone
 * - Se documento do inquilino não é informado, gera "UNK-{timestamp}"
 */
export async function saveStandaloneContract(data: MinimalContractData) {
    const session = await requireAuth();
    const actorName = session.user?.name || session.user?.email || 'Unknown';

    const validation = contractSchema.safeParse(data);
    if (!validation.success) {
        return { success: false, error: `Dados inválidos: ${validation.error.issues.map(i => i.message).join(', ')}` };
    }

    try {
        if (!data.assetId) throw new Error("Asset ID is required");

        // 1. Prepare Values
        const valorParsed = parseFloat(data.valorAluguel.replace(/\D/g, '')) / 100;
        const diaParsed = parseInt(data.diaVencimento.replace(/\D/g, '')) || 5;
        // Fix Start Date: append time to avoid timezone shifts if just YYYY-MM-DD
        const startDate = data.inicioVigencia ? new Date(`${data.inicioVigencia}T12:00:00Z`) : new Date();

        // 2. Upsert Tenant
        let tenantId = '';
        const doc = data.documentoInquilino && data.documentoInquilino.length > 5 ? data.documentoInquilino : null;

        // Try to find tenant
        let tenant = null;

        await prisma.$transaction(async (tx) => {
            if (doc) {
                tenant = await tx.tenant.findUnique({ where: { document: doc } });
            }
            if (!tenant) {
                // Try by name fallback if no doc provided? Or precise match
                tenant = await tx.tenant.findFirst({ where: { name: data.nomeInquilino } });
            }

            if (tenant) {
                // Update existing
                await tx.tenant.update({
                    where: { id: tenant.id },
                    data: {
                        name: data.nomeInquilino,
                        email: data.emailInquilino,
                        // doc cannot be updated if it's the unique key and exists
                    }
                });
                tenantId = tenant.id;
            } else {
                // Create new
                const newTenant = await tx.tenant.create({
                    data: {
                        name: data.nomeInquilino,
                        document: doc || `UNK-${Date.now()}`,
                        email: data.emailInquilino
                    }
                });
                tenantId = newTenant.id;
            }

            // 3. Upsert Contract (SQL Table)
            let contractId = data.id;
            let contractNumber = data.contractNumber;

            if (contractId) {
                await tx.contract.update({
                    where: { id: contractId },
                    data: {
                        baseValue: valorParsed,
                        currentValue: valorParsed,
                        dueDay: diaParsed,
                        startDate: startDate,
                        adjustmentIndex: data.indexador,
                        // If we want to allow moving asset? Maybe not for now.
                        // tenant can be updated
                        tenantId: tenantId
                    }
                });
            } else {
                contractNumber = await generateContractNumber();
                const newContract = await tx.contract.create({
                    data: {
                        contractNumber,
                        assetId: data.assetId,
                        tenantId: tenantId,
                        baseValue: valorParsed,
                        currentValue: valorParsed,
                        dueDay: diaParsed,
                        startDate: startDate,
                        adjustmentIndex: data.indexador,
                        status: 'active'
                    }
                });
                contractId = newContract.id;
            }

            // 4. SYNC Legacy Lease on Asset (for AssetRegistration compatibility)
            // If this contract is active, we should update the Lease record on the Asset.
            // We delete all leases for this asset and recreate one with this contract's data.
            await tx.lease.deleteMany({ where: { assetId: data.assetId } });

            await tx.lease.create({
                data: {
                    assetId: data.assetId,
                    nomeInquilino: data.nomeInquilino,
                    documentoInquilino: doc,
                    emailInquilino: data.emailInquilino,
                    valorAluguel: valorParsed,
                    diaVencimento: diaParsed,
                    inicioVigencia: data.inicioVigencia,
                    fimContrato: data.fimContrato,
                    garantia: data.tipoGarantia,
                    indexador: data.indexador,
                    contractFile: data.contractFile ? JSON.stringify(data.contractFile) : null
                }
            });

            // 5. Update Asset Status to 'Locado'
            await tx.asset.update({
                where: { id: data.assetId },
                data: { status: 'Locado', rentalValue: valorParsed }
            });

            await logAudit(
                data.id ? 'UPDATE' : 'CREATE',
                'Contract',
                contractId || 'unknown',
                { contractNumber, value: valorParsed, tenant: data.nomeInquilino },
                actorName
            );

            revalidatePath('/contracts');
            revalidatePath('/tenants');
            revalidatePath('/assets');
        });

        return { success: true };

    } catch (error) {
        logger.error("Save Contract Error:", error);
        throw error;
    }
}

/**
 * Atualiza dados cadastrais de um inquilino existente.
 * Não permite alteração do documento (chave única).
 * 
 * @param {object} data - Dados do inquilino (id, name, email, phone)
 * @returns {Promise<{success: boolean}>}
 */
export async function saveStandaloneTenant(data: { id: string; name: string; email?: string; phone?: string }) {
    await requireAuth();
    try {
        await prisma.tenant.update({
            where: { id: data.id },
            data: {
                name: data.name,
                email: data.email,
                phone: data.phone
            }
        });

        revalidatePath('/tenants');
        revalidatePath('/contracts'); // Tenant name might appear there
    return { success: true };
    } catch (error) {
        logger.error("Save Tenant Error:", error);
        throw error;
    }
}
