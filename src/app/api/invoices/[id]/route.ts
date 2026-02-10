
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const body = await request.json();
        const invoice = await prisma.invoice.update({
            where: { id: params.id },
            data: {
                status: body.status,
                auditReason: body.auditReason,
                // Full Update Support
                data: body.data,
                cnpj_cpf_emissor: body.cnpj_cpf_emissor,
                nome_emissor: body.nome_emissor,
                endereco_emissor: body.endereco_emissor,
                cidade: body.cidade,
                estado: body.estado,
                valor_total: body.valor_total,
                categoria: body.categoria,
                source: body.source,
                fileCopy: body.fileCopy,
                items: body.items ? (typeof body.items === 'string' ? body.items : JSON.stringify(body.items)) : undefined,
                numero_nota: body.numero_nota,
                serie_nota: body.serie_nota,
                beneficiario: body.beneficiario,
                nome_tomador: body.nome_tomador,
                cpf_cnpj_tomador: body.cpf_cnpj_tomador,
                endereco_tomador: body.endereco_tomador,
                email_tomador: body.email_tomador,
                telefone_emissor: body.telefone_emissor,
                telefone_tomador: body.telefone_tomador
            }
        });
        return NextResponse.json(invoice);
    } catch (error) {
        return NextResponse.json({ error: 'Error updating invoice' }, { status: 500 });
    }
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    console.log(`[API DELETE] Attempting to delete invoice: ${params.id}`);
    try {
        await prisma.invoice.delete({
            where: { id: params.id }
        });
        console.log(`[API DELETE] Success: ${params.id}`);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error(`[API DELETE] Error deleting ${params.id}:`, error.message);
        if (error.code === 'P2025') {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }
        return NextResponse.json({ error: 'Error deleting invoice' }, { status: 500 });
    }
}
