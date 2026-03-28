import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';

const mockSession = {
    user: { name: 'Test User', email: 'test@test.com', role: 'USER' },
};

vi.mock('@/lib/auth-guard', () => ({
    requireAuth: vi.fn(() => mockSession),
    requireAdmin: vi.fn(() => ({ user: { name: 'Admin', role: 'ADMIN' } })),
}));

vi.mock('@/lib/action-schemas', () => ({
    saveAssetSchema: { safeParse: vi.fn(() => ({ success: true })) },
}));

import { getAssets, saveAsset, deleteAsset, updateRent, bulkImportAssets } from '@/app/actions/assets';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeAsset = (overrides: Record<string, any> = {}) => ({
    id: 'asset-1',
    name: 'Apto 101',
    type: 'Apartamento',
    address: 'Rua Teste 123',
    value: 500000,
    marketValue: 550000,
    rentalValue: 2500,
    status: 'Alugado',
    image: '',
    partners: [],
    ...overrides,
});

const makeDbAsset = (overrides: Record<string, any> = {}) => ({
    id: 'asset-1',
    name: 'Apto 101',
    type: 'Apartamento',
    address: 'Rua Teste 123',
    zipCode: '01000-000',
    street: 'Rua Teste',
    number: '123',
    complement: null,
    neighborhood: 'Centro',
    city: 'São Paulo',
    state: 'SP',
    description: 'Nice apartment',
    areaTotal: 80,
    matricula: 'MAT-001',
    iptuRegistration: 'IPTU-001',
    iptuValue: 500,
    iptuFrequency: 'monthly',
    registryOffice: 'Cartório 1',
    acquisitionDate: '2024-01-01',
    irpfStatus: 'Declarado',
    acquisitionOrigin: 'Compra',
    value: 500000,
    marketValue: 550000,
    declaredValue: 480000,
    saleForecast: null,
    suggestedRentalValue: 3000,
    rentalValue: 2500,
    status: 'Alugado',
    image: '/img.png',
    partners: [
        { name: 'Sócio A', initials: 'SA', color: '#ff0000', percentage: 100 },
    ],
    financing: null,
    leases: [],
    updatedAt: new Date(),
    ...overrides,
});

// ---------------------------------------------------------------------------
// getAssets
// ---------------------------------------------------------------------------

describe('getAssets', () => {
    beforeEach(() => vi.clearAllMocks());

    it('fetches and maps assets with relations', async () => {
        vi.mocked(prisma.asset.findMany).mockResolvedValue([makeDbAsset()] as any);

        const result = await getAssets();

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('asset-1');
        expect(result[0].name).toBe('Apto 101');
        expect(result[0].value).toBe(500000);
        expect(result[0].partners).toHaveLength(1);
        expect(result[0].partners[0].percentage).toBe(100);
        expect(prisma.asset.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                include: { partners: true, financing: true, leases: true },
                orderBy: { updatedAt: 'desc' },
            })
        );
    });

    it('returns empty array on error', async () => {
        vi.mocked(prisma.asset.findMany).mockRejectedValue(new Error('DB'));

        const result = await getAssets();

        expect(result).toEqual([]);
    });
});

// ---------------------------------------------------------------------------
// saveAsset
// ---------------------------------------------------------------------------

