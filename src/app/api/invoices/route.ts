import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { invoiceCreateSchema } from '@/lib/validations';
import { handleApiError, handleValidationError, parseIntParam } from '@/lib/api-utils';
import { logAudit } from '@/lib/audit';
import { requireAuth } from '@/lib/auth-guard';

export async function GET(request: Request) {
    try {
        await requireAuth();
        const { searchParams } = new URL(request.url);
        const page = parseIntParam(searchParams.get('page'), 1, 1, 1000);
        const limit = parseIntParam(searchParams.get('limit'), 50, 1, 100);
        const skip = (page - 1) * limit;

        const [invoices, total] = await Promise.all([
            prisma.invoice.findMany({
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.invoice.count()
        ]);

        return NextResponse.json({ data: invoices, total, page, limit });
    } catch (error) {
        return handleApiError(error, 'Invoices GET');
    }
}

export async function POST(request: Request) {
    try {
        await requireAuth();
        const body = await request.json();

        const parsed = invoiceCreateSchema.safeParse(body);
        if (!parsed.success) {
            return handleValidationError(parsed.error);
        }

        const data = parsed.data;
        const items = data.items
            ? (typeof data.items === 'string' ? data.items : JSON.stringify(data.items))
            : null;

        const invoice = await prisma.invoice.create({
            data: {
                data: data.data,
                cnpj_cpf_emissor: data.cnpj_cpf_emissor,
                nome_emissor: data.nome_emissor,
                endereco_emissor: data.endereco_emissor,
                cidade: data.cidade,
                estado: data.estado,
                valor_total: data.valor_total != null ? String(data.valor_total) : undefined,
                categoria: data.categoria,
                status: data.status,
                source: data.source,
                fileCopy: data.fileCopy,
                auditReason: data.auditReason,
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

        await logAudit('CREATE', 'Invoice', invoice.id, {
            nome_emissor: data.nome_emissor,
            valor_total: data.valor_total,
            source: data.source
        });

        return NextResponse.json(invoice);
    } catch (error) {
        return handleApiError(error, 'Invoices POST');
    }
}
