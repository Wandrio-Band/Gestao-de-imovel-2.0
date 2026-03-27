import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
const CATEGORIES = ["Saúde", "Educação", "Reforma", "Eletrônicos", "Outros"];

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { content, isFile, mimeType } = body;

        if (!apiKey) {
            return NextResponse.json({ error: 'API Key não configurada' }, { status: 500 });
        }

        const prompt = `Analise este documento de Nota Fiscal/Recibo. Seja extremamente preciso.
            Extraia os seguintes campos com foco total no contexto brasileiro:
            - TOMADOR: Nome completo, CPF/CNPJ, Endereço, Email e Telefone.
            - EMISSOR: Nome, CNPJ, Telefone.
            - DATA: Formato DD/MM/YYYY.
            - VALOR TOTAL: Valor líquido ou total da nota.

         CATEGORIA DEVE SER UMA DAS: ${CATEGORIES.join(', ')}.
         
         Devolva APENAS o JSON estrito. Não use blocos de código markdown (\`\`\`json). Retorne estritamente o objeto: 
         { "is_invoice": boolean, "invalidation_reason": string, "data": "DD/MM/YYYY", "cnpj_cpf_emissor": "", "nome_emissor": "", "endereco_emissor": "", "cep_emissor": "", "logradouro_emissor": "", "numero_emissor": "", "bairro_emissor": "", "complemento_emissor": "", "telefone_emissor": "", "cidade": "", "estado": "", "valor_total": "", "categoria": "", "numero_nota": "", "serie_nota": "", "beneficiario": "", "nome_tomador": "", "cpf_cnpj_tomador": "", "endereco_tomador": "", "cep_tomador": "", "logradouro_tomador": "", "numero_tomador": "", "bairro_tomador": "", "complemento_tomador": "", "cidade_tomador": "", "estado_tomador": "", "email_tomador": "", "telefone_tomador": "", "items": [{ "descricao": "", "quantidade": "", "valor": "", "unidade": "", "categoria": "" }] }`;

        const parts = isFile
            ? [{ text: prompt }, { inlineData: { mimeType, data: content } }]
            : [{ text: `${prompt}\n\nCONTENT:\n${content}` }];

        let lastError = null;
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash"
        });

        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            try {
                const result = await model.generateContent(parts);
                const text = result.response.text();

                if (!text) {
                    return NextResponse.json({ error: 'Sem dados da IA' }, { status: 500 });
                }

                let parsed;
                try {
                    parsed = JSON.parse(text);
                } catch (e) {
                    return NextResponse.json({ error: 'JSON inválido', rawText: text }, { status: 500 });
                }

                return NextResponse.json(parsed);

            } catch (err: any) {
                console.error(`Attempt ${attempt + 1} GenerativeAI Error:`, err);
                lastError = { status: err.status || 500, text: err.message, details: err };

                if (attempt < MAX_RETRIES - 1) {
                    await sleep(RETRY_DELAY * (attempt + 1));
                }
            }
        }

        let errorJson = { error: 'Falha na API Gemini após múltiplas tentativas' };
        if (lastError) {
            errorJson = { ...errorJson, message: lastError.text, details: lastError.details };
            return NextResponse.json(errorJson, { status: lastError.status });
        }

        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });

    } catch (error: any) {
        console.error('AI Extract Route Critical Error:', error);
        return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
    }
}
