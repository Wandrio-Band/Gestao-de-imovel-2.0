import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

// Mock auth-guard
vi.mock('@/lib/auth-guard', () => ({
    requireAuth: vi.fn(() => ({ user: { name: 'Test', role: 'USER' } })),
    requireAdmin: vi.fn(() => ({ user: { name: 'Admin', role: 'ADMIN' } })),
}));

// Helper to create mock NextRequest objects
function createRequest(method: string, url: string, body?: object): NextRequest {
    const req = new NextRequest(new URL(url, 'http://localhost:3000'), {
        method,
        ...(body ? { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } } : {}),
    });
    return req;
}

// Sample invoice returned by Prisma
const sampleInvoice = {
    id: 'inv-001',
    data: '2026-03-27',
    cnpj_cpf_emissor: '12345678000199',
    nome_emissor: 'Empresa Teste Ltda',
    endereco_emissor: 'Rua Teste 123',
    cidade: 'Sao Paulo',
    estado: 'SP',
    valor_total: '1500.00',
    categoria: 'SERVICO',
    status: 'PENDENTE',
    source: 'MANUAL',
    fileCopy: null,
    auditReason: null,
    items: null,
    numero_nota: '001',
    serie_nota: '1',
    beneficiario: 'Beneficiario Teste',
    nome_tomador: 'Tomador Teste',
    cpf_cnpj_tomador: '98765432000111',
    endereco_tomador: 'Rua Tomador 456',
    email_tomador: 'tomador@test.com',
    telefone_emissor: '11999999999',
    telefone_tomador: '11888888888',
    createdAt: new Date('2026-03-27T10:00:00Z'),
    updatedAt: new Date('2026-03-27T10:00:00Z'),
};

beforeEach(() => {
    vi.clearAllMocks();
});

// ─── GET /api/invoices ──────────────────────────────────────────────────────

describe('GET /api/invoices', () => {
    it('returns paginated list of invoices', async () => {
        const { GET } = await import('@/app/api/invoices/route');

        const mockInvoices = [sampleInvoice];
        vi.mocked(prisma.invoice.findMany).mockResolvedValue(mockInvoices as never);
        vi.mocked(prisma.invoice.count).mockResolvedValue(1);

        const req = createRequest('GET', '/api/invoices?page=1&limit=10');
        const res = await GET(req);
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.data).toHaveLength(1);
        expect(json.total).toBe(1);
        expect(json.page).toBe(1);
        expect(json.limit).toBe(10);
        expect(prisma.invoice.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                orderBy: { createdAt: 'desc' },
                skip: 0,
                take: 10,
            })
        );
    });

    it('returns empty list when no invoices', async () => {
        const { GET } = await import('@/app/api/invoices/route');

        vi.mocked(prisma.invoice.findMany).mockResolvedValue([]);
        vi.mocked(prisma.invoice.count).mockResolvedValue(0);

        const req = createRequest('GET', '/api/invoices');
        const res = await GET(req);
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.data).toHaveLength(0);
        expect(json.total).toBe(0);
    });
});

// ─── POST /api/invoices ─────────────────────────────────────────────────────

