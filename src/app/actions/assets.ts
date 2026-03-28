'use server';

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { Asset } from '@/components/ai-studio/types';
import { revalidatePath } from 'next/cache';
import { logAudit } from '@/lib/audit';
import { generateContractNumber } from '@/utils/generators';
import { requireAuth, requireAdmin } from '@/lib/auth-guard';
import { saveAssetSchema } from '@/lib/action-schemas';

/**
 * @module actions/assets
 * @description Server Actions para gestão de ativos imobiliários.
 * Inclui operações de CRUD, importação em lote e atualização de aluguel.
 * Todas as operações exigem autenticação e registram log de auditoria.
 * 
 * @requires prisma - ORM para acesso ao banco SQLite
 * @requires auth-guard - Guards de autenticação (requireAuth, requireAdmin)
 * @requires action-schemas - Schemas Zod para validação de entrada
 */

/**
 * Busca todos os ativos imobiliários do banco de dados com relacionamentos.
 * 
 * Inclui parceiros (sócios), financiamento e locações (legacy).
 * Converte campos Decimal do Prisma para number e faz parse seguro de JSON
 * armazenado como string (phases, cashFlow, contractFile).
 * 
 * @returns {Promise<Asset[]>} Lista de ativos ordenada por data de atualização (mais recente primeiro)
 * @throws Retorna array vazio em caso de erro (não propaga exceção)
 * 
 * @example
 * const assets = await getAssets();
 * // assets[0].partners → [{ name: "Wândrio", percentage: 50, ... }]
 * // assets[0].financingDetails?.cashFlow → CashFlowItem[] | undefined
 */
export async function getAssets(): Promise<Asset[]> {
    await requireAuth();
    try {
        const assets = await prisma.asset.findMany({
            include: {
                partners: true,
                financing: true,
                leases: true
            },
            orderBy: { updatedAt: 'desc' }
        });

        // Helper for safe JSON parse
        const safeParse = (str: string | null) => {
            if (!str) return undefined;
            try { return JSON.parse(str); } catch (e) { return undefined; }
        };

        return assets.map((a: typeof assets[number]) => ({
            id: a.id,
            name: a.name,
            type: a.type as Asset['type'],
            address: a.address || '',
            zipCode: a.zipCode || undefined,
            street: a.street || undefined,
            number: a.number || undefined,
            complement: a.complement || undefined,
            neighborhood: a.neighborhood || undefined,
            city: a.city || undefined,
            state: a.state || undefined,
            description: a.description || undefined, // Mapped description field

            // Characteristics
            areaTotal: a.areaTotal ? Number(a.areaTotal) : undefined,

            // Documentation
            matricula: a.matricula || undefined,
            iptu: a.iptuRegistration || undefined,
            iptuRegistration: a.iptuRegistration || undefined,
            iptuValue: a.iptuValue ? Number(a.iptuValue) : undefined,
            iptuFrequency: a.iptuFrequency || undefined,
            registryOffice: a.registryOffice || undefined,
            acquisitionDate: a.acquisitionDate || undefined,
            irpfStatus: (a.irpfStatus as Asset['irpfStatus']) || 'Declarado',
            acquisitionOrigin: a.acquisitionOrigin || undefined,

            // Financial
            value: Number(a.value),
            marketValue: Number(a.marketValue),
            declaredValue: a.declaredValue ? Number(a.declaredValue) : undefined,
            saleForecast: a.saleForecast || undefined,
            suggestedRentalValue: a.suggestedRentalValue ? Number(a.suggestedRentalValue) : undefined,
            rentalValue: Number(a.rentalValue),

            status: (a.status as Asset['status']) || 'Vago',
            image: a.image || '',

            partners: a.partners.map((p: { name: string; initials: string; color: string; percentage: unknown }) => ({
                initials: p.initials,
                name: p.name,
                percentage: Number(p.percentage),
                color: p.color
            })),

            financingDetails: a.financing ? {
                valorTotal: a.financing.valorTotal.toString(),
                subtotalConstrutora: Number(a.financing.subtotalConstrutora),
                valorFinanciar: a.financing.valorFinanciar.toString(),
                valorQuitado: a.financing.valorQuitado ? Number(a.financing.valorQuitado) : undefined,
                saldoDevedor: a.financing.saldoDevedor ? Number(a.financing.saldoDevedor) : undefined,
                dataAssinatura: a.financing.dataAssinatura || undefined,
                vencimentoConstrutora: a.financing.vencimentoConstrutora || undefined,
                vencimentoPrimeira: a.financing.vencimentoPrimeira || undefined,
                prazoMeses: a.financing.prazoMeses || undefined,
                jurosAnuais: a.financing.jurosAnuais || undefined,
                indexador: a.financing.indexador || undefined,
                sistemaAmortizacao: a.financing.sistemaAmortizacao || undefined,
                taxaAdm: a.financing.taxaAdm || undefined,
                seguros: a.financing.seguros || undefined,
                phases: safeParse(a.financing.phases),
                cashFlow: safeParse(a.financing.cashFlow),
            } : undefined,

            leaseDetails: a.leases.length > 0 ? {
                nomeInquilino: a.leases[0].nomeInquilino,
                documentoInquilino: a.leases[0].documentoInquilino || '',
                emailInquilino: a.leases[0].emailInquilino || '',
                valorAluguel: a.leases[0].valorAluguel.toString(),
                diaVencimento: a.leases[0].diaVencimento ? a.leases[0].diaVencimento.toString() : '1',
                tipoGarantia: a.leases[0].garantia || '',
                inicioVigencia: a.leases[0].inicioVigencia || '',
                fimContrato: a.leases[0].fimContrato || '',
                indexador: a.leases[0].indexador || 'IGPM',
                contractFile: safeParse(a.leases[0].contractFile)
            } : undefined
        }));
    } catch (e) {
        logger.error("Failed to fetch assets:", e);
        return [];
    }
}

