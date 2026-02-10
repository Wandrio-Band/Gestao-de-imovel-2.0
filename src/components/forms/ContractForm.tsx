import React, { useState, useRef, useEffect } from 'react';
import { DatePicker } from '../ai-studio/components/DatePicker';
import { Asset } from '@/components/ai-studio/types';

interface ContractData {
    id?: string;
    assetId?: string;
    contractNumber?: string;
    nomeInquilino: string;
    documentoInquilino: string;
    emailInquilino: string;
    valorAluguel: string;
    diaVencimento: string;
    tipoGarantia: string;
    inicioVigencia: string;
    fimContrato: string;
    indexador: string;
    contractFile?: { name: string; data: string } | null;
}

interface ContractFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: ContractData) => Promise<void>;
    initialData?: ContractData | null;
    assets: Asset[]; // For selection
}

// Helper to format number
const formatNumber = (value: number) => {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export const ContractForm: React.FC<ContractFormProps> = ({ isOpen, onClose, onSave, initialData, assets }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [attachedFile, setAttachedFile] = useState<File | null>(null);

    const [formData, setFormData] = useState<ContractData>({
        nomeInquilino: '',
        documentoInquilino: '',
        emailInquilino: '',
        valorAluguel: '',
        diaVencimento: 'Dia 5',
        tipoGarantia: 'Caução (3x)',
        inicioVigencia: '',
        fimContrato: '',
        indexador: 'IPCA',
        assetId: ''
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...initialData,
                diaVencimento: initialData.diaVencimento.startsWith('Dia') ? initialData.diaVencimento : `Dia ${initialData.diaVencimento}`
            });
        } else {
            // Reset
            setFormData({
                nomeInquilino: '',
                documentoInquilino: '',
                emailInquilino: '',
                valorAluguel: '',
                diaVencimento: 'Dia 5',
                tipoGarantia: 'Caução (3x)',
                inicioVigencia: '',
                fimContrato: '',
                indexador: 'IPCA',
                assetId: ''
            });
        }
        setAttachedFile(null);
    }, [initialData, isOpen]);

    // Format helper
    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    const processContractFile = async (file: File) => {
        setIsAnalyzing(true);
        setAttachedFile(file);

        try {
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
                const textItems = textContent.items.map((item: any) => item.str);
                fullText += textItems.join(' ') + "\n";
            }

            // Extract logic (Simplified for brevity, same as LeaseModal)
            const extractedData: Partial<ContractData> = {};

            // 1. Name
            const nomeMatch = fullText.match(/(?:Locat[áa]rio|Inquilino).*?[:\s]+([A-ZÀ-Ú][a-zA-ZÀ-Ú\s\.\-\&]+?)(?=[,;]|\s+CPF|\s+CNPJ)/i);
            if (nomeMatch) extractedData.nomeInquilino = nomeMatch[1].trim().replace(/^[:\.\s-]+/, '');

            // 2. CPF/CNPJ
            const cpfMatch = fullText.match(/(\d{3}\.\d{3}\.\d{3}-\d{2}|\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})/);
            if (cpfMatch) extractedData.documentoInquilino = cpfMatch[1];

            // 3. Email
            const emailMatch = fullText.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z]+)/);
            if (emailMatch) extractedData.emailInquilino = emailMatch[1];

            // 4. Value
            const valorMatch = fullText.match(/(?:valor|aluguel|loca[çc][ãa]o|mensal).*?R\$\s*([\d\.,]+)/i);
            if (valorMatch) {
                const valorRaw = valorMatch[1];
                let valor = 0;
                if (valorRaw.includes(',')) {
                    valor = parseFloat(valorRaw.replace(/\./g, '').replace(',', '.'));
                } else {
                    valor = parseFloat(valorRaw.replace(/,/g, ''));
                }
                if (!isNaN(valor)) extractedData.valorAluguel = formatNumber(valor);
            }

            // 5. Due Day
            const diaMatch = fullText.match(/vencimento.*?dia\s*(\d+)/i);
            if (diaMatch) extractedData.diaVencimento = `Dia ${diaMatch[1]}`;

            // 6. Start Date
            const inicioSnippet = fullText.match(/(?:in[íi]cio|vig[êe]ncia|prazo).*?(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i);
            if (inicioSnippet) {
                const parts = inicioSnippet[1].split(/[\/\-\.]/);
                const day = parts[0].padStart(2, '0');
                const month = parts[1].padStart(2, '0');
                const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
                extractedData.inicioVigencia = `${year}-${month}-${day}`;
            }

            setFormData(prev => ({ ...prev, ...extractedData }));
            setIsAnalyzing(false);
        } catch (error) {
            console.error('Error processing PDF:', error);
            setIsAnalyzing(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) processContractFile(e.target.files[0]);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) processContractFile(e.dataTransfer.files[0]);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCurrencyInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const rawValue = value.replace(/\D/g, '');
        const floatValue = Number(rawValue) / 100;
        const formatted = formatNumber(floatValue);
        setFormData(prev => ({ ...prev, [name]: formatted }));
    };

    const handleSave = async () => {
        if (!formData.assetId) {
            alert("Selecione um imóvel para o contrato.");
            return;
        }

        setIsSaving(true);
        try {
            let contractFileBase64 = null;
            if (attachedFile) {
                contractFileBase64 = await fileToBase64(attachedFile);
            }

            await onSave({
                ...formData,
                contractFile: contractFileBase64 ? { name: attachedFile?.name || 'contract.pdf', data: contractFileBase64 } : null
            });
            onClose();
        } catch (e) {
            console.error(e);
            alert("Erro ao salvar contrato.");
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl overflow-hidden animate-fade-in-up" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-700 border border-blue-100">
                            <span className="material-symbols-outlined text-2xl">contract</span>
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                                {initialData ? `Editar Contrato ${initialData.contractNumber || ''}` : 'Novo Contrato'}
                            </h2>
                            <p className="text-sm text-gray-500 font-medium">Preencha os dados abaixo</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
                        <span className="material-symbols-outlined text-gray-500">close</span>
                    </button>
                </div>

                <div className="p-8 overflow-y-auto max-h-[80vh] bg-[#f8f9fc]">

                    {/* ASSET SELECTION */}
                    <div className="mb-6">
                        <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Imóvel</label>
                        <div className="relative">
                            <select
                                name="assetId"
                                value={formData.assetId}
                                onChange={handleChange}
                                disabled={!!initialData?.id} // Lock asset if editing existing contract
                                className="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
                            >
                                <option value="" disabled>Selecione um imóvel...</option>
                                {assets.map(asset => (
                                    <option key={asset.id} value={asset.id}>{asset.name}</option>
                                ))}
                            </select>
                            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">expand_more</span>
                        </div>
                    </div>

                    {/* UPLOAD */}
                    {!initialData && (
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
                                <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.doc,.docx" onChange={handleFileSelect} />
                                <div className="p-8 flex flex-col items-center justify-center text-center">
                                    {isAnalyzing ? (
                                        <div className="flex flex-col items-center animate-pulse">
                                            <div className="w-8 h-8 rounded-full border-4 border-blue-200 border-t-primary animate-spin mb-2"></div>
                                            <p className="text-sm font-bold text-primary">Analisando...</p>
                                        </div>
                                    ) : attachedFile ? (
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-green-600">check_circle</span>
                                            <p className="text-sm font-bold text-gray-900">{attachedFile.name}</p>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-gray-400">
                                            <span className="material-symbols-outlined">cloud_upload</span>
                                            <p className="text-sm font-bold">Importar Contrato (PDF) para preenchimento automático</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* FIELDS GRID */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Locatário (Inquilino)</label>
                            <input name="nomeInquilino" value={formData.nomeInquilino} onChange={handleChange} type="text" className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm font-bold text-gray-900 outline-none" placeholder="Nome Completo" />
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2">CPF / CNPJ</label>
                            <input name="documentoInquilino" value={formData.documentoInquilino} onChange={handleChange} type="text" className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm font-bold text-gray-900 outline-none" placeholder="000.000.000-00" />
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Email</label>
                            <input name="emailInquilino" value={formData.emailInquilino} onChange={handleChange} type="email" className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm font-bold text-gray-900 outline-none" placeholder="email@exemplo.com" />
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Valor Aluguel (R$)</label>
                            <input name="valorAluguel" value={formData.valorAluguel} onChange={handleCurrencyInput} type="text" className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm font-bold text-gray-900 outline-none" placeholder="0,00" />
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Dia Vencimento</label>
                            <select name="diaVencimento" value={formData.diaVencimento} onChange={handleChange} className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm font-bold text-gray-900 outline-none">
                                {[1, 5, 10, 15, 20, 25, 30].map(d => <option key={d} value={`Dia ${d}`}>Dia {d}</option>)}
                            </select>
                        </div>

                        <div>
                            <DatePicker label="Início Vigência" value={formData.inicioVigencia} onChange={(val) => setFormData(prev => ({ ...prev, inicioVigencia: val }))} />
                        </div>
                        <div>
                            <DatePicker label="Fim Contrato" value={formData.fimContrato} onChange={(val) => setFormData(prev => ({ ...prev, fimContrato: val }))} />
                        </div>
                    </div>

                </div>

                <div className="p-6 border-t border-gray-100 bg-white flex items-center justify-end gap-3 sticky bottom-0 z-10">
                    <button onClick={onClose} className="px-6 py-3 rounded-full border border-gray-200 text-sm font-bold text-gray-500 hover:bg-gray-50 transition">Cancelar</button>
                    <button onClick={handleSave} disabled={isSaving || isAnalyzing} className="px-8 py-3 rounded-full bg-blue-600 text-white text-sm font-bold shadow-lg hover:bg-blue-700 transition flex items-center gap-2">
                        {isSaving ? 'Salvando...' : 'Salvar Contrato'}
                    </button>
                </div>
            </div>
        </div>
    );
};