describe('POST /api/invoices', () => {
    it('creates invoice with valid data', async () => {
        const { POST } = await import('@/app/api/invoices/route');

        const createData = {
            nome_emissor: 'Empresa Teste Ltda',
            cnpj_cpf_emissor: '12345678000199',
            valor_total: 1500,
            categoria: 'SERVICO',
            status: 'PENDENTE' as const,
            source: 'MANUAL',
        };

        vi.mocked(prisma.invoice.create).mockResolvedValue({
            ...sampleInvoice,
            ...createData,
            valor_total: '1500',
        } as never);

        const req = createRequest('POST', '/api/invoices', createData);
        const res = await POST(req);
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.nome_emissor).toBe('Empresa Teste Ltda');
        expect(prisma.invoice.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    nome_emissor: 'Empresa Teste Ltda',
                    cnpj_cpf_emissor: '12345678000199',
                    valor_total: '1500',
                }),
            })
        );
    });

    it('rejects invalid data (missing required fields)', async () => {
        const { POST } = await import('@/app/api/invoices/route');

        // email_tomador must be a valid email or empty string -- invalid value triggers validation error
        const invalidData = {
            email_tomador: 'not-an-email',
        };

        const req = createRequest('POST', '/api/invoices', invalidData);
        const res = await POST(req);
        const json = await res.json();

        expect(res.status).toBe(400);
        expect(json.error).toBe('Dados invalidos');
        expect(json.code).toBe('VALIDATION_ERROR');
        expect(json.fields).toBeDefined();
        expect(prisma.invoice.create).not.toHaveBeenCalled();
    });
});

// ─── PUT /api/invoices/[id] ─────────────────────────────────────────────────

describe('PUT /api/invoices/[id]', () => {
    it('updates existing invoice', async () => {
        const { PUT } = await import('@/app/api/invoices/[id]/route');

        const updateData = {
            status: 'APROVADO' as const,
            auditReason: 'Verificado e aprovado',
        };

        vi.mocked(prisma.invoice.update).mockResolvedValue({
            ...sampleInvoice,
            status: 'APROVADO',
            auditReason: 'Verificado e aprovado',
        } as never);

        const req = createRequest('PUT', '/api/invoices/inv-001', updateData);
        const res = await PUT(req, { params: Promise.resolve({ id: 'inv-001' }) });
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.status).toBe('APROVADO');
        expect(json.auditReason).toBe('Verificado e aprovado');
        expect(prisma.invoice.update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: 'inv-001' },
                data: expect.objectContaining({
                    status: 'APROVADO',
                    auditReason: 'Verificado e aprovado',
                }),
            })
        );
    });
});

// ─── DELETE /api/invoices/[id] ──────────────────────────────────────────────

describe('DELETE /api/invoices/[id]', () => {
    it('deletes existing invoice', async () => {
        const { DELETE } = await import('@/app/api/invoices/[id]/route');

        vi.mocked(prisma.invoice.delete).mockResolvedValue(sampleInvoice as never);

        const req = createRequest('DELETE', '/api/invoices/inv-001');
        const res = await DELETE(req, { params: Promise.resolve({ id: 'inv-001' }) });
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.success).toBe(true);
        expect(prisma.invoice.delete).toHaveBeenCalledWith({
            where: { id: 'inv-001' },
        });
    });

    it('returns 404 for non-existent invoice', async () => {
        const { DELETE } = await import('@/app/api/invoices/[id]/route');

        const prismaError = new Error('Record to delete does not exist.');
        (prismaError as unknown as { code: string }).code = 'P2025';
        vi.mocked(prisma.invoice.delete).mockRejectedValue(prismaError);

        const req = createRequest('DELETE', '/api/invoices/non-existent');
        const res = await DELETE(req, { params: Promise.resolve({ id: 'non-existent' }) });
        const json = await res.json();

        expect(res.status).toBe(404);
        expect(json.error).toBe('Nota fiscal nao encontrada');
        expect(json.code).toBe('NOT_FOUND');
    });
});

// ─── DELETE /api/invoices/reset ─────────────────────────────────────────────

describe('DELETE /api/invoices/reset', () => {
    it('deletes all invoices with confirmation', async () => {
        const { DELETE } = await import('@/app/api/invoices/reset/route');

        vi.mocked(prisma.invoice.count).mockResolvedValue(5);
        vi.mocked(prisma.invoice.deleteMany).mockResolvedValue({ count: 5 });

        const req = createRequest('DELETE', '/api/invoices/reset', { confirm: true });
        const res = await DELETE(req);
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.success).toBe(true);
        expect(json.count).toBe(5);
        expect(prisma.invoice.deleteMany).toHaveBeenCalledWith({});
    });
});