/**
 * Cria ou atualiza um ativo imobiliário com todos os relacionamentos.
 * 
 * Fluxo de operação:
 * 1. Valida input com schema Zod (saveAssetSchema)
 * 2. Upsert do ativo principal (Asset)
 * 3. Recria parceiros (delete all + createMany) — validando soma = 100%
 * 4. Upsert do financiamento (Financing) com parse de moeda BRL → Decimal
 * 5. Recria locação legacy (Lease) e sincroniza com módulo de contratos (Contract + Tenant)
 * 6. Registra log de auditoria (CREATE ou UPDATE)
 * 
 * @param {Asset} asset - Dados completos do ativo incluindo partners, financingDetails e leaseDetails
 * @returns {Promise<{success: boolean, error?: string}>} Resultado da operação
 * 
 * @remarks
 * - Parse de moeda: strings como "1.000,00" são convertidas para Decimal via parseCurrency()
 * - Sincronização Lease↔Contract: ao salvar leaseDetails, também cria/atualiza Tenant e Contract
 * - Se o inquilino não tem documento válido (>5 chars), gera documento temporário "UNK-XXXXXXX"
 */
export async function saveAsset(asset: Asset) {
    const session = await requireAuth();
    const actorName = session.user?.name || session.user?.email || 'Unknown';

    const validation = saveAssetSchema.safeParse(asset);
    if (!validation.success) {
        return { success: false, error: `Dados inválidos: ${validation.error.issues.map(i => i.message).join(', ')}` };
    }

    try {
        const existing = await prisma.asset.findUnique({ where: { id: asset.id } });

        const dataToSave = {
            name: asset.name,
            type: asset.type,
            address: asset.address,
            zipCode: asset.zipCode,
            street: asset.street,
            number: asset.number,
            complement: asset.complement,
            neighborhood: asset.neighborhood,
            city: asset.city,
            state: asset.state,
            description: asset.description, // Added description field
            areaTotal: asset.areaTotal,
            matricula: asset.matricula,
            iptuRegistration: asset.iptuRegistration || asset.iptu,
            iptuValue: asset.iptuValue || 0,
            iptuFrequency: asset.iptuFrequency || 'monthly',
            registryOffice: asset.registryOffice,
            acquisitionDate: asset.acquisitionDate,
            irpfStatus: asset.irpfStatus,
            acquisitionOrigin: asset.acquisitionOrigin,
            value: asset.value,
            marketValue: asset.marketValue,
            declaredValue: asset.declaredValue,
            saleForecast: asset.saleForecast,
            suggestedRentalValue: asset.suggestedRentalValue,
            rentalValue: asset.rentalValue,
            status: asset.status,
            image: asset.image,
        };

        logger.debug("💾 [Server] dataToSave:", JSON.stringify(dataToSave, null, 2));

        // 1. Upsert Main Asset
        if (existing) {
            await prisma.asset.update({
                where: { id: asset.id },
                data: dataToSave
            });
        } else {
            await prisma.asset.create({
                data: {
                    id: asset.id,
                    ...dataToSave
                }
            });
        }

        logger.info(`💾 [Server] Asset Saved: ${asset.name} | DescLen: ${asset.description?.length || 0}`);

        // 2. Partners (validate percentages sum to 100)
        if (asset.partners && asset.partners.length > 0) {
            const totalPercentage = asset.partners.reduce((sum, p) => sum + (p.percentage || 0), 0);
            if (Math.abs(totalPercentage - 100) > 0.01) {
                return { success: false, error: `Percentuais dos sócios devem somar 100%. Atual: ${totalPercentage.toFixed(2)}%` };
            }

            await prisma.assetPartner.deleteMany({ where: { assetId: asset.id } });
            await prisma.assetPartner.createMany({
                data: asset.partners.map(p => ({
                    assetId: asset.id,
                    name: p.name,
                    initials: p.initials,
                    color: p.color,
                    percentage: p.percentage
                }))
            });
        }

        // 3. Financing
        if (asset.financingDetails) {
            const f = asset.financingDetails;

            // Parse formatted currency strings ("1.000,00") to numbers for Prisma Decimal fields
            const parseCurrency = (val: string | number | undefined | null): number => {
                if (!val) return 0;
                if (typeof val === 'number') return val;
                const clean = String(val).replace(/[R$\s.]/g, '').replace(',', '.');
                return parseFloat(clean) || 0;
            };

            const financingData = {
                valorTotal: parseCurrency(f.valorTotal),
                subtotalConstrutora: parseCurrency(f.subtotalConstrutora),
                valorFinanciar: parseCurrency(f.valorFinanciar),
                valorQuitado: parseCurrency(f.valorQuitado),
                saldoDevedor: parseCurrency(f.saldoDevedor),
                dataAssinatura: f.dataAssinatura,
                vencimentoConstrutora: f.vencimentoConstrutora,
                vencimentoPrimeira: f.vencimentoPrimeira,
                prazoMeses: f.prazoMeses,
                jurosAnuais: f.jurosAnuais,
                indexador: f.indexador,
                sistemaAmortizacao: f.sistemaAmortizacao,
                taxaAdm: f.taxaAdm,
                seguros: f.seguros,
                phases: f.phases ? JSON.stringify(f.phases) : null,
                cashFlow: f.cashFlow ? JSON.stringify(f.cashFlow) : null
            };

            const existingFinancing = await prisma.financing.findUnique({ where: { assetId: asset.id } });
            if (existingFinancing) {
                await prisma.financing.update({ where: { assetId: asset.id }, data: financingData });
            } else {
                await prisma.financing.create({ data: { assetId: asset.id, ...financingData } });
            }
        }

        // 4. Leases
        if (asset.leaseDetails) {
            const l = asset.leaseDetails;

            // Parse diaVencimento - extract number from "Dia X" format
            const diaVencimentoParsed = parseInt(l.diaVencimento.toString().replace(/\D/g, '')) || 5;

            // Parse valorAluguel - handle formatted currency (e.g., "2.690,00")
            const valorAluguelString = String(l.valorAluguel)
                .replace('R$', '')
                .replace(/\s/g, '')
                .trim();
            const valorAluguelParsed = parseFloat(
                valorAluguelString.replace(/\./g, '').replace(',', '.')
            ) || 0;

            const leaseData = {
                nomeInquilino: l.nomeInquilino,
                documentoInquilino: l.documentoInquilino || '',
                emailInquilino: l.emailInquilino || '',
                valorAluguel: valorAluguelParsed,
                diaVencimento: diaVencimentoParsed,
                garantia: l.tipoGarantia || '',
                inicioVigencia: l.inicioVigencia || '',
                fimContrato: l.fimContrato || '',
                indexador: l.indexador || 'IPCA',
                contractFile: l.contractFile ? JSON.stringify(l.contractFile) : null
            };

            // Assume single lease for now per frontend logic
            // Strategy: delete all for asset and recreate
            await prisma.lease.deleteMany({ where: { assetId: asset.id } });
            await prisma.lease.create({
                data: {
                    assetId: asset.id,
                    ...leaseData
                }
            });

            // --- SYNC WITH NEW RENTAL MODULE (Tenant & Contract) ---
            if (l.nomeInquilino) {
                // 1. Upsert Tenant
                let tenant;
                const doc = l.documentoInquilino && l.documentoInquilino.length > 5 ? l.documentoInquilino : null;

                if (doc) {
                    tenant = await prisma.tenant.upsert({
                        where: { document: doc },
                        update: {
                            name: l.nomeInquilino,
                            email: l.emailInquilino
                        },
                        create: {
                            name: l.nomeInquilino,
                            document: doc,
                            email: l.emailInquilino
                        }
                    });
                } else {
                    // Try to find by name or create with generated ID
                    tenant = await prisma.tenant.findFirst({ where: { name: l.nomeInquilino } });
                    if (!tenant) {
                        const tempDoc = 'UNK-' + Math.random().toString(36).substr(2, 9).toUpperCase();
                        tenant = await prisma.tenant.create({
                            data: {
                                name: l.nomeInquilino,
                                document: tempDoc,
                                email: l.emailInquilino
                            }
                        });
                    }
                }

                // 2. Upsert Contract
                if (tenant) {
                    // Find active contract to update, or create new
                    const existingContract = await prisma.contract.findFirst({
                        where: { assetId: asset.id, status: 'active' }
                    });

                    const startDate = l.inicioVigencia ? new Date(l.inicioVigencia) : new Date();

                    if (existingContract) {
                        await prisma.contract.update({
                            where: { id: existingContract.id },
                            data: {
                                tenantId: tenant.id,
                                currentValue: valorAluguelParsed,
                                dueDay: diaVencimentoParsed,
                                startDate: startDate
                            }
                        });
                    } else {
                        const contractNumber = await generateContractNumber();
                        await prisma.contract.create({
                            data: {
                                contractNumber,
                                assetId: asset.id,
                                tenantId: tenant.id,
                                status: 'active',
                                baseValue: valorAluguelParsed,
                                currentValue: valorAluguelParsed,
                                dueDay: diaVencimentoParsed,
                                startDate: startDate,
                                penaltyPercent: 10, // Default
                                adjustmentIndex: l.indexador || 'IPCA'
                            }
                        });
                    }
                }
            }
        }

        // AUDIT LOG
        await logAudit(
            existing ? 'UPDATE' : 'CREATE',
            'Asset',
            asset.id,
            { name: asset.name, value: asset.value },
            actorName
        );

        revalidatePath('/dashboard');
        revalidatePath('/assets');

        return { success: true };
    } catch (e) {
        logger.error("❌ CRITICAL ERROR saving asset:", e);
        if (e instanceof Error) {
            logger.error("Error Message:", e.message);
            logger.error("Error Stack:", e.stack);
        }
        return { success: false, error: String(e) };
    }
}

