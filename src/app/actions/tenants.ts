'use server';

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { requireAuth } from '@/lib/auth-guard';

/**
 * @module actions/tenants
 * @description Server Action para listagem paginada de inquilinos.
 * Retorna inquilinos com status derivado dos contratos ativos.
 */

export interface TenantData {
    id: string;
    name: string;
    document?: string | null;
    email?: string | null;
    phone?: string | null;
    status: 'Ativo' | 'Inativo';
    assetId?: string | null;
    currentAsset?: string | null;
    contractValue?: number;
    contractStart?: Date;
    contractEnd?: Date;
}

export interface PaginatedTenants {
    data: TenantData[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

/**
 * Lista inquilinos com paginação, incluindo dados do contrato ativo.
 * 
 * O status é derivado: 'Ativo' se tem contrato ativo, 'Inativo' caso contrário.
 * O currentAsset mostra o nome do imóvel do contrato ativo.
 * 
 * @param {number} [page=1] - Número da página
 * @param {number} [limit=10] - Itens por página
 * @returns {Promise<PaginatedTenants>} Resultado paginado
 */
export async function getTenants(page = 1, limit = 10): Promise<PaginatedTenants> {
    await requireAuth();
    try {
        const skip = (page - 1) * limit;

        const [tenants, total] = await Promise.all([
            prisma.tenant.findMany({
                include: {
                    contracts: {
                        where: { status: 'active' },
                        include: { asset: true }
                    }
                },
                orderBy: { name: 'asc' },
                skip,
                take: limit,
            }),
            prisma.tenant.count(),
        ]);

        return {
            data: tenants.map(t => {
                const activeContract = t.contracts[0];
                return {
                    id: t.id,
                    name: t.name,
                    document: t.document,
                    email: t.email,
                    phone: t.phone,
                    status: activeContract ? 'Ativo' : 'Inativo',
                    assetId: activeContract?.asset.id,
                    currentAsset: activeContract?.asset.name,
                    contractValue: activeContract ? Number(activeContract.currentValue) : undefined,
                    contractStart: activeContract?.startDate,
                    contractEnd: activeContract?.endDate,
                };
            }),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    } catch (e) {
        logger.error('Error fetching tenants:', e);
        return { data: [], total: 0, page, limit, totalPages: 0 };
    }
}
