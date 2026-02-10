import { PrismaClient } from '@prisma/client';
import path from 'path';

const globalForPrisma = global as unknown as { prisma_v2: PrismaClient };

// Force absolute path resolution to avoid "Unable to open database" errors in some Next.js contexts
const dbPath = path.resolve(process.cwd(), 'prisma/dev.db');

export const prisma =
    globalForPrisma.prisma_v2 ||
    new PrismaClient({
        log: ['query'],
        datasources: {
            db: {
                url: `file:${dbPath}`
            }
        }
    });

console.log("💿 [Prisma] Initialized with database at:", dbPath);

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma_v2 = prisma;
