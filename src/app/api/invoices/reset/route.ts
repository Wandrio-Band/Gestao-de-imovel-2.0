import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';
import { resetConfirmSchema } from '@/lib/validations';
import { apiError, handleApiError, handleValidationError } from '@/lib/api-utils';
import { requireAdmin } from '@/lib/auth-guard';

export async function DELETE(request: NextRequest) {
    try {
        await requireAdmin();
        const body = await request.json();

        const parsed = resetConfirmSchema.safeParse(body);
        if (!parsed.success) {
            return handleValidationError(parsed.error);
        }

        const countBefore = await prisma.invoice.count();

        await logAudit('DELETE_ALL', 'Invoice', 'ALL', {
            countDeleted: countBefore,
            reason: 'User requested full reset'
        });

        const { count } = await prisma.invoice.deleteMany({});

        return NextResponse.json({ success: true, count });
    } catch (error) {
        return handleApiError(error, 'InvoiceReset');
    }
}
