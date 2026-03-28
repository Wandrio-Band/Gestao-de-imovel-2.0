import { NextRequest, NextResponse } from 'next/server';
import { extractGmailToken, apiError, handleApiError } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const messageId = searchParams.get('messageId');
        const attachmentId = searchParams.get('attachmentId');
        const cookieHeader = req.headers.get('cookie');
        const token = extractGmailToken(req, cookieHeader);

        if (!messageId || !attachmentId) {
            return apiError('Parametros messageId e attachmentId obrigatorios', 400, 'MISSING_PARAMS');
        }

        if (!token) {
            return apiError('Token de autorizacao ausente ou invalido', 401, 'UNAUTHORIZED');
        }

        const safeMessageId = encodeURIComponent(messageId);
        const safeAttachmentId = encodeURIComponent(attachmentId);

        const res = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${safeMessageId}/attachments/${safeAttachmentId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!res.ok) {
            return apiError(`Erro ao buscar anexo: ${res.status}`, res.status, 'GMAIL_API_ERROR');
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        return handleApiError(error, 'Gmail Attachments');
    }
}
