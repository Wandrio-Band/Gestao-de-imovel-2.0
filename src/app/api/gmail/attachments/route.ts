import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const messageId = searchParams.get('messageId');
    const attachmentId = searchParams.get('attachmentId');
    const authHeader = req.headers.get('Authorization');

    if (!messageId || !attachmentId || !authHeader) {
        return NextResponse.json({ error: 'Missing parameters or Authorization' }, { status: 400 });
    }

    try {
        const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/attachments/${attachmentId}`, {
            headers: { Authorization: authHeader }
        });

        if (!res.ok) {
            const errText = await res.text();
            return NextResponse.json({ error: `Gmail API Error: ${res.status}`, details: errText }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
