'use server';

import { prisma } from '@/lib/prisma';
import { addMonths, format, startOfMonth, endOfMonth, parseISO, isAfter, isBefore } from 'date-fns';

export interface CashFlowProjection {
    month: string; // "Fev/26"
    receivables: number;
    payables: number;
    balance: number;
    details: {
        incomes: { name: string, day: number, value: number }[];
        expenses: { name: string, date: string, value: number }[];
    }
}

export async function getProjectedCashFlow(monthsToProject: number = 12): Promise<CashFlowProjection[]> {
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
                const paymentDate = new Date(targetMonthDate.getFullYear(), targetMonthDate.getMonth(), contract.dueDay);

                // Ensure payment date implies valid contract duration? 
                // For MVP, we assume active contracts yield revenue indefinitely until status changes.

                const key = format(targetMonthDate, 'MMM/yy');
                const entry = projections.get(key);

                if (entry) {
                    const value = Number(contract.currentValue);
                    entry.receivables += value;
                    entry.details.incomes.push({
                        name: `${contract.asset.name} - ${contract.tenant.name}`,
                        day: contract.dueDay,
                        value: value
                    });
                }
            }
        }

        // 2. Calculate Payables (Financing CashFlows)
        const financings = await prisma.financing.findMany({
            include: { asset: true }
        });

        for (const fin of financings) {
            if (!fin.cashFlow) continue;

            let cashFlowItems: any[] = [];
            try {
                cashFlowItems = JSON.parse(fin.cashFlow);
            } catch (e) {
                console.error(`Error parsing cashflow for asset ${fin.asset.name}`, e);
                continue;
            }

            for (const item of cashFlowItems) {
                // item.vencimento is "DD/MM/YYYY" usually, from the wizard logic.
                // We need to parse it. 
                const [d, m, y] = item.vencimento.split('/').map(Number);
                const itemDate = new Date(y, m - 1, d);

                if (isAfter(itemDate, startProjection) && isBefore(itemDate, endProjection)) {
                    const key = format(itemDate, 'MMM/yy');
                    const entry = projections.get(key);

                    if (entry) {
                        // Sum all partners shares for total asset expense
                        const totalValue = Object.values(item.valoresPorSocio as Record<string, number>)
                            .reduce((a, b) => a + b, 0);

                        entry.payables += totalValue;
                        entry.details.expenses.push({
                            name: `${fin.asset.name} - ${item.descricao} (${item.fase})`,
                            date: item.vencimento,
                            value: totalValue
                        });
                    }
                }
            }
        }

        // Helper to parse BRL currency strings
        const parseCurrency = (val: string | number | undefined | null): number => {
            if (!val) return 0;
            if (typeof val === 'number') return val;
            // Remove "R$", spaces, dots, and replace comma with dot
            const clean = val.replace(/[R$\s.]/g, '').replace(',', '.');
            const parsed = parseFloat(clean);
            return isNaN(parsed) ? 0 : parsed;
        };

        // 3. Calculate Recurring Expenses (IPTU)
        // We assume all assets in the system generate IPTU cost unless specified otherwise.
        const assets = await prisma.asset.findMany();

        for (const asset of assets) {
            // Project IPTU
            if (asset.iptu) {
                const iptuValue = parseCurrency(asset.iptu);

                if (iptuValue > 0) {
                    // Try to determine if it's monthly or annual? 
                    // Usually "IPTU" field often stores the *total Annual* or *Monthly* value?
                    // For this MVP, let's assume the field holds the MONTHLY installment value usually paid.
                    // Or if it's annual, we normally divide by 10 or 12. 
                    // Let's assume it is the Monthly Payment amount for simplicity of the "Fixed Cost".

                    for (let i = 0; i < monthsToProject; i++) {
                        const targetMonthDate = addMonths(today, i);
                        const key = format(targetMonthDate, 'MMM/yy');
                        const entry = projections.get(key);

                        if (entry) {
                            entry.payables += iptuValue;
                            entry.details.expenses.push({
                                name: `${asset.name} - IPTU (Est.)`,
                                date: `10/${key}`, // Hypothetical due date
                                value: iptuValue
                            });
                        }
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
        console.error('Error calculating projected cash flow:', e);
        return [];
    }
}
