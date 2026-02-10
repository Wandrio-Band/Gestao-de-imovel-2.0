'use server';

import { prisma } from '@/lib/prisma';

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

export async function getContracts(): Promise<ContractData[]> {
    try {
        const contracts = await prisma.contract.findMany({
            include: {
                asset: true,
                tenant: true
            },
            orderBy: { startDate: 'desc' }
        });

        return contracts.map(c => ({
            id: c.id,
            contractNumber: c.contractNumber,
            assetId: c.assetId,
            assetName: c.asset.name,
            tenantName: c.tenant.name,
            startDate: c.startDate,
            // endDate: c.endDate || undefined,
            currentValue: Number(c.currentValue),
            status: c.status as 'active' | 'inactive'
        }));
    } catch (e) {
        console.error('Error fetching contracts:', e);
        return [];
    }
}
