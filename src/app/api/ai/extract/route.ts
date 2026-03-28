import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { aiExtractSchema } from '@/lib/validations';
import { apiError, handleApiError, handleValidationError, ALLOWED_MIME_TYPES } from '@/lib/api-utils';
import { requireAuth } from '@/lib/auth-guard';

const CATEGORIES = ["Saude", "Educacao", "Reforma", "Eletronicos", "Outros"];
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function POST(request: NextRequest) {
    try {
        await requireAuth();
        const body = await request.json();

        const parsed = aiExtractSchema.safeParse(body);
        if (!parsed.success) {
            return handleValidationError(parsed.error);
        }

        const { content, isFile, mimeType } = parsed.data;

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return apiError('API Key nao configurada', 500, 'CONFIG_ERROR');
        }

        if (isFile && mimeType && !ALLOWED_MIME_TYPES.includes(mimeType)) {
            return apiError(`Tipo de arquivo nao suportado: ${mimeType}`, 400, 'INVALID_MIME');
        }

        // Validate file size (base64 encoded, ~10MB decoded limit)
        if (isFile && content) {
            const estimatedBytes = (content.length * 3) / 4;
            if (estimatedBytes > 10 * 1024 * 1024) {
                return apiError('Arquivo muito grande (maximo 10MB)', 413, 'FILE_TOO_LARGE');
            }
        }

        const prompt = `Analise este documento de Nota Fiscal/Recibo. Seja extremamente preciso.
            Extraia os seguintes campos com foco total no contexto brasileiro:
            - TOMADOR: Nome completo, CPF/CNPJ, Endereco, Email e Telefone.
            - EMISSOR: Nome, CNPJ, Telefone.
            - DATA: Formato DD/MM/YYYY.
            - VALOR TOTAL: Valor liquido ou total da nota.

         CATEGORIA DEVE SER UMA DAS: ${CATEGORIES.join(', ')}.

         Devolva APENAS o JSON estrito. Nao use blocos de codigo markdown (\`\`\`json). Retorne estritamente o objeto:
         { "is_invoice": boolean, "invalidation_reason": string, "data": "DD/MM/YYYY", "cnpj_cpf_emissor": "", "nome_emissor": "", "endereco_emissor": "", "cep_emissor": "", "logradouro_emissor": "", "numero_emissor": "", "bairro_emissor": "", "complemento_emissor": "", "telefone_emissor": "", "cidade": "", "estado": "", "valor_total": "", "categoria": "", "numero_nota": "", "serie_nota": "", "beneficiario": "", "nome_tomador": "", "cpf_cnpj_tomador": "", "endereco_tomador": "", "cep_tomador": "", "logradouro_tomador": "", "numero_tomador": "", "bairro_tomador": "", "complemento_tomador": "", "cidade_tomador": "", "estado_tomador": "", "email_tomador": "", "telefone_tomador": "", "items": [{ "descricao": "", "quantidade": "", "valor": "", "unidade": "", "categoria": "" }] }`;

        const parts = isFile
            ? [{ text: prompt }, { inlineData: { mimeType: mimeType!, data: content } }]
            : [{ text: `${prompt}\n\nCONTENT:\n${content}` }];

        let lastError: { status: number; text: string } | null = null;
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            try {
                const result = await model.generateContent(parts);
                const text = result.response.text();

                if (!text) {
                    return apiError('Sem dados retornados pela IA', 502, 'AI_EMPTY_RESPONSE');
                }

                let parsed;
                try {
                    parsed = JSON.parse(text);
                } catch {
                    return apiError('Resposta da IA em formato invalido', 502, 'AI_INVALID_JSON');
                }

                return NextResponse.json(parsed);

            } catch (err: unknown) {
                const errMsg = err instanceof Error ? err.message : 'Unknown AI error';
                const errStatus = (err as { status?: number })?.status || 502;
                logger.error(`[AI Extract] Attempt ${attempt + 1} failed:`, errMsg);
                lastError = { status: errStatus, text: errMsg };

                if (attempt < MAX_RETRIES - 1) {
                    await sleep(RETRY_DELAY * (attempt + 1));
                }
            }
        }

        return apiError('Falha na API Gemini apos multiplas tentativas', lastError?.status || 502, 'AI_RETRY_EXHAUSTED');

    } catch (error) {
        return handleApiError(error, 'AI Extract');
    }
}
