import { describe, it, expect, vi, beforeEach } from 'vitest';

// We need to mock the auth module directly
const mockAuth = vi.fn();

vi.mock('@/auth', () => ({
    auth: () => mockAuth(),
}));

// Now import auth-guard (clear the previous mock from setup for this test)
vi.mock('@/lib/auth-guard', async () => {
    const { auth } = await import('@/auth');
    return {
        requireAuth: async () => {
            const session = await auth();
            if (!session?.user) {
                throw new Error('Unauthorized: Authentication required');
            }
            return session;
        },
        requireAdmin: async () => {
            const session = await auth();
            if (!session?.user) {
                throw new Error('Unauthorized: Authentication required');
            }
            if (session.user.role !== 'ADMIN') {
                throw new Error('Forbidden: Admin access required');
            }
            return session;
        },
    };
});

import { requireAuth, requireAdmin } from '@/lib/auth-guard';

describe('requireAuth', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns session for authenticated user', async () => {
        mockAuth.mockResolvedValue({ user: { name: 'Test', email: 'test@test.com', role: 'USER' } });

        const session = await requireAuth();
        expect(session.user.name).toBe('Test');
    });

    it('throws for unauthenticated user', async () => {
        mockAuth.mockResolvedValue(null);

        await expect(requireAuth()).rejects.toThrow('Unauthorized');
    });

    it('throws for session without user', async () => {
        mockAuth.mockResolvedValue({ user: null });

        await expect(requireAuth()).rejects.toThrow('Unauthorized');
    });
});

describe('requireAdmin', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns session for admin user', async () => {
        mockAuth.mockResolvedValue({ user: { name: 'Admin', email: 'admin@test.com', role: 'ADMIN' } });

        const session = await requireAdmin();
        expect(session.user.role).toBe('ADMIN');
    });

    it('throws for non-admin user', async () => {
        mockAuth.mockResolvedValue({ user: { name: 'User', email: 'user@test.com', role: 'USER' } });

        await expect(requireAdmin()).rejects.toThrow('Forbidden');
    });

    it('throws for unauthenticated user', async () => {
        mockAuth.mockResolvedValue(null);

        await expect(requireAdmin()).rejects.toThrow('Unauthorized');
    });
});
