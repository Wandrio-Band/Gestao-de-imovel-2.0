import { NextResponse } from 'next/server';

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
    // This file is strictly for importing by ID, but since this is a dynamic route for list,
    // wait, this is supposed to be the DETAIL route.
    // The previous design was /api/gmail/import/route.ts which is wrong for detail.
    // The detail should be /api/gmail/messages/[id]/route.ts
    // BUT the user's frontend Logic currently fetches detail for each item in the list loop.
    return NextResponse.json({ error: 'Use /api/gmail/messages/[id]' }, { status: 404 });
}
