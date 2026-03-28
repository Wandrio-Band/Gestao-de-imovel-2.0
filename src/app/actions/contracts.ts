'use server';

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { requireAuth } from '@/lib/auth-guard';

/**
 * @module actions/contracts
 * @description Server Action para listagem paginada de contratos.
 * Retorna contratos com dados do ativo e inquilino associados.
 */

export interface ContractData {
    id: string;
    contractNumber?: string | null;
    assetId: string;
    assetName: string;
    tenantName: string;
    startDate: Date;
    endDate?: Date;
    currentValue: number;
    status: 'active' | 'inactive';
}

export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

/**
 * Lista contratos com paginação e dados relacionados.
 * 
 * @param {number} [page=1] - Número da página (1-indexed)
 * @param {number} [limit=10] - Quantidade de itens por página
 * @returns {Promise<PaginatedResult<ContractData>>} Resultado paginado com total e número de páginas
 */
export async function getContracts(page = 1, limit = 10): Promise<PaginatedResult<ContractData>> {
    await requireAuth();
    try {
        const skip = (page - 1) * limit;

        const [contracts, total] = await Promise.all([
            prisma.contract.findMany({
                include: {
                    asset: true,
                    tenant: true
                },
                orderBy: { startDate: 'desc' },
                skip,
                take: limit,
            }),
            prisma.contract.count(),
        ]);

        return {
            data: contracts.map(c => ({
                id: c.id,
                contractNumber: c.contractNumber,
                assetId: c.assetId,
                assetName: c.asset?.name ?? 'Sem imóvel',
                tenantName: c.tenant?.name ?? 'Sem inquilino',
                startDate: c.startDate,
                currentValue: Number(c.currentValue),
                status: c.status as 'active' | 'inactive'
            })),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    } catch (e) {
        logger.error('Error fetching contracts:', e);
        return { data: [], total: 0, page, limit, totalPages: 0 };
    }
}
