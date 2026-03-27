import { PrismaClient } from '@prisma/client';
import path from 'path';

const globalForPrisma = global as unknown as { prisma_v2: PrismaClient };

const dbPath = path.resolve(process.cwd(), 'prisma/dev.db');

export const prisma =
    globalForPrisma.prisma_v2 ||
    new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
        datasources: {
            db: {
                url: process.env.DATABASE_URL || `file:${dbPath}`
            }
        }
    });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma_v2 = prisma;
