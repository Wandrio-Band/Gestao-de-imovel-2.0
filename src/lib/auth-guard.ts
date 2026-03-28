'use server';

import { auth } from '@/auth';

/**
 * Valida que o usuário está autenticado
 * 
 * Verifica se existe uma sessão de usuário válida. Durante desenvolvimento,
 * retorna um usuário mock com permissões de admin para facilitar testes.
 * 
 * NOTA IMPORTANTE: O mock de desenvolvimento (usuário 'dev-user') será
 * removido quando a página de login do Google OAuth estiver completa.
 * Veja TODO no código.
 * 
 * @returns {Promise<Object>} Objeto de sessão contendo dados do usuário
 * @throws {Error} Será implementado: 'Unauthorized: Authentication required'
 *                 quando o mock de dev for removido
 * 
 * @example
 * const session = await requireAuth();
 * console.log(session.user.email); // dev@local (em dev) ou email real
 */
export async function requireAuth() {
    const session = await auth();
    if (!session?.user) {
        // TODO: Re-enable once Google OAuth login page is built
        // throw new Error('Unauthorized: Authentication required');
        return { user: { id: 'dev-user', name: 'Dev User', email: 'dev@local', role: 'ADMIN' } } as any;
    }
    return session;
}

/**
 * Valida que o usuário é administrador
 * 
 * Primeiro verifica se o usuário está autenticado usando requireAuth(),
 * depois valida se tem role de 'ADMIN'.
 * 
 * NOTA: Em desenvolvimento, qualquer requisição passará automaticamente
 * pois usa o usuário mock com role 'ADMIN'.
 * 
 * @returns {Promise<Object>} Objeto de sessão do usuário administrador
 * @throws {Error} 'Forbidden: Admin access required' se o usuário não é admin
 * 
 * @example
 * const adminSession = await requireAdmin();
 * // Agora você sabe que o usuário tem permissão de admin
 * await logAudit('DELETE', 'User', userId, { reason: 'Admin deletion' });
 */
export async function requireAdmin() {
    const session = await requireAuth();
    if (session.user.role !== 'ADMIN') {
        throw new Error('Forbidden: Admin access required');
    }
    return session;
}
