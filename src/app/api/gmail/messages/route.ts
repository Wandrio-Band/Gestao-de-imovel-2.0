import { NextResponse } from 'next/server';
import { extractBearerToken, parseIntParam, apiError, handleApiError } from '@/lib/api-utils';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const token = extractBearerToken(request);

        if (!token) {
            return apiError('Token de autorizacao ausente ou invalido', 401, 'UNAUTHORIZED');
        }

        const q = searchParams.get('q') || '';
        const maxResults = parseIntParam(searchParams.get('maxResults'), 10, 1, 50);

        const url = new URL('https://gmail.googleapis.com/gmail/v1/users/me/messages');
        url.searchParams.set('q', q);
        url.searchParams.set('maxResults', String(maxResults));

        const res = await fetch(url.toString(), {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) {
            const errText = await res.text();
            let parsedErr;
            try { parsedErr = JSON.parse(errText); } catch { parsedErr = { message: 'Gmail API error' }; }
            return NextResponse.json({ error: parsedErr }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        return handleApiError(error, 'Gmail Messages');
    }
}
