'use server';

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/auth-guard';

/**
 * @module actions/tenant_search
 * @description Server Action para busca de inquilinos por nome.
 * Usado pelo componente de autocomplete na conciliação PIX.
 */

/**
 * Busca inquilinos por nome (case-sensitive, contains) com limite de 20 resultados.
 * Inclui o contrato ativo e nome do imóvel associado.
 * 
 * @param {string} query - Texto de busca (se vazio, retorna todos até o limite)
 * @returns {Promise<Array<{id, name, document, activeContractId?, assetName?}>>}
 */
export async function searchTenants(query: string) {
    await requireAuth();
    try {
        const whereClause = query && query.length > 0
            ? { name: { contains: query, mode: 'insensitive' as const } }
            : {}; // If empty, return all (limited by take)

        const tenants = await prisma.tenant.findMany({
            where: whereClause,
            include: {
                contracts: {
                    where: { status: 'active' },
                    include: { asset: true }
                }
            },
            orderBy: { name: 'asc' },
            take: 20
        });

        return tenants.map(t => ({
            id: t.id,
            name: t.name,
            document: t.document,
            activeContractId: t.contracts[0]?.id,
            assetName: t.contracts[0]?.asset.name
        }));
    } catch (e) {
        logger.error('Error searching tenants:', e);
        return [];
    }
}
