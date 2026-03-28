'use server';

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { revalidatePath } from 'next/cache';
import stringSimilarity from 'string-similarity';
import { logAudit } from '@/lib/audit';
import { requireAuth } from '@/lib/auth-guard';
import { conciliationSchema, pixEntrySchema } from '@/lib/action-schemas';
import { DEFAULT_IPCA_RATE } from '@/lib/constants';

/**
 * @module actions/rental
 * @description Server Actions para o módulo de gestão de aluguéis.
 * Inclui conciliação PIX (matching de extratos bancários com inquilinos),
 * reajuste automático de contratos por IPCA, importação de contratos via PDF/OCR,
 * e gestão de aliases aprendidos.
 * 
 * O sistema de conciliação usa duas estratégias de matching:
 * 1. **Exact match**: busca na tabela TenantAlias (nomes já aprendidos)
 * 2. **Fuzzy match**: string-similarity com threshold de 0.3 nos nomes dos inquilinos
 */

// Types
export interface PixEntry {
    date: string;       // YYYY-MM-DD
    amount: number;
    description: string; // The raw text from bank statement
    id?: string;        // Optional unique ID from bank
}

export interface MatchSuggestion {
    tenantId?: string;
    tenantName: string;
    contractId?: string;
    assetName?: string;
    confidence: number;
    matchType: 'ALREADY_LEARNED' | 'FUZZY_SUGGESTION' | 'NO_MATCH';
}

export interface ConciliationResult {
    rawEntry: PixEntry;
    suggestion: MatchSuggestion | null;
}

/**
 * Processa uma lista de entradas de extrato bancário e sugere matches com inquilinos.
 * 
 * Para cada entrada PIX:
 * 1. Busca match exato na tabela TenantAlias (aliases já aprendidos)
 * 2. Se não encontrou, usa fuzzy matching (string-similarity) com threshold > 0.3
 * 3. Retorna sugestão com nível de confiança e tipo de match
 * 
 * Otimização: pré-busca todos os inquilinos com aliases e contratos ativos em uma query.
 * 
 * @param {PixEntry[]} entries - Lista de lançamentos PIX do extrato bancário
 * @returns {Promise<ConciliationResult[]>} Lista de resultados com sugestões de match
 * 
 * @example
 * const results = await processConciliation([
 *   { date: '2026-03-15', amount: 2500, description: 'JOAO DA SILVA PIX' }
 * ]);
 * // results[0].suggestion?.matchType === 'FUZZY_SUGGESTION'
 * // results[0].suggestion?.confidence === 0.85
 */
export async function processConciliation(entries: PixEntry[]): Promise<ConciliationResult[]> {
    await requireAuth();

    const validation = conciliationSchema.safeParse(entries);
    if (!validation.success) {
        return [];
    }

    const results: ConciliationResult[] = [];

    // Pre-fetch all tenants and aliases to avoid N+1 queries
    const tenants = await prisma.tenant.findMany({
        include: {
            aliases: true,
            contracts: {
                where: { status: 'active' },
                include: { asset: true }
            }
        }
    });

    for (const entry of entries) {
        const descriptionUpper = entry.description.toUpperCase();
        let bestMatch: MatchSuggestion | null = null;

        // 1. Check EXACT match in Aliases (Learned)
        for (const tenant of tenants) {
            const alias = tenant.aliases.find(a => a.aliasName.toUpperCase() === descriptionUpper);
            if (alias) {
                const activeContract = tenant.contracts[0]; // Assuming 1 active contract for simplicity
                bestMatch = {
                    tenantId: tenant.id,
                    tenantName: tenant.name,
                    contractId: activeContract?.id,
                    assetName: activeContract?.asset.name || 'Sem Contrato Ativo',
                    confidence: 1.0,
                    matchType: 'ALREADY_LEARNED'
                };
                break;
            }
        }

        // 2. If no alias, use Fuzzy Matching on Tenant Names
        if (!bestMatch) {
            const tenantNames = tenants.map(t => t.name.toUpperCase());
            if (tenantNames.length > 0) {
                const manualAliases = tenants.flatMap(t => t.aliases.map(a => a.aliasName.toUpperCase()));
                // Helper to map index back to tenant is tricky if we flatten aliases. 
                // Let's just match against Tenant Names first as per requirements.

                const matches = stringSimilarity.findBestMatch(descriptionUpper, tenantNames);
                const best = matches.bestMatch;

                if (best.rating > 0.3) { // Threshold
                    const matchedTenant = tenants[matches.bestMatchIndex];
                    const activeContract = matchedTenant.contracts[0];

                    bestMatch = {
                        tenantId: matchedTenant.id,
                        tenantName: matchedTenant.name,
                        contractId: activeContract?.id,
                        assetName: activeContract?.asset.name || 'Sem Contrato Ativo',
                        confidence: best.rating,
                        matchType: 'FUZZY_SUGGESTION'
                    };
                }
            }
        }

        results.push({
            rawEntry: entry,
            suggestion: bestMatch
        });
    }

    return results;
}

