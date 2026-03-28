'use server';

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { addMonths, format, startOfMonth, endOfMonth, isAfter, isBefore } from 'date-fns';
import { requireAuth } from '@/lib/auth-guard';

/**
 * @module actions/financial
 * @description Server Action para projeção de fluxo de caixa.
 * Calcula receitas (contratos ativos), despesas (financiamentos + IPTU)
 * e saldo projetado para os próximos N meses.
 * 
 * Fontes de dados:
 * - **Receitas**: Contract.currentValue de contratos com status 'active'
 * - **Despesas**: Financing.cashFlow (parcelas futuras) + Asset.iptuValue (IPTU mensal/anual)
 * - **Projeção**: sliding window de N meses a partir da data atual
 */

/**
 * Projeção de fluxo de caixa para um mês específico.
 * 
 * @property {string} month - Mês formatado (ex: "Fev/26", "Mar/26")
 * @property {number} receivables - Total de receitas projetadas no mês (aluguéis)
 * @property {number} payables - Total de despesas projetadas no mês (parcelas + IPTU)
 * @property {number} balance - Saldo: receivables - payables
 * @property {object} details - Detalhamento por item (incomes e expenses)
 */
export interface CashFlowDetailItem {
    name: string;
    value: number;
    day?: number;
    date?: string;
    originType: 'contract' | 'financing' | 'iptu';
    originId: string;
    originDetails: {
        assetName: string;
        assetId: string;
        tenantName?: string;
        contractNumber?: string;
        dueDay?: number;
        phase?: string;
        description?: string;
        frequency?: string;
    };
}

export interface CashFlowProjection {
    month: string; // "Fev/26"
    receivables: number;
    payables: number;
    balance: number;
    details: {
        incomes: CashFlowDetailItem[];
        expenses: CashFlowDetailItem[];
    }
}

/**
 * Calcula a projeção de fluxo de caixa para os próximos N meses.
 * 
 * Algoritmo:
 * 1. Inicializa Map com N meses a partir de hoje
 * 2. Para cada contrato ativo: soma currentValue como receita em todos os meses
 * 3. Para cada financiamento com cashFlow: parse do JSON, filtra parcelas no período,
 *    soma valoresPorSocio como despesa no mês correspondente
 * 4. Para cada ativo com IPTU > 0: distribui como despesa mensal (ou anual/12)
 * 5. Calcula balance = receivables - payables para cada mês
 * 
 * @param {number} [monthsToProject=12] - Quantidade de meses a projetar
 * @returns {Promise<CashFlowProjection[]>} Array de projeções ordenado cronologicamente
 * 
 * @remarks
 * - Datas do cashFlow usam formato DD/MM/YYYY (padrão brasileiro)
 * - IPTU com valor > 1.000.000 é ignorado (proteção contra dados legados incorretos)
 * - Contratos ativos são projetados indefinidamente (sem considerar data de fim)
 */