/**
 * Remove um ativo imobiliário e todos os relacionamentos em cascata.
 * 
 * A exclusão em cascata é garantida pelo schema Prisma (onDelete: Cascade)
 * para: AssetPartner, Financing, Lease e Contract.
 * 
 * @param {string} id - UUID do ativo a ser removido
 * @returns {Promise<{success: boolean, error?: unknown}>} Resultado da operação
 */
export async function deleteAsset(id: string) {
    const session = await requireAuth();
    const actorName = session.user?.name || session.user?.email || 'Unknown';
    try {
        // Fetch asset name for log before deleting
        const asset = await prisma.asset.findUnique({ where: { id }, select: { name: true } });

        await prisma.asset.delete({ where: { id } });

        // AUDIT LOG
        await logAudit(
            'DELETE',
            'Asset',
            id,
            { name: asset?.name || 'Unknown' },
            actorName
        );

        // Revalidate all possible paths that show assets
        revalidatePath('/assets');
        revalidatePath('/dashboard');
        revalidatePath('/', 'layout'); // Revalidate entire app
        return { success: true };
    } catch (e) {
        logger.error('Delete asset error:', e);
        return { success: false, error: e };
    }
}

/**
 * Atualiza o valor do aluguel de um ativo e suas locações associadas.
 * 
 * Atualiza tanto o campo rentalValue do Asset quanto o valorAluguel
 * de todos os Leases vinculados. Registra a mudança no log de auditoria
 * com valor anterior e novo.
 * 
 * @param {string} assetId - UUID do ativo
 * @param {number} newRentalValue - Novo valor do aluguel em reais
 * @param {Date} [adjustmentDecidedDate] - Data da decisão do reajuste (não utilizado atualmente)
 * @returns {Promise<{success: boolean, error?: unknown}>} Resultado da operação
 */
