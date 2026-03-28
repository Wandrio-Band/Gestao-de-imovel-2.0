import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';

const mockSession = {
    user: { name: 'Test User', email: 'test@test.com', role: 'USER' },
};

vi.mock('@/lib/auth-guard', () => ({
    requireAuth: vi.fn(() => mockSession),
    requireAdmin: vi.fn(() => ({ user: { name: 'Admin', role: 'ADMIN' } })),
}));

import { getContracts } from '@/app/actions/contracts';
import { getTenants } from '@/app/actions/tenants';
import { getAuditLogs } from '@/app/actions/audit';
import { searchTenants } from '@/app/actions/tenant_search';
import { saveStandaloneTenant } from '@/app/actions/contract-management';

describe('getContracts', () => {
    beforeEach(() => vi.clearAllMocks());

    it('fetches and transforms contracts', async () => {
        vi.mocked(prisma.contract.findMany).mockResolvedValue([
            {
                id: 'c-1',
                contractNumber: 'CTR-2026-001',
                assetId: 'a-1',
                asset: { name: 'Apto 101' },
                tenant: { name: 'João' },
                startDate: new Date('2026-01-15'),
                currentValue: 2500,
                status: 'active',
            },
        ] as any);
        vi.mocked(prisma.contract.count).mockResolvedValue(1);

        const result = await getContracts();

        expect(result.data).toHaveLength(1);
        expect(result.data[0].contractNumber).toBe('CTR-2026-001');
        expect(result.data[0].assetName).toBe('Apto 101');
        expect(result.data[0].tenantName).toBe('João');
        expect(result.data[0].currentValue).toBe(2500);
        expect(result.data[0].status).toBe('active');
        expect(result.total).toBe(1);
        expect(result.totalPages).toBe(1);
    });

    it('returns empty result on error', async () => {
        vi.mocked(prisma.contract.findMany).mockRejectedValue(new Error('DB'));
        const result = await getContracts();
        expect(result.data).toEqual([]);
        expect(result.total).toBe(0);
    });
});

describe('getTenants', () => {
    beforeEach(() => vi.clearAllMocks());

    it('marks tenants with active contracts as Ativo', async () => {
        vi.mocked(prisma.tenant.findMany).mockResolvedValue([
            {
                id: 't-1',
                name: 'João Silva',
                document: '123.456.789-00',
                email: 'joao@test.com',
                phone: null,
                contracts: [
                    { id: 'c-1', asset: { id: 'a-1', name: 'Apto 101' }, currentValue: 2500, startDate: new Date() },
                ],
            },
        ] as any);
        vi.mocked(prisma.tenant.count).mockResolvedValue(1);

        const result = await getTenants();

        expect(result.data).toHaveLength(1);
        expect(result.data[0].status).toBe('Ativo');
        expect(result.data[0].currentAsset).toBe('Apto 101');
        expect(result.data[0].contractValue).toBe(2500);
    });

    it('marks tenants without active contracts as Inativo', async () => {
        vi.mocked(prisma.tenant.findMany).mockResolvedValue([
            {
                id: 't-2',
                name: 'Maria',
                document: null,
                email: null,
                phone: null,
                contracts: [],
            },
        ] as any);
        vi.mocked(prisma.tenant.count).mockResolvedValue(1);

        const result = await getTenants();

        expect(result.data[0].status).toBe('Inativo');
        expect(result.data[0].currentAsset).toBeUndefined();
        expect(result.data[0].contractValue).toBeUndefined();
    });

    it('returns empty result on error', async () => {
        vi.mocked(prisma.tenant.findMany).mockRejectedValue(new Error('DB'));
        const result = await getTenants();
        expect(result.data).toEqual([]);
        expect(result.total).toBe(0);
    });
});

describe('getAuditLogs', () => {
    beforeEach(() => vi.clearAllMocks());

    it('fetches audit logs with limit', async () => {
        const mockLogs = [
            { id: 'log-1', action: 'CREATE', entity: 'Asset', entityId: 'a-1', actorName: 'Admin', details: null, createdAt: new Date() },
        ];
        vi.mocked(prisma.systemAuditLog.findMany).mockResolvedValue(mockLogs as any);

        const result = await getAuditLogs(10);

        expect(result).toHaveLength(1);
        expect(prisma.systemAuditLog.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                take: 10,
                orderBy: { createdAt: 'desc' },
            })
        );
    });

    it('requires admin access', async () => {
        vi.mocked(prisma.systemAuditLog.findMany).mockResolvedValue([]);
        const { requireAdmin } = await import('@/lib/auth-guard');
        await getAuditLogs();
        expect(requireAdmin).toHaveBeenCalled();
    });

    it('returns empty array on error', async () => {
        vi.mocked(prisma.systemAuditLog.findMany).mockRejectedValue(new Error('DB'));
        const result = await getAuditLogs();
        expect(result).toEqual([]);
    });
});

describe('searchTenants', () => {
    beforeEach(() => vi.clearAllMocks());

    it('searches tenants by name', async () => {
        vi.mocked(prisma.tenant.findMany).mockResolvedValue([
            {
                id: 't-1',
                name: 'João',
                document: '123',
                contracts: [{ id: 'c-1', asset: { name: 'Apto 101' } }],
            },
        ] as any);

        const result = await searchTenants('João');

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('João');
        expect(result[0].activeContractId).toBe('c-1');
        expect(result[0].assetName).toBe('Apto 101');
    });

    it('returns all tenants for empty query', async () => {
        vi.mocked(prisma.tenant.findMany).mockResolvedValue([]);

        await searchTenants('');

        expect(prisma.tenant.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {},
                take: 20,
            })
        );
    });
});

describe('saveStandaloneTenant', () => {
    beforeEach(() => vi.clearAllMocks());

    it('updates tenant data', async () => {
        vi.mocked(prisma.tenant.update).mockResolvedValue({} as any);

        const result = await saveStandaloneTenant({
            id: 't-1',
            name: 'João Atualizado',
            email: 'joao@new.com',
            phone: '11999990000',
        });

        expect(result.success).toBe(true);
        expect(prisma.tenant.update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: 't-1' },
                data: { name: 'João Atualizado', email: 'joao@new.com', phone: '11999990000' },
            })
        );
    });

    it('throws on database error', async () => {
        vi.mocked(prisma.tenant.update).mockRejectedValue(new Error('Not found'));

        await expect(saveStandaloneTenant({ id: 'bad', name: 'Test' })).rejects.toThrow();
    });
});
