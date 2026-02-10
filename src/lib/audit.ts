import { prisma } from '@/lib/prisma';

export async function logAudit(
    action: string,
    entity: string,
    entityId: string,
    details: any,
    actorName: string = 'Ricardo Silva' // Default user for MVP
) {
    try {
        await prisma.systemAuditLog.create({
            data: {
                action,
                entity,
                entityId,
                actorName,
                details: typeof details === 'string' ? details : JSON.stringify(details)
            }
        });
        console.log(`[AUDIT SUCCESS] ${action} on ${entity} (${entityId}) by ${actorName}`);
    } catch (e) {
        console.error('Failed to create audit log:', e);
        if (e instanceof Error) console.error(e.stack);
    }
}