describe('saveAsset', () => {
    beforeEach(() => vi.clearAllMocks());

    it('creates new asset when not existing', async () => {
        vi.mocked(prisma.asset.findUnique).mockResolvedValue(null);
        vi.mocked(prisma.asset.create).mockResolvedValue({} as any);

        const result = await saveAsset(makeAsset() as any);

        expect(result.success).toBe(true);
        expect(prisma.asset.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    id: 'asset-1',
                    name: 'Apto 101',
                }),
            })
        );
        expect(prisma.asset.update).not.toHaveBeenCalled();
    });

    it('updates existing asset', async () => {
        vi.mocked(prisma.asset.findUnique).mockResolvedValue({ id: 'asset-1' } as any);
        vi.mocked(prisma.asset.update).mockResolvedValue({} as any);
        vi.mocked(prisma.assetPartner.deleteMany).mockResolvedValue({ count: 0 } as any);
        vi.mocked(prisma.assetPartner.createMany).mockResolvedValue({ count: 2 } as any);

        const assetWithPartners = makeAsset({
            partners: [
                { name: 'Raquel', initials: 'RA', color: '#1152d4', percentage: 50 },
                { name: 'Marília', initials: 'MA', color: '#fb923c', percentage: 50 },
            ]
        });

        const result = await saveAsset(assetWithPartners as any);

        expect(result.success).toBe(true);
        expect(prisma.asset.update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: 'asset-1' },
                data: expect.objectContaining({ name: 'Apto 101' }),
            })
        );
        expect(prisma.asset.create).not.toHaveBeenCalled();
        expect(prisma.assetPartner.deleteMany).toHaveBeenCalledWith({ where: { assetId: 'asset-1' } });
    });

    it('saves financing with formatted currency strings parsed to numbers', async () => {
        vi.mocked(prisma.asset.findUnique).mockResolvedValue(null);
        vi.mocked(prisma.asset.create).mockResolvedValue({} as any);
        vi.mocked(prisma.financing.findUnique).mockResolvedValue(null);
        vi.mocked(prisma.financing.create).mockResolvedValue({} as any);

        const asset = makeAsset({
            financingDetails: {
                valorTotal: '1.000.000,00',
                subtotalConstrutora: '500.000,00',
                valorFinanciar: '500.000,00',
                valorQuitado: '100.000,00',
                saldoDevedor: '400.000,00',
            },
        });

        const result = await saveAsset(asset as any);

        expect(result.success).toBe(true);
        expect(prisma.financing.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    assetId: 'asset-1',
                    valorTotal: 1000000,
                    subtotalConstrutora: 500000,
                    valorFinanciar: 500000,
                    valorQuitado: 100000,
                    saldoDevedor: 400000,
                }),
            })
        );
    });

    it('saves financing with numeric values passed through', async () => {
        vi.mocked(prisma.asset.findUnique).mockResolvedValue(null);
        vi.mocked(prisma.asset.create).mockResolvedValue({} as any);
        vi.mocked(prisma.financing.findUnique).mockResolvedValue(null);
        vi.mocked(prisma.financing.create).mockResolvedValue({} as any);

        const asset = makeAsset({
            financingDetails: {
                valorTotal: 750000,
                subtotalConstrutora: 250000,
                valorFinanciar: 500000,
            },
        });

        const result = await saveAsset(asset as any);

        expect(result.success).toBe(true);
        expect(prisma.financing.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    valorTotal: 750000,
                    subtotalConstrutora: 250000,
                    valorFinanciar: 500000,
                }),
            })
        );
    });

    it('stringifies phases as JSON', async () => {
        vi.mocked(prisma.asset.findUnique).mockResolvedValue(null);
        vi.mocked(prisma.asset.create).mockResolvedValue({} as any);
        vi.mocked(prisma.financing.findUnique).mockResolvedValue(null);
        vi.mocked(prisma.financing.create).mockResolvedValue({} as any);

        const phases = [{ name: 'Fase 1', value: 100000 }];
        const asset = makeAsset({
            financingDetails: {
                valorTotal: 100000,
                subtotalConstrutora: 0,
                valorFinanciar: 100000,
                phases,
            },
        });

        await saveAsset(asset as any);

        expect(prisma.financing.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    phases: JSON.stringify(phases),
                }),
            })
        );
    });

    it('saves lease with parsed valorAluguel and diaVencimento', async () => {
        vi.mocked(prisma.asset.findUnique).mockResolvedValue(null);
        vi.mocked(prisma.asset.create).mockResolvedValue({} as any);
        vi.mocked(prisma.lease.deleteMany).mockResolvedValue({ count: 0 } as any);
        vi.mocked(prisma.lease.create).mockResolvedValue({} as any);
        vi.mocked(prisma.tenant.findFirst).mockResolvedValue(null);
        vi.mocked(prisma.tenant.create).mockResolvedValue({ id: 'tenant-1' } as any);
        vi.mocked(prisma.contract.findFirst).mockResolvedValue(null);
        vi.mocked(prisma.contract.create).mockResolvedValue({} as any);

        const asset = makeAsset({
            leaseDetails: {
                nomeInquilino: 'João',
                documentoInquilino: '',
                emailInquilino: 'joao@test.com',
                valorAluguel: '2.690,00',
                diaVencimento: 'Dia 5',
                tipoGarantia: 'Caução',
                inicioVigencia: '2026-01-01',
                fimContrato: '2027-01-01',
                indexador: 'IGPM',
            },
        });

        const result = await saveAsset(asset as any);

        expect(result.success).toBe(true);
        expect(prisma.lease.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    assetId: 'asset-1',
                    valorAluguel: 2690,
                    diaVencimento: 5,
                    nomeInquilino: 'João',
                }),
            })
        );
    });

    it('creates tenant and contract when lease has nomeInquilino', async () => {
        vi.mocked(prisma.asset.findUnique).mockResolvedValue(null);
        vi.mocked(prisma.asset.create).mockResolvedValue({} as any);
        vi.mocked(prisma.lease.deleteMany).mockResolvedValue({ count: 0 } as any);
        vi.mocked(prisma.lease.create).mockResolvedValue({} as any);
        vi.mocked(prisma.tenant.findFirst).mockResolvedValue(null);
        vi.mocked(prisma.tenant.create).mockResolvedValue({ id: 'tenant-new' } as any);
        vi.mocked(prisma.contract.findFirst).mockResolvedValue(null);
        vi.mocked(prisma.contract.create).mockResolvedValue({} as any);

        const asset = makeAsset({
            leaseDetails: {
                nomeInquilino: 'Maria Silva',
                documentoInquilino: '',
                emailInquilino: 'maria@test.com',
                valorAluguel: 3000,
                diaVencimento: '10',
                tipoGarantia: '',
                inicioVigencia: '2026-02-01',
                fimContrato: '2027-02-01',
                indexador: 'IPCA',
            },
        });

        await saveAsset(asset as any);

        // Tenant created (short doc -> findFirst then create)
        expect(prisma.tenant.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    name: 'Maria Silva',
                    email: 'maria@test.com',
                }),
            })
        );

        // Contract created with generated number
        expect(prisma.contract.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    contractNumber: 'CTR-2026-001',
                    assetId: 'asset-1',
                    tenantId: 'tenant-new',
                    status: 'active',
                    currentValue: 3000,
                    baseValue: 3000,
                    dueDay: 10,
                }),
            })
        );
    });

    it('saves partners with deleteMany + createMany', async () => {
        vi.mocked(prisma.asset.findUnique).mockResolvedValue({ id: 'asset-1' } as any);
        vi.mocked(prisma.asset.update).mockResolvedValue({} as any);
        vi.mocked(prisma.assetPartner.deleteMany).mockResolvedValue({ count: 0 } as any);
        vi.mocked(prisma.assetPartner.createMany).mockResolvedValue({ count: 2 } as any);

        const asset = makeAsset({
            partners: [
                { name: 'Sócio A', initials: 'SA', color: '#ff0000', percentage: 60 },
                { name: 'Sócio B', initials: 'SB', color: '#00ff00', percentage: 40 },
            ],
        });

        const result = await saveAsset(asset as any);

        expect(result.success).toBe(true);
        expect(prisma.assetPartner.deleteMany).toHaveBeenCalledWith({ where: { assetId: 'asset-1' } });
        expect(prisma.assetPartner.createMany).toHaveBeenCalledWith({
            data: [
                { assetId: 'asset-1', name: 'Sócio A', initials: 'SA', color: '#ff0000', percentage: 60 },
                { assetId: 'asset-1', name: 'Sócio B', initials: 'SB', color: '#00ff00', percentage: 40 },
            ],
        });
    });

    it('returns {success: false} on DB error', async () => {
        vi.mocked(prisma.asset.findUnique).mockRejectedValue(new Error('DB connection lost'));

        const result = await saveAsset(makeAsset() as any);

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
    });
});

