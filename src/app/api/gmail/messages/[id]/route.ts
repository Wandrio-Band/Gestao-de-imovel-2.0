import { NextResponse } from 'next/server';

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
        }

        const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${params.id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) {
            const err = await res.json();
            return NextResponse.json({ error: err }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
