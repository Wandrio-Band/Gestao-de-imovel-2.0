import { PrismaClient } from '@prisma/client';
import path from 'path';

/**
 * Instância singleton do Prisma Client
 * 
 * Implementa o padrão singleton para garantir que apenas uma instância
 * do Prisma Client seja criada durante toda a execução da aplicação.
 * 
 * Em desenvolvimento, a instância é armazenada no objeto global para
 * evitar criação de múltiplas conexões quando há hot reload.
 * 
 * Em produção, a instância é criada uma única vez na inicialização.
 * 
 * Este padrão é essencial para:
 * - Evitar esgotamento de conexões com o banco de dados
 * - Melhorar performance ao reutilizar conexões
 * - Permitir hot reload sem problemas em desenvolvimento
 */

const globalForPrisma = global as unknown as { prisma_v2: PrismaClient };

/**
 * Caminho padrão do banco de dados SQLite
 * 
 * Usado quando DATABASE_URL não está configurada.
 * Armazena o banco em prisma/dev.db (relativo ao diretório raiz do projeto).
 * 
 * @type {string}
 */
const dbPath = path.resolve(process.cwd(), 'prisma/dev.db');

/**
 * Instância do Prisma Client (singleton)
 * 
 * Reutiliza instância global em desenvolvimento para evitar múltiplas conexões.
 * Em produção, cria instância única na inicialização.
 * 
 * Configurações:
 * - Dev: Registra avisos e erros
 * - Prod: Apenas registra erros críticos
 * - DATABASE_URL: Variável de ambiente, fallback para SQLite local
 * 
 * @type {PrismaClient}
 * 
 * @example
 * import { prisma } from '@/lib/prisma';
 * 
 * const user = await prisma.user.findUnique({ where: { id: 'user-1' } });
 * const assets = await prisma.asset.findMany({ where: { status: 'Locado' } });
 */
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

/**
 * Armazena instância global em desenvolvimento
 * 
 * Permite que hot reload reutilize a mesma instância Prisma
 * e evite avisos de múltiplas instâncias.
 */
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma_v2 = prisma;
