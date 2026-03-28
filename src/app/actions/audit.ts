'use server';

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/auth-guard';

/**
 * @module actions/audit
 * @description Server Action para consulta do log de auditoria do sistema.
 * Requer role ADMIN para acesso.
 */

export interface AuditLogEntry {
    id: string;
    action: string;
    entity: string;
    entityId: string;
    actorName: string;
    details: string | null;
    createdAt: Date;
}

/**
 * Retorna os últimos N registros do log de auditoria.
 * 
 * Cada registro contém: ação (CREATE, UPDATE, DELETE, LEARN_ALIAS, etc.),
 * entidade afetada, ID da entidade, ator e detalhes em JSON.
 * 
 * @param {number} [limit=50] - Quantidade máxima de registros a retornar
 * @returns {Promise<AuditLogEntry[]>} Logs ordenados do mais recente ao mais antigo
 */
export async function getAuditLogs(limit: number = 50): Promise<AuditLogEntry[]> {
    await requireAdmin();
    try {
        const logs = await prisma.systemAuditLog.findMany({
            orderBy: {
                createdAt: 'desc'
            },
            take: limit
        });

        return logs;
    } catch (e) {
        logger.error('Failed to fetch audit logs:', e);
        return [];
    }
}