// ---------------------------------------------------------------------------
// deleteAsset
// ---------------------------------------------------------------------------

describe('deleteAsset', () => {
    beforeEach(() => vi.clearAllMocks());

    it('deletes asset by ID', async () => {
        vi.mocked(prisma.asset.findUnique).mockResolvedValue({ name: 'Apto 101' } as any);
        vi.mocked(prisma.asset.delete).mockResolvedValue({} as any);

        const result = await deleteAsset('asset-1');

        expect(result.success).toBe(true);
        expect(prisma.asset.delete).toHaveBeenCalledWith({ where: { id: 'asset-1' } });
    });

    it('returns error on failure', async () => {
        vi.mocked(prisma.asset.findUnique).mockResolvedValue({ name: 'Apto 101' } as any);
        vi.mocked(prisma.asset.delete).mockRejectedValue(new Error('FK constraint'));

        const result = await deleteAsset('asset-1');

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
    });
});

// ---------------------------------------------------------------------------
// updateRent
// ---------------------------------------------------------------------------

describe('updateRent', () => {
    beforeEach(() => vi.clearAllMocks());

    it('updates rentalValue on asset and lease', async () => {
        vi.mocked(prisma.asset.findUnique).mockResolvedValue({
            rentalValue: 2500,
            name: 'Apto 101',
        } as any);
        vi.mocked(prisma.asset.update).mockResolvedValue({} as any);
        vi.mocked(prisma.lease.updateMany).mockResolvedValue({ count: 1 } as any);

        const result = await updateRent('asset-1', 3000);

        expect(result.success).toBe(true);
        expect(prisma.asset.update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: 'asset-1' },
                data: expect.objectContaining({ rentalValue: 3000 }),
            })
        );
        expect(prisma.lease.updateMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { assetId: 'asset-1' },
                data: { valorAluguel: 3000 },
            })
        );
    });
});

