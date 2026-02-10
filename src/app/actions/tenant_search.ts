'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function searchTenants(query: string) {
    try {
        const whereClause = query && query.length > 0
            ? { name: { contains: query } }
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
        console.error('Error searching tenants:', e);
        return [];
    }
}