/**
 * Confirma um pagamento e aprende o alias do pagador para futura conciliação.
 * 
 * Fluxo:
 * 1. Registra o pagamento na tabela PaymentHistory (status: 'paid', método: 'PIX')
 * 2. Cria ou atualiza o alias na tabela TenantAlias (upsert por tenantId + aliasName)
 * 3. Registra ação no log de auditoria
 * 
 * @param {string} tenantId - UUID do inquilino confirmado
 * @param {string|undefined} contractId - UUID do contrato (opcional se inquilino sem contrato ativo)
 * @param {PixEntry} pixEntry - Dados do lançamento PIX original
 * @returns {Promise<{success: boolean, error?: string}>} Resultado da operação
 */
export async function confirmPaymentAndLearn(
    tenantId: string,
    contractId: string | undefined,
    pixEntry: PixEntry
) {
    const session = await requireAuth();
    const actorName = session.user?.name || session.user?.email || 'Unknown';

    const entryValidation = pixEntrySchema.safeParse(pixEntry);
    if (!entryValidation.success) {
        return { success: false, error: 'Dados do PIX inválidos' };
    }

    try {
        // 1. Record Payment
        if (contractId) {
            await prisma.paymentHistory.create({
                data: {
                    contractId: contractId,
                    dueDate: new Date(pixEntry.date), // Using payment date as due date reference for now
                    paymentDate: new Date(pixEntry.date),
                    paidValue: pixEntry.amount,
                    expectedValue: pixEntry.amount, // Ideally fetched from contract
                    status: 'paid',
                    method: 'PIX'
                }
            });
        }

        // 2. Learn Alias (Upsert to avoid duplicates)
        // We use create because we have a unique constraint, but Prisma doesn't support ON CONFLICT DO NOTHING easily in create.
        // We check first.
        const existingAlias = await prisma.tenantAlias.findUnique({
            where: {
                tenantId_aliasName: {
                    tenantId: tenantId,
                    aliasName: pixEntry.description
                }
            }
        });

        if (!existingAlias) {
            await prisma.tenantAlias.create({
                data: {
                    tenantId: tenantId,
                    aliasName: pixEntry.description,
                    confidence: 1.0,
                    lastUsed: new Date()
                }
            });
        } else {
            await prisma.tenantAlias.update({
                where: { id: existingAlias.id },
                data: { lastUsed: new Date() }
            });
        }

        revalidatePath('/conciliacao');
        revalidatePath('/assets');

        await logAudit(
            'CONCILIATION',
            'Contract',
            contractId || tenantId,
            { amount: pixEntry.amount, learnedAlias: !existingAlias, description: pixEntry.description },
            actorName
        );

        return { success: true };
    } catch (e) {
        logger.error('Error confirming payment:', e);
        return { success: false, error: e };
    }
}

/**
 * Verifica e aplica reajustes anuais de aluguel baseados no IPCA.
 * 
 * Regras de elegibilidade:
 * - Contrato deve estar ativo (status: 'active')
 * - Mês atual deve ser o mês de aniversário do contrato (startDate.month === currentMonth)
 * - Contrato deve ter pelo menos 1 ano de vigência
 * - Não pode ter sido reajustado no ano corrente (lastAdjustment.year !== currentYear)
 * 
 * @returns {Promise<{success: boolean, updatedCount?: number, error?: unknown}>}
 * 
 * @remarks
 * - IPCA está SIMULADO com valor fixo de 4.5% — em produção, usar fetchIndexHistory() do serviço BCB
 * - Não atualiza o Asset.rentalValue automaticamente (apenas Contract.currentValue)
 */
