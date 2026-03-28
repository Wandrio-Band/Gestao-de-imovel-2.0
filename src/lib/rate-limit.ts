/**
 * Rate Limiter em Memória
 * 
 * Sistema simples de controle de taxa (rate limiting) usando sliding window.
 * Armazena tentativas em memória e limpa entradas expiradas periodicamente.
 * 
 * Ideal para APIs simples e aplicações small-to-medium. Para sistemas de alta
 * escala, considere Redis ou serviço externo especializado.
 */

/**
 * Map de chaves de rate limiting com contadores
 * 
 * @type {Map<string, {count: number, resetTime: number}>}
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

/**
 * Limpa entradas de rate limit expiradas a cada 5 minutos
 * 
 * Previne crescimento indefinido da memória removendo entradas
 * cujo window de tempo já passou.
 * 
 * Executa automaticamente e não requer chamadas manuais.
 */
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitMap) {
        if (now > entry.resetTime) {
            rateLimitMap.delete(key);
        }
    }
}, 5 * 60 * 1000);

/**
 * Rate limiter com sliding window simples em memória
 * 
 * Verifica se uma requisição de um cliente pode ser processada baseado
 * no histórico de requisições recentes. Implementa um algoritmo de
 * sliding window onde cada cliente tem um limite de requisições por
 * intervalo de tempo.
 * 
 * @param {string} key - Identificador único do cliente (ex: IP, user ID)
 *                        Deve ser único por cliente que deseja limitar
 * @param {number} [maxRequests=20] - Máximo de requisições permitidas
 * @param {number} [windowMs=60000] - Tamanho da janela em milissegundos (padrão: 60s)
 * @returns {boolean} true se requisição é permitida, false se excedeu limite
 * 
 * @example
 * // Limitar a 5 requisições por minuto por IP
 * const allowed = rateLimit(clientIp, 5, 60 * 1000);
 * if (!allowed) {
 *   return apiError('Rate limit exceeded', 429, 'RATE_LIMITED');
 * }
 * 
 * @example
 * // Limitar a 100 requisições por hora para um usuário
 * const allowed = rateLimit(`user-${userId}`, 100, 60 * 60 * 1000);
 * 
 * @example
 * // Limitar uploads a 10 por minuto
 * export async function POST(req: Request) {
 *   const ip = req.headers.get('x-forwarded-for') || 'unknown';
 *   if (!rateLimit(`upload-${ip}`, 10, 60 * 1000)) {
 *     return apiError('Too many uploads', 429);
 *   }
 *   // Processar upload...
 * }
 */
export function rateLimit(
    key: string,
    maxRequests: number = 20,
    windowMs: number = 60_000
): boolean {
    const now = Date.now();
    const entry = rateLimitMap.get(key);

    if (!entry || now > entry.resetTime) {
        rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
        return true;
    }

    if (entry.count >= maxRequests) {
        return false;
    }

    entry.count++;
    return true;
}
