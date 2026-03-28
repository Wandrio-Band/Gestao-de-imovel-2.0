import { describe, it, expect } from 'vitest';
import { invoiceCreateSchema, invoiceUpdateSchema, aiExtractSchema, resetConfirmSchema } from '@/lib/validations';

describe('invoiceCreateSchema', () => {
    it('accepts valid minimal invoice', () => {
        const result = invoiceCreateSchema.safeParse({});
        expect(result.success).toBe(true);
    });

    it('accepts full valid invoice', () => {
        const result = invoiceCreateSchema.safeParse({
            data: '27/03/2026',
            cnpj_cpf_emissor: '12.345.678/0001-90',
            nome_emissor: 'Empresa Teste',
            valor_total: 1500.50,
            categoria: 'Reforma',
            status: 'APROVADO',
            source: 'Upload',
            nome_tomador: 'Tomador Teste',
            cpf_cnpj_tomador: '123.456.789-00',
        });
        expect(result.success).toBe(true);
    });

    it('rejects invalid status', () => {
        const result = invoiceCreateSchema.safeParse({
            status: 'INVALIDO',
        });
        expect(result.success).toBe(false);
    });

    it('accepts valor_total as string or number', () => {
        const asNumber = invoiceCreateSchema.safeParse({ valor_total: 1500 });
        const asString = invoiceCreateSchema.safeParse({ valor_total: '1500.00' });
        expect(asNumber.success).toBe(true);
        expect(asString.success).toBe(true);
    });

    it('rejects nome_emissor over 200 chars', () => {
        const result = invoiceCreateSchema.safeParse({
            nome_emissor: 'A'.repeat(201),
        });
        expect(result.success).toBe(false);
    });

    it('accepts empty email_tomador', () => {
        const result = invoiceCreateSchema.safeParse({
            email_tomador: '',
        });
        expect(result.success).toBe(true);
    });

    it('rejects invalid email_tomador', () => {
        const result = invoiceCreateSchema.safeParse({
            email_tomador: 'not-an-email',
        });
        expect(result.success).toBe(false);
    });

    it('accepts items as string or array', () => {
        const asString = invoiceCreateSchema.safeParse({ items: '[]' });
        const asArray = invoiceCreateSchema.safeParse({ items: [{ descricao: 'Item 1' }] });
        expect(asString.success).toBe(true);
        expect(asArray.success).toBe(true);
    });

    it('defaults status to PENDENTE', () => {
        const result = invoiceCreateSchema.safeParse({});
        if (result.success) {
            expect(result.data.status).toBe('PENDENTE');
        }
    });
});

describe('invoiceUpdateSchema', () => {
    it('accepts partial update with just status', () => {
        const result = invoiceUpdateSchema.safeParse({ status: 'APROVADO' });
        expect(result.success).toBe(true);
    });

    it('accepts empty object (all optional)', () => {
        const result = invoiceUpdateSchema.safeParse({});
        expect(result.success).toBe(true);
    });
});

describe('aiExtractSchema', () => {
    it('accepts valid text content', () => {
        const result = aiExtractSchema.safeParse({
            content: 'Some invoice text content',
            isFile: false,
        });
        expect(result.success).toBe(true);
    });

    it('accepts valid file content', () => {
        const result = aiExtractSchema.safeParse({
            content: 'base64data...',
            isFile: true,
            mimeType: 'image/png',
        });
        expect(result.success).toBe(true);
    });

    it('rejects empty content', () => {
        const result = aiExtractSchema.safeParse({
            content: '',
            isFile: false,
        });
        expect(result.success).toBe(false);
    });

    it('defaults isFile to false', () => {
        const result = aiExtractSchema.safeParse({ content: 'test' });
        if (result.success) {
            expect(result.data.isFile).toBe(false);
        }
    });
});

describe('resetConfirmSchema', () => {
    it('accepts confirm: true', () => {
        const result = resetConfirmSchema.safeParse({ confirm: true });
        expect(result.success).toBe(true);
    });

    it('rejects confirm: false', () => {
        const result = resetConfirmSchema.safeParse({ confirm: false });
        expect(result.success).toBe(false);
    });

    it('rejects missing confirm', () => {
        const result = resetConfirmSchema.safeParse({});
        expect(result.success).toBe(false);
    });
});