export async function getProjectedCashFlow(monthsToProject: number = 12): Promise<CashFlowProjection[]> {
    await requireAuth();
    try {
        const today = new Date();
        const projections: Map<string, CashFlowProjection> = new Map();

        // Initialize map for N months
        for (let i = 0; i < monthsToProject; i++) {
            const date = addMonths(today, i);
            const key = format(date, 'MMM/yy'); // e.g. "Fev/26"
            // Use a sortable key for internal logic if needed, but Map insertion order is usually preserved.
            // Let's rely on standard iteration or re-sort later.
            projections.set(key, {
                month: key,
                receivables: 0,
                payables: 0,
                balance: 0,
                details: { incomes: [], expenses: [] }
            });
        }

        // 1. Calculate Receivables (Active Contracts)
        const contracts = await prisma.contract.findMany({
            where: { status: 'active' },
            include: { asset: true, tenant: true }
        });

        const startProjection = startOfMonth(today);
        const endProjection = endOfMonth(addMonths(today, monthsToProject - 1));

        for (const contract of contracts) {
            // Project this contract for the requested months
            for (let i = 0; i < monthsToProject; i++) {
                const targetMonthDate = addMonths(today, i);
                const key = format(targetMonthDate, 'MMM/yy');
                const entry = projections.get(key);

                if (entry) {
                    const value = Number(contract.currentValue);
                    entry.receivables += value;
                    entry.details.incomes.push({
                        name: `${contract.asset.name} - ${contract.tenant.name}`,
                        day: contract.dueDay,
                        value: value,
                        originType: 'contract',
                        originId: contract.id,
                        originDetails: {
                            assetName: contract.asset.name,
                            assetId: contract.assetId,
                            tenantName: contract.tenant.name,
                            contractNumber: contract.contractNumber || contract.id,
                            dueDay: contract.dueDay,
                        }
                    });
                }
            }
        }

        // 2. Calculate Payables (Financing CashFlows)
        const financings = await prisma.financing.findMany({
            include: { asset: true }
        });

        for (const fin of financings) {
            // Path A: Use detailed cashFlow items if available
            if (fin.cashFlow) {
                let cashFlowItems: Record<string, unknown>[] = [];
                try {
                    cashFlowItems = JSON.parse(fin.cashFlow);
                } catch (e) {
                    logger.error(`Error parsing cashflow for asset ${fin.asset.name} (ID: ${fin.assetId}):`, e);
                    continue;
                }

                for (const item of cashFlowItems) {
                    // Parse DD/MM/YYYY date with validation
                    if (!item.vencimento || typeof item.vencimento !== 'string') continue;
                    const parts = item.vencimento.split('/').map(Number);
                    if (parts.length !== 3 || parts.some(isNaN)) continue;
                    const [d, m, y] = parts;
                    if (d < 1 || d > 31 || m < 1 || m > 12 || y < 2000) continue;
                    const itemDate = new Date(y, m - 1, d);
                    if (isNaN(itemDate.getTime())) continue;

                    if (isAfter(itemDate, startProjection) && isBefore(itemDate, endProjection)) {
                        const key = format(itemDate, 'MMM/yy');
                        const entry = projections.get(key);

                        if (entry) {
                            const totalValue = Object.values(item.valoresPorSocio as Record<string, number>)
                                .reduce((a, b) => a + b, 0);

                            entry.payables += totalValue;
                            entry.details.expenses.push({
                                name: `${fin.asset.name} - ${item.descricao} (${item.fase})`,
                                date: item.vencimento as string,
                                value: totalValue,
                                originType: 'financing',
                                originId: fin.id,
                                originDetails: {
                                    assetName: fin.asset.name,
                                    assetId: fin.assetId,
                                    phase: item.fase as string,
                                    description: item.descricao as string,
                                }
                            });
                        }
                    }
                }
                continue;
            }

            // Path B: Generate projections from phases when cashFlow is empty
            if (fin.phases) {
                let phases: { sinal?: { qtd: number; unitario: number }; mensais?: { qtd: number; unitario: number }; baloes?: { qtd: number; unitario: number } };
                try {
                    phases = typeof fin.phases === 'string' ? JSON.parse(fin.phases) : fin.phases;
                } catch {
                    continue;
                }

                // Determine start date: use vencimentoConstrutora (pagamentos à construtora)
                // or vencimentoPrimeira (financiamento bancário) or today
                let startDate = today;
                if (fin.vencimentoConstrutora) {
                    const parsed = new Date(fin.vencimentoConstrutora);
                    if (!isNaN(parsed.getTime())) startDate = parsed;
                } else if (fin.vencimentoPrimeira) {
                    const parsed = new Date(fin.vencimentoPrimeira);
                    if (!isNaN(parsed.getTime())) startDate = parsed;
                }

                // Generate monthly payment schedule from phases
                const scheduledPayments: { date: Date; value: number; description: string; phase: string }[] = [];
                let monthOffset = 0;

                // Sinal (down payment) — first payment at start date
                if (phases.sinal && phases.sinal.qtd > 0 && phases.sinal.unitario > 0) {
                    for (let s = 0; s < phases.sinal.qtd; s++) {
                        scheduledPayments.push({
                            date: addMonths(startDate, monthOffset),
                            value: phases.sinal.unitario,
                            description: `Sinal ${s + 1}/${phases.sinal.qtd}`,
                            phase: 'Sinal',
                        });
                        monthOffset++;
                    }
                }

                // Mensais (monthly installments)
                if (phases.mensais && phases.mensais.qtd > 0 && phases.mensais.unitario > 0) {
                    for (let m = 0; m < phases.mensais.qtd; m++) {
                        scheduledPayments.push({
                            date: addMonths(startDate, monthOffset),
                            value: phases.mensais.unitario,
                            description: `Parcela Mensal ${m + 1}/${phases.mensais.qtd}`,
                            phase: 'Mensais',
                        });
                        monthOffset++;
                    }
                }

                // Balões (balloon payments — every 6 months during the mensais period)
                if (phases.baloes && phases.baloes.qtd > 0 && phases.baloes.unitario > 0) {
                    const sinalCount = phases.sinal?.qtd || 0;
                    for (let b = 0; b < phases.baloes.qtd; b++) {
                        const balaoMonth = sinalCount + ((b + 1) * 6);
                        scheduledPayments.push({
                            date: addMonths(startDate, balaoMonth),
                            value: phases.baloes.unitario,
                            description: `Balão ${b + 1}/${phases.baloes.qtd}`,
                            phase: 'Balões',
                        });
                    }
                }

                // Add scheduled payments to projections
                for (const payment of scheduledPayments) {
                    if (isAfter(payment.date, startProjection) && isBefore(payment.date, endProjection)) {
                        const key = format(payment.date, 'MMM/yy');
                        const entry = projections.get(key);

                        if (entry) {
                            const dateStr = format(payment.date, 'dd/MM/yyyy');
                            entry.payables += payment.value;
                            entry.details.expenses.push({
                                name: `${fin.asset.name} - ${payment.description} (${payment.phase})`,
                                date: dateStr,
                                value: payment.value,
                                originType: 'financing',
                                originId: fin.id,
                                originDetails: {
                                    assetName: fin.asset.name,
                                    assetId: fin.assetId,
                                    phase: payment.phase,
                                    description: payment.description,
                                }
                            });
                        }
                    }
                }
            }
        }

            // 3. Calculate Recurring Expenses (IPTU)
        const assets = await prisma.asset.findMany();

        for (const asset of assets) {
            // Use iptuValue (Decimal field) — NOT iptuRegistration (which stores inscription numbers)
            const rawIptuValue = asset.iptuValue ? Number(asset.iptuValue) : 0;

            if (rawIptuValue > 0 && rawIptuValue < 1000000) {
                const isAnnual = asset.iptuFrequency === 'annual';
                const iptuMonthly = isAnnual ? rawIptuValue / 12 : rawIptuValue;

                for (let i = 0; i < monthsToProject; i++) {
                    const targetMonthDate = addMonths(today, i);
                    const key = format(targetMonthDate, 'MMM/yy');
                    const entry = projections.get(key);

                    if (entry) {
                        entry.payables += iptuMonthly;
                        entry.details.expenses.push({
                            name: `${asset.name} - IPTU${isAnnual ? ' (Anual/12)' : ''} (Est.)`,
                            date: `10/${key}`,
                            value: iptuMonthly,
                            originType: 'iptu',
                            originId: asset.id,
                            originDetails: {
                                assetName: asset.name,
                                assetId: asset.id,
                                frequency: isAnnual ? 'annual' : 'monthly',
                            }
                        });
                    }
                }
            }
        }

        // 4. Finalize Balance and Sort
        const results = Array.from(projections.values()).map(p => ({
            ...p,
            balance: p.receivables - p.payables
        }));

        return results;

    } catch (e) {
        logger.error('Error calculating projected cash flow:', e);
        return [];
    }
}
