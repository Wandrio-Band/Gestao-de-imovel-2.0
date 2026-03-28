import { NextResponse } from 'next/server';
import { extractGmailToken, apiError, handleApiError } from '@/lib/api-utils';

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const cookieHeader = request.headers.get('cookie');
        const token = extractGmailToken(request, cookieHeader);

        if (!token) {
            return apiError('Token de autorizacao ausente ou invalido', 401, 'UNAUTHORIZED');
        }

        const messageId = encodeURIComponent(params.id);
        const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`, {
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
        return handleApiError(error, 'Gmail Message Detail');
    }
}
