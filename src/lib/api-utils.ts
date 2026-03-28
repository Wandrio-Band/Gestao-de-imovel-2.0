import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

/**
 * Utilitários para APIs REST
 * 
 * Este módulo fornece funções auxiliares para tratamento de erros, validação
 * e extração de informações das requisições HTTP.
 */

/**
 * Cria uma resposta de erro API padronizada
 * 
 * Nunca expõe detalhes internos da aplicação. Retorna uma resposta JSON
 * com mensagem de erro e código HTTP apropriado.
 * 
 * @param {string} message - Mensagem de erro para o cliente
 * @param {number} [status=500] - Código HTTP (padrão: 500 Internal Server Error)
 * @param {string} [code] - Código de erro opcional para tratamento no cliente
 * @returns {NextResponse} Resposta JSON com erro
 * 
 * @example
 * return apiError('Recurso não encontrado', 404, 'NOT_FOUND');
 */
export function apiError(message: string, status: number = 500, code?: string) {
    return NextResponse.json(
        { error: message, ...(code && { code }) },
        { status }
    );
}

/**
 * Trata erros de validação do Zod com detalhes por campo
 * 
 * Extrai os erros de validação do Zod e retorna uma resposta formatada
 * indicando qual campo falhou e por quê.
 * 
 * @param {ZodError} error - Erro retornado pelo Zod durante validação
 * @returns {NextResponse} Resposta JSON com status 400 e detalhes dos erros
 * 
 * @example
 * try {
 *   const data = schema.parse(input);
 * } catch (error) {
 *   if (error instanceof ZodError) {
 *     return handleValidationError(error);
 *   }
 * }
 */
export function handleValidationError(error: ZodError) {
    const fieldErrors = error.issues.map(e => ({
        field: e.path.join('.'),
        message: e.message
    }));
    return NextResponse.json(
        { error: 'Dados invalidos', code: 'VALIDATION_ERROR', fields: fieldErrors },
        { status: 400 }
    );
}

/**
 * Tratador seguro de erros de API
 * 
 * Registra o erro no console (apenas em desenvolvimento) e retorna
 * uma mensagem genérica sem expor informações internas.
 * 
 * @param {unknown} error - Erro capturado (pode ser Error ou qualquer tipo)
 * @param {string} [context='API'] - Contexto onde o erro ocorreu para logging
 * @returns {NextResponse} Resposta de erro genérica com status 500
 * 
 * @example
 * try {
 *   // operação perigosa
 * } catch (error) {
 *   return handleApiError(error, 'POST /assets');
 * }
 */
export function handleApiError(error: unknown, context: string = 'API') {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[${context}] Error:`, message);
    return apiError('Erro interno do servidor', 500, 'INTERNAL_ERROR');
}

/**
 * Extrai token Bearer do header Authorization
 * 
 * Valida o formato do token e garante que seja válido (mínimo 10 caracteres).
 * 
 * @param {Request} request - Objeto da requisição HTTP
 * @returns {string|null} Token extraído ou null se inválido/inexistente
 * 
 * @example
 * const token = extractBearerToken(request);
 * if (!token) return apiError('Não autorizado', 401);
 */
export function extractBearerToken(request: Request): string | null {
    const auth = request.headers.get('Authorization');
    if (!auth || !auth.startsWith('Bearer ')) return null;
    const token = auth.slice(7).trim();
    if (token.length < 10) return null;
    return token;
}

/**
 * Valida e limita um parâmetro inteiro de query
 * 
 * Converte um valor de string para número inteiro, com validação de range.
 * Retorna o valor padrão se a conversão falhar ou o valor estiver fora do intervalo.
 * 
 * @param {string|null} value - Valor da query string
 * @param {number} defaultVal - Valor padrão se conversão falhar
 * @param {number} min - Valor mínimo aceito (inclusive)
 * @param {number} max - Valor máximo aceito (inclusive)
 * @returns {number} Valor validado e limitado ao intervalo
 * 
 * @example
 * const page = parseIntParam(req.nextUrl.searchParams.get('page'), 1, 1, 100);
 * // Input "abc" retorna 1
 * // Input "-5" retorna 1
 * // Input "50" retorna 50
 */
export function parseIntParam(value: string | null, defaultVal: number, min: number, max: number): number {
    if (!value) return defaultVal;
    const num = parseInt(value, 10);
    if (isNaN(num)) return defaultVal;
    return Math.max(min, Math.min(max, num));
}

/**
 * Extrai token do Gmail do cookie httpOnly ou header Bearer
 * 
 * Tenta primeiro extrair de cookie seguro (httpOnly), depois fallback para
 * token Bearer no header para compatibilidade com versões antigas.
 * 
 * @param {Request} request - Objeto da requisição HTTP
 * @param {string|null} [cookieHeader] - Header de cookie (opcional)
 * @returns {string|null} Token Gmail extraído ou null se não encontrado
 * 
 * @example
 * const token = extractGmailToken(request, req.headers.get('cookie'));
 * if (!token) return apiError('Autenticação Gmail necessária', 401);
 */
export function extractGmailToken(request: Request, cookieHeader?: string | null): string | null {
    // Try cookie first
    if (cookieHeader) {
        const match = cookieHeader.match(/gmail_access_token=([^;]+)/);
        if (match?.[1] && match[1].length >= 10) return match[1];
    }
    // Fallback to Bearer header for backward compatibility
    return extractBearerToken(request);
}

/**
 * Tipos MIME permitidos para extração com IA
 * 
 * Lista os formatos de arquivo que podem ser processados pelo sistema de IA
 * para extração de dados (imagens, PDFs e textos).
 * 
 * @type {string[]}
 * @constant
 */
export const ALLOWED_MIME_TYPES = [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'application/pdf',
    'text/plain', 'text/html'
];
