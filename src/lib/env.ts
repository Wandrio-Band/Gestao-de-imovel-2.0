import { z } from 'zod';

/**
 * Environment Variables Schema
 * Validates required environment variables at startup
 */
const envSchema = z.object({
    // Required
    NEXT_PUBLIC_GEMINI_API_KEY: z.string().min(1, 'Gemini API Key is required'),
    DATABASE_URL: z.string().min(1, 'Database URL is required'),

    // Optional with defaults
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

/**
 * Validates and returns typed environment variables
 * Throws error if validation fails
 */
function validateEnv() {
    try {
        return envSchema.parse({
            NEXT_PUBLIC_GEMINI_API_KEY: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
            DATABASE_URL: process.env.DATABASE_URL,
            NODE_ENV: process.env.NODE_ENV,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            const missingVars = error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ');
            throw new Error(`❌ Invalid environment variables: ${missingVars}`);
        }
        throw error;
    }
}

// Validate and export typed env
export const env = validateEnv();

// Export type for autocomplete
export type Env = z.infer<typeof envSchema>;
