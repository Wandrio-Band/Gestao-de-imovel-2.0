import NextAuth from "next-auth"
import authConfig from "@/auth.config"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
    const { nextUrl } = req
    const isAuthenticated = !!req.auth

    const isApiRoute = nextUrl.pathname.startsWith('/api')
    const isAuthRoute = nextUrl.pathname.startsWith('/api/auth')

    if (isApiRoute && !isAuthRoute) {
        if (!isAuthenticated) {
            return NextResponse.json({ error: "Acesso nao autorizado" }, { status: 401 })
        }

        // RBAC: Protect destructive endpoints (only ADMIN)
        const isDestructiveRoute = nextUrl.pathname === '/api/invoices/reset'
        if (isDestructiveRoute) {
            const role = req.auth?.user?.role
            if (role !== 'ADMIN') {
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

export const config = {
    matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}
