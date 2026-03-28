import { describe, it, expect } from 'vitest';
import {
    ASSET_TYPES,
    ASSET_STATUS,
    IRPF_STATUS,
    DEFAULT_PARTNERS,
    BACKUP_CONFIG,
    CURRENCY_CONFIG,
    VALIDATION,
    UI_CONFIG,
    SIMILARITY_THRESHOLD,
    DEFAULT_IPCA_RATE,
    DEFAULT_PENALTY_PERCENT,
    DEFAULT_DUE_DAY,
    MAX_AI_RETRIES,
    MAX_GMAIL_RESULTS,
} from '@/lib/constants';

describe('constants', () => {
    describe('ASSET_TYPES', () => {
        it('contains expected property types', () => {
            expect(ASSET_TYPES).toContain('Apartamento');
            expect(ASSET_TYPES).toContain('Casa');
            expect(ASSET_TYPES).toContain('Terreno');
            expect(ASSET_TYPES).toContain('Sala Comercial');
        });

        it('has at least 5 types', () => {
            expect(ASSET_TYPES.length).toBeGreaterThanOrEqual(5);
        });
    });

    describe('ASSET_STATUS', () => {
        it('contains all valid statuses', () => {
            expect(ASSET_STATUS).toContain('Vago');
            expect(ASSET_STATUS).toContain('Locado');
            expect(ASSET_STATUS).toContain('Em Reforma');
            expect(ASSET_STATUS).toContain('Uso Próprio');
            expect(ASSET_STATUS).toContain('À Venda');
        });
    });

    describe('IRPF_STATUS', () => {
        it('contains all tax declaration statuses', () => {
            expect(IRPF_STATUS).toContain('Declarado');
            expect(IRPF_STATUS).toContain('Pendente');
            expect(IRPF_STATUS).toContain('Isento');
        });
    });

    describe('DEFAULT_PARTNERS', () => {
        it('has at least 1 partner', () => {
            expect(DEFAULT_PARTNERS.length).toBeGreaterThanOrEqual(1);
        });
    });

    describe('BACKUP_CONFIG', () => {
        it('has a version', () => {
            expect(BACKUP_CONFIG.VERSION).toBe('1.0');
        });

        it('has reasonable file size limit', () => {
            expect(BACKUP_CONFIG.MAX_FILE_SIZE_MB).toBeGreaterThan(0);
            expect(BACKUP_CONFIG.MAX_FILE_SIZE_MB).toBeLessThanOrEqual(100);
        });

        it('has rate limit of at least 1 minute', () => {
            expect(BACKUP_CONFIG.RATE_LIMIT_MS).toBeGreaterThanOrEqual(60_000);
        });
    });

    describe('CURRENCY_CONFIG', () => {
        it('uses pt-BR locale and BRL', () => {
            expect(CURRENCY_CONFIG.locale).toBe('pt-BR');
            expect(CURRENCY_CONFIG.currency).toBe('BRL');
        });
    });

    describe('VALIDATION', () => {
        it('CEP pattern matches valid CEP', () => {
            expect(VALIDATION.CEP_PATTERN.test('12345-678')).toBe(true);
            expect(VALIDATION.CEP_PATTERN.test('12345678')).toBe(true);
        });

        it('CEP pattern rejects invalid CEP', () => {
            expect(VALIDATION.CEP_PATTERN.test('1234-567')).toBe(false);
            expect(VALIDATION.CEP_PATTERN.test('abcde-fgh')).toBe(false);
        });

        it('has valid asset value range', () => {
            expect(VALIDATION.MIN_ASSET_VALUE).toBe(0);
            expect(VALIDATION.MAX_ASSET_VALUE).toBeGreaterThan(0);
        });
    });

    describe('Business constants', () => {
        it('SIMILARITY_THRESHOLD is between 0 and 1', () => {
            expect(SIMILARITY_THRESHOLD).toBeGreaterThan(0);
            expect(SIMILARITY_THRESHOLD).toBeLessThan(1);
        });

        it('DEFAULT_IPCA_RATE is reasonable', () => {
            expect(DEFAULT_IPCA_RATE).toBeGreaterThan(0);
            expect(DEFAULT_IPCA_RATE).toBeLessThan(0.5); // < 50%
        });

        it('DEFAULT_PENALTY_PERCENT is 10', () => {
            expect(DEFAULT_PENALTY_PERCENT).toBe(10);
        });

        it('DEFAULT_DUE_DAY is between 1 and 31', () => {
            expect(DEFAULT_DUE_DAY).toBeGreaterThanOrEqual(1);
            expect(DEFAULT_DUE_DAY).toBeLessThanOrEqual(31);
        });

        it('MAX_AI_RETRIES is reasonable', () => {
            expect(MAX_AI_RETRIES).toBeGreaterThanOrEqual(1);
            expect(MAX_AI_RETRIES).toBeLessThanOrEqual(10);
        });

        it('MAX_GMAIL_RESULTS is positive', () => {
            expect(MAX_GMAIL_RESULTS).toBeGreaterThan(0);
        });
    });

    describe('UI_CONFIG', () => {
        it('has reasonable page size', () => {
            expect(UI_CONFIG.TABLE_PAGE_SIZE).toBeGreaterThan(0);
            expect(UI_CONFIG.TABLE_PAGE_SIZE).toBeLessThanOrEqual(100);
        });

        it('has reasonable toast duration', () => {
            expect(UI_CONFIG.TOAST_DURATION_MS).toBeGreaterThanOrEqual(1000);
        });
    });
});
