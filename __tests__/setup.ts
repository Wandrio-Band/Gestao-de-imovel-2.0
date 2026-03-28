import { vi } from 'vitest';

// Mock next/cache
vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}));

// Mock next/headers
vi.mock('next/headers', () => ({
    cookies: vi.fn(() => ({
        get: vi.fn(),
        set: vi.fn(),
        delete: vi.fn(),
    })),
}));

// Mock Prisma client
vi.mock('@/lib/prisma', () => ({
    prisma: {
        asset: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            deleteMany: vi.fn(),
            upsert: vi.fn(),
        },
        assetPartner: {
            createMany: vi.fn(),
            deleteMany: vi.fn(),
        },
        financing: {
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            findMany: vi.fn(),
        },
        lease: {
            create: vi.fn(),
            deleteMany: vi.fn(),
            updateMany: vi.fn(),
        },
        tenant: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            findFirst: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            upsert: vi.fn(),
            count: vi.fn(),
        },
        contract: {
            findMany: vi.fn(),
            findFirst: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            count: vi.fn(),
        },
        paymentHistory: {
            create: vi.fn(),
        },
        tenantAlias: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
        invoice: {
            findMany: vi.fn(),
            count: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            deleteMany: vi.fn(),
        },
        systemAuditLog: {
            findMany: vi.fn(),
            create: vi.fn(),
        },
    },
}));

// Mock audit logger
vi.mock('@/lib/audit', () => ({
    logAudit: vi.fn(),
}));

// Mock contract number generator
vi.mock('@/utils/generators', () => ({
    generateContractNumber: vi.fn(() => 'CTR-2026-001'),
}));