export async function updateRent(assetId: string, newRentalValue: number, adjustmentDecidedDate?: Date) {
    const session = await requireAuth();
    const actorName = session.user?.name || session.user?.email || 'Unknown';
    try {
        // Fetch old value for audit
        const asset = await prisma.asset.findUnique({ where: { id: assetId }, select: { rentalValue: true, name: true } });
        const oldValue = asset?.rentalValue ? Number(asset.rentalValue) : 0;

        // Update the main asset value
        await prisma.asset.update({
            where: { id: assetId },
            data: {
                rentalValue: newRentalValue,
                updatedAt: new Date()
            }
        });

        // Also update the active lease if exists
        // (Assuming single lease per asset for now as per schema logic)
        // We might want to log this adjustment in a history table later.
        await prisma.lease.updateMany({
            where: { assetId: assetId },
            data: {
                valorAluguel: newRentalValue
            }
        });

        // AUDIT LOG
        await logAudit(
            'UPDATE_RENT',
            'Asset',
            assetId,
            {
                assetName: asset?.name,
                oldValue: oldValue,
                newValue: newRentalValue,
                difference: newRentalValue - oldValue
            },
            actorName
        );

        revalidatePath('/assets');
        revalidatePath('/dashboard');
        revalidatePath('/adjustments');
        return { success: true };
    } catch (e) {
        logger.error("Failed to update rent:", e);
        return { success: false, error: e };
    }
}

