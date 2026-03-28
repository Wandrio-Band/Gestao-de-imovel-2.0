/**
 * @fileoverview Middleware de segurança centralizado para a aplicação Next.js.
 * 
 * Implementa camadas de proteção em cadeia para requisições de API:
 * 
 * 1. Rate Limiting
 *    - Limita requisições por IP e rota
 *    - Rutas de IA: máximo 5 requisições por minuto
 *    - Outras rotas: máximo 30 requisições por minuto
 * 
 * 2. CSRF Protection
 *    - Valida header Origin para requisições que modificam dados
 *    - Bloqueia requisições POST/PUT/DELETE/PATCH com origin diferente
 * 
 * 3. Authentication (TODO)
 *    - Aguarda implementação de login com Google OAuth
 * 
 * 4. RBAC (Role-Based Access Control)
 *    - Protege endpoints destrutivos (ex: /api/invoices/reset)
 *    - Restringe a usuários com role ADMIN
 * 
 * 5. Security Headers
 *    - Adiciona headers HTTP de segurança em todas as respostas
 *    - Previne: clickjacking, XSS, mime sniffing
 * 
 * Ordem de execução: Rate Limit → CSRF → Auth → RBAC → Headers
 * 
 * @see {@link https://nextjs.org/docs/advanced-features/middleware|Next.js Middleware}
 */

import NextAuth from "next-auth"
import authConfig from "@/auth.config"
import { NextResponse } from "next/server"
import { rateLimit } from "@/lib/rate-limit"

const { auth } = NextAuth(authConfig)

/**
 * Middleware principal que executa verificações de segurança.
 * 
 * @function middleware
 * @param {Request} req - Objeto de requisição Next.js
 * @returns {Response} Resposta Next.js (NextResponse ou erro)
 * 
 * @description
 * Fluxo de execução:
 * 
 * 1. **Extração de contexto**
 *    - Recupera URL, autenticação, e método HTTP
 *    - Identifica se é rota de API ou autenticação
 * 
 * 2. **Rate Limiting** (apenas rotas de API não-auth)
 *    - Obtém IP real do cliente (x-forwarded-for ou fallback)
 *    - Define limites maiores para rotas regulares (30/min)
 *    - Define limites menores para rotas de IA (5/min)
 *    - Retorna 429 Too Many Requests se exceder
 * 
 * 3. **CSRF Protection** (POST, PUT, DELETE, PATCH)
 *    - Compara header Origin com host da requisição
 *    - Bloqueia se origins diferentes (previne CSRF)
 *    - Retorna 403 Forbidden se violado
 * 
 * 4. **Authentication** (TODO)
 *    - Atualmente desativado até login ser implementado
 *    - Verificaria `req.auth` e retornaria 401 se não autenticado
 * 
 * 5. **RBAC - Endpoints Destrutivos**
 *    - Define lista de endpoints destrutivos:
 *      - /api/invoices/reset (qualquer método)
 *      - /api/invoices/[id] com DELETE
 *    - Restringe a usuários com role === 'ADMIN'
 *    - Retorna 403 Forbidden se permissão insuficiente
 * 
 * 6. **Security Headers** (todas as requisições)
 *    - X-Content-Type-Options: nosniff (previne mime sniffing)
 *    - X-Frame-Options: DENY (previne clickjacking)
 *    - X-XSS-Protection: 1; mode=block (legado, previne XSS)
 *    - Referrer-Policy: strict-origin-when-cross-origin (controla referrer)
 * 
 * @example
 * // Rate limit excedido
 * GET /api/financial/consolidated (31ª requisição em 60s)
 * Response: 429 Too Many Requests
 * { error: "Muitas requisicoes. Tente novamente em breve." }
 * 
 * @example
 * // CSRF bloqueado
 * POST /api/invoices/[id]
 * Origin: evil.com
 * Host: myapp.com
 * Response: 403 Forbidden
 * { error: "CSRF rejected" }
 * 
 * @example
 * // RBAC bloqueado
 * DELETE /api/invoices/reset
 * User role: USER
 * Response: 403 Forbidden
 * { error: "Permissao insuficiente" }
 */
export default auth((req) => {
    const { nextUrl } = req
    const isAuthenticated = !!req.auth
    const method = req.method || 'GET'

    const isApiRoute = nextUrl.pathname.startsWith('/api')
    const isAuthRoute = nextUrl.pathname.startsWith('/api/auth')

    if (isApiRoute && !isAuthRoute) {
        // Rate limiting
        const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
        const isAiRoute = nextUrl.pathname.startsWith('/api/ai')
        const maxRequests = isAiRoute ? 5 : 30
        const windowMs = 60_000

        if (!rateLimit(`${clientIp}:${nextUrl.pathname}`, maxRequests, windowMs)) {
            return NextResponse.json(
                { error: "Muitas requisicoes. Tente novamente em breve." },
                { status: 429 }
            )
        }

        // CSRF protection for state-changing methods
        if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
            const origin = req.headers.get('origin')
            const host = req.headers.get('host')
            if (origin && host && new URL(origin).host !== host) {
                return NextResponse.json({ error: "CSRF rejected" }, { status: 403 })
            }
        }

        // Authentication check (skipped until login flow is implemented)
        // TODO: Re-enable once Google OAuth login page is built
        // if (!isAuthenticated) {
        //     return NextResponse.json({ error: "Acesso nao autorizado" }, { status: 401 })
        // }

        // RBAC: Protect destructive endpoints (ADMIN only)
        if (isAuthenticated) {
            const role = req.auth?.user?.role
            const isDestructive = (
                nextUrl.pathname === '/api/invoices/reset' ||
                (nextUrl.pathname.match(/^\/api\/invoices\/[^/]+$/) && method === 'DELETE')
            )
            if (isDestructive && role !== 'ADMIN') {
                return NextResponse.json({ error: "Permissao insuficiente" }, { status: 403 })
            }
        }
    }

    // Add security headers
    const response = NextResponse.next()
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

    return response
})

/**
 * Configuração de padrão de matcher para o middleware.
 * 
 * @constant
 * @type {Object}
 * @property {string[]} matcher - Array de padrões de rota que acionam o middleware
 * 
 * @description
 * Padrões de exclusão:
 * - Arquivos com extensão (imagens, CSS, JS)
 * - Rotas _next (recursos do Next.js)
 * 
 * Padrões de inclusão:
 * - Todas as outras rotas
 * - Rotas /api e /trpc
 */
export const config = {
    matcher: ['/((?!.+\.[\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}
