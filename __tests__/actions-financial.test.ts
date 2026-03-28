import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';

const mockSession = {
    user: { name: 'Test User', email: 'test@test.com', role: 'USER' },
};

vi.mock('@/lib/auth-guard', () => ({
    requireAuth: vi.fn(() => mockSession),
    requireAdmin: vi.fn(() => ({ user: { name: 'Admin', role: 'ADMIN' } })),
}));

import { getProjectedCashFlow } from '@/app/actions/financial';

describe('getProjectedCashFlow', () => {
    beforeEach(() => vi.clearAllMocks());

    it('returns 12 months of projections', async () => {
        vi.mocked(prisma.contract.findMany).mockResolvedValue([]);
        vi.mocked(prisma.financing.findMany).mockResolvedValue([]);
        vi.mocked(prisma.asset.findMany).mockResolvedValue([]);

        const result = await getProjectedCashFlow();

        expect(result).toHaveLength(12);
    });

    it('calculates receivables from active contracts', async () => {
        vi.mocked(prisma.contract.findMany).mockResolvedValue([
            {
                id: 'c-1',
                assetId: 'a-1',
                tenantId: 't-1',
                startDate: new Date('2025-01-01'),
                currentValue: 3000,
                dueDay: 10,
                status: 'active',
                asset: { id: 'a-1', name: 'Apto 101' },
                tenant: { id: 't-1', name: 'João Silva' },
            },
        ] as any);
        vi.mocked(prisma.financing.findMany).mockResolvedValue([]);
        vi.mocked(prisma.asset.findMany).mockResolvedValue([]);

        const result = await getProjectedCashFlow();

        expect(result[0].receivables).toBeGreaterThan(0);
        expect(result[0].receivables).toBe(3000);
        expect(result[0].details.incomes).toHaveLength(1);
        expect(result[0].details.incomes[0].name).toContain('Apto 101');
    });

    it('calculates payables from financing cashFlow', async () => {
        vi.mocked(prisma.contract.findMany).mockResolvedValue([]);

        // Build a future date within the projection window (next month)
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + 1);
        const month = String(futureDate.getMonth() + 1).padStart(2, '0');
        const year = futureDate.getFullYear();
        const vencimento = `15/${month}/${year}`;

        vi.mocked(prisma.financing.findMany).mockResolvedValue([
            {
                id: 'f-1',
                assetId: 'a-1',
                asset: { id: 'a-1', name: 'Terreno Centro' },
                cashFlow: JSON.stringify([
                    {
                        vencimento,
                        descricao: 'Parcela',
                        fase: 'Obra',
                        valoresPorSocio: { socio1: 1500, socio2: 1500 },
                    },
                ]),
            },
        ] as any);
        vi.mocked(prisma.asset.findMany).mockResolvedValue([]);

        const result = await getProjectedCashFlow();

        const monthWithPayable = result.find(r => r.payables > 0);
        expect(monthWithPayable).toBeDefined();
        expect(monthWithPayable!.payables).toBe(3000);
        expect(monthWithPayable!.details.expenses[0].name).toContain('Terreno Centro');
    });

    it('calculates IPTU expenses', async () => {
        vi.mocked(prisma.contract.findMany).mockResolvedValue([]);
        vi.mocked(prisma.financing.findMany).mockResolvedValue([]);
        vi.mocked(prisma.asset.findMany).mockResolvedValue([
            {
                id: 'a-1',
                name: 'Apto 201',
                iptuValue: 600,
                iptuFrequency: 'monthly',
            },
        ] as any);

        const result = await getProjectedCashFlow();

        expect(result[0].payables).toBe(600);
        expect(result[0].details.expenses[0].name).toContain('IPTU');
    });

    it('balance equals receivables minus payables', async () => {
        vi.mocked(prisma.contract.findMany).mockResolvedValue([
            {
                id: 'c-1',
                assetId: 'a-1',
                tenantId: 't-1',
                startDate: new Date('2025-01-01'),
                currentValue: 5000,
                dueDay: 10,
                status: 'active',
                asset: { id: 'a-1', name: 'Apto 101' },
                tenant: { id: 't-1', name: 'João' },
            },
        ] as any);
        vi.mocked(prisma.financing.findMany).mockResolvedValue([]);
        vi.mocked(prisma.asset.findMany).mockResolvedValue([
            {
                id: 'a-1',
                name: 'Apto 101',
                iptuValue: 200,
                iptuFrequency: 'monthly',
            },
        ] as any);

        const result = await getProjectedCashFlow();

        for (const month of result) {
            expect(month.balance).toBe(month.receivables - month.payables);
        }
    });

    it('returns empty array on error', async () => {
        vi.mocked(prisma.contract.findMany).mockRejectedValue(new Error('DB'));

        const result = await getProjectedCashFlow();

        expect(result).toEqual([]);
    });
});
