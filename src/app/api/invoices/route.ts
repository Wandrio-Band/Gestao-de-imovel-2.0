import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        console.log("🔍 [Invoices API] GET requested");
        console.log("📂 [Invoices API] Current CWD:", process.cwd());

        const dbPath = process.env.DATABASE_URL?.replace('file:', '');
        if (dbPath) {
            const absoluteDbPath = path.isAbsolute(dbPath) ? dbPath : path.join(process.cwd(), dbPath);
            console.log("🗄️ [Invoices API] Checking DB path:", absoluteDbPath);
            console.log("❓ [Invoices API] File exists?", fs.existsSync(absoluteDbPath));
            if (fs.existsSync(absoluteDbPath)) {
                const stats = fs.statSync(absoluteDbPath);
                console.log("📊 [Invoices API] DB File size:", stats.size);
            }
        }

        const invoices = await prisma.invoice.findMany({
            orderBy: { createdAt: 'desc' }
        });
        console.log(`✅ [Invoices API] Found ${invoices.length} invoices`);
        return NextResponse.json(invoices);
    } catch (error: any) {
        console.error("❌ [Invoices API] GET Error:", error);
        return NextResponse.json({
            error: 'Error fetching invoices',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
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
