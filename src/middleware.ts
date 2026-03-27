import NextAuth from "next-auth"
import authConfig from "@/../auth.config"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
    const { nextUrl } = req
    const isAuthenticated = !!req.auth

    // For MVP: Protect /api/invoices, /api/ai/extract
    // Allow /api/auth/* 
    const isApiRoute = nextUrl.pathname.startsWith('/api')
    const isAuthRoute = nextUrl.pathname.startsWith('/api/auth')

    if (isApiRoute && !isAuthRoute) {
        if (!isAuthenticated) {
            return NextResponse.json({ error: "Unauthorized access" }, { status: 401 })
        }
    }

    return NextResponse.next()
})

export const config = {
    matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}
