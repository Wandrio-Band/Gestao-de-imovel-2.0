import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';

/**
 * DEV/TEST ONLY: Creates a test session for E2E testing.
 * This endpoint is blocked in production by the environment check.
 */
export async function POST() {
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Not available' }, { status: 404 });
    }

    try {
        // Upsert a test user
        const testUser = await prisma.user.upsert({
            where: { email: 'e2e-test@localhost' },
            update: {},
            create: {
                email: 'e2e-test@localhost',
                name: 'E2E Test User',
                role: 'ADMIN',
                emailVerified: new Date(),
            },
        });

        // Create a session token
        const sessionToken = randomUUID();
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

        await prisma.session.create({
            data: {
                sessionToken,
                userId: testUser.id,
                expires,
            },
        });

        // Set the session cookie that NextAuth expects
        const response = NextResponse.json({ success: true, userId: testUser.id });

        response.cookies.set('authjs.session-token', sessionToken, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            path: '/',
            expires,
        });

        return response;
    } catch (error) {
        console.error('Test session error:', error);
        return NextResponse.json({ error: 'Failed to create test session' }, { status: 500 });
    }
}