export async function checkAndApplyAdjustments() {
    await requireAuth();
    try {
        const today = new Date();
        const currentMonth = today.getMonth() + 1; // 1-12

        // Find contracts active and starting in this month (anniversary)
        const contracts = await prisma.contract.findMany({
            where: {
                status: 'active'
            }
        });

        let updatedCount = 0;

        for (const contract of contracts) {
            const startMonth = contract.startDate.getMonth() + 1;
            const startYear = contract.startDate.getFullYear();
            const yearsSinceStart = today.getFullYear() - startYear;

            // Check if it is anniversary month and at least 1 year old
            if (startMonth === currentMonth && yearsSinceStart >= 1) {
                // Check if already adjusted this year (optional safety)
                const lastAdjYear = contract.lastAdjustment ? contract.lastAdjustment.getFullYear() : 0;
                if (lastAdjYear === today.getFullYear()) continue;

                // TODO: Futura integração com API do BCB para taxa IPCA real
                // Busca IPCA real da API do BCB (com fallback para taxa padrão)
                let ipcaAcumulado = DEFAULT_IPCA_RATE;
                try {
                    const indexHistory = await fetchIndexHistory('IPCA', 24);
                    if (indexHistory.length > 0) {
                        const adjustment = calculateRentAdjustment(
                            Number(contract.currentValue),
                            contract.lastAdjustmentDate || contract.startDate,
                            indexHistory
                        );
                        if (!adjustment.error) {
                            ipcaAcumulado = adjustment.accumulatedFactor - 1;
                        }
                    }
                } catch (bcbError) {
                    logger.warn('Falha ao buscar IPCA do BCB, usando taxa padrão:', bcbError);
                }

                const newValue = Number(contract.currentValue) * (1 + ipcaAcumulado);

                await prisma.contract.update({
                    where: { id: contract.id },
                    data: {
                        currentValue: newValue,
                        lastAdjustment: today,
                        updatedAt: new Date()
                    }
                });

                // AUDIT LOG
                await logAudit(
                    'RENT_AUTO_ADJUSTMENT',
                    'Contract',
                    contract.id,
                    {
                        assetId: contract.assetId,
                        oldValue: Number(contract.currentValue),
                        newValue: newValue,
                        index: 'IPCA (Simul 4.5%)'
                    }
                );

                updatedCount++;
            }
        }

        revalidatePath('/assets');
        return { success: true, updatedCount };
    } catch (e) {
        logger.error('Error applying adjustments:', e);
        return { success: false, error: e };
    }
}

/**
 * Importa dados de contrato extraídos via IA/OCR e cria Tenant + Contract no banco.
 * 
 * Pressupõe que a extração via Gemini AI já foi feita pela UI e os dados
 * chegam estruturados. Cria o inquilino se não existir (busca por documento).
 * 
 * @param {PDFImportData} data - Dados estruturados do contrato extraído
 * @returns {Promise<{success: boolean, contractId?: string, error?: unknown}>}
 */
export interface PDFImportData {
    tenantName: string;
    tenantDocument: string;
    tenantEmail?: string;
    tenantPhone?: string;
    assetId: string;
    startDate: string;
    rentValue: number;
    dueDay?: number;
    penaltyPercent?: number;
}

export async function importContractFromPDF(data: PDFImportData) {
    await requireAuth();
    // This function assumes the UI or another service already called the AI/OCR 
    // and returns structured data to be saved.

    // data structure expected:
    // { tenantName, tenantDocument, rentValue, startDate, assetId, ... }

    try {
        // 1. Create or Find Tenant
        let tenant = await prisma.tenant.findUnique({
            where: { document: data.tenantDocument || '000' } // Fallback for safety
        });

        if (!tenant) {
            tenant = await prisma.tenant.create({
                data: {
                    name: data.tenantName,
                    document: data.tenantDocument,
                    email: data.tenantEmail,
                    phone: data.tenantPhone
                }
            });
        }

        // 2. Create Contract
        const contract = await prisma.contract.create({
            data: {
                assetId: data.assetId,
                tenantId: tenant.id,
                startDate: new Date(data.startDate),
                baseValue: data.rentValue,
                currentValue: data.rentValue,
                dueDay: data.dueDay || 5, // Default 5th
                penaltyPercent: data.penaltyPercent || 10,
                status: 'active'
            }
        });

        return { success: true, contractId: contract.id };
    } catch (e) {
        logger.error('Error importing contract:', e);
        return { success: false, error: e };
    }
}

/**
 * Retorna todos os aliases aprendidos pelo sistema de conciliação PIX.
 * Usado na tela de configuração (/conciliacao/config) para gerenciamento.
 * 
 * @returns {Promise<Array>} Lista de aliases com nome do inquilino, ordenada por último uso
 */
export async function getTenantAliases() {
    await requireAuth();
    try {
        const aliases = await prisma.tenantAlias.findMany({
            include: {
                tenant: {
                    select: { name: true }
                }
            },
            orderBy: { lastUsed: 'desc' }
        });
        return aliases;
    } catch (e) {
        logger.error('Error fetching aliases:', e);
        return [];
    }
}

/**
 * Remove um alias aprendido da tabela TenantAlias.
 * Útil quando o sistema aprendeu um nome incorreto durante a conciliação.
 * 
 * @param {string} aliasId - UUID do alias a remover
 * @returns {Promise<{success: boolean, error?: unknown}>}
 */
export async function deleteAlias(aliasId: string) {
    await requireAuth();
    try {
        await prisma.tenantAlias.delete({
            where: { id: aliasId }
        });
        revalidatePath('/conciliacao/config');
        return { success: true };
    } catch (e) {
        logger.error('Error deleting alias:', e);
        return { success: false, error: e };
    }
}
