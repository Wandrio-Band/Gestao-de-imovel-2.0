import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'gmail_access_token';
const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
    maxAge: 3600, // 1 hour (Gmail access tokens are short-lived)
};

// Save Gmail token in httpOnly cookie
export async function POST(request: NextRequest) {
    try {
        const { token } = await request.json();

        if (!token || typeof token !== 'string' || token.length < 10) {
            return NextResponse.json({ error: 'Token invalido' }, { status: 400 });
        }

        const cookieStore = await cookies();
        cookieStore.set(COOKIE_NAME, token, COOKIE_OPTIONS);

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Erro ao salvar token' }, { status: 500 });
    }
}

// Check if token exists (does not return the token itself)
export async function GET() {
    const cookieStore = await cookies();
    const hasToken = !!cookieStore.get(COOKIE_NAME)?.value;
    return NextResponse.json({ hasToken });
}

// Clear the token
export async function DELETE() {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
    return NextResponse.json({ success: true });
}