// ---------------------------------------------------------------------------
// bulkImportAssets
// ---------------------------------------------------------------------------

describe('bulkImportAssets', () => {
    beforeEach(() => vi.clearAllMocks());

    it('imports multiple assets', async () => {
        vi.mocked(prisma.asset.findMany).mockResolvedValue([] as any);
        vi.mocked(prisma.asset.upsert).mockResolvedValue({} as any);

        const assets = [
            makeAsset({ id: 'a-1', name: 'Apto 1' }),
            makeAsset({ id: 'a-2', name: 'Apto 2' }),
        ];

        const result = await bulkImportAssets(assets as any);

        expect(result.success).toBe(true);
        expect(result.imported).toBe(2);
        expect(result.total).toBe(2);
        expect(prisma.asset.upsert).toHaveBeenCalledTimes(2);
    });

    it('with replaceAll deletes all first', async () => {
        vi.mocked(prisma.asset.deleteMany).mockResolvedValue({ count: 5 } as any);
        vi.mocked(prisma.asset.findMany).mockResolvedValue([] as any);
        vi.mocked(prisma.asset.upsert).mockResolvedValue({} as any);

        const assets = [makeAsset({ id: 'a-1', name: 'Apto 1' })];

        const result = await bulkImportAssets(assets as any, true);

        expect(result.success).toBe(true);
        expect(prisma.asset.deleteMany).toHaveBeenCalledWith({});
        expect(prisma.asset.upsert).toHaveBeenCalledTimes(1);
    });
});
