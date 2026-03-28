
import React, { useState, useEffect } from 'react';
import { Asset, ReconciliationItem, IRPFExtractedAsset } from '../types';

interface IRPFAuditDashboardProps {
    items: ReconciliationItem[];
    assets: Asset[];
    onSave: (item: ReconciliationItem, action: ReconciliationItem['action'], data?: Partial<IRPFExtractedAsset>) => void;
    onNavigateBack: () => void;
}

export const IRPFAuditDashboard: React.FC<IRPFAuditDashboardProps> = ({ items, assets, onSave, onNavigateBack }) => {
    // Asset Types for dropdown
    const ASSET_TYPES = ['Apartamento', 'Casa', 'Flat', 'Terreno', 'Sala', 'Loja', 'Galpão', 'Prédio', 'Rural', 'Outro'];

    // State to track selected item ID
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

    // State to track ignored fields per item: { itemId: ['field1', 'field2'] }
    const [ignoredFieldsMap, setIgnoredFieldsMap] = useState<Record<string, string[]>>({});

    // Effect to select first item on load if none selected
    // Effect to select first item on load if none selected OR if selected item was removed
    useEffect(() => {
        // Check if currently selected item still exists in the list
        const isValidParams = selectedItemId && items.some(i => i.id === selectedItemId);

        if (!isValidParams && items.length > 0) {
            // If selection is invalid/empty but we have items, select the first one
            setSelectedItemId(items[0].id);
        } else if (items.length === 0) {
            setSelectedItemId(null);
        }
    }, [items, selectedItemId]);

    // Derived state
    const selectedItem = items.find(i => i.id === selectedItemId);
    const matchedAsset = selectedItem?.matchedAssetId
        ? assets.find(a => a.id === selectedItem.matchedAssetId)
        : null;

    // Helper to format currency
    const formatBRL = (val: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    // Toggle field ignore status
    const toggleFieldIgnore = (fieldKey: string) => {
        if (!selectedItemId) return;

        setIgnoredFieldsMap(prev => {
            const currentIgnored = prev[selectedItemId] || [];
            if (currentIgnored.includes(fieldKey)) {
                return { ...prev, [selectedItemId]: currentIgnored.filter(f => f !== fieldKey) };
            } else {
                return { ...prev, [selectedItemId]: [...currentIgnored, fieldKey] };
            }
        });
    };

    // Component for Field Comparison with Toggle and Edit
    const FieldComparisonInput = ({
        label,
        fieldKey,
        pdfValue,
        systemValue,
        type = 'text',
        options = [] // For select type
    }: {
        label: string,
        fieldKey: string,
        pdfValue: string | number | null,
        systemValue: string | number | null,
        type?: 'text' | 'money' | 'textarea' | 'select',
        options?: string[]
    }) => {
        const isDifferent = String(pdfValue || '').trim().toLowerCase() !== String(systemValue || '').trim().toLowerCase();

        const isIgnored = selectedItemId ? (ignoredFieldsMap[selectedItemId] || []).includes(fieldKey) : false;

        // Local state for editing could be here, but for simplicity we rely on parent update via onBlur/onChange logic
        // Actually, we need to lift the change handler.
        const handleLocalChange = (newValue: string | number) => {
            if (!selectedItem) return;
            onSave(selectedItem, 'update', { [fieldKey]: newValue });
        };

        return (
            <div className={`flex items-start gap-4 py-2 px-4 transition-all rounded-xl my-1 ${isDifferent && !isIgnored ? 'bg-orange-50 border border-orange-200' :
                isIgnored ? 'opacity-60 bg-gray-50 border border-gray-100' :
                    'hover:bg-gray-50/50 border border-transparent'
                }`}>
                {/* 1. Label Column */}
                <div className="w-32 flex flex-col justify-start pt-2 shrink-0">
                    <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wide mb-1 block leading-tight">{label}</span>

                    {/* Status Badges */}
                    {isDifferent && !isIgnored && <span className="bg-orange-100 text-orange-600 text-[9px] font-bold px-1.5 py-0.5 rounded w-fit mt-1 border border-orange-200 block mb-1">DIVERGENTE</span>}
                    {isDifferent && isIgnored && <span className="bg-gray-200 text-gray-500 text-[9px] font-bold px-1.5 py-0.5 rounded w-fit mt-1 border border-gray-300 block mb-1">IGNORADO</span>}
                </div>

                {/* 2. System Value Box */}
                <div className="flex-1 bg-white border border-blue-200 rounded-lg p-2 relative group shadow-sm flex items-center min-h-[40px]">
                    <div className={`w-full text-xs font-medium text-slate-500 ${type === 'textarea' ? 'max-h-[160px] overflow-y-auto whitespace-pre-wrap leading-relaxed' : ''}`}>
                        {systemValue ? (type === 'money' ? formatBRL(Number(systemValue)) : systemValue) : <span className="text-slate-300 italic opacity-50">Vazio</span>}
                    </div>
                </div>

                {/* 3. Arrow Action */}
                <div className="flex flex-col items-center justify-center px-1 self-center">
                    <button
                        onClick={() => toggleFieldIgnore(fieldKey)}
                        disabled={!isDifferent}
                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${isDifferent ? 'bg-orange-100 text-orange-600 hover:scale-110 shadow-sm' : 'text-slate-300'}`}
                    >
                        <span className="material-symbols-outlined text-sm">{isDifferent ? (isIgnored ? 'close' : 'arrow_forward') : 'check'}</span>
                    </button>
                </div>

                {/* 4. PDF Value Box (Editable) */}
                <div className={`flex-1 rounded-lg p-1 relative border transition-all shadow-sm flex items-center min-h-[40px] ${isDifferent
                    ? (isIgnored ? 'bg-gray-100 border-gray-200 opacity-60' : 'bg-white border-orange-300 shadow-md ring-1 ring-orange-100')
                    : 'bg-orange-50/30 border-orange-200'
                    }`}>
                    {type === 'select' ? (
                        <div className="w-full">
                            <select
                                value={pdfValue || ''}
                                onChange={(e) => handleLocalChange(e.target.value)}
                                className="w-full text-xs font-bold text-slate-900 bg-transparent border-none focus:ring-0 p-1 cursor-pointer"
                            >
                                <option value="">Selecione...</option>
                                {options?.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>
                    ) : type === 'textarea' ? (
                        <textarea
                            value={pdfValue || ''}
                            onChange={(e) => handleLocalChange(e.target.value)}
                            className="w-full text-xs font-bold text-slate-900 bg-transparent border-none focus:ring-0 p-1 min-h-[150px] resize-y leading-relaxed"
                            placeholder="Vazio"
                        />
                    ) : (
                        <input
                            type={type === 'money' ? 'text' : 'text'} // Use text for money to allow formatting
                            value={type === 'money' ? formatBRL(Number(pdfValue || 0)) : (pdfValue || '')}
                            onChange={(e) => {
                                if (type === 'money') {
                                    // Currency Mask Logic
                                    const rawValue = e.target.value.replace(/\D/g, ''); // strip non-digits
                                    const numberValue = rawValue ? Number(rawValue) / 100 : 0;
                                    handleLocalChange(numberValue);
                                } else {
                                    handleLocalChange(e.target.value);
                                }
                            }}
                            className={`w-full text-xs font-bold text-slate-900 bg-transparent border-none focus:ring-0 p-1 ${type === 'money' ? 'text-right' : ''}`} // Right align money
                            placeholder={type === 'money' ? 'R$ 0,00' : 'Vazio'}
                        />
                    )}
                </div>
            </div>
        );
    };

    // Global Comparison Header
    const ComparisonHeader = () => (
        <div className="flex items-center gap-4 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 border-b border-slate-100 pb-2">
            <div className="w-32 opacity-0">Label</div>
            <div className="flex-1 pl-1 text-blue-400">No Sistema</div>
            <div className="w-8"></div>
            <div className="flex-1 pl-1 text-orange-400">Final (PDF)</div>
        </div>
    );

    // Helper to extract smart summary from description
    const getSmartSummary = (extracted: IRPFExtractedAsset, existingSummary?: string) => {
        const description = extracted.descricao || "";
        if (!description && !existingSummary) return "Item sem descrição";

        const descLower = description.toLowerCase();

        // 1. Try to find Unit (Apto, Apt, Ap)
        // Updated Jan 23: Handle "NR", "N", "Nº" (e.g. "APARTAMENTO NR 1003")
        const unitMatch = descLower.match(/(?:apto|apt|ap|apartamento)(?:[\s.]+(?:nr|n|nº|no))?[\s.]*(\d+)/i);
        const unit = unitMatch ? `Apt ${unitMatch[1]}` : '';

        // 2. Try to find Building/Condo (Ed, Cond, Res)
        // Matches "Ed. Name", "Cond. Name" until a comma, dash or end of string
        // Captures FULL phrase (Group 1) e.g. "Edificio Rio Claro" (Jan 23 Fix: Include Prefix)
        const buildingMatch = descLower.match(/((?:edifício|edificio|ed\.|ed\b|condomínio|condominio|cond\.|cond\b|residencial|res\.|res\b|empreendimento)\s+[^,.-]+)/i);
        let building = buildingMatch ? buildingMatch[1] : '';

        // Jan 23 Improvement: If no building prefix found, look for capitalized words immediately after the unit number?
        // E.g. "Apto 906 Águas do Madeira" -> "Águas do Madeira"
        if (!building && unitMatch) {
            const postUnit = description.substring(unitMatch.index! + unitMatch[0].length).trim();
            // Regex: Start with capital letter, allow spaces, stops at hyphen/comma/slash
            const implicitMatch = postUnit.match(/^([A-ZÀ-Ú][\wÀ-Ú\s]+?)(?=\s*[-,\/]|\s*$)/);
            if (implicitMatch) {
                building = implicitMatch[1];
            }
        }

        // Capitalize building name nicely
        if (building) {
            building = building.trim().replace(/\b\w/g, l => l.toUpperCase());
        }

        // 3. Fallback: Street name if no building? (Example: "Casa, Rua X")
        // Jan 23 Fix: Allow street extraction even if unit is found (for "Apt 101 - Rua X" fallback)
        let street = '';
        if (!building) {
            const streetMatch = descLower.match(/(?:rua|av\.|avenida|alameda|travessa|tv\.|rodovia|rod\.|estrada|est\.)\s+([^,.-]+)/i);
            if (streetMatch) {
                street = streetMatch[1].replace(/\b\w/g, l => l.toUpperCase());
            } else if (extracted.logradouro) {
                // Fallback to structured data if description regex fails
                street = extracted.logradouro.replace(/\b\w/g, l => l.toUpperCase());
            }
        }

        // Add "Rua" prefix if missing and it looks like a proper name
        // Normalize "Rua" prefix to avoid "Rua Rua" duplication
        if (street) {
            street = street.trim();
            // If it starts with Rua/Av (case insensitive), keep it as is, otherwise add Rua
            if (!street.match(/^(rua|av|avenida|alameda|travessa|rodovia|estrada)/i)) {
                street = `Rua ${street}`;
            }
        }

        // Jan 23: PRIORITY LOGIC BASED ON USER SELECTED TYPE
        const userType = extracted.tipo_ativo ? extracted.tipo_ativo.toLowerCase() : '';

        // --- CASE 1: CASA / HOUSE ---
        if (['casa', 'residência', 'residencia'].includes(userType)) {
            const number = extracted.numero || '';
            const streetName = street || extracted.logradouro || '';
            // Format: "Casa 123 - Rua X"
            const numberPart = number ? ` ${number}` : '';

            if (streetName) {
                // Ensure street is normalized (we already did above, but verify fallback)
                let cleanStreet = streetName.trim();
                if (!cleanStreet.match(/^(rua|av|avenida|alameda|travessa|rodovia|estrada)/i)) {
                    cleanStreet = `Rua ${cleanStreet}`;
                }
                return `Casa${numberPart} - ${cleanStreet}`;
            }
            // Fallback if no street found but is Casa
            return `Casa${numberPart} - ${description.substring(0, 30)}...`;
        }

        // --- CASE 2: APARTMENT ---
        if (['apartamento', 'flat', 'apto'].includes(userType)) {
            // Determine Unit string
            let displayUnit = unit;
            if (!displayUnit && extracted.complemento) {
                // Try to find digits in complemento to use as unit
                const match = extracted.complemento.match(/(\d+)/);
                if (match) {
                    displayUnit = match[1];
                }
            }

            // Format "Apto [Unit]"
            // If displayUnit exists check if it already has "Apt/Apto". If not, prepend "Apto ".
            let prefix = "Apto";
            if (displayUnit) {
                if (/^(apt|apto|apartamento)/i.test(displayUnit)) {
                    prefix = displayUnit; // Already has prefix, assume it's good (e.g. "Apto 101")
                } else {
                    prefix = `Apto ${displayUnit}`;
                }
            }

            // Priority: Building Name -> Street Name
            if (building) return `${prefix} - ${building}`;
            if (street) return `${prefix} - ${street}`;

            // Fallback
            return `${prefix} - ${existingSummary || description.substring(0, 20)}...`;
        }

        // --- CASE 3: ALL OTHER SPECIFIC TYPES (Loja, Terreno, Rural, etc.) ---
        if (userType) {
            // Priority: Type + Street
            // Example: "Loja - Rua Getulio Vargas"
            if (street) {
                return `${extracted.tipo_ativo} - ${street}`;
            }
            // Fallback: Type + Description start
            return `${extracted.tipo_ativo} - ${existingSummary || description.substring(0, 30)}...`;
        }

        // --- CASE 4: GENERIC / FALLBACK (No explicit type detected) ---

        // Construct Logic
        if (unit && building) return `${unit} - ${building}`;

        // Jan 23 Fix: If no building but we have a Unit + Street, use that.
        if (unit && !building && street) return `${unit} - ${street}`;

        // Jan 23 Fix: If No Unit Number but it describes an Apartment/Apto, use "Apto - Street"
        if (!unit && street && (
            (extracted.tipo_ativo && extracted.tipo_ativo.toLowerCase().includes('apartamento')) ||
            descLower.includes('apartamento') ||
            descLower.includes('apto')
        )) {
            return `Apto - ${street}`;
        }

        // Fallback for implicit "Casa" in description if type is not set
        if (!userType && (descLower.includes('casa ') || descLower.includes('residência'))) {
            return `Casa - ${street || description.substring(0, 20)}`;
        }

        // Fallback: If unit found but no building
        if (unit && !building) {
            // Avoid duplicating logic e.g. "Apt 01 - Apto 01..."
            if (existingSummary) {
                const cleanExisting = existingSummary.replace(new RegExp(`^(?:item\\s*#\\d+\\s*|apto|apt|ap|apartamento)?\\s*${unitMatch ? unitMatch[1] : ''}\\s*[-–]?\\s*`, 'i'), '');
                // Fix double separators if they exist
                return `${unit} - ${cleanExisting.replace(/^[-–\s]+/, '')}`;
            }
            return `${unit} - ${description.substring(0, 20)}...`;
        }
        if (street) return street; // House case case

        // If matched "Casa" explicitly
        if (descLower.includes('casa')) return `Casa ${street || (existingSummary || description.substring(0, 30))}`;

        // Default fallback if logic fails or it's a generic land/other
        return existingSummary || (description.length > 60 ? description.substring(0, 60) + '...' : description);
    };

    // Filter data before saving
    const handleUpdate = () => {
        if (!selectedItem) return;

        const ignoredKeys = ignoredFieldsMap[selectedItem.id] || [];

        // Create a copy of the extracted data
        const dataToSave = { ...selectedItem.extracted };

        // Ensure description_resumida is updated with smart summary if empty or generic
        if (!dataToSave.descricao_resumida && dataToSave.descricao) {
            dataToSave.descricao_resumida = getSmartSummary(dataToSave, dataToSave.descricao_resumida);
        }

        // Remove ignored keys from the data object so they aren't updated
        // Note: We need to map UI field keys back to IRPFExtractedAsset keys
        const fieldMap: Record<string, keyof IRPFExtractedAsset> = {
            'descricao': 'descricao',
            'tipo_ativo': 'tipo_ativo',
            'municipio': 'municipio',
            'uf': 'uf',
            'logradouro': 'logradouro',
            'numero': 'numero',
            'bairro': 'bairro',
            'cep': 'cep',
            'matricula': 'matricula',
            'cartorio': 'cartorio',
            'iptu': 'iptu',
            'area_total': 'area_total',
            'valor_ir_atual': 'valor_ir_atual',
            'data_aquisicao': 'data_aquisicao',
            'origem_aquisicao': 'origem_aquisicao'
        };

        ignoredKeys.forEach(ignoredKey => {
            const actualKey = fieldMap[ignoredKey];
            if (actualKey) {
                delete dataToSave[actualKey];
            }
        });

        onSave(selectedItem, 'update_commit' as any, dataToSave);
    };

    return (
        <div className="flex h-full bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-200">
            {/* --- SIDEBAR (Audit Queue) --- */}
            <div className="w-80 bg-slate-50 border-r border-slate-200 flex flex-col h-full">
                {/* Header */}
                <div className="p-4 border-b border-slate-200 bg-slate-900 text-white">
                    <h2 className="text-sm font-bold flex items-center gap-2 tracking-wide">
                        <span className="material-symbols-outlined text-green-400">dns</span>
                        {items.length} ATIVOS EM PROCESSAMENTO
                    </h2>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    {items.map((item, idx) => {
                        const isSelected = item.id === selectedItemId;
                        const matchedAssetName = item.matchedAssetId ? assets.find(a => a.id === item.matchedAssetId)?.name : null;

                        return (
                            <div
                                key={item.id}
                                onClick={() => setSelectedItemId(item.id)}
                                className={`
                                    p-4 rounded-xl cursor-pointer border-2 transition-all text-left group relative shadow-sm
                                    ${isSelected
                                        ? 'bg-blue-100 border-blue-400 shadow-md z-10 scale-[1.01]'
                                        : 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md'
                                    }
                                `}
                            >
                                <div className="flex justify-between items-center mb-2">
                                    <span className={`text-[10px] uppercase font-bold tracking-wider ${isSelected ? 'text-blue-600' : 'text-slate-400'}`}>
                                        ITEM #{idx + 1}
                                    </span>
                                    {!matchedAssetName && (
                                        <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                                            NOVO
                                        </span>
                                    )}
                                </div>

                                <div className={`text-xs font-bold line-clamp-2 leading-snug mb-2 ${isSelected ? 'text-slate-900' : 'text-slate-600'}`}>
                                    {getSmartSummary(item.extracted, item.extracted.descricao_resumida)}
                                </div>

                                <div className={`text-xs font-mono mb-3 ${isSelected ? 'text-slate-800' : 'text-slate-400'}`}>
                                    {formatBRL(item.extracted.valor_ir_atual)}
                                </div>

                                {matchedAssetName && (
                                    <div className={`mt-2 pt-2 border-t flex items-center gap-1 text-[10px] font-medium ${isSelected ? 'border-blue-300 text-blue-700' : 'border-slate-100 text-slate-400'}`}>
                                        <span className="material-symbols-outlined text-sm">link</span>
                                        <span className="truncate max-w-[180px]">{matchedAssetName}</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* --- MAIN AREA (Workspace) --- */}
            <div className="flex-1 flex flex-col h-full bg-[#f8fafc] overflow-y-auto">
                {selectedItem ? (
                    <>
                        {/* Top Bar - Sticky Header */}
                        <div className="bg-blue-100 border-b border-blue-300 px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-md">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                                        ITEM #{selectedItem.id.replace('ext-', '')}
                                    </span>
                                    {selectedItem.status === 'auto_match' && <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-100">Atualizar Existente</span>}
                                    {selectedItem.status === 'new' && <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-100">Criar Novo</span>}
                                </div>
                                <h1 className="text-lg font-bold text-slate-800 line-clamp-1 max-w-2xl">
                                    "{getSmartSummary(selectedItem.extracted, selectedItem.extracted.descricao_resumida)}"
                                </h1>
                            </div>
                            {/* Navigation */}
                        </div>

                        {/* Content Scroll */}
                        <div className="p-8 max-w-5xl mx-auto w-full space-y-8">

                            {/* AI Analysis Block (Top) */}
                            <div className="bg-blue-900/5 mt-0 p-5 rounded-xl border border-blue-100 flex gap-4 items-start shadow-sm">
                                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-blue-600 text-xl">auto_awesome</span>
                                </div>
                                <div className="text-sm text-blue-900 leading-relaxed font-light">
                                    <span className="font-bold text-blue-600 block mb-1 uppercase tracking-wide text-xs">Análise Inteligente da IA</span>
                                    {selectedItem.matchScore >= 100 && Object.keys(selectedItem.extracted).every(k => !matchedAsset || String(selectedItem.extracted[k as keyof IRPFExtractedAsset]).trim() === String((matchedAsset as any)[k] || '').trim())
                                        ? 'Coincidência exata detectada em todos os campos. Fusão recomendada.'
                                        : 'Atenção: Embora haja alta similaridade, detectamos divergências específicas (destacadas em laranja) que exigem sua revisão manual antes da aprovação.'
                                    }
                                </div>
                            </div>

                            {/* Detailed Field Comparison */}
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">

                                {/* 1. General Info Section */}
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-sm">info</span>
                                    </div>
                                    <h3 className="text-sm font-bold text-orange-600">Informações Gerais</h3>
                                </div>
                                <div className="w-full h-1 bg-orange-200 rounded-full mb-4"></div>
                                <ComparisonHeader />

                                <div className="space-y-1 mb-8">
                                    {/* Summary Description */}
                                    <FieldComparisonInput
                                        fieldKey="descricao_resumida"
                                        label="Descrição Resumida"
                                        pdfValue={getSmartSummary(selectedItem.extracted, selectedItem.extracted.descricao_resumida)}
                                        systemValue={matchedAsset?.name}
                                        type="text"
                                    />
                                    {/* Full Description */}
                                    <FieldComparisonInput
                                        fieldKey="descricao"
                                        label="Descrição Completa"
                                        pdfValue={selectedItem.extracted.descricao}
                                        systemValue={matchedAsset?.description}
                                        type="textarea"
                                    />
                                    {/* Asset Type */}
                                    <FieldComparisonInput
                                        fieldKey="tipo_ativo"
                                        label="Tipo de Ativo"
                                        pdfValue={selectedItem.extracted.tipo_ativo || "Apartamento"}
                                        systemValue={matchedAsset?.type || "Apartamento"}
                                        type="select"
                                        options={ASSET_TYPES}
                                    />
                                    {/* IRPF Value */}
                                    <FieldComparisonInput
                                        fieldKey="valor_ir_atual"
                                        label="Valor IRPF (R$)"
                                        pdfValue={selectedItem.extracted.valor_ir_atual}
                                        systemValue={matchedAsset?.declaredValue || matchedAsset?.value}
                                        type="money"
                                    />
                                    {/* Acquisition Date */}
                                    <FieldComparisonInput
                                        fieldKey="data_aquisicao"
                                        label="Data de Aquisição"
                                        pdfValue={selectedItem.extracted.data_aquisicao}
                                        systemValue={matchedAsset?.acquisitionDate}
                                        type="text"
                                    />
                                    {/* Acquisition Origin */}
                                    <FieldComparisonInput
                                        fieldKey="origem_aquisicao"
                                        label="Origem / Forma de Aquisição"
                                        pdfValue={selectedItem.extracted.origem_aquisicao}
                                        systemValue={matchedAsset?.acquisitionOrigin}
                                        type="text"
                                    />
                                </div>


                                {/* 2. Location Section */}
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-sm">pin_drop</span>
                                    </div>
                                    <h3 className="text-sm font-bold text-blue-600">Identificação e Localização</h3>
                                </div>
                                <div className="w-full h-1 bg-blue-600 rounded-full mb-4"></div>
                                <ComparisonHeader />

                                <div className="space-y-1 mb-8">
                                    <FieldComparisonInput fieldKey="municipio" label="Município" pdfValue={selectedItem.extracted.municipio} systemValue={matchedAsset?.city} />
                                    <FieldComparisonInput fieldKey="uf" label="UF" pdfValue={selectedItem.extracted.uf} systemValue={matchedAsset?.state} />
                                    <FieldComparisonInput fieldKey="logradouro" label="Logradouro" pdfValue={selectedItem.extracted.logradouro} systemValue={matchedAsset?.street} />
                                    <FieldComparisonInput fieldKey="numero" label="Número" pdfValue={selectedItem.extracted.numero} systemValue={matchedAsset?.number} />
                                    <FieldComparisonInput fieldKey="bairro" label="Bairro" pdfValue={selectedItem.extracted.bairro} systemValue={matchedAsset?.neighborhood} />
                                    <FieldComparisonInput fieldKey="cep" label="CEP" pdfValue={selectedItem.extracted.cep} systemValue={matchedAsset?.zipCode} />
                                </div>

                                {/* 3. Registry Section */}
                                <div className="flex items-center gap-3 mt-8 mb-2">
                                    <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-sm">description</span>
                                    </div>
                                    <h3 className="text-sm font-bold text-purple-600">Documentação e Registro</h3>
                                </div>
                                <div className="w-full h-1 bg-purple-600 rounded-full mb-4"></div>
                                <ComparisonHeader />
                                <div className="space-y-1">
                                    <FieldComparisonInput fieldKey="matricula" label="Matrícula" pdfValue={selectedItem.extracted.matricula} systemValue={matchedAsset?.matricula} />
                                    <FieldComparisonInput fieldKey="cartorio" label="Cartório" pdfValue={selectedItem.extracted.cartorio} systemValue={matchedAsset?.registryOffice} />
                                    <FieldComparisonInput fieldKey="iptu" label="IPTU" pdfValue={selectedItem.extracted.iptu} systemValue={matchedAsset?.iptu} />
                                    <FieldComparisonInput fieldKey="area_total" label="Área / Metragem" pdfValue={selectedItem.extracted.area_total} systemValue={matchedAsset?.areaTotal} />

                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="bg-white border-t border-slate-200 p-4 sticky bottom-0 z-20 flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                            <div className="flex gap-3">
                                <button
                                    onClick={() => onSave(selectedItem, 'ignore')}
                                    className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-200 transition-colors"
                                >
                                    Pular / Ignorar
                                </button>
                                <button className="px-4 py-2 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg text-sm font-bold hover:bg-yellow-100 transition-colors">
                                    Sinalizar Dúvida
                                </button>
                            </div>

                            <div className="flex gap-3">
                                {matchedAsset ? (
                                    <>
                                        <button
                                            onClick={() => onSave(selectedItem, 'create')}
                                            className="px-6 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold hover:bg-slate-700 transition-colors"
                                        >
                                            Desvincular & Criar Novo
                                        </button>
                                        <button
                                            onClick={handleUpdate}
                                            className="px-8 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:scale-105 transition-all flex items-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-lg">sync</span>
                                            ATUALIZAR ATIVO
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => onSave(selectedItem, 'create')}
                                        className="px-8 py-2 bg-green-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-green-200 hover:bg-green-700 hover:scale-105 transition-all flex items-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-lg">add_circle</span>
                                        CRIAR NOVO ATIVO
                                    </button>
                                )}
                            </div>
                        </div>

                    </>
                ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 flex-col gap-4">
                        <span className="material-symbols-outlined text-6xl opacity-20">checklist</span>
                        <p>Selecione um item na auditoria para visualizar detalhes.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
