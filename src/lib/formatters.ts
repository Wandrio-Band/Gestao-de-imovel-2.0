/**
 * Centralized formatting and normalization utilities
 */

export function formatMoney(value: string | number | undefined): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0);
}

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
