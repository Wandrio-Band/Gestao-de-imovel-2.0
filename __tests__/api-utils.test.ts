import { describe, it, expect } from 'vitest';
import { extractBearerToken, parseIntParam, extractGmailToken, ALLOWED_MIME_TYPES } from '@/lib/api-utils';

describe('extractBearerToken', () => {
    it('extracts valid Bearer token', () => {
        const req = new Request('http://localhost', {
            headers: { Authorization: 'Bearer ya29.some_long_token_here' },
        });
        expect(extractBearerToken(req)).toBe('ya29.some_long_token_here');
    });

    it('returns null for missing Authorization header', () => {
        const req = new Request('http://localhost');
        expect(extractBearerToken(req)).toBeNull();
    });

    it('returns null for non-Bearer auth', () => {
        const req = new Request('http://localhost', {
            headers: { Authorization: 'Basic abc123' },
        });
        expect(extractBearerToken(req)).toBeNull();
    });

    it('returns null for short token (<10 chars)', () => {
        const req = new Request('http://localhost', {
            headers: { Authorization: 'Bearer short' },
        });
        expect(extractBearerToken(req)).toBeNull();
    });
});

describe('parseIntParam', () => {
    it('returns default for null', () => {
        expect(parseIntParam(null, 10, 1, 100)).toBe(10);
    });

    it('returns default for NaN string', () => {
        expect(parseIntParam('abc', 10, 1, 100)).toBe(10);
    });

    it('parses valid number', () => {
        expect(parseIntParam('50', 10, 1, 100)).toBe(50);
    });

    it('clamps to min', () => {
        expect(parseIntParam('-5', 10, 1, 100)).toBe(1);
    });

    it('clamps to max', () => {
        expect(parseIntParam('200', 10, 1, 100)).toBe(100);
    });

    it('handles boundary values', () => {
        expect(parseIntParam('1', 10, 1, 100)).toBe(1);
        expect(parseIntParam('100', 10, 1, 100)).toBe(100);
    });
});

describe('extractGmailToken', () => {
    it('extracts token from cookie header', () => {
        const req = new Request('http://localhost');
        const cookie = 'gmail_access_token=ya29.very_long_token_here; other=val';
        expect(extractGmailToken(req, cookie)).toBe('ya29.very_long_token_here');
    });

    it('falls back to Bearer token when no cookie', () => {
        const req = new Request('http://localhost', {
            headers: { Authorization: 'Bearer ya29.bearer_token_value' },
        });
        expect(extractGmailToken(req, null)).toBe('ya29.bearer_token_value');
    });

    it('returns null when neither cookie nor bearer available', () => {
        const req = new Request('http://localhost');
        expect(extractGmailToken(req, null)).toBeNull();
    });

    it('ignores short cookie token (<10 chars)', () => {
        const req = new Request('http://localhost', {
            headers: { Authorization: 'Bearer ya29.fallback_token_v' },
        });
        const cookie = 'gmail_access_token=short';
        expect(extractGmailToken(req, cookie)).toBe('ya29.fallback_token_v');
    });
});

describe('ALLOWED_MIME_TYPES', () => {
    it('includes common image types', () => {
        expect(ALLOWED_MIME_TYPES).toContain('image/jpeg');
        expect(ALLOWED_MIME_TYPES).toContain('image/png');
    });

    it('includes PDF', () => {
        expect(ALLOWED_MIME_TYPES).toContain('application/pdf');
    });

    it('includes text types', () => {
        expect(ALLOWED_MIME_TYPES).toContain('text/plain');
    });
});