/**
 * Importação em lote de ativos — usado no backup/restore e importação IRPF.
 * 
 * Suporta dois modos de operação:
 * - **Incremental** (replaceAll=false): importa apenas ativos com IDs inexistentes, pula duplicatas
 * - **Substituição total** (replaceAll=true): deleta TODOS os ativos e reimporta do zero
 * 
 * Otimização: pré-busca todos os IDs existentes em uma query para evitar N+1.
 * Requer role ADMIN (via requireAdmin).
 * 
 * @param {Asset[]} assets - Lista de ativos a importar
 * @param {boolean} [replaceAll=false] - Se true, remove todos os ativos antes de importar
 * @returns {Promise<{success: boolean, imported: number, skipped: number, total: number, error?: unknown}>}
 */
export async function bulkImportAssets(assets: Asset[], replaceAll: boolean = false) {
    await requireAdmin();
    try {
        // If replaceAll, delete all existing assets first
        if (replaceAll) {
            await prisma.asset.deleteMany({});
            logger.info('All existing assets deleted for full restore');
        }

        // Import all assets - pre-fetch existing IDs to avoid N+1 queries
        let imported = 0;
        let skipped = 0;
        const existingIds = new Set(
            (await prisma.asset.findMany({ select: { id: true } })).map(a => a.id)
        );

        for (const asset of assets) {
            try {
                // Check if asset with same ID exists (using pre-fetched set)
                const existing = existingIds.has(asset.id);

                if (existing && !replaceAll) {
                    // Skip if exists and not replacing
                    skipped++;
                    continue;
                }

                // Upsert the asset
                await prisma.asset.upsert({
                    where: { id: asset.id },
                    update: {
                        name: asset.name,
                        type: asset.type,
                        address: asset.address || '',
                        zipCode: asset.zipCode,
                        street: asset.street,
                        number: asset.number,
                        complement: asset.complement,
                        neighborhood: asset.neighborhood,
                        city: asset.city,
                        state: asset.state,
                        description: asset.description, // Added description field
                        areaTotal: asset.areaTotal,
                        matricula: asset.matricula,
                        iptuRegistration: asset.iptuRegistration || asset.iptu,
                        iptuValue: asset.iptuValue || 0,
                        iptuFrequency: asset.iptuFrequency || 'monthly',
                        registryOffice: asset.registryOffice,
                        acquisitionDate: asset.acquisitionDate,
                        irpfStatus: asset.irpfStatus || 'Não Declarado',
                        acquisitionOrigin: asset.acquisitionOrigin,
                        value: asset.value,
                        marketValue: asset.marketValue,
                        declaredValue: asset.declaredValue,
                        saleForecast: asset.saleForecast,
                        suggestedRentalValue: asset.suggestedRentalValue,
                        rentalValue: asset.rentalValue || 0,
                        status: asset.status,
                        image: asset.image
                    },
                    create: {
                        id: asset.id,
                        name: asset.name,
                        type: asset.type,
                        address: asset.address || '',
                        zipCode: asset.zipCode,
                        street: asset.street,
                        number: asset.number,
                        complement: asset.complement,
                        neighborhood: asset.neighborhood,
                        city: asset.city,
                        state: asset.state,
                        description: asset.description,
                        areaTotal: asset.areaTotal,
                        matricula: asset.matricula,
                        iptuRegistration: asset.iptuRegistration || asset.iptu,
                        iptuValue: asset.iptuValue || 0,
                        iptuFrequency: asset.iptuFrequency || 'monthly',
                        registryOffice: asset.registryOffice,
                        acquisitionDate: asset.acquisitionDate,
                        irpfStatus: asset.irpfStatus || 'Não Declarado',
                        acquisitionOrigin: asset.acquisitionOrigin,
                        value: asset.value,
                        marketValue: asset.marketValue,
                        declaredValue: asset.declaredValue,
                        saleForecast: asset.saleForecast,
                        suggestedRentalValue: asset.suggestedRentalValue,
                        rentalValue: asset.rentalValue || 0,
                        status: asset.status,
                        image: asset.image
                    }
                });
                imported++;
            } catch (err) {
                logger.error(`Failed to import asset ${asset.id}:`, err);
            }
        }

        revalidatePath('/assets');
        revalidatePath('/dashboard');
        revalidatePath('/', 'layout');

        return {
            success: true,
            imported,
            skipped,
            total: assets.length
        };
    } catch (e) {
        logger.error('Bulk import error:', e);


/** Converte Decimal do Prisma para number com precisão de 2 casas */
function toNumber(val: any): number {
    if (val == null) return 0;
    return Math.round(Number(val) * 100) / 100;
}
        return { success: false, error: e, imported: 0, skipped: 0, total: 0 };
    }
}
