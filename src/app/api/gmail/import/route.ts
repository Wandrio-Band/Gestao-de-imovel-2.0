import { NextResponse } from 'next/server';

// This route is deprecated. Use /api/gmail/messages/[id] instead.
export async function GET() {
    return NextResponse.json(
        { error: 'Rota descontinuada. Use /api/gmail/messages/[id]', code: 'DEPRECATED' },
        { status: 410 }
    );
}
