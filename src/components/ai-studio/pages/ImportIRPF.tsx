
import React, { useState, useRef, useEffect } from 'react';
import { ViewState, Asset, ReconciliationItem, IRPFExtractedAsset } from '../types';
import { GoogleGenAI, Type } from "@google/genai";
import * as pdfjsLib from 'pdfjs-dist';
import { IRPFReviewCardList } from './IRPFReviewCardList';
import { IRPFItemReviewModal } from './IRPFItemReviewModal';
import { IRPFAuditDashboard } from './IRPFAuditDashboard';
import { useAssetContext } from '@/context/AssetContext';
import toast from 'react-hot-toast';

interface ImportIRPFProps {
    onNavigate: (view: ViewState, asset?: Asset) => void;
    onUpdateAssets: (assets: Asset[]) => void;
    currentAssets: Asset[];
}

const PARTNERS = ['Raquel', 'Marília', 'Wândrio', 'Tilinha'];
const STORAGE_KEY = 'irpf_import_state_v3';

const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

export const ImportIRPF: React.FC<ImportIRPFProps> = ({ onNavigate, onUpdateAssets, currentAssets }) => {
    const [step, setStep] = useState<'upload' | 'extracting' | 'processing' | 'review' | 'success'>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [selectedPartner, setSelectedPartner] = useState(PARTNERS[0]);
    const [reconciliationList, setReconciliationList] = useState<ReconciliationItem[]>([]);
    const [progress, setProgress] = useState(0);
    const [progressStatus, setProgressStatus] = useState('');

    // Review View Mode: Simple List vs Advanced Audit
    const [reviewViewMode, setReviewViewMode] = useState<'list' | 'dashboard'>('list');

    // State for item-by-item review modal
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [currentReviewIndex, setCurrentReviewIndex] = useState(0);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const { handleUpdateAsset } = useAssetContext();

    // Restore state from localStorage on mount
    useEffect(() => {
        const savedState = localStorage.getItem(STORAGE_KEY);
        if (savedState) {
            try {
                const parsed = JSON.parse(savedState);

                // Only restore if less than 24 hours old
                const age = Date.now() - (parsed.timestamp || 0);
                if (age < 24 * 60 * 60 * 1000) {
                    setReconciliationList(parsed.reconciliationList || []);
                    setSelectedPartner(parsed.selectedPartner || PARTNERS[0]);
                    setStep('review');

                    console.log('🔄 Restored IRPF import state:', {
                        items: parsed.reconciliationList?.length || 0,
                        partner: parsed.selectedPartner,
                        age: Math.round(age / 1000 / 60) + ' minutes ago'
                    });
                } else {
                    // Clear old data
                    localStorage.removeItem(STORAGE_KEY);
                    console.log('🗑️ Cleared old IRPF import state (> 24hrs)');
                }
            } catch (e) {
                console.error('Failed to restore IRPF state:', e);
                localStorage.removeItem(STORAGE_KEY);
            }
        }
    }, []);

    // Save state to localStorage whenever reconciliationList changes
    useEffect(() => {
        if (reconciliationList.length > 0 && step === 'review') {
            const stateToSave = {
                reconciliationList,
                selectedPartner,
                timestamp: Date.now()
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
            console.log('💾 Saved IRPF import state:', reconciliationList.length, 'items');
        }
    }, [reconciliationList, selectedPartner, step]);

    // Safe initialization of PDF Worker
    useEffect(() => {
        try {
            const workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.530/build/pdf.worker.min.mjs`;
            const lib = pdfjsLib as any;
            if (lib.GlobalWorkerOptions) {
                lib.GlobalWorkerOptions.workerSrc = workerSrc;
            } else if (lib.default && lib.default.GlobalWorkerOptions) {
                lib.default.GlobalWorkerOptions.workerSrc = workerSrc;
            }
        } catch (e) {
            console.warn("Could not initialize PDF Worker", e);
        }
    }, []);

    // --- Step A: Extração de Texto (Client-side) ---
    const extractTextFromPDF = async (file: File): Promise<string> => {
        console.log('📄 Iniciando extração PDF:', file.name);
        const arrayBuffer = await file.arrayBuffer();
        console.log('📦 ArrayBuffer size:', arrayBuffer.byteLength);

        // Handle generic import structure
        const lib = (pdfjsLib as any).default || pdfjsLib;

        const pdf = await lib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';

        const numPages = pdf.numPages;
        console.log('📖 Total páginas:', numPages);
        for (let i = 1; i <= numPages; i++) {
            setProgress(Math.round((i / numPages) * 30)); // 0-30%
            setProgressStatus(`Lendo página ${i} de ${numPages}...`);

            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
                .map((item: any) => item.str)
                .join(' ')
                .replace(/\0/g, '')           // Remove caracteres nulos
                .replace(/\s+/g, ' ')          // Normaliza espaços múltiplos
                .trim();
            fullText += pageText + '\n';
        }

        console.log('✅ Texto extraído - Total caracteres:', fullText.length);
        console.log('📝 Primeiros 500 chars:', fullText.substring(0, 500));
        return fullText;
    };

    // --- Step B: Inteligência (Gemini 3 Flash) ---
    const analyzeTextWithGemini = async (text: string): Promise<IRPFExtractedAsset[]> => {
        setProgress(40);
        setProgressStatus('Enviando para Auditoria IA (Gemini 3.0)...');

        try {
            // Read API Key from Next.js environment
            const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

            if (!apiKey) {
                console.warn("API Key missing, using mock data for demo.");
                throw new Error("API Key missing");
            }

            const ai = new GoogleGenAI({ apiKey });

            const slicedText = text.length > 50000 ? text.slice(-50000) : text;

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: `DOCUMENTO: Declaração de Imposto de Renda Pessoa Física (IRPF) - Receita Federal do Brasil

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

OBS: Se não encontrar a seção "BENS E DIREITOS" explicitamente, procure por qualquer menção a imóveis, apartamentos, terrenos ou propriedades declaradas. Retorne TODOS os imóveis encontrados, mesmo que parcialmente preenchidos.`,
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

            setProgress(70);
            setProgressStatus('Estruturando dados...');

            const jsonText = response.text || "[]";
            const data = JSON.parse(jsonText);

            // DEBUG: Log extracted data to console
            console.log('🔍 GEMINI EXTRACTED DATA:', data);
            console.log('📊 Total items extracted:', data.length);
            if (data.length > 0) {
                console.log('📍 First item sample:', {
                    municipio: data[0].municipio,
                    uf: data[0].uf,
                    cep: data[0].cep,
                    logradouro: data[0].logradouro,
                    bairro: data[0].bairro
                });
            }

            return data;

        } catch (error: any) {
            console.error("=== ERRO GEMINI ===");
            console.error(error);
            console.error("=== FIM ERRO ===");

            // Check if it's a 503 overload error
            if (error?.message?.includes('overloaded') || error?.code === 503) {
                throw new Error("API Gemini está temporariamente sobrecarregada. Por favor, aguarde alguns segundos e tente novamente.");
            }

            // For other errors, throw with details
            throw new Error(`Erro ao processar PDF com Gemini: ${error?.message || 'Erro desconhecido'}`);
        }
    };

    // --- Step C: Reconciliação (Heurística) ---
    const reconcileData = (extractedItems: IRPFExtractedAsset[]) => {
        setProgress(90);
        setProgressStatus('Cruzando informações com base de dados...');

        // Helper function to normalize strings for comparison (remove accents, lower case)
        const normalize = (str: string) => {
            if (!str) return '';
            return str
                .toLowerCase()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, "") // Remove accents
                .trim()
                .replace(/[^\w\s]/gi, '') // Remove special chars but keep spaces (and numbers)
                .replace(/\s+/g, ' '); // Normalize spaces
        };

        // Helper function to calculate description similarity
        const calculateDescriptionSimilarity = (pdfDesc: string, assetName: string): number => {
            const pdfLower = normalize(pdfDesc);
            const assetLower = normalize(assetName);

            // Extract meaningful keywords (length >= 2 to include apartment numbers, exclude common words)
            const commonWords = ['com', 'de', 'da', 'do', 'em', 'na', 'no', 'para', 'por', 'uma', 'um', 'o', 'a'];

            const pdfKeywords = pdfLower.split(/\s+/)
                .filter(w => w.length >= 2 && !commonWords.includes(w)); // Changed from > 3 to >= 2
            const assetKeywords = assetLower.split(/\s+/)
                .filter(w => w.length >= 2 && !commonWords.includes(w)); // Changed from > 3 to >= 2

            // Calculate Jaccard similarity (intersection / union)
            const allKeywords = new Set([...pdfKeywords, ...assetKeywords]);
            const commonKeywords = pdfKeywords.filter(k => assetKeywords.includes(k));

            if (allKeywords.size === 0) return 0;

            const similarity = commonKeywords.length / allKeywords.size;

            // Debug log for low similarity cases
            if (similarity < 0.5) {
                console.log(`🔍 Similarity calculation:`, {
                    pdf: pdfDesc,
                    asset: assetName,
                    pdfKeywords,
                    assetKeywords,
                    common: commonKeywords,
                    similarity: (similarity * 100).toFixed(0) + '%'
                });
            }

            return similarity;
        };

        const results: ReconciliationItem[] = extractedItems.map((item, idx) => {
            let bestMatchId = undefined;
            let highestScore = 0;

            currentAssets.forEach(asset => {
                let score = 0;

                // IMPROVED: Geographic scoring instead of hard filter
                // Give points for city/state match, but don't discard if missing
                const cityMatch = item.municipio && asset.city &&
                    normalize(item.municipio) === normalize(asset.city);
                const stateMatch = item.uf && asset.state &&
                    item.uf.toUpperCase() === asset.state.toUpperCase();

                // CRITICAL PRIORITY: CHECK VETO CONDITIONS FIRST
                // If there is a clear mismatch in key identifiers, apply heavy penalty immediately.

                // GOD MODE: Check Matricula Match FIRST
                let bypassVeto = false;
                if (item.matricula && asset.matricula) {
                    const itemMat = item.matricula.replace(/\D/g, '');
                    const assetMat = asset.matricula.replace(/\D/g, '');

                    if (itemMat.length > 2 && assetMat.length > 2 && itemMat === assetMat) {
                        console.log(`✅ ID MATCH: Matricula (${itemMat}) - Bypassing Veto`);
                        score += 2000;
                        bypassVeto = true;
                    }
                }

                if (!bypassVeto) {
                    // 1. Geographic Veto
                    // Use looser "includes" check to avoid vetoing "Porto Velho - RO" vs "Porto Velho"
                    const itemCity = normalize(item.municipio);
                    const assetCity = normalize(asset.city || '');

                    // Only veto if BOTH are present, BOTH are longer than 3 chars, and NEITHER allows the other
                    if (itemCity.length > 3 && assetCity.length > 3) {
                        if (itemCity !== assetCity && !itemCity.includes(assetCity) && !assetCity.includes(itemCity)) {
                            console.log(`⛔ VETO: City Mismatch [${item.descricao_resumida} vs ${asset.name}]`, {
                                pdfCity: itemCity,
                                assetCity: assetCity
                            });
                            score -= 2000; // Nuclear penalty
                        }
                    }

                    if (item.uf && asset.state && item.uf.toUpperCase() !== asset.state.toUpperCase()) {
                        console.log(`⛔ VETO: State Mismatch (${item.uf} vs ${asset.state})`);
                        score -= 2000;
                    }

                    // 2. ID Veto (Matrícula/IPTU)
                    if (item.matricula && asset.matricula) {
                        const itemMat = item.matricula.replace(/\D/g, '');
                        const assetMat = asset.matricula.replace(/\D/g, '');
                        // Only veto if both have valid numbers and they are different
                        if (itemMat.length > 2 && assetMat.length > 2 && itemMat !== assetMat) {
                            score -= 2000;
                            console.log(`⛔ VETO: Matricula Mismatch (${item.matricula} vs ${asset.matricula})`);
                        }
                    }
                    if (item.iptu && asset.iptu) {
                        const itemIptu = item.iptu.replace(/\D/g, '');
                        const assetIptu = asset.iptu.replace(/\D/g, '');
                        // Only veto if both have valid numbers and they are different
                        if (itemIptu.length > 5 && assetIptu.length > 5 && itemIptu !== assetIptu) {
                            score -= 2000;
                            console.log(`⛔ VETO: IPTU Mismatch (${item.iptu} vs ${asset.iptu})`);
                        }
                    }
                }

                // Award points for geographic matches (instead of requiring them)
                if (cityMatch && stateMatch) {
                    score += 50; // RESTORED CONFIDENCE: Exact City+State is a strong indicator
                    console.log(`✅ Geographic match: ${item.municipio}/${item.uf} = ${asset.city}/${asset.state}`);
                } else if (cityMatch && !asset.state) {
                    score += 35;
                    console.log(`⚠️ Partial match: City OK but asset missing state (${item.municipio})`);
                } else if (cityMatch) {
                    // City matches but state differs? Rare but possible (e.g. same name cities). Check later logic.
                    score += 10;
                } else if (!asset.city && !asset.state) {
                    // Asset has no geographic data - allow comparison based on description only
                    console.log(`⚠️ Asset "${asset.name}" missing city/state - will rely on description similarity`);
                } else {
                    // Different cities - logged above in veto
                }

                // NEW: Description similarity check (CRITICAL for same-city properties)
                // Use RESUMIDA (short name) instead of full description for better matching
                const descSimilarity = calculateDescriptionSimilarity(
                    item.descricao_resumida, // Changed from item.descricao
                    asset.name
                );



                // Extract apartment/building numbers for special boost
                const extractAptNumber = (str: string): string | null => {
                    // PRIORITY 1: Match "AP 905", "APTO 905", "APARTAMENTO 1405" (keyword required)
                    let match = str.match(/(?:apto?\.?|apartamento|unidade|loja|sala|lote)\s*(\d{1,5})/i);

                    // PRIORITY 2: Match "Nº 123", "NUMERO 123"
                    if (!match) {
                        match = str.match(/(?:n[º°o]\.?|numero)\s*(\d{1,5})/i);
                    }

                    // REMOVED RISKY FALLBACK: Matching any 3-4 digit number caused false positives with years (2023) and values

                    const number = match ? match[1] : null;

                    if (number) {
                        console.log(`🔢 Extracted unit number from "${str}": ${number}`);
                    }

                    return number;
                };

                const pdfAptNum = extractAptNumber(item.descricao);
                const assetAptNum = extractAptNumber(asset.name);

                console.log(`🔍 Comparing: PDF="${item.descricao_resumida}" vs Asset="${asset.name}"`, {
                    cityMatch,
                    stateMatch,
                    pdfApt: pdfAptNum,
                    assetApt: assetAptNum,
                    aptMatch: pdfAptNum === assetAptNum
                });



                // SPECIAL CASE: If city + apt# match (state optional), consider auto-approve
                // This handles cases like "Apt 905 Porto Velho" where description varies but key identifiers match
                const hasStrongGeographicMatch = cityMatch && (stateMatch || !asset.state);

                if (pdfAptNum && assetAptNum && pdfAptNum === assetAptNum && hasStrongGeographicMatch) {
                    console.log(`✅ AUTO-APPROVED: City+Apt# match (${item.municipio} #${pdfAptNum})`, {
                        pdf: item.descricao_resumida,
                        asset: asset.name,
                        stateMatch: stateMatch ? 'Yes' : asset.state ? 'No' : 'Asset missing state'
                    });
                    // Skip similarity check entirely - proceed with high score
                    score += 100; // High confidence match
                } else if (pdfAptNum && assetAptNum && pdfAptNum !== assetAptNum) {
                    // NEW: Explicit penalty for mismatched unit numbers
                    console.log(`⛔ MISMATCH: Unit numbers differ (${pdfAptNum} vs ${assetAptNum}) - applying penalty`, {
                        pdf: item.descricao_resumida,
                        asset: asset.name
                    });
                    score -= 500; // INCREASED PENALTY from 100 to 500
                } else {
                    // Normal similarity check with boost
                    const aptNumberBoost = (pdfAptNum && assetAptNum && pdfAptNum === assetAptNum) ? 0.5 : 0;
                    const finalSimilarity = descSimilarity + aptNumberBoost;

                    // Reduced threshold from 10% to 5% (to handle very different description lengths)
                    if (finalSimilarity < 0.05) {
                        console.log(`⚠️ Low description similarity (${(finalSimilarity * 100).toFixed(0)}%) - skipping match`, {
                            pdf: item.descricao_resumida,
                            asset: asset.name,
                            city: item.municipio,
                            descSim: (descSimilarity * 100).toFixed(0) + '%',
                            aptBoost: aptNumberBoost > 0 ? '+50% (apt#' + pdfAptNum + ')' : '0%'
                        });
                        return; // Skip this asset, score = 0
                    }

                    // Add description similarity bonus (up to 50 points, including apt boost)
                    score += Math.floor(finalSimilarity * 50);
                }

                // Removed nested Veto logic from here as it is now at the top
                // 1. Identificadores Únicos Matches (Peso 100)
                if (item.matricula && asset.matricula &&
                    item.matricula.replace(/\D/g, '') === asset.matricula.replace(/\D/g, '')) {
                    score += 100;
                }
                if (item.iptu && asset.iptu &&
                    item.iptu.replace(/\D/g, '') === asset.iptu.replace(/\D/g, '')) {
                    score += 100;
                }

                // 2. Address Matching (Peso 50 each)
                if (item.logradouro && asset.street &&
                    normalize(item.logradouro) === normalize(asset.street)) {
                    score += 50;
                }
                if (item.bairro && asset.neighborhood &&
                    normalize(item.bairro) === normalize(asset.neighborhood)) {
                    score += 50;
                }
                if (item.cep && asset.zipCode &&
                    item.cep.replace(/\D/g, '') === asset.zipCode.replace(/\D/g, '')) {
                    score += 40;
                }

                // 3. Building/Unit Number Matching (Peso 30)
                // Only match specific building numbers, not ALL numbers
                const buildingNumber = item.numero || item.complemento;
                if (buildingNumber && asset.number &&
                    buildingNumber.includes(asset.number)) {
                    score += 30;
                }
                if (item.complemento && asset.complement &&
                    normalize(item.complemento).includes(normalize(asset.complement))) {
                    score += 20;
                }

                // 4. Token Matching - REMOVED (Redundant with description similarity and causes false positives)
                // previously score += matches.length * 10;

                // MINIMUM SCORE THRESHOLD:
                // Require at least 40 points to even consider a match.
                // This rigorously filters out weak matches (e.g. just City + 1 word).
                if (score > highestScore && score >= 40) {
                    highestScore = score;
                    bestMatchId = asset.id;
                }
            });



            // Higher thresholds to prevent false positives
            let status: ReconciliationItem['status'] = 'new';
            if (highestScore >= 150) status = 'auto_match';  // High confidence
            else if (highestScore >= 80) status = 'suggestion';  // Medium confidence

            return {
                id: `ext-${idx}`,
                extracted: item,
                matchScore: highestScore,
                matchedAssetId: bestMatchId,
                status: status,
                action: status === 'new' ? 'create' : 'update'
            };
        });

        console.log('🔍 RECONCILIATION RESULTS:', results.map(r => ({
            desc: r.extracted.descricao_resumida,
            desc_len: r.extracted.descricao?.length || 0,
            city: r.extracted.municipio,
            score: r.matchScore,
            status: r.status,
            matchedTo: r.matchedAssetId ? currentAssets.find(a => a.id === r.matchedAssetId)?.name : 'none'
        })));

        setReconciliationList(results);
        setStep('review');
    };

    const processFile = async (file: File) => {
        setFile(file);
        setStep('extracting');

        try {
            const text = await extractTextFromPDF(file);
            setStep('processing');

            try {
                const data = await analyzeTextWithGemini(text);
                reconcileData(data);
            } catch (geminiError: any) {
                console.error('Gemini error:', geminiError);
                setStep('upload');
                alert(`❌ ERRO AO PROCESSAR COM GEMINI\n\n${geminiError.message}\n\n💡 Dica: Se a API está sobrecarregada, aguarde 10-30 segundos e tente novamente.`);
            }
        } catch (err) {
            console.error('PDF extraction error:', err);
            setStep('upload');
            alert('❌ Erro ao extrair texto do PDF. Verifique se o arquivo é um PDF válido.');
        }
    };

    const handleActionChange = (itemId: string, newAction: ReconciliationItem['action'], newMatchId?: string) => {
        setReconciliationList(prev => prev.map(item => {
            if (item.id === itemId) {
                return {
                    ...item,
                    action: newAction,
                    matchedAssetId: newMatchId || item.matchedAssetId
                };
            }
            return item;
        }));
    };
    // Handlers for new card-based review interface
    const handleReviewItem = (item: ReconciliationItem, index: number) => {
        setCurrentReviewIndex(index);
        setReviewModalOpen(true);
    };

    const handleReviewNext = () => {
        if (currentReviewIndex < reconciliationList.length - 1) {
            setCurrentReviewIndex(prev => prev + 1);
        }
    };

    const handleReviewPrevious = () => {
        if (currentReviewIndex > 0) {
            setCurrentReviewIndex(prev => prev - 1);
        }
    };

    const handleReviewSave = async (action: ReconciliationItem['action'], editedData?: Partial<IRPFExtractedAsset>, explicitItem?: ReconciliationItem) => {
        const currentItem = explicitItem || reconciliationList[currentReviewIndex];

        // Safety check
        if (!currentItem) {
            console.error("No item to save");
            return;
        }

        // Handle explicit commit action from Dashboard
        let effectiveAction = action;
        if (action === 'update_commit' as any) {
            effectiveAction = 'update';
        }

        // Update the item with edited data
        const updatedItem = {
            ...currentItem,
            action: effectiveAction,
            extracted: { ...currentItem.extracted, ...editedData }
        };

        // DASHBOARD MODE: Data Edit Only
        // If we are in dashboard mode and this is just a data update (not confirm), update list without side effects
        // We detect this by checking if 'editedData' is present AND it's not a commit action.
        if (reviewViewMode === 'dashboard' && action !== 'update_commit' as any && editedData && Object.keys(editedData).length > 0) {
            console.log('📝 Dashboard Edit - Updating State Only', updatedItem);
            setReconciliationList(prev => prev.map(item => item.id === currentItem.id ? updatedItem : item));
            // Don't save to DB yet, don't remove from list. User will click "Salvar Alterações" globally.
            return;
        }

        console.log('💾 Saving item immediately to database:', effectiveAction, updatedItem);

        // Save to database immediately (if not ignore)
        if (effectiveAction !== 'ignore') {
            try {
                if (effectiveAction === 'update' && updatedItem.matchedAssetId) {
                    // Update existing asset
                    const existingAsset = currentAssets.find(a => a.id === updatedItem.matchedAssetId);
                    if (existingAsset) {
                        const assetToUpdate: Asset = {
                            ...existingAsset,
                            name: updatedItem.extracted.descricao_resumida !== undefined ? updatedItem.extracted.descricao_resumida : existingAsset.name,
                            description: updatedItem.extracted.descricao !== undefined ? updatedItem.extracted.descricao : existingAsset.description,
                            type: (updatedItem.extracted.tipo_ativo ? (updatedItem.extracted.tipo_ativo as Asset['type']) : existingAsset.type),
                            declaredValue: updatedItem.extracted.valor_ir_atual,
                            irpfStatus: 'Declarado',
                            matricula: updatedItem.extracted.matricula || existingAsset.matricula,
                            iptu: updatedItem.extracted.iptu || existingAsset.iptu,
                            registryOffice: updatedItem.extracted.cartorio || existingAsset.registryOffice,
                            street: updatedItem.extracted.logradouro || existingAsset.street,
                            number: updatedItem.extracted.numero || existingAsset.number,
                            complement: updatedItem.extracted.complemento || existingAsset.complement,
                            neighborhood: updatedItem.extracted.bairro || existingAsset.neighborhood,
                            city: updatedItem.extracted.municipio || existingAsset.city,
                            state: updatedItem.extracted.uf || existingAsset.state,
                            zipCode: updatedItem.extracted.cep || existingAsset.zipCode,
                            areaTotal: updatedItem.extracted.area_total || existingAsset.areaTotal,
                            acquisitionDate: updatedItem.extracted.data_aquisicao || existingAsset.acquisitionDate,
                            acquisitionOrigin: updatedItem.extracted.origem_aquisicao || existingAsset.acquisitionOrigin
                        };
                        await handleUpdateAsset(assetToUpdate);
                        console.log('✅ Updated existing asset in database');
                    }
                } else if (action === 'create') {
                    // Create new asset
                    const newAsset: Asset = {
                        id: Date.now().toString() + Math.random(),
                        name: updatedItem.extracted.descricao_resumida || "Novo Ativo Importado",
                        description: updatedItem.extracted.descricao || '', // Initial description
                        address: updatedItem.extracted.descricao ? updatedItem.extracted.descricao.substring(0, 100) + "..." : "",
                        type: 'Residencial',
                        status: 'Vago',
                        value: 0, // Do not copy IRPF value to Acquisition Value
                        marketValue: 0, // Do not copy IRPF value to Market Value
                        declaredValue: updatedItem.extracted.valor_ir_atual,
                        city: updatedItem.extracted.municipio || '',
                        state: updatedItem.extracted.uf || '',
                        street: updatedItem.extracted.logradouro || '',
                        number: updatedItem.extracted.numero || '',
                        complement: updatedItem.extracted.complemento || '',
                        neighborhood: updatedItem.extracted.bairro || '',
                        zipCode: updatedItem.extracted.cep || '',
                        matricula: updatedItem.extracted.matricula,
                        iptu: updatedItem.extracted.iptu,
                        registryOffice: updatedItem.extracted.cartorio,
                        areaTotal: updatedItem.extracted.area_total,
                        acquisitionDate: updatedItem.extracted.data_aquisicao,
                        acquisitionOrigin: updatedItem.extracted.origem_aquisicao,
                        irpfStatus: 'Declarado',
                        partners: [
                            { name: selectedPartner, initials: selectedPartner[0], percentage: 100, color: 'bg-blue-100 text-blue-700' }
                        ],
                        rentalValue: 0,
                        image: ''
                    };

                    console.log('🚨 DEBUG: Creating New Asset - Payload:', JSON.stringify(newAsset, null, 2));

                    if (!newAsset.description) {
                        console.warn('⚠️ WARNING: Description is empty for new asset!');
                    }

                    await handleUpdateAsset(newAsset);
                    console.log('✅ Created new asset in database');
                }
            } catch (error) {
                console.error('❌ Error saving asset:', error);
                toast.error('Erro ao salvar ativo. Tente novamente.');
                return; // Don't remove from list if save failed
            }
        }

        // Remove the processed item from list by ID
        setReconciliationList(prev => {
            const filtered = prev.filter(item => item.id !== currentItem.id);
            // Save updated list to localStorage
            localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
            return filtered;
        });

        // Adjust review index if needed
        // Only adjust if we processed the item currently being viewed in modal
        if (!explicitItem || explicitItem.id === reconciliationList[currentReviewIndex]?.id) {
            if (currentReviewIndex >= reconciliationList.length - 1) {
                // If this was the last item, move back one
                setCurrentReviewIndex(Math.max(0, currentReviewIndex - 1));
            }
            // If not last item, index stays the same (but now points to next item)
        }

        setReviewModalOpen(false);

        // Show success feedback
        console.log('✅ Item saved and removed from pending list');
        toast.success(action === 'ignore' ? 'Item ignorado' : 'Ativo salvo com sucesso!');
    };

    const handleDesvincular = (itemId: string) => {
        setReconciliationList(prev => prev.map(item => {
            if (item.id === itemId) {
                return {
                    ...item,
                    matchedAssetId: undefined,
                    action: 'create',
                    status: 'new'
                };
            }
            return item;
        }));
    };

    const handleClearAll = () => {
        console.log('🧹 handleClearAll called - button clicked!');
        console.log('📋 Current reconciliationList length:', reconciliationList.length);

        console.log('💾 Clearing state...');
        setStep('upload');
        setReconciliationList([]);
        setFile(null);
        localStorage.removeItem(STORAGE_KEY);
        console.log('🗑️ Cleared all items and localStorage');

        toast.success('Lista de importação limpa com sucesso!');
    };


    const handleFinalSave = async () => {
        const toastId = toast.loading('Salvando ativos importados...');

        try {
            let savedCount = 0;
            let updatedCount = 0;

            for (const item of reconciliationList) {
                console.log('🚨 [IRPF] Processing item:', item.action, item.extracted.descricao_resumida);

                if (item.action === 'ignore') {
                    console.log('⏭️ [IRPF] Skipping ignored item');
                    continue;
                }

                if (item.action === 'update' && item.matchedAssetId) {
                    const existingAsset = currentAssets.find(a => a.id === item.matchedAssetId);
                    if (existingAsset) {
                        const updatedAsset: Asset = {
                            ...existingAsset,
                            declaredValue: item.extracted.valor_ir_atual,
                            irpfStatus: 'Declarado',
                            matricula: item.extracted.matricula || existingAsset.matricula,
                            iptu: item.extracted.iptu || existingAsset.iptu,
                            registryOffice: item.extracted.cartorio || existingAsset.registryOffice,
                            street: item.extracted.logradouro || existingAsset.street,
                            number: item.extracted.numero || existingAsset.number,
                            complement: item.extracted.complemento || existingAsset.complement,
                            neighborhood: item.extracted.bairro || existingAsset.neighborhood,
                            city: item.extracted.municipio || existingAsset.city,
                            state: item.extracted.uf || existingAsset.state,
                            zipCode: item.extracted.cep || existingAsset.zipCode,
                            areaTotal: item.extracted.area_total || existingAsset.areaTotal,
                            acquisitionDate: item.extracted.data_aquisicao || existingAsset.acquisitionDate,
                            acquisitionOrigin: item.extracted.origem_aquisicao || existingAsset.acquisitionOrigin,
                            description: item.extracted.descricao !== undefined ? item.extracted.descricao : existingAsset.description,
                        };

                        console.log('🔄 [IRPF] Updating existing asset:', updatedAsset.id, updatedAsset.name);
                        await handleUpdateAsset(updatedAsset);
                        console.log('✅ [IRPF] Updated successfully');
                        updatedCount++;
                    }
                } else if (item.action === 'create') {
                    const newAsset: Asset = {
                        id: Date.now().toString() + Math.random(),
                        name: item.extracted.descricao_resumida || "Novo Ativo Importado",
                        address: item.extracted.descricao ? item.extracted.descricao.substring(0, 100) + "..." : "",
                        description: item.extracted.descricao || '',
                        type: 'Residencial',
                        status: 'Vago',
                        value: 0,
                        marketValue: 0,
                        declaredValue: item.extracted.valor_ir_atual,
                        city: item.extracted.municipio || '',
                        state: item.extracted.uf || '',
                        street: item.extracted.logradouro || '',
                        number: item.extracted.numero || '',
                        complement: item.extracted.complemento || '',
                        neighborhood: item.extracted.bairro || '',
                        zipCode: item.extracted.cep || '',
                        matricula: item.extracted.matricula,
                        iptu: item.extracted.iptu,
                        areaTotal: item.extracted.area_total,
                        acquisitionDate: item.extracted.data_aquisicao,
                        acquisitionOrigin: item.extracted.origem_aquisicao,
                        irpfStatus: 'Declarado',
                        partners: [
                            { name: selectedPartner, initials: selectedPartner[0], percentage: 100, color: 'bg-blue-100 text-blue-700' }
                        ],
                        rentalValue: 0,
                        image: ''
                    };

                    await handleUpdateAsset(newAsset);
                    savedCount++;
                }
            }

            console.log(`🏁 [IRPF] Finished! Created: ${savedCount}, Updated: ${updatedCount}`);
            localStorage.removeItem(STORAGE_KEY);
            console.log('🧹 [IRPF] Cleared localStorage');

            toast.success(`✅ ${savedCount} novos ativos criados, ${updatedCount} atualizados!`, { id: toastId });
            setStep('success');
        } catch (error) {
            console.error('❌ [IRPF] Error in handleFinalSave:', error);
            toast.error('Erro ao salvar ativos. Tente novamente.', { id: toastId });
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#f6f6f8] relative overflow-hidden">

            {/* Dark Header (Terminal Style) - COMPACT */}
            <div className="bg-slate-900 text-white p-4 pb-6 shadow-lg z-10">
                <div className="max-w-[1400px] mx-auto">
                    <div className="flex justify-between items-center mb-3">
                        <button onClick={() => onNavigate('assets_list')} className="text-slate-400 hover:text-white flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors">
                            <span className="material-symbols-outlined text-sm">arrow_back</span> Voltar
                        </button>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                            <span className="text-xs font-mono text-green-400">GEMINI 3.0 FLASH CONNECTED</span>
                        </div>
                    </div>
                    <h1 className="text-2xl font-mono font-bold tracking-tight text-white mb-1">Terminal de Auditoria IRPF</h1>
                    <p className="text-slate-400 text-xs max-w-2xl">
                        Importação automatizada de Declaração de Imposto de Renda. O sistema utiliza OCR e IA para extrair bens, normalizar valores e cruzar com a base patrimonial existente.
                    </p>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto -mt-6 z-20 px-8 pb-12">
                <div className="max-w-[1400px] mx-auto">

                    {/* STEP 1: UPLOAD */}
                    {step === 'upload' && (
                        <div className="bg-white rounded-2xl shadow-xl p-12 text-center border border-gray-200">
                            <div className="max-w-md mx-auto">
                                <div className="mb-8">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Selecione o Titular da Declaração</label>
                                    <div className="flex justify-center gap-2">
                                        {PARTNERS.map(p => (
                                            <button
                                                key={p}
                                                onClick={() => setSelectedPartner(p)}
                                                className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all ${selectedPartner === p ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div
                                    className="border-2 border-dashed border-gray-300 rounded-2xl h-64 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all group"
                                    onClick={() => fileInputRef.current?.click()}
                                    onDragOver={e => e.preventDefault()}
                                    onDrop={e => { e.preventDefault(); if (e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]); }}
                                >
                                    <input type="file" className="hidden" ref={fileInputRef} accept=".pdf" onChange={e => e.target.files && processFile(e.target.files[0])} />
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform text-gray-400 group-hover:text-blue-600">
                                        <span className="material-symbols-outlined text-3xl">upload_file</span>
                                    </div>
                                    <p className="text-lg font-bold text-gray-700">Arraste o PDF da Declaração (Recibo)</p>
                                    <p className="text-sm text-gray-400 mt-1">Processamento Local + Auditoria IA</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: PROCESSING */}
                    {(step === 'extracting' || step === 'processing') && (
                        <div className="bg-white rounded-2xl shadow-xl p-16 text-center border border-gray-200 flex flex-col items-center">
                            <div className="w-20 h-20 relative mb-6">
                                <svg className="animate-spin w-full h-full text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">{progressStatus}</h2>
                            <div className="w-full max-w-lg bg-gray-100 rounded-full h-2 mt-4 overflow-hidden">
                                <div className="bg-blue-600 h-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
                            </div>
                            <p className="text-xs font-mono text-gray-400 mt-4">{file?.name}</p>
                        </div>
                    )}

                    {/* STEP 3: REVIEW (CARD-BASED INTERFACE) */}
                    {step === 'review' && (
                        <div className="flex flex-col h-full">
                            {/* Review Header with Actions */}
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800">Revisão de Ativos</h2>
                                    <p className="text-sm text-slate-500">Confira as associações antes de salvar.</p>
                                </div>
                                <div className="flex gap-3">
                                    <div className="bg-white border p-1 rounded-lg flex items-center shadow-sm">
                                        <button
                                            onClick={() => setReviewViewMode('list')}
                                            className={`px-3 py-1.5 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${reviewViewMode === 'list' ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
                                        >
                                            <span className="material-symbols-outlined text-lg">view_list</span>
                                            Lista Simples
                                        </button>
                                        <button
                                            onClick={() => setReviewViewMode('dashboard')}
                                            className={`px-3 py-1.5 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${reviewViewMode === 'dashboard' ? 'bg-blue-50 text-blue-700' : 'text-slate-400 hover:text-slate-600'}`}
                                        >
                                            <span className="material-symbols-outlined text-lg">dashboard_customize</span>
                                            Auditoria Avançada
                                        </button>
                                    </div>
                                    <button onClick={handleClearAll} className="bg-slate-900 text-white px-6 py-2 rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2">
                                        <span className="material-symbols-outlined">delete_sweep</span>
                                        Limpar Ativos
                                    </button>
                                </div>
                            </div>

                            {/* Content based on View Mode */}
                            {reviewViewMode === 'dashboard' ? (
                                <div className="flex-1 overflow-hidden h-[calc(100vh-220px)] pb-4">
                                    <IRPFAuditDashboard
                                        items={reconciliationList}
                                        assets={currentAssets}
                                        onSave={(item, action, data) => handleReviewSave(action, data, item)}
                                        onNavigateBack={() => setReviewViewMode('list')}
                                    />
                                </div>
                            ) : (
                                <IRPFReviewCardList
                                    items={reconciliationList}
                                    currentAssets={currentAssets}
                                    onReviewItem={handleReviewItem}
                                    onDesvincular={handleDesvincular}
                                    // Removed onClearAll from here since we lifted it to the header
                                    onClearAll={() => { }}
                                />
                            )}
                        </div>
                    )}

                    {reviewModalOpen && reconciliationList[currentReviewIndex] && (
                        <IRPFItemReviewModal
                            item={reconciliationList[currentReviewIndex]}
                            matchedAsset={currentAssets.find(a => a.id === reconciliationList[currentReviewIndex].matchedAssetId) || null}
                            currentIndex={currentReviewIndex}
                            total={reconciliationList.length}
                            onNext={handleReviewNext}
                            onPrevious={handleReviewPrevious}
                            onSave={handleReviewSave}
                            onClose={() => setReviewModalOpen(false)}
                            onDesvincular={handleDesvincular}
                        />
                    )}

                    {/* Footer Actions */}


                    {/* STEP 4: SUCCESS */}
                    {step === 'success' && (
                        <div className="flex flex-col items-center justify-center py-20 animate-fade-in-up">
                            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 text-green-600">
                                <span className="material-symbols-outlined text-6xl">check_circle</span>
                            </div>
                            <h2 className="text-3xl font-black text-gray-900 mb-2">Importação Concluída!</h2>
                            <p className="text-gray-500 mb-8 max-w-md text-center">
                                A base de dados foi atualizada com sucesso. Os valores de IRPF e novos ativos foram registrados.
                            </p>
                            <button onClick={() => onNavigate('assets_list')} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:bg-black transition-all">
                                Ver Meus Ativos
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div >
    );
};

export default ImportIRPF;
