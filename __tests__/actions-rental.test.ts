import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';

const mockSession = {
    user: { name: 'Test User', email: 'test@test.com', role: 'USER' },
};

vi.mock('@/lib/auth-guard', () => ({
    requireAuth: vi.fn(() => mockSession),
    requireAdmin: vi.fn(() => ({ user: { name: 'Admin', role: 'ADMIN' } })),
}));

vi.mock('string-similarity', () => ({
    default: { compareTwoStrings: vi.fn(() => 0.8) },
}));

vi.mock('@/lib/action-schemas', () => ({
    conciliationSchema: { safeParse: vi.fn(() => ({ success: true, data: [] })) },
    pixEntrySchema: { safeParse: vi.fn((d: unknown) => ({ success: true, data: d })) },
}));

import {
    importContractFromPDF,
    confirmPaymentAndLearn,
    checkAndApplyAdjustments,
    getTenantAliases,
    deleteAlias,
} from '@/app/actions/rental';

describe('importContractFromPDF', () => {
    beforeEach(() => vi.clearAllMocks());

    it('creates tenant, contract, lease and updates asset status', async () => {
        vi.mocked(prisma.tenant.findUnique).mockResolvedValue(null);
        vi.mocked(prisma.tenant.create).mockResolvedValue({
            id: 't-new',
            name: 'Carlos Souza',
            document: '111.222.333-44',
        } as any);
        vi.mocked(prisma.contract.create).mockResolvedValue({
            id: 'c-new',
            assetId: 'a-1',
            tenantId: 't-new',
            status: 'active',
        } as any);

        const result = await importContractFromPDF({
            tenantName: 'Carlos Souza',
            tenantDocument: '111.222.333-44',
            tenantEmail: 'carlos@test.com',
            tenantPhone: '11999990000',
            assetId: 'a-1',
            startDate: '2026-01-01',
            rentValue: 3500,
            dueDay: 10,
            penaltyPercent: 10,
        });

        expect(result.success).toBe(true);
        expect(result.contractId).toBe('c-new');
        expect(prisma.tenant.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    name: 'Carlos Souza',
                    document: '111.222.333-44',
                    email: 'carlos@test.com',
                    phone: '11999990000',
                }),
            })
        );
        expect(prisma.contract.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    assetId: 'a-1',
                    tenantId: 't-new',
                    baseValue: 3500,
                    currentValue: 3500,
                    dueDay: 10,
                    status: 'active',
                }),
            })
        );
    });

    it('fails without required fields (nomeInquilino)', async () => {
        vi.mocked(prisma.tenant.findUnique).mockResolvedValue(null);
        vi.mocked(prisma.tenant.create).mockRejectedValue(new Error('Missing required field'));

        const result = await importContractFromPDF({
            tenantName: '',
            tenantDocument: '',
            assetId: 'a-1',
            startDate: '2026-01-01',
            rentValue: 3500,
        });

        expect(result.success).toBe(false);
    });
});

describe('confirmPaymentAndLearn', () => {
    beforeEach(() => vi.clearAllMocks());

    it('creates paymentHistory record', async () => {
        vi.mocked(prisma.paymentHistory.create).mockResolvedValue({} as any);
        vi.mocked(prisma.tenantAlias.findUnique).mockResolvedValue(null);
        vi.mocked(prisma.tenantAlias.create).mockResolvedValue({} as any);

        const pixEntry = { date: '2026-03-15', amount: 2500, description: 'PIX NOVO ALIAS' };
        const result = await confirmPaymentAndLearn('tenant-1', 'contract-1', pixEntry);

        expect(result.success).toBe(true);
        expect(prisma.paymentHistory.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    contractId: 'contract-1',
                    paidValue: 2500,
                    status: 'paid',
                    method: 'PIX',
                }),
            })
        );
    });

    it('creates tenantAlias for learning', async () => {
        vi.mocked(prisma.paymentHistory.create).mockResolvedValue({} as any);
        vi.mocked(prisma.tenantAlias.findUnique).mockResolvedValue(null);
        vi.mocked(prisma.tenantAlias.create).mockResolvedValue({} as any);

        const pixEntry = { date: '2026-03-15', amount: 2500, description: 'PIX CARLOS' };
        const result = await confirmPaymentAndLearn('tenant-1', 'contract-1', pixEntry);

        expect(result.success).toBe(true);
        expect(prisma.tenantAlias.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    tenantId: 'tenant-1',
                    aliasName: 'PIX CARLOS',
                    confidence: 1.0,
                }),
            })
        );
    });
});

describe('checkAndApplyAdjustments', () => {
    beforeEach(() => vi.clearAllMocks());

    it('applies IPCA adjustment to eligible contracts', async () => {
        const today = new Date();
        const startDate = new Date(today.getFullYear() - 1, today.getMonth(), 15);

        vi.mocked(prisma.contract.findMany).mockResolvedValue([
            {
                id: 'c-1',
                assetId: 'a-1',
                currentValue: 2000,
                startDate,
                lastAdjustment: null,
                status: 'active',
            },
        ] as any);
        vi.mocked(prisma.contract.update).mockResolvedValue({} as any);

        const result = await checkAndApplyAdjustments();

        expect(result.success).toBe(true);
        expect(result.updatedCount).toBe(1);
        expect(prisma.contract.update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: 'c-1' },
                data: expect.objectContaining({
                    currentValue: 2000 * 1.045, // 4.5% IPCA
                }),
            })
        );
    });
});

describe('getTenantAliases', () => {
    beforeEach(() => vi.clearAllMocks());

    it('returns list of aliases', async () => {
        vi.mocked(prisma.tenantAlias.findMany).mockResolvedValue([
            { id: 'a-1', tenantId: 't-1', aliasName: 'PIX JOAO', tenant: { name: 'Joao' } },
            { id: 'a-2', tenantId: 't-2', aliasName: 'PIX MARIA', tenant: { name: 'Maria' } },
        ] as any);

        const result = await getTenantAliases();

        expect(result).toHaveLength(2);
        expect(prisma.tenantAlias.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                include: { tenant: { select: { name: true } } },
                orderBy: { lastUsed: 'desc' },
            })
        );
    });
});

describe('deleteAlias', () => {
    beforeEach(() => vi.clearAllMocks());

    it('deletes alias by ID', async () => {
        vi.mocked(prisma.tenantAlias.delete).mockResolvedValue({} as any);

        const result = await deleteAlias('alias-1');

        expect(result.success).toBe(true);
        expect(prisma.tenantAlias.delete).toHaveBeenCalledWith({
            where: { id: 'alias-1' },
        });
    });
});
