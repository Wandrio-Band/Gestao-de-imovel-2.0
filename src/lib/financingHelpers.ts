import { FinancingDetails, CashFlowItem } from '@/components/ai-studio/types';

/**
 * Parse currency string (BRL) or number to number.
 * "1.000.000,50" → 1000000.5
 */
export function parseCurrencyValue(val: string | number | undefined): number {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    const clean = val.replace(/[R$\s.]/g, '').replace(',', '.');
    return parseFloat(clean) || 0;
}

/**
 * Detect which financing phase(s) an asset has.
 */
export function getFinancingPhase(financing: FinancingDetails): 'construtora' | 'bancario' | 'both' {
    const hasConstrutora = !!(
        financing.phases &&
        ((financing.phases.sinal?.qtd > 0 && financing.phases.sinal?.unitario > 0) ||
            (financing.phases.mensais?.qtd > 0 && financing.phases.mensais?.unitario > 0))
    ) || !!(financing.cashFlow && financing.cashFlow.length > 0);

    const hasBancario = !!(
        parseCurrencyValue(financing.valorFinanciar) > 0 &&
        financing.sistemaAmortizacao &&
        financing.prazoMeses
    );

    if (hasConstrutora && hasBancario) return 'both';
    if (hasBancario) return 'bancario';
    return 'construtora';
}

/**
 * Calculate a single SAC installment.
 * SAC: fixed amortization, decreasing interest.
 */
export function calcSACPayment(
    saldoAtual: number,
    prazoRestante: number,
    taxaMensal: number,
    prazoTotal: number
): { prestacao: number; amortizacao: number; juros: number } {
    const amortizacao = saldoAtual / prazoTotal; // Fixed amortization in SAC uses original total term
    const juros = saldoAtual * taxaMensal;
    return {
        prestacao: amortizacao + juros,
        amortizacao,
        juros,
    };
}

/**
 * Calculate a PRICE installment.
 * PRICE: fixed total payment (prestação constante).
 */
export function calcPRICEPayment(
    saldoAtual: number,
    prazoRestante: number,
    taxaMensal: number,
): { prestacao: number; amortizacao: number; juros: number } {
    if (taxaMensal === 0) {
        const amortizacao = prazoRestante > 0 ? saldoAtual / prazoRestante : saldoAtual;
        return { prestacao: amortizacao, amortizacao, juros: 0 };
    }
    const prestacao = saldoAtual * (taxaMensal * Math.pow(1 + taxaMensal, prazoRestante)) /
        (Math.pow(1 + taxaMensal, prazoRestante) - 1);
    const juros = saldoAtual * taxaMensal;
    const amortizacao = prestacao - juros;
    return { prestacao, amortizacao, juros };
}

/**
 * Generate full bank amortization table.
 */
export interface BankAmortizationRow {
    id: string;
    parcela: number;
    date: string;
    prestacao: number;
    amortizacao: number;
    juros: number;
    saldoDevedor: number;
}

export function generateBankAmortizationTable(financing: FinancingDetails): BankAmortizationRow[] {
    const valorFinanciar = parseCurrencyValue(financing.valorFinanciar);
    if (valorFinanciar <= 0) return [];

    const prazo = parseInt(financing.prazoMeses || '0') || 0;
    if (prazo <= 0) return [];

    const jurosAnuais = parseFloat(financing.jurosAnuais || '0') / 100;
    const taxaMensal = jurosAnuais > 0 ? Math.pow(1 + jurosAnuais, 1 / 12) - 1 : 0;
    const sistema = (financing.sistemaAmortizacao || 'SAC').toUpperCase();

    let startDate = new Date();
    if (financing.vencimentoPrimeira) {
        const parsed = new Date(financing.vencimentoPrimeira);
        if (!isNaN(parsed.getTime())) startDate = parsed;
    }

    const rows: BankAmortizationRow[] = [];
    let saldo = valorFinanciar;

    for (let i = 0; i < prazo && saldo > 0.01; i++) {
        const date = new Date(startDate);
        date.setMonth(date.getMonth() + i);

        const calc = sistema === 'PRICE'
            ? calcPRICEPayment(saldo, prazo - i, taxaMensal)
            : calcSACPayment(saldo, prazo - i, taxaMensal, prazo);

        saldo = Math.max(0, saldo - calc.amortizacao);

        rows.push({
            id: `bank-${i}`,
            parcela: i + 1,
            date: `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`,
            prestacao: calc.prestacao,
            amortizacao: calc.amortizacao,
            juros: calc.juros,
            saldoDevedor: saldo,
        });
    }

    return rows;
}

/**
 * Parse DD/MM/YYYY string to Date.
 */
export function parseDDMMYYYY(dateStr: string): Date {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
        const [d, m, y] = parts.map(Number);
        return new Date(y, m - 1, d);
    }
    return new Date(dateStr);
}

/**
 * Get total value of a CashFlowItem.
 */
export function getCashFlowItemTotal(item: CashFlowItem): number {
    return Object.values(item.valoresPorSocio).reduce((a, b) => a + b, 0);
}
