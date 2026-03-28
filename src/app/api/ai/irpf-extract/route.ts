import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { apiError, handleApiError } from '@/lib/api-utils';
import { requireAuth } from '@/lib/auth-guard';

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function POST(request: NextRequest) {
    try {
        await requireAuth();
        const body = await request.json();
        const { text } = body;

        if (!text || typeof text !== 'string') {
            return apiError('Campo "text" obrigatório', 400, 'INVALID_INPUT');
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return apiError('API Key nao configurada', 500, 'CONFIG_ERROR');
        }

        const slicedText = text.length > 50000 ? text.slice(-50000) : text;

        const prompt = `DOCUMENTO: Declaração de Imposto de Renda Pessoa Física (IRPF) - Receita Federal do Brasil

TAREFA: Analise o texto abaixo e extraia TODOS os IMÓVEIS declarados na seção "BENS E DIREITOS" (códigos 11-19).

CAMPOS OBRIGATÓRIOS POR IMÓVEL:
- id_declaracao: Código/número do bem no IR
- descricao: Texto INTEGRAL E COMPLETO da declaração do imóvel (copiar exatamente como está no PDF)
- descricao_resumida: Resumo curto e claro (ex: "Apto 905 - Porto Velho/RO")
- valor_ir_atual: Valor declarado em reais (apenas número, sem R$ ou vírgulas)
- matricula: Número da matrícula no cartório
- iptu: Inscrição Municipal (IPTU)
- logradouro: Nome completo da rua/avenida
- numero: Número do imóvel
- complemento: Bloco, apartamento, sala (se houver)
- bairro: Nome do bairro
- municipio: Nome da cidade
- uf: Sigla do estado (2 letras)
- cep: Código postal
- area_total: Área em metros quadrados (apenas número)
- cartorio: Nome completo do cartório
- data_aquisicao: Data de aquisição no formato DD/MM/AAAA (ex: "15/03/2012")
- origem_aquisicao: Forma de aquisição ( ex: "Compra e Venda", "Doação", "Herança", "Leilão", "Financiamento")

IMPORTANTE:
- Normalize valores monetários (ex: "R$ 270.000,00" → 270000)
- Extraia endereço COMPLETO separando rua, número, complemento e bairro
- Se algum campo não estiver disponível, deixe vazio mas não omita o campo
- Para origem_aquisicao, infira pelo contexto se não estiver explícito (ex: "Adquirido de fulano" -> "Compra e Venda")

TEXTO DO PDF:
${slicedText}

OBS: Se não encontrar a seção "BENS E DIREITOS" explicitamente, procure por qualquer menção a imóveis, apartamentos, terrenos ou propriedades declaradas. Retorne TODOS os imóveis encontrados, mesmo que parcialmente preenchidos.`;

        let lastError: { status: number; text: string } | null = null;

        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            try {
                const ai = new GoogleGenAI({ apiKey });

                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: prompt,
                    config: {
                        systemInstruction: `Você é um AUDITOR FISCAL ESPECIALIZADO em extração de dados de Declaração de IRPF da Receita Federal do Brasil.

MISSÃO: Extrair TODOS os imóveis da seção "BENS E DIREITOS" com MÁXIMA PRECISÃO.

REGRAS OBRIGATÓRIAS:
1. Normalize valores R$ → number (ex: "R$ 1.250.000,00" → 1250000)
2. Crie descrição_resumida curta e clara (ex: "Apto 905 - Porto Velho/RO")
3. Se campo não disponível, deixe string vazia (não omita)
4. Extraia ENDEREÇO COMPLETO: separe rua, número, complemento, bairro
5. Area em m²: extraia APENAS NÚMEROS do texto (ex: "102,7 m²" → 102.7, "área de 200m2" → 200). Se houver fração ideal, ignore e pegue a área privativa ou total do imóvel.`,
                        responseMimeType: "application/json",
                        responseSchema: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    id_declaracao: { type: Type.STRING },
                                    descricao: { type: Type.STRING },
                                    descricao_resumida: { type: Type.STRING },
                                    valor_ir_atual: { type: Type.NUMBER },
                                    matricula: { type: Type.STRING },
                                    iptu: { type: Type.STRING },
                                    logradouro: { type: Type.STRING },
                                    numero: { type: Type.STRING },
                                    complemento: { type: Type.STRING },
                                    bairro: { type: Type.STRING },
                                    municipio: { type: Type.STRING },
                                    uf: { type: Type.STRING },
                                    cep: { type: Type.STRING },
                                    area_total: { type: Type.NUMBER },
                                    cartorio: { type: Type.STRING },
                                    data_aquisicao: { type: Type.STRING },
                                    origem_aquisicao: { type: Type.STRING }
                                },
                                required: ['id_declaracao', 'descricao', 'descricao_resumida', 'valor_ir_atual', 'municipio', 'uf']
                            }
                        }
                    }
                });

                const jsonText = response.text || "[]";
                const data = JSON.parse(jsonText);
                return NextResponse.json(data);

            } catch (err: unknown) {
                const errMsg = err instanceof Error ? err.message : 'Unknown AI error';
                const errStatus = (err as { status?: number })?.status || 502;
                lastError = { status: errStatus, text: errMsg };
                console.error(`[IRPF-Extract] Attempt ${attempt + 1}/${MAX_RETRIES} failed:`, errMsg);

                const isRetryable = errMsg.includes('overloaded') || errStatus === 503 || errStatus === 429;
                if (!isRetryable) break;

                if (attempt < MAX_RETRIES - 1) {
                    await sleep(RETRY_DELAY * (attempt + 1));
                }
            }
        }

        return apiError(
            'Falha na API Gemini apos multiplas tentativas',
            lastError?.status || 502,
            'AI_RETRY_EXHAUSTED'
        );

    } catch (error) {
        return handleApiError(error, 'IRPF Extract');
    }
}
