import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');
        const q = searchParams.get('q') || '';
        const maxResults = searchParams.get('maxResults') || '10';

        if (!token) {
            return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
        }

        const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${q}&maxResults=${maxResults}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) {
            const errText = await res.text();
            let parsedErr;
            try { parsedErr = JSON.parse(errText); } catch (e) { parsedErr = errText; }
            console.error(`Gmail API Error:`, parsedErr);
            return NextResponse.json({ error: parsedErr }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
