/**
 * Sistema de Logging da Aplicação
 * 
 * Este módulo fornece um logger unificado para toda a aplicação.
 * Em desenvolvimento, registra logs no console. Em produção, apenas
 * erros críticos são registrados (WARN, ERROR, EXCEPTION).
 * 
 * Suporta integração futura com Sentry para rastreamento de exceções.
 */

const isDev = process.env.NODE_ENV === 'development';

/**
 * Objeto logger com múltiplos níveis de log
 * 
 * @type {Object}
 * @property {Function} info - Log de informações (apenas em dev)
 * @property {Function} warn - Log de avisos (sempre)
 * @property {Function} error - Log de erros (sempre)
 * @property {Function} debug - Log de debug detalhado (apenas em dev)
 * @property {Function} captureException - Registra exceção para rastreamento externo
 * 
 * @example
 * import { logger } from '@/lib/logger';
 * 
 * logger.info('Sistema iniciado');
 * logger.warn('Operação demorada');
 * logger.error('Falha ao conectar BD');
 * logger.debug('Dados processados:', { count: 100 });
 * logger.captureException(error, { context: 'UploadAPI' });
 */
export const logger = {
    /**
     * Log informativo (exibido apenas em desenvolvimento)
     * 
     * @param {...unknown[]} args - Argumentos para registrar
     */
    info: (...args: unknown[]) => { if (isDev) console.log('[INFO]', ...args); },

    /**
     * Log de aviso (sempre exibido)
     * 
     * @param {...unknown[]} args - Argumentos para registrar
     */
    warn: (...args: unknown[]) => { console.warn('[WARN]', ...args); },

    /**
     * Log de erro (sempre exibido)
     * 
     * @param {...unknown[]} args - Argumentos para registrar
     */
    error: (...args: unknown[]) => { console.error('[ERROR]', ...args); },

    /**
     * Log de debug (exibido apenas em desenvolvimento)
     * 
     * Usado para logs muito detalhados durante desenvolvimento.
     * 
     * @param {...unknown[]} args - Argumentos para registrar
     */
    debug: (...args: unknown[]) => { if (isDev) console.log('[DEBUG]', ...args); },

    /**
     * Registra exceção para serviço de rastreamento externo
     * 
     * Atualmente apenas registra no console. Para habilitar envio ao Sentry:
     * 1. Instalar: npm install @sentry/nextjs
     * 2. Definir NEXT_PUBLIC_SENTRY_DSN no .env
     * 3. Descomentar linhas com Sentry.captureException
     * 
     * Util para rastreamento de erros em produção que não são capturados
     * pelas tratativas normais de erro.
     * 
     * @param {unknown} error - Erro a registrar
     * @param {Record<string, unknown>} [context] - Contexto adicional (ex: user ID, ação)
     * 
     * @example
     * logger.captureException(error, { user: userId, action: 'upload' });
     * // Será enviado ao Sentry (quando configurado) com contexto
     */
    captureException: (error: unknown, context?: Record<string, unknown>) => {
        console.error('[EXCEPTION]', error, context);
        // Uncomment after installing @sentry/nextjs:
        // Sentry.captureException(error, { extra: context });
    },
};
