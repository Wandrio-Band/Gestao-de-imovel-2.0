'use server';

import { prisma } from '@/lib/prisma';

export interface AuditLogEntry {
    id: string;
    action: string;
    entity: string;
    entityId: string;
    actorName: string;
    details: string | null;
    createdAt: Date;
}

export async function getAuditLogs(limit: number = 50): Promise<AuditLogEntry[]> {
    try {
        const logs = await prisma.systemAuditLog.findMany({
            orderBy: {
                createdAt: 'desc'
            },
            take: limit
        });

        return logs;
    } catch (e) {
        console.error('Failed to fetch audit logs:', e);
        return [];
    }
}
