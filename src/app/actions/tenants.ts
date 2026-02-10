'use server';

import { prisma } from '@/lib/prisma';

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

export async function getTenants(): Promise<TenantData[]> {
    try {
        const tenants = await prisma.tenant.findMany({
            include: {
                contracts: {
                    where: { status: 'active' },
                    include: { asset: true }
                }
            },
            orderBy: { name: 'asc' }
        });

        return tenants.map(t => {
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
                // contractEnd: activeContract?.endDate || undefined
            };
        });
    } catch (e) {
        console.error('Error fetching tenants:', e);
        return [];
    }
}
