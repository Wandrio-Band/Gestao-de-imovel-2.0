import { describe, it, expect } from 'vitest';
import { formatMoney, normalizeDate, normalizeValue } from '@/lib/formatters';

describe('formatMoney', () => {
    it('formats number to BRL currency', () => {
        const result = formatMoney(1500.50);
        expect(result).toContain('1.500,50');
        expect(result).toContain('R$');
    });

    it('formats string number', () => {
        const result = formatMoney('2500');
        expect(result).toContain('2.500,00');
    });

    it('handles undefined as R$ 0,00', () => {
        const result = formatMoney(undefined);
        expect(result).toContain('0,00');
    });

    it('handles zero', () => {
        const result = formatMoney(0);
        expect(result).toContain('0,00');
    });

    it('handles negative values', () => {
        const result = formatMoney(-500);
        expect(result).toContain('500,00');
    });

    it('handles NaN string as 0', () => {
        const result = formatMoney('not-a-number');
        expect(result).toContain('0,00');
    });

    it('formats large values', () => {
        const result = formatMoney(1250000);
        expect(result).toContain('1.250.000,00');
    });
});

describe('normalizeDate', () => {
    it('converts YYYY-MM-DD to DD/MM/YYYY', () => {
        expect(normalizeDate('2024-03-15')).toBe('15/03/2024');
    });

    it('converts YYYY/MM/DD to DD/MM/YYYY', () => {
        expect(normalizeDate('2024/03/15')).toBe('15/03/2024');
    });

    it('converts DD/MM/YY to DD/MM/20YY', () => {
        expect(normalizeDate('15/03/24')).toBe('15/03/2024');
    });

    it('returns DD/MM/YYYY as-is', () => {
        expect(normalizeDate('15/03/2024')).toBe('15/03/2024');
    });

    it('returns today for undefined input', () => {
        const result = normalizeDate(undefined);
        expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    });

    it('returns today for empty string', () => {
        const result = normalizeDate('');
        expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    });

    it('trims whitespace', () => {
        expect(normalizeDate('  2024-01-01  ')).toBe('01/01/2024');
    });

    it('returns unrecognized format as-is', () => {
        expect(normalizeDate('March 15, 2024')).toBe('March 15, 2024');
    });
});

describe('normalizeValue', () => {
    it('returns 0 for undefined', () => {
        expect(normalizeValue(undefined)).toBe(0);
    });

    it('returns 0 for empty string', () => {
        expect(normalizeValue('')).toBe(0);
    });

    it('returns number as-is', () => {
        expect(normalizeValue(1500)).toBe(1500);
    });

    it('parses BRL format "1.500,50"', () => {
        expect(normalizeValue('1.500,50')).toBe(1500.50);
    });

    it('parses "R$ 2.500,00"', () => {
        expect(normalizeValue('R$ 2.500,00')).toBe(2500);
    });

    it('parses US format "1,500.50"', () => {
        expect(normalizeValue('1,500.50')).toBe(1500.50);
    });

    it('parses plain number string "1500"', () => {
        expect(normalizeValue('1500')).toBe(1500);
    });

    it('handles "R$1.250.000,00"', () => {
        expect(normalizeValue('R$1.250.000,00')).toBe(1250000);
    });

    it('returns 0 for non-numeric string', () => {
        expect(normalizeValue('abc')).toBe(0);
    });

    it('parses "0,50" as 0.5', () => {
        expect(normalizeValue('0,50')).toBe(0.5);
    });
});
