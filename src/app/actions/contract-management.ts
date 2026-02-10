'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { generateContractNumber } from '@/utils/generators';
import { logAudit } from '@/lib/audit';

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

export async function saveStandaloneContract(data: MinimalContractData) {
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
        if (doc) {
            tenant = await prisma.tenant.findUnique({ where: { document: doc } });
        }
        if (!tenant) {
            // Try by name fallback if no doc provided? Or precise match
            tenant = await prisma.tenant.findFirst({ where: { name: data.nomeInquilino } });
        }

        if (tenant) {
            // Update existing
            await prisma.tenant.update({
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
            const newTenant = await prisma.tenant.create({
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
            await prisma.contract.update({
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
            const newContract = await prisma.contract.create({
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
        await prisma.lease.deleteMany({ where: { assetId: data.assetId } });

        await prisma.lease.create({
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
        await prisma.asset.update({
            where: { id: data.assetId },
            data: { status: 'Locado', rentalValue: valorParsed }
        });

        await logAudit(
            data.id ? 'UPDATE' : 'CREATE',
            'Contract',
            contractId || 'unknown',
            { contractNumber, value: valorParsed, tenant: data.nomeInquilino }
        );

        revalidatePath('/contracts');
        revalidatePath('/tenants');
        revalidatePath('/assets');
        return { success: true };

    } catch (error) {
        console.error("Save Contract Error:", error);
        throw error;
    }
}

export async function saveStandaloneTenant(data: { id: string; name: string; email?: string; phone?: string }) {
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
        console.error("Save Tenant Error:", error);
        throw error;
    }
}
