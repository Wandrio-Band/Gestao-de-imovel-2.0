import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE() {
    try {
        const { count } = await prisma.invoice.deleteMany({});
        return NextResponse.json({ success: true, count });
    } catch (error) {
        console.error("Failed to delete all invoices:", error);
        return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
    }
}
