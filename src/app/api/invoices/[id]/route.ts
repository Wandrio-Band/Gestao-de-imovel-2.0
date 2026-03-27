import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { invoiceUpdateSchema } from '@/lib/validations';
import { apiError, handleApiError, handleValidationError } from '@/lib/api-utils';
import { logAudit } from '@/lib/audit';

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const body = await request.json();

        const parsed = invoiceUpdateSchema.safeParse(body);
        if (!parsed.success) {
            return handleValidationError(parsed.error);
        }

        const data = parsed.data;
        const items = data.items
            ? (typeof data.items === 'string' ? data.items : JSON.stringify(data.items))
            : undefined;

        const invoice = await prisma.invoice.update({
            where: { id: params.id },
            data: {
                status: data.status,
                auditReason: data.auditReason,
                data: data.data,
                cnpj_cpf_emissor: data.cnpj_cpf_emissor,
                nome_emissor: data.nome_emissor,
                endereco_emissor: data.endereco_emissor,
                cidade: data.cidade,
                estado: data.estado,
                valor_total: data.valor_total != null ? String(data.valor_total) : undefined,
                categoria: data.categoria,
                source: data.source,
                fileCopy: data.fileCopy,
                items,
                numero_nota: data.numero_nota,
                serie_nota: data.serie_nota,
                beneficiario: data.beneficiario,
                nome_tomador: data.nome_tomador,
                cpf_cnpj_tomador: data.cpf_cnpj_tomador,
                endereco_tomador: data.endereco_tomador,
                email_tomador: data.email_tomador,
                telefone_emissor: data.telefone_emissor,
                telefone_tomador: data.telefone_tomador
            }
        });

        await logAudit('UPDATE', 'Invoice', invoice.id, {
            fieldsUpdated: Object.keys(data).filter(k => data[k as keyof typeof data] !== undefined)
        });

        return NextResponse.json(invoice);
    } catch (error: unknown) {
        const prismaError = error as { code?: string };
        if (prismaError.code === 'P2025') {
            return apiError('Nota fiscal nao encontrada', 404, 'NOT_FOUND');
        }
        return handleApiError(error, 'Invoice PUT');
    }
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        await prisma.invoice.delete({
            where: { id: params.id }
        });

        await logAudit('DELETE', 'Invoice', params.id, { deletedAt: new Date().toISOString() });

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        const prismaError = error as { code?: string };
        if (prismaError.code === 'P2025') {
            return apiError('Nota fiscal nao encontrada', 404, 'NOT_FOUND');
        }
        return handleApiError(error, 'Invoice DELETE');
    }
}
