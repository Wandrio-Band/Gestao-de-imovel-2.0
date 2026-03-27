import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

/**
 * Standardized API error response - never exposes internal details
 */
export function apiError(message: string, status: number = 500, code?: string) {
    return NextResponse.json(
        { error: message, ...(code && { code }) },
        { status }
    );
}

/**
 * Handle Zod validation errors with detailed field messages
 */
export function handleValidationError(error: ZodError) {
    const fieldErrors = error.issues.map(e => ({
        field: e.path.join('.'),
        message: e.message
    }));
    return NextResponse.json(
        { error: 'Dados invalidos', code: 'VALIDATION_ERROR', fields: fieldErrors },
        { status: 400 }
    );
}

/**
 * Safe error handler for API routes - never leaks internal info
 */
export function handleApiError(error: unknown, context: string = 'API') {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[${context}] Error:`, message);
    return apiError('Erro interno do servidor', 500, 'INTERNAL_ERROR');
}

/**
 * Validate Bearer token format
 */
export function extractBearerToken(request: Request): string | null {
    const auth = request.headers.get('Authorization');
    if (!auth || !auth.startsWith('Bearer ')) return null;
    const token = auth.slice(7).trim();
    if (token.length < 10) return null;
    return token;
}

/**
 * Validate and clamp integer query param
 */
export function parseIntParam(value: string | null, defaultVal: number, min: number, max: number): number {
    if (!value) return defaultVal;
    const num = parseInt(value, 10);
    if (isNaN(num)) return defaultVal;
    return Math.max(min, Math.min(max, num));
}

/**
 * Allowed MIME types for AI extraction
 */
export const ALLOWED_MIME_TYPES = [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'application/pdf',
    'text/plain', 'text/html'
];
