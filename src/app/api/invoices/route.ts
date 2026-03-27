
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        console.log("Fetching invoices GET route hit");
        const invoices = await prisma.invoice.findMany({
            orderBy: { createdAt: 'desc' }
        });
        console.log("Invoices fetched successfully", invoices.length);
        return NextResponse.json(invoices);
    } catch (error: any) {
        console.error("CRITICAL ERROR IN /api/invoices GET:", error);
        return NextResponse.json({ error: 'Error fetching invoices', details: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        console.log("Creating Invoice with data:", JSON.stringify(body, null, 2));

        const invoice = await prisma.invoice.create({
            data: {
                data: body.data,
                cnpj_cpf_emissor: body.cnpj_cpf_emissor,
                nome_emissor: body.nome_emissor,
                endereco_emissor: body.endereco_emissor,
                cidade: body.cidade,
                estado: body.estado,
                valor_total: body.valor_total,
                categoria: body.categoria,
                status: body.status || 'PENDENTE',
                source: body.source,
                fileCopy: body.fileCopy,
                auditReason: body.auditReason,
                items: body.items ? JSON.stringify(body.items) : null,
                numero_nota: body.numero_nota,
                nome_tomador: body.nome_tomador,
                cpf_cnpj_tomador: body.cpf_cnpj_tomador,
                // Missing fields added:
                serie_nota: body.serie_nota,
                beneficiario: body.beneficiario,
                endereco_tomador: body.endereco_tomador,
                email_tomador: body.email_tomador,
                telefone_emissor: body.telefone_emissor,
                telefone_tomador: body.telefone_tomador
            }
        });
        console.log("Invoice created successfully:", invoice.id);
        return NextResponse.json(invoice);
    } catch (error: any) {
        console.error("Error creating invoice:", error);
        return NextResponse.json({ error: `Error creating invoice: ${error.message}` }, { status: 500 });
    }
}
