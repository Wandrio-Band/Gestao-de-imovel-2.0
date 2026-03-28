/**
 * Utilitários de Formatação e Normalização de Dados
 * 
 * Este módulo centraliza todas as funções para formatação de moeda, datas
 * e normalização de valores para o padrão brasileiro (pt-BR).
 */

/**
 * Formata um valor numérico como moeda BRL (Real)
 * 
 * Usa locale pt-BR para formatação correta com R$ e casas decimais.
 * 
 * @param {string|number|undefined} value - Valor a formatar (string, número ou undefined)
 * @returns {string} Valor formatado ex: "R$ 1.234,56"
 * 
 * @example
 * formatMoney(1234.56) // "R$ 1.234,56"
 * formatMoney("2500") // "R$ 2.500,00"
 * formatMoney(undefined) // "R$ 0,00"
 */
export function formatMoney(value: string | number | undefined): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0);
}

/**
 * Formata valor como moeda sem casas decimais (compacto)
 * 
 * Útil para exibição em tabelas ou cards onde espaço é limitado.
 * 
 * @param {number} value - Valor a formatar
 * @returns {string} Valor formatado ex: "R$ 1.235"
 * 
 * @example
 * formatCurrencyCompact(1234.56) // "R$ 1.235"
 * formatCurrencyCompact(1000000) // "R$ 1.000.000"
 */
export function formatCurrencyCompact(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
}

/**
 * Formata valor como moeda com casas decimais reduzidas para valores grandes
 * 
 * Para valores >= 1.000.000: exibe 1 casa decimal (ex: "R$ 1.5M")
 * Para valores < 1.000.000: exibe 2 casas decimais (ex: "R$ 1.234,56")
 * 
 * Útil para gráficos e resumos onde valores variam muito em magnitude.
 * 
 * @param {number} value - Valor a formatar
 * @returns {string} Valor formatado
 * 
 * @example
 * formatCurrencyLarge(1234.56) // "R$ 1.234,56"
 * formatCurrencyLarge(1500000) // "R$ 1.500.000,0"
 */
export function formatCurrencyLarge(value: number): string {
    if (value >= 1000000) {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 1 }).format(value);
    }
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

/**
 * Formata número decimal com 2 casas decimais
 * 
 * Usa separador decimal com vírgula (pt-BR) e ponto como separador de milhares.
 * 
 * @param {number} value - Valor a formatar
 * @returns {string} Número formatado ex: "1.234,56"
 * 
 * @example
 * formatDecimal(1234.567) // "1.234,57" (arredondado)
 * formatDecimal(100) // "100,00"
 */
export function formatDecimal(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

/**
 * Normaliza diferentes formatos de data para DD/MM/YYYY
 * 
 * Aceita múltiplos formatos de entrada:
 * - "15/12/24" ou "15/12/2024" (entrada com ano curto ou longo)
 * - "2024-12-15" (ISO format)
 * - "2024/12/15" (barra com ISO)
 * 
 * @param {string} [dateStr] - String de data em diversos formatos
 * @returns {string} Data normalizada no formato DD/MM/YYYY
 * 
 * @example
 * normalizeDate("15/12/24") // "15/12/2024"
 * normalizeDate("2024-12-15") // "15/12/2024"
 * normalizeDate("2024/12/15") // "15/12/2024"
 * normalizeDate(undefined) // Data de hoje em DD/MM/YYYY
 */
export function normalizeDate(dateStr?: string): string {
    if (!dateStr) return new Date().toLocaleDateString('pt-BR');
    const clean = dateStr.trim();
    if (/^\d{2}\/\d{2}\/\d{2}$/.test(clean)) {
        const [d, m, y] = clean.split('/');
        return `${d}/${m}/20${y}`;
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
        const [y, m, d] = clean.split('-');
        return `${d}/${m}/${y}`;
    }
    if (/^\d{4}\/\d{2}\/\d{2}$/.test(clean)) {
        const [y, m, d] = clean.split('/');
        return `${d}/${m}/${y}`;
    }
    return clean;
}

/**
 * Normaliza diferentes formatos de valor para número decimal
 * 
 * Remove símbolos de moeda (R$), espaços e converte para número válido.
 * Suporta múltiplos separadores decimais:
 * - "1.234,56" (padrão brasileiro) -> 1234.56
 * - "1,234.56" (padrão US) -> 1234.56
 * - "1234.56" -> 1234.56
 * - "R$ 1.234,56" -> 1234.56
 * 
 * @param {string|number|undefined} val - Valor em diversos formatos
 * @returns {number} Número decimal normalizado, ou 0 se inválido
 * 
 * @example
 * normalizeValue("R$ 1.234,56") // 1234.56
 * normalizeValue("1,234.56") // 1234.56
 * normalizeValue(1234.56) // 1234.56
 * normalizeValue("") // 0
 * normalizeValue(undefined) // 0
 */
export function normalizeValue(val: string | number | undefined): number {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    let clean = val.toString().replace(/[R$\s]/g, '');
    if (clean.includes(',') && (!clean.includes('.') || clean.lastIndexOf(',') > clean.lastIndexOf('.'))) {
        clean = clean.replace(/\./g, '').replace(',', '.');
    } else {
        clean = clean.replace(/,/g, '');
    }
    return parseFloat(clean) || 0;
}
