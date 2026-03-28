import { z } from 'zod';

/**
 * Validação de Variáveis de Ambiente
 * 
 * Este módulo define e valida todas as variáveis de ambiente necessárias para
 * o funcionamento da aplicação. A validação ocorre em tempo de inicialização,
 * prevenindo inicialização da app com configuração incompleta.
 * 
 * Variáveis obrigatórias:
 * - GEMINI_API_KEY: Chave de autenticação para API do Google Gemini
 * - DATABASE_URL: String de conexão com o banco de dados (ex: SQLite, PostgreSQL)
 * 
 * Variáveis opcionais:
 * - NODE_ENV: Ambiente de execução (development, production, test)
 */

/**
 * Schema Zod para validação de variáveis de ambiente
 * 
 * Define quais variáveis são obrigatórias, seus tipos e valores padrão.
 * 
 * @type {ZodSchema}
 */
const envSchema = z.object({
    // Required
    GEMINI_API_KEY: z.string().min(1, 'Gemini API Key is required'),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    AUTH_SECRET: z.string().optional(),
    DATABASE_URL: z.string().min(1, 'Database URL is required'),

    // Optional with defaults
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

/**
 * Valida e retorna variáveis de ambiente tipadas
 * 
 * Executa a validação do schema no momento de import.
 * Se alguma variável obrigatória estiver faltando ou inválida,
 * lança um erro com detalhes do problema.
 * 
 * @returns {Object} Objeto com variáveis de ambiente validadas e tipadas
 * @throws {Error} Erro detalhado se validação falhar, listando variáveis inválidas
 * 
 * @example
 * // Automático no import
 * import { env } from '@/lib/env';
 * console.log(env.DATABASE_URL); // Tipado como string
 */
function validateEnv() {
    try {
        return envSchema.parse({
            GEMINI_API_KEY: process.env.GEMINI_API_KEY,
            DATABASE_URL: process.env.DATABASE_URL,
            NODE_ENV: process.env.NODE_ENV,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            const missingVars = error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ');
            throw new Error(`Invalid environment variables: ${missingVars}`);
        }
        throw error;
    }
}

/**
 * Variáveis de ambiente validadas e tipadas
 * 
 * Exportado como constante após validação na inicialização.
 * Oferece autocomplete e type-safety em toda a aplicação.
 * 
 * @constant
 * @type {Object}
 */
export const env = validateEnv();

/**
 * Tipo inferido do schema de variáveis de ambiente
 * 
 * Útil para criar tipos compatíveis em outras partes da aplicação.
 * 
 * @typedef {Object} Env
 * @type {import('zod').infer<typeof envSchema>}
 */
export type Env = z.infer<typeof envSchema>;
