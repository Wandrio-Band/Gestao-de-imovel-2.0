import { GoogleGenAI, Type } from "@google/genai";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
    try {
        console.log("🚀 [AI Extract] POST Request received with @google/genai");
        const body = await req.json();
        const { file, text } = body;

        console.log("📝 [AI Extract] Payload details:", {
            hasFile: !!file,
            fileType: file?.mimeType,
            hasText: !!text,
            textSize: text?.length
        });

        const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

        if (!apiKey) {
            console.error("❌ [AI Extract] GEMINI_API_KEY is missing!");
            return NextResponse.json({ error: "Configuração incompleta: GEMINI_API_KEY ausente." }, { status: 500 });
        }

        const ai = new GoogleGenAI({ apiKey });

        const prompt = `ATENÇÃO: Extração Fiscal de Nota Fiscal de Serviços (NFS-e) ou Comprovante.
         Se houver "=== ANEXO XML DETECTADO ===", USE O CONTEUDO DO XML COMO FONTE PRINCIPAL.
         
         OBJETIVO: Extrair metadados para controle financeiro e IRPF.
         
         1. BENEFICIÁRIO (CRÍTICO - IRPF):
            - O campo 'beneficiario' refere-se ao PACIENTE, ALUNO ou DEPENDENTE que utilizou o serviço.
            - DEVE SER ESTRITAMENTE UM DOS SEGUINTES NOMES (se encontrado):
              A) "Wândrio Bandeira dos Anjos"
              B) "Lucas Massad Bandeira"
              C) "Raquel Dutra Massad"
              D) "Ana Júlia Massad Bandeira"
            - Se encontrar "Lucas" ou "Lucas Massad", retorne "Lucas Massad Bandeira".
            - Se encontrar "Raquel" ou "Raquel Dutra", retorne "Raquel Dutra Massad".
            - Se encontrar "Ana Júlia", "Ana Julia" ou "Júlia Massad", retorne "Ana Júlia Massad Bandeira".
            - Se encontrar "Wândrio" ou "Wandrio", retorne "Wândrio Bandeira dos Anjos".
            - Procure em "Discriminação dos Serviços", "Informações Complementares" ou "Observações".
            - Se não encontrar menção a esses nomes, deixe vazio (null).
         
         2. DADOS CADASTRAIS:
            - TOMADOR: Nome completo, CPF/CNPJ, Endereço, Email e Telefone.
            - EMISSOR: Nome, CNPJ, Telefone.
            - DATA: Formato DD/MM/YYYY.
            - VALOR TOTAL: Valor líquido ou total da nota.

         CATEGORIA DEVE SER UMA DAS: Saúde, Educação, Reforma, Eletrônicos, Outros.`;

        console.log("🤖 [AI Extract] Calling Gemini 3 Flash Preview...");

        const contents = file
            ? [{
                role: 'user',
                parts: [
                    { text: prompt },
                    { inlineData: { mimeType: file.mimeType, data: file.data } }
                ]
            }]
            : [{
                role: 'user',
                parts: [{ text: `${prompt}\n\nCONTENT:\n${text}` }]
            }];

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: contents as any,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        data: { type: Type.STRING },
                        cnpj_cpf_emissor: { type: Type.STRING },
                        nome_emissor: { type: Type.STRING },
                        endereco_emissor: { type: Type.STRING },
                        telefone_emissor: { type: Type.STRING },
                        cidade: { type: Type.STRING },
                        estado: { type: Type.STRING },
                        valor_total: { type: Type.STRING },
                        categoria: { type: Type.STRING },
                        numero_nota: { type: Type.STRING },
                        serie_nota: { type: Type.STRING },
                        beneficiario: { type: Type.STRING },
                        nome_tomador: { type: Type.STRING },
                        cpf_cnpj_tomador: { type: Type.STRING },
                        endereco_tomador: { type: Type.STRING },
                        email_tomador: { type: Type.STRING },
                        telefone_tomador: { type: Type.STRING },
                        items: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    descricao: { type: Type.STRING },
                                    quantidade: { type: Type.STRING },
                                    valor: { type: Type.STRING },
                                    unidade: { type: Type.STRING }
                                }
                            }
                        }
                    },
                    required: ['data', 'nome_emissor', 'valor_total', 'categoria']
                }
            }
        });

        // Use .text directly as in ImportIRPF.tsx
        const responseText = response.text || "{}";
        console.log("✅ [AI Extract] Response received from Gemini 3:", responseText.substring(0, 100) + "...");

        try {
            const parsed = JSON.parse(responseText);
            return NextResponse.json(parsed);
        } catch (parseError) {
            console.error("❌ [AI Extract] JSON Parse Error. Raw text:", responseText);
            return NextResponse.json({
                error: "Falha ao processar resposta da IA: JSON inválido.",
                raw: responseText.substring(0, 500)
            }, { status: 500 });
        }
    } catch (error: any) {
        const errorDetails = {
            message: error.message,
            stack: error.stack,
            cause: error.cause,
            status: error.status,
            name: error.name,
            timestamp: new Date().toISOString(),
            lib: "@google/genai"
        };
        console.error("❌ [AI Extract] Server Error Details:", errorDetails);

        try {
            fs.appendFileSync(path.join(process.cwd(), 'ai-error.log'), JSON.stringify(errorDetails, null, 2) + '\n---\n');
        } catch (logError) {
            console.error("Failed to write to ai-error.log", logError);
        }

        return NextResponse.json({
            error: error.message || "Erro interno no servidor de IA",
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}
