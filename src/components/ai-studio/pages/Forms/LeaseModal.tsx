import React, { useState, useRef } from 'react';
import { DatePicker } from '../../components/DatePicker';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Record<string, unknown>) => void;
}

// Helper para formatar apenas o número (sem R$)
const formatNumber = (value: number) => {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export const LeaseModal: React.FC<ModalProps> = ({ isOpen, onClose, onSave }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [attachedFile, setAttachedFile] = useState<File | null>(null);

    const [formData, setFormData] = useState({
        nomeInquilino: '',
        documentoInquilino: '',
        emailInquilino: '',
        valorAluguel: '',
        diaVencimento: 'Dia 5',
        tipoGarantia: 'Caução (3x)',
        inicioVigencia: '',
        fimContrato: '',
        indexador: 'IPCA'
    });

    // Helper para converter arquivo para Base64
    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    // Função REAL de Extração de Dados via PDF
    const processContractFile = async (file: File) => {
        setIsAnalyzing(true);
        setAttachedFile(file);

        try {
            // Extract text from PDF
            const pdfjsLib = await import('pdfjs-dist');
            pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
                'pdfjs-dist/build/pdf.worker.min.mjs',
                import.meta.url
            ).toString();

            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

            let fullText = "";
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();

                // Smart Reconstruction based on coordinates
                let lastX = -100;
                let lastY = -100;
                let lastWidth = 0;
                let pageText = "";

                // Sort items by Y (desc) then X (asc) to ensure reading order
                // usually pdfjs returns them correctly but not always
                const items = textContent.items.map((item: { str: string; transform: number[]; width: number; height: number }) => ({
                    str: item.str,
                    x: item.transform[4],
                    y: item.transform[5],
                    w: item.width,
                    h: item.height
                })); // .sort? Trust default order for now as sorting is complex (multi-column)

                for (const item of items) {
                    // New line detection (Y difference > height or threshold)
                    if (lastY !== -100 && Math.abs(item.y - lastY) > (item.h || 5)) {
                        pageText += "\n";
                        lastX = -100; // Reset X for new line
                    }
                    // formatting: add space if distance from last char > threshold
                    else if (lastX !== -100) {
                        const dist = item.x - (lastX + lastWidth);
                        // If distance is positive and significant (e.g. > 1 or 2pt), add space
                        // But for "spaced out" text, the distance might be very small or effectively zero if they are just kerning
                        // Standard space is usually 3-5 pt depending on font size. Kerning is < 1.
                        if (dist > 2) {
                            pageText += " ";
                        }
                    }

                    pageText += item.str;

                    lastX = item.x;
                    lastY = item.y;
                    lastWidth = item.w;
                }

                fullText += pageText + "\n";
            }

            // Extract data using regex patterns
            const extractedData: Record<string, string | number | null> = {
                nomeInquilino: '',
                documentoInquilino: '',
                emailInquilino: '',
                valorAluguel: '',
                diaVencimento: 'Dia 5',
                tipoGarantia: 'Caução (3x)',
                inicioVigencia: '',
                fimContrato: '',
                indexador: 'IPCA'
            };

            // 1. Nome (Improved Regex)
            // Ensure we match "Locatário" as a distinct word start to avoid mid-word matches (unlikely but safe)
            // Case-Insensitive partial match for Locatario/Inquilino
            const nomeRegex = /(?:Locat[áa]rio|Inquilino).*?[:\s]+([A-ZÀ-Ú][a-zA-ZÀ-Ú\s\.\-\&]+?)(?=[,;]|\s+CPF|\s+CNPJ|\s+Brasileiro|\n|Endereço|Residente)/i;
            const nomeMatch = fullText.match(nomeRegex);

            let locatarioIndex = 0;

            if (nomeMatch) {
                let name = nomeMatch[1].trim();
                locatarioIndex = nomeMatch.index || 0;

                // Cleanup common OCR/Regex noise
                name = name.replace(/^[:\.\s-]+/, '');

                // Filter out likely legal text mismatches
                if (name.length < 60 && !name.toLowerCase().includes("não terá") && !name.toLowerCase().includes("deverá")) {
                    extractedData.nomeInquilino = name;
                }
            }

            // 2. CPF/CNPJ (Context Aware)
            // Only search AFTER the name found.
            // If name not found, DO NOT search (to avoid Landlord CPF).
            if (extractedData.nomeInquilino && locatarioIndex > 0) {
                const textAfterName = fullText.slice(locatarioIndex);
                const cpfMatch = textAfterName.match(/(\d{3}\.\d{3}\.\d{3}-\d{2}|\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})/);
                if (cpfMatch) {
                    extractedData.documentoInquilino = cpfMatch[1];
                }
            }

            // 3. Email (Context Aware)
            // Use same context as CPF
            if (extractedData.nomeInquilino && locatarioIndex > 0) {
                const textAfterName = fullText.slice(locatarioIndex);
                const emailMatch = textAfterName.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z]+)/);
                if (emailMatch) {
                    extractedData.emailInquilino = emailMatch[1];
                }
            }

            // 4. Valor do aluguel (Improved Regex - Lazy Match)
            // Finds "valor/aluguel", scans forward until "R$", then captures digits
            const valorMatch = fullText.match(/(?:valor|aluguel|loca[çc][ãa]o|mensal).*?R\$\s*([\d\.,]+)/i);
            if (valorMatch) {
                const valorRaw = valorMatch[1];
                // Handle "2.500,00" -> 2500.00 | "1,200.00" -> 1200.00
                // Assumption: If it has comma, comma is decimal. If only dots, dots are thousands?
                // Standard BR: '.' thousand, ',' decimal.
                let valor = 0;
                if (valorRaw.includes(',')) {
                    valor = parseFloat(valorRaw.replace(/\./g, '').replace(',', '.'));
                } else {
                    // Maybe US format? or integer "2500"
                    valor = parseFloat(valorRaw.replace(/,/g, ''));
                }

                if (!isNaN(valor)) {
                    extractedData.valorAluguel = valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
                }
            }

            // 5. Dia do vencimento
            const diaMatch = fullText.match(/vencimento.*?dia\s*(\d+)/i);
            if (diaMatch) extractedData.diaVencimento = `Dia ${diaMatch[1]}`;

            // 6. Data início (Flexible Date Match)
            // Context aware: Look for dates near "Início", "Vigência", or simply the first date mentioned in Clause 3 or similar
            const inicioSnippet = fullText.match(/(?:in[íi]cio|vig[êe]ncia|prazo).*?(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i);

            let startDateObj: Date | null = null;

            if (inicioSnippet) {
                const parts = inicioSnippet[1].split(/[\/\-\.]/);
                // Assume DD/MM/YYYY
                const day = parseInt(parts[0]);
                const month = parseInt(parts[1]) - 1; // Month is 0-indexed in JS
                const yearStr = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
                const year = parseInt(yearStr);

                extractedData.inicioVigencia = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                startDateObj = new Date(year, month, day);
            }

            // 7. Data fim OR Duration Calculation
            const fimSnippet = fullText.match(/(?:fim|t[ée]rmino|final).*?(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i);
            if (fimSnippet) {
                const parts = fimSnippet[1].split(/[\/\-\.]/);
                const day = parts[0].padStart(2, '0');
                const month = parts[1].padStart(2, '0');
                const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
                extractedData.fimContrato = `${year}-${month}-${day}`;
            } else if (startDateObj) {
                // If NO specific end date found, try to find DURATION (e.g., "30 meses", "12 meses")
                const durationMatch = fullText.match(/(?:prazo|dura[çc][ãa]o|vig[êe]ncia|per[íi]odo).*?(\d+)\s*(?:meses|ano)/i);
                if (durationMatch) {
                    let months = parseInt(durationMatch[1]);
                    // Heuristic: If number is small (<5) and word is "ano" or "anos", convert to months
                    const isYears = /anos?/i.test(durationMatch[0]); // Check the full match content for "ano"
                    if (isYears) {
                        months = months * 12;
                    }

                    if (months > 0 && months < 120) { // Safety limit: 120 months (10 years)
                        const endDate = new Date(startDateObj);
                        endDate.setMonth(endDate.getMonth() + months);

                        // Fix for month overflow behavior (e.g. starting Jan 31 + 1 month -> Feb 28/29)
                        // JS Date auto-corrects to March 2/3 if day doesn't exist, we might want last day of month
                        // But standard Date add is "acceptable" for estimation.

                        const endDay = String(endDate.getDate()).padStart(2, '0');
                        const endMonth = String(endDate.getMonth() + 1).padStart(2, '0');
                        const endYear = endDate.getFullYear();
                        extractedData.fimContrato = `${endYear}-${endMonth}-${endDay}`;

                    }
                }
            }

            // Tipo de garantia
            if (/cau[çc][ãa]o/i.test(fullText)) {
                const caucaoMatch = fullText.match(/cau[çc][ãa]o[:\s]*([0-9]+)/i);
                extractedData.tipoGarantia = caucaoMatch ? `Caução (${caucaoMatch[1]}x)` : 'Caução (3x)';
            } else if (/seguro\s+fian[çc]a/i.test(fullText)) {
                extractedData.tipoGarantia = 'Seguro Fiança';
            } else if (/fiador/i.test(fullText)) {
                extractedData.tipoGarantia = 'Fiador';
            }

            // Indexador
            if (/IGPM/i.test(fullText)) extractedData.indexador = 'IGPM';
            else if (/IPCA/i.test(fullText)) extractedData.indexador = 'IPCA';

            setFormData(prev => ({ ...prev, ...extractedData }));
            setIsAnalyzing(false);
        } catch (error) {
            console.error('Erro ao processar PDF:', error);
            alert('Erro ao processar contrato. Preencha manualmente.');
            setIsAnalyzing(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            processContractFile(e.target.files[0]);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processContractFile(e.dataTransfer.files[0]);
        }
    };

    const handleRemoveFile = (e: React.MouseEvent) => {
        e.stopPropagation();
        setAttachedFile(null);
        // Limpa os dados ao remover o arquivo para evitar confusão
        setFormData({
            nomeInquilino: '',
            documentoInquilino: '',
            emailInquilino: '',
            valorAluguel: '',
            diaVencimento: 'Dia 5',
            tipoGarantia: 'Caução (3x)',
            inicioVigencia: '',
            fimContrato: '',
            indexador: 'IPCA'
        });
    };

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Handler para inputs monetários
    const handleCurrencyInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        // Remove tudo que não é dígito
        const rawValue = value.replace(/\D/g, '');
        // Converte para float (ex: 1234 -> 12.34)
        const floatValue = Number(rawValue) / 100;
        // Formata para exibição
        const formatted = formatNumber(floatValue);
        setFormData(prev => ({ ...prev, [name]: formatted }));
    };

    const handleSave = async () => {
        let contractFileBase64 = null;
        if (attachedFile) {
            try {
                contractFileBase64 = await fileToBase64(attachedFile);
                // We can append metadata like name if needed, but simple string for now
                // or maybe object { name: ..., data: ... }? The Action expects simple string or JSON.
                // Let's stick to what actions/assets.ts expects: generic JSON.
            } catch (err) {
                console.error("Error converting file", err);
                alert("Erro ao salvar arquivo do contrato.");
                return;
            }
        }

        onSave({
            ...formData,
            contractFile: contractFileBase64 ? { name: attachedFile?.name, data: contractFileBase64 } : null
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            <div
                className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl overflow-hidden animate-fade-in-up"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-700 border border-green-100">
                            <span className="material-symbols-outlined text-2xl">real_estate_agent</span>
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Novo Contrato de Locação</h2>
                            <p className="text-sm text-gray-500 font-medium">Apto 402 - Ed. Horizon</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
                        <span className="material-symbols-outlined text-gray-500">close</span>
                    </button>
                </div>

                <div className="p-8 overflow-y-auto max-h-[80vh] bg-[#f8f9fc]">

                    {/* IMPORT SECTION */}
                    <div className="mb-8">
                        <div
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleDrop}
                            onClick={() => !attachedFile && fileInputRef.current?.click()}
                            className={`
                       relative rounded-[2rem] border-2 border-dashed transition-all duration-300 cursor-pointer overflow-hidden
                       ${isAnalyzing ? 'border-primary bg-blue-50/50' : ''}
                       ${attachedFile ? 'border-green-200 bg-green-50/30' : 'border-gray-300 hover:border-primary hover:bg-white'}
                   `}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept=".pdf,.doc,.docx"
                                onChange={handleFileSelect}
                            />

                            <div className="p-8 flex flex-col items-center justify-center text-center">
                                {isAnalyzing ? (
                                    <div className="flex flex-col items-center animate-pulse">
                                        <div className="w-12 h-12 rounded-full border-4 border-blue-200 border-t-primary animate-spin mb-4"></div>
                                        <h3 className="text-lg font-bold text-primary">Analisando Contrato com IA...</h3>
                                        <p className="text-sm text-blue-400">Extraindo cláusulas, valores e datas do arquivo <span className="font-bold">{attachedFile?.name}</span></p>
                                    </div>
                                ) : attachedFile ? (
                                    <div className="flex items-center justify-between w-full max-w-lg">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600">
                                                <span className="material-symbols-outlined text-2xl">description</span>
                                            </div>
                                            <div className="text-left">
                                                <h3 className="text-sm font-bold text-gray-900">{attachedFile.name}</h3>
                                                <p className="text-xs text-green-600 font-bold flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-xs">check_circle</span>
                                                    Dados Extraídos com Sucesso
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleRemoveFile}
                                            className="px-4 py-2 bg-white border border-gray-200 text-gray-500 text-xs font-bold rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-colors"
                                        >
                                            Remover
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-4 group-hover:bg-blue-50 group-hover:text-primary transition-colors">
                                            <span className="material-symbols-outlined text-3xl">cloud_upload</span>
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-1">Importar Contrato (PDF/DOC)</h3>
                                        <p className="text-sm text-gray-500 max-w-md">
                                            Arraste seu arquivo aqui ou clique para selecionar.
                                            <span className="text-primary font-bold"> Nossa IA preencherá o formulário automaticamente.</span>
                                        </p>
                                    </>
                                )}
                            </div>

                            {/* Background decoration */}
                            {!attachedFile && !isAnalyzing && (
                                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                                    <span className="material-symbols-outlined text-9xl text-gray-400">article</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Inquilino Section */}
                    <div className="mb-8">
                        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-4">
                            <span className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-xs">1</span>
                            Dados do Inquilino
                        </h3>
                        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Nome Completo / Razão Social</label>
                                <input
                                    name="nomeInquilino"
                                    value={formData.nomeInquilino}
                                    onChange={handleChange}
                                    type="text"
                                    placeholder="Ex: João da Silva ou Empresa LTDA"
                                    className={`w-full bg-gray-50 border-none rounded-xl p-4 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-primary/20 transition-all ${isAnalyzing ? 'animate-pulse bg-gray-100' : ''}`}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2">CPF / CNPJ</label>
                                <input
                                    name="documentoInquilino"
                                    value={formData.documentoInquilino}
                                    onChange={handleChange}
                                    type="text"
                                    placeholder="000.000.000-00"
                                    className={`w-full bg-gray-50 border-none rounded-xl p-4 text-sm font-bold text-gray-900 outline-none transition-all ${isAnalyzing ? 'animate-pulse bg-gray-100' : ''}`}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Email de Contato</label>
                                <input
                                    name="emailInquilino"
                                    value={formData.emailInquilino}
                                    onChange={handleChange}
                                    type="email"
                                    placeholder="email@exemplo.com"
                                    className={`w-full bg-gray-50 border-none rounded-xl p-4 text-sm font-bold text-gray-900 outline-none transition-all ${isAnalyzing ? 'animate-pulse bg-gray-100' : ''}`}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Contrato Section */}
                    <div className="mb-8">
                        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-4">
                            <span className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-xs">2</span>
                            Termos do Contrato
                        </h3>
                        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Valor do Aluguel</label>
                                    <div className={`flex items-center gap-2 bg-gray-50 rounded-xl p-4 border border-transparent focus-within:border-primary/50 focus-within:bg-white transition-all ${isAnalyzing ? 'animate-pulse bg-gray-100' : ''}`}>
                                        <span className="text-sm font-bold text-gray-400">R$</span>
                                        <input
                                            name="valorAluguel"
                                            value={formData.valorAluguel}
                                            onChange={handleCurrencyInput}
                                            type="text"
                                            placeholder="0,00"
                                            className="w-full bg-transparent border-none text-lg font-black text-gray-900 outline-none placeholder-gray-300"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Dia Vencimento</label>
                                    <select
                                        name="diaVencimento"
                                        value={formData.diaVencimento}
                                        onChange={handleChange}
                                        className="w-full bg-gray-50 border-none rounded-xl p-4 text-sm font-bold text-gray-900 outline-none cursor-pointer"
                                    >
                                        <option>Dia 1</option>
                                        <option>Dia 4</option>
                                        <option>Dia 5</option>
                                        <option>Dia 10</option>
                                        <option>Dia 15</option>
                                        <option>Dia 20</option>
                                        <option>Dia 25</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Garantia</label>
                                    <select
                                        name="tipoGarantia"
                                        value={formData.tipoGarantia}
                                        onChange={handleChange}
                                        className={`w-full bg-gray-50 border-none rounded-xl p-4 text-sm font-bold text-gray-900 outline-none cursor-pointer ${isAnalyzing ? 'animate-pulse bg-gray-100' : ''}`}
                                    >
                                        <option>Caução (1x)</option>
                                        <option>Caução (3x)</option>
                                        <option>Fiador</option>
                                        <option>Seguro Fiança</option>
                                        <option>Capitalização</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                <div>
                                    <DatePicker
                                        label="Início da Vigência"
                                        value={formData.inicioVigencia}
                                        onChange={(val) => setFormData(prev => ({ ...prev, inicioVigencia: val }))}
                                    />
                                </div>
                                <div>
                                    <DatePicker
                                        label="Fim do Contrato (Previsão)"
                                        value={formData.fimContrato}
                                        onChange={(val) => setFormData(prev => ({ ...prev, fimContrato: val }))}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Indexador Section */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-4">
                            <span className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-xs">3</span>
                            Reajuste
                        </h3>
                        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-6">
                            <div className="flex-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Índice de Reajuste Anual</label>
                                <div className="flex gap-4">
                                    <label className={`flex items-center gap-2 cursor-pointer p-3 rounded-xl border transition-all ${formData.indexador === 'IPCA' ? 'border-primary bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                                        <input
                                            type="radio"
                                            name="indexador"
                                            value="IPCA"
                                            checked={formData.indexador === 'IPCA'}
                                            onChange={handleChange}
                                            className="accent-primary"
                                        />
                                        <span className={`text-sm font-bold ${formData.indexador === 'IPCA' ? 'text-primary' : 'text-gray-600'}`}>IPCA (IBGE)</span>
                                    </label>
                                    <label className={`flex items-center gap-2 cursor-pointer p-3 rounded-xl border transition-all ${formData.indexador === 'IGPM' ? 'border-primary bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                                        <input
                                            type="radio"
                                            name="indexador"
                                            value="IGPM"
                                            checked={formData.indexador === 'IGPM'}
                                            onChange={handleChange}
                                            className="accent-primary"
                                        />
                                    </label>
                                </div>
                            </div>
                            <div className="w-px h-16 bg-gray-100"></div>
                            <div className="flex-1">
                                <p className="text-xs text-gray-500 mb-1">Próximo Reajuste Estimado</p>
                                <p className="text-lg font-black text-gray-900">
                                    {(() => {
                                        if (!formData.inicioVigencia || !formData.valorAluguel) return '--/--';

                                        try {
                                            // 1. Calculate Next Date
                                            const [year, month, day] = formData.inicioVigencia.split('-').map(Number);
                                            const startDate = new Date(year, month - 1, day);
                                            const today = new Date();

                                            // Find next anniversary
                                            let nextDate = new Date(startDate);
                                            nextDate.setFullYear(startDate.getFullYear() + 1);

                                            while (nextDate < today) {
                                                nextDate.setFullYear(nextDate.getFullYear() + 1);
                                            }

                                            const dateStr = nextDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });

                                            // 2. Calculate Estimated Value
                                            // Mock Rates: IPCA ~4.62%, IGPM ~0.50% (Recent 12m trends vary, using safe estimates)
                                            // In a real app, this should fetch recent 12m accumulated indices.
                                            // Using generic projections: IPCA 4.5%, IGPM 4.0%
                                            const rate = formData.indexador === 'IGPM' ? 0.04 : 0.045;

                                            const currentVal = parseFloat(formData.valorAluguel.replace(/\./g, '').replace(',', '.'));
                                            const newVal = currentVal * (1 + rate);
                                            const newValStr = newVal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

                                            return (
                                                <span className="flex flex-col">
                                                    <span>{newValStr}</span>
                                                    <span className="text-[10px] font-medium text-gray-400">
                                                        em {dateStr} (aprox. {(rate * 100).toFixed(1)}%)
                                                    </span>
                                                </span>
                                            );
                                        } catch (e) {
                                            return '--/--';
                                        }
                                    })()}
                                </p>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-gray-100 bg-white flex items-center justify-end gap-3 sticky bottom-0 z-10">
                    <button onClick={onClose} className="px-6 py-3 rounded-full border border-gray-200 text-sm font-bold text-gray-500 hover:bg-gray-50 transition">Cancelar</button>
                    <button
                        onClick={handleSave}
                        disabled={isAnalyzing}
                        className={`px-8 py-3 rounded-full text-white text-sm font-bold shadow-lg shadow-blue-200 transition flex items-center gap-2 ${isAnalyzing ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-blue-700'}`}
                    >
                        <span className="material-symbols-outlined text-sm">save</span>
                        <span>Salvar Contrato</span>
                    </button>
                </div>
            </div>
        </div >
    );
};