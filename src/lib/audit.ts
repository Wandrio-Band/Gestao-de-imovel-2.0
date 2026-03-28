import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

/**
 * Registra uma ação no log de auditoria do sistema
 * 
 * Cria um registro permanente de todas as operações críticas do sistema,
 * incluindo quem executou a ação, quando, sobre qual entidade e detalhes específicos.
 * 
 * @param {string} action - Tipo de ação (ex: 'CREATE', 'UPDATE', 'DELETE', 'APPROVE')
 * @param {string} entity - Tipo de entidade afetada (ex: 'Asset', 'Contract', 'Invoice')
 * @param {string} entityId - ID único da entidade modificada
 * @param {Record<string, unknown>} details - Detalhes específicos da ação em formato de objeto
 *                                             Será convertido para JSON se necessário
 * @param {string} [actorName='Sistema'] - Nome do usuário ou sistema que executou a ação
 * 
 * @returns {Promise<void>}
 * 
 * @example
 * // Auditoria de criação de ativo
 * await logAudit(
 *   'CREATE',
 *   'Asset',
 *   'asset-123',
 *   { name: 'Apartamento 201', value: 250000 },
 *   'Usuário João'
 * );
 * 
 * @example
 * // Auditoria de aprovação de fatura
 * await logAudit(
 *   'APPROVE',
 *   'Invoice',
 *   'inv-456',
 *   { previousStatus: 'PENDENTE', newStatus: 'APROVADO' },
 *   'Admin Sistema'
 * );
 */
export async function logAudit(
    action: string,
    entity: string,
    entityId: string,
    details: Record<string, unknown>,
    actorName: string = 'Sistema'
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
        logger.info(`[AUDIT SUCCESS] ${action} on ${entity} (${entityId}) by ${actorName}`);
    } catch (e) {
        logger.error('Failed to create audit log:', e);
        if (e instanceof Error) logger.error(e.stack);
    }
}
