import React, { useState } from 'react';
import { ReconciliationItem, Asset, IRPFExtractedAsset } from '../types';

interface IRPFItemReviewModalProps {
    item: ReconciliationItem;
    matchedAsset: Asset | null;
    currentIndex: number;
    total: number;
    onNext: () => void;
    onPrevious: () => void;
    onSave: (action: ReconciliationItem['action'], editedData?: Partial<IRPFExtractedAsset>) => void;
    onClose: () => void;
    onDesvincular: (itemId: string) => void;
}

export const IRPFItemReviewModal: React.FC<IRPFItemReviewModalProps> = ({
    item,
    matchedAsset,
    currentIndex,
    total,
    onNext,
    onPrevious,
    onSave,
    onClose,
    onDesvincular
}) => {
    const [editedData, setEditedData] = useState<Partial<IRPFExtractedAsset>>(item.extracted);
    const [selectedAction, setSelectedAction] = useState<ReconciliationItem['action']>(item.action);

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    const handleFieldChange = (field: keyof IRPFExtractedAsset, value: any) => {
        setEditedData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        console.log('💾 Saving with action:', selectedAction, 'data:', editedData);
        onSave(selectedAction, editedData);
        // Modal will close via onSave callback in parent
    };

    const handleDesvincular = () => {
        console.log('🔗 Unlinking item:', item.id);
        onDesvincular(item.id);
        onClose();
    };

    // Check if values are different
    const isDifferent = (systemValue: any, pdfValue: any): boolean => {
        if (!systemValue && !pdfValue) return false;
        if (!systemValue || !pdfValue) return true;
        return String(systemValue).trim() !== String(pdfValue).trim();
    };

    // Comparison field component
    const ComparisonField = ({
        label,
        systemValue,
        pdfValue,
        field
    }: {
        label: string;
        systemValue: any;
        pdfValue: any;
        field: keyof IRPFExtractedAsset;
    }) => {
        const hasDifference = isDifferent(systemValue, pdfValue);

        return (
            <div className="mb-3">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                    {label}
                    {hasDifference && (
                        <span className="ml-2 text-orange-600 text-[10px]">
                            ⚠️ DIFERENTE
                        </span>
                    )}
                </label>
                <div className="grid grid-cols-2 gap-4 items-start">
                    {/* Sistema */}
                    <div className={`p-3 rounded-lg border ${hasDifference ? 'bg-yellow-50 border-yellow-300' : 'bg-gray-50 border-gray-200'}`}>
                        <span className="text-[10px] text-gray-400 uppercase block mb-1">NO SISTEMA</span>
                        <span className="text-sm font-medium text-gray-700">
                            {systemValue || '-'}
                        </span>
                    </div>

                    {/* PDF (Editable) */}
                    <div className={`border rounded-lg ${hasDifference ? 'bg-orange-100 border-orange-400 ring-2 ring-orange-200' : 'bg-orange-50 border-orange-200'}`}>
                        <span className={`text-[10px] uppercase block px-3 pt-2 ${hasDifference ? 'text-orange-700 font-bold' : 'text-orange-600'}`}>
                            FINAL DO PDF {hasDifference && '→'}
                        </span>
                        <input
                            type="text"
                            value={(editedData[field] as string) || ''}
                            onChange={(e) => handleFieldChange(field, e.target.value)}
                            className="w-full px-3 pb-2 bg-transparent text-sm font-bold text-orange-700 outline-none"
                            placeholder="-"
                        />
                    </div>
                </div>
            </div>
        );
    };

    // NEW: 3-Column Comparison Field Component  
    const ComparisonField3Cols = ({
        label,
        systemValue,
        pdfValue,
        field
    }: {
        label: string;
        systemValue: any;
        pdfValue: any;
        field: keyof IRPFExtractedAsset;
    }) => {
        const hasDifference = isDifferent(systemValue, pdfValue);
        const currentValue = editedData[field];

        return (
            <div className="border-b border-gray-200 py-3">
                <div className="grid grid-cols-[200px_1fr_40px_1fr] gap-3 items-center">
                    {/* Column 1: Label */}
                    <div className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                        {label}
                        {hasDifference && (
                            <span className="ml-2 text-orange-500 text-[10px]">
                                ⚠️ DIFERENTE
                            </span>
                        )}
                    </div>

                    {/* Column 2: Sistema */}
                    <div className={`p-3 rounded-lg border ${hasDifference ? 'bg-yellow-50 border-yellow-300' : 'bg-gray-50 border-gray-200'}`}>
                        <span className="text-[10px] text-gray-400 uppercase block mb-1">NO SISTEMA</span>
                        <span className="text-sm font-medium text-gray-700">
                            {systemValue || '-'}
                        </span>
                    </div>

                    {/* Column 3: Arrow */}
                    {hasDifference && (
                        <div className="flex justify-center">
                            <button
                                onClick={() => handleFieldChange(field, systemValue)}
                                className="text-orange-500 hover:text-orange-700 text-2xl"
                                title="Aceitar valor do sistema"
                            >
                                →
                            </button>
                        </div>
                    )}
                    {!hasDifference && <div />}

                    {/* Column 4: PDF */}
                    <div className={`p-3 rounded-lg border ${hasDifference ? 'bg-orange-100 border-orange-400 ring-2 ring-orange-200' : 'bg-orange-50 border-orange-200'}`}>
                        <span className={`text-[10px] uppercase block mb-1 ${hasDifference ? 'text-orange-700 font-bold' : 'text-orange-600'}`}>
                            FINAL DO PDF →
                        </span>
                        <input
                            type="text"
                            value={(currentValue as string) || ''}
                            onChange={(e) => handleFieldChange(field, e.target.value)}
                            className="w-full bg-transparent text-sm font-bold text-orange-700 outline-none"
                            placeholder="-"
                        />
                    </div>
                </div>
            </div>
        );
    };

    // NEW: TextArea version for descricao_completa
    const ComparisonFieldTextArea = ({
        label,
        systemValue,
        pdfValue,
        field
    }: {
        label: string;
        systemValue: any;
        pdfValue: any;
        field: keyof IRPFExtractedAsset;
    }) => {
        const hasDifference = isDifferent(systemValue, pdfValue);
        const currentValue = editedData[field];

        return (
            <div className="border-b border-gray-200 py-3">
                <div className="grid grid-cols-[200px_1fr_40px_1fr] gap-3 items-start">
                    {/* Column 1: Label */}
                    <div className="text-xs font-bold text-gray-600 uppercase tracking-wide pt-3">
                        {label}
                        {hasDifference && (
                            <span className="ml-2 text-orange-500 text-[10px]">
                                ⚠️ DIFERENTE
                            </span>
                        )}
                    </div>

                    {/* Column 2: Sistema */}
                    <div className={`p-3 rounded-lg border ${hasDifference ? 'bg-yellow-50 border-yellow-300' : 'bg-gray-50 border-gray-200'}`}>
                        <span className="text-[10px] text-gray-400 uppercase block mb-1">NO SISTEMA</span>
                        <p className="text-sm font-medium text-gray-700 whitespace-pre-wrap">
                            {systemValue || '-'}
                        </p>
                    </div>

                    {/* Column 3: Arrow */}
                    {hasDifference && (
                        <div className="flex justify-center pt-3">
                            <button
                                onClick={() => handleFieldChange(field, systemValue)}
                                className="text-orange-500 hover:text-orange-700 text-2xl"
                                title="Aceitar valor do sistema"
                            >
                                →
                            </button>
                        </div>
                    )}
                    {!hasDifference && <div />}

                    {/* Column 4: PDF */}
                    <div className={`p-3 rounded-lg border ${hasDifference ? 'bg-orange-100 border-orange-400 ring-2 ring-orange-200' : 'bg-orange-50 border-orange-200'}`}>
                        <span className={`text-[10px] uppercase block mb-1 ${hasDifference ? 'text-orange-700 font-bold' : 'text-orange-600'}`}>
                            FINAL DO PDF →
                        </span>
                        <textarea
                            value={(currentValue as string) || ''}
                            onChange={(e) => handleFieldChange(field, e.target.value)}
                            rows={4}
                            className="w-full bg-transparent text-sm font-bold text-orange-700 outline-none resize-none"
                            placeholder="-"
                        />
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-black tracking-tight">
                            REFINAMENTO DE DADOS
                        </h2>
                        <p className="text-sm text-orange-400 uppercase tracking-wider mt-1">
                            {matchedAsset ? 'Atualização de Ativo Existente' : 'Criação de Novo Ativo'}
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-bold text-gray-400">
                            {currentIndex + 1} de {total}
                        </span>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* NEW: PDF Text at Top (Full Width) */}
                    <div className="bg-slate-900 text-white p-6 rounded-xl mb-6">
                        <h3 className="text-orange-500 uppercase text-xs font-bold tracking-wider mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">description</span>
                            TEXTO EXTRAÍDO: FONTE PDF
                        </h3>
                        <div className="bg-slate-800/50 p-4 rounded-lg mb-6">
                            <p className="text-sm leading-relaxed text-gray-300">
                                {item.extracted.descricao}
                            </p>
                        </div>

                        {/* Basic Info in Grid */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="border-t border-slate-700 pt-4">
                                <span className="text-xs text-gray-400 uppercase">Descrição Resumida</span>
                                <p className="text-sm font-bold mt-1">{item.extracted.descricao_resumida}</p>
                            </div>
                            <div className="border-t border-slate-700 pt-4">
                                <span className="text-xs text-gray-400 uppercase">Tipo de Ativo</span>
                                <select
                                    value={editedData.tipo_ativo || 'Apartamento'}
                                    onChange={(e) => handleFieldChange('tipo_ativo', e.target.value)}
                                    className="w-full mt-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm font-medium text-white"
                                >
                                    <option>Apartamento</option>
                                    <option>Casa</option>
                                    <option>Terreno</option>
                                    <option>Sala Comercial</option>
                                    <option>Loja</option>
                                    <option>Galpão</option>
                                </select>
                            </div>
                            <div className="border-t border-slate-700 pt-4">
                                <span className="text-xs text-gray-400 uppercase">Valor IRPF (R$)</span>
                                <p className="text-xl font-black text-orange-400 mt-1">
                                    {formatCurrency(Number(item.extracted.valor_ir_atual) || 0)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Comparison Fields (Full Width Below) */}
                    <div className="mb-6">
                        <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
                            <span className="material-symbols-outlined text-orange-500">
                                compare_arrows
                            </span>
                            COMPARAÇÃO DE CAMPOS
                        </h3>

                        {/* Location Section */}
                        <div className="mb-6">
                            <h4 className="text-xs font-black text-gray-700 uppercase tracking-wider mb-4 pb-2 border-b-2 border-orange-500">
                                📍 Informações de Localidade e Descrição
                            </h4>

                            <ComparisonFieldTextArea
                                label="Descrição Completa"
                                systemValue={matchedAsset?.description}
                                pdfValue={editedData.descricao}
                                field="descricao"
                            />

                            <ComparisonField3Cols
                                label="CEP"
                                systemValue={matchedAsset?.zipCode}
                                pdfValue={editedData.cep}
                                field="cep"
                            />

                            <ComparisonField3Cols
                                label="Município"
                                systemValue={matchedAsset?.city}
                                pdfValue={editedData.municipio}
                                field="municipio"
                            />

                            <ComparisonField3Cols
                                label="UF"
                                systemValue={matchedAsset?.state}
                                pdfValue={editedData.uf}
                                field="uf"
                            />

                            <ComparisonField3Cols
                                label="Logradouro"
                                systemValue={matchedAsset?.street}
                                pdfValue={editedData.logradouro}
                                field="logradouro"
                            />

                            <ComparisonField3Cols
                                label="Número"
                                systemValue={matchedAsset?.number}
                                pdfValue={editedData.numero}
                                field="numero"
                            />

                            <ComparisonField3Cols
                                label="Complemento"
                                systemValue={matchedAsset?.complement}
                                pdfValue={editedData.complemento}
                                field="complemento"
                            />

                            <ComparisonField3Cols
                                label="Bairro"
                                systemValue={matchedAsset?.neighborhood}
                                pdfValue={editedData.bairro}
                                field="bairro"
                            />
                        </div>

                        {/* Registry Section */}
                        <div className="mb-6">
                            <h4 className="text-xs font-black text-gray-700 uppercase tracking-wider mb-4 pb-2 border-b-2 border-blue-500">
                                📋 Informações de Registro
                            </h4>

                            <ComparisonField3Cols
                                label="IPTU"
                                systemValue={matchedAsset?.iptu}
                                pdfValue={editedData.iptu}
                                field="iptu"
                            />

                            <ComparisonField3Cols
                                label="Área Total (m²)"
                                systemValue={matchedAsset?.areaTotal}
                                pdfValue={editedData.area_total}
                                field="area_total"
                            />

                            <ComparisonField3Cols
                                label="Matrícula"
                                systemValue={matchedAsset?.matricula}
                                pdfValue={editedData.matricula}
                                field="matricula"
                            />

                            <ComparisonField3Cols
                                label="Cartório"
                                systemValue={matchedAsset?.registryOffice}
                                pdfValue={editedData.cartorio}
                                field="cartorio"
                            />
                        </div>
                    </div>

                    {/* Automatic Action Info (Full Width Bottom) */}
                    <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-5 rounded-xl border-2 border-slate-200">
                        <div className="flex items-center gap-3 mb-3">
                            <span className="material-symbols-outlined text-slate-600">
                                {matchedAsset ? 'autorenew' : 'add_circle'}
                            </span>
                            <h4 className="text-sm font-black text-slate-700 uppercase tracking-wider">
                                AÇÃO AUTOMÁTICA
                            </h4>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed">
                            {matchedAsset ? (
                                <>
                                    <strong className="text-blue-700">Sistema detectou ativo existente.</strong><br />
                                    Os dados serão <strong>atualizados</strong> no ativo vinculado: <span className="font-mono text-xs bg-blue-100 px-2 py-0.5 rounded">{matchedAsset.name}</span>
                                </>
                            ) : (
                                <>
                                    <strong className="text-green-700">Nenhum ativo correspondente encontrado.</strong><br />
                                    Um <strong>novo ativo</strong> será criado automaticamente no sistema.
                                </>
                            )}
                        </p>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="bg-gray-50 p-6 border-t border-gray-200 flex justify-between items-center">
                    <div className="flex gap-3">
                        <button
                            onClick={onPrevious}
                            disabled={currentIndex === 0}
                            className="px-4 py-2 text-sm font-bold text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed uppercase tracking-wider flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-sm">arrow_back</span>
                            ANTERIOR
                        </button>
                        <button
                            onClick={onNext}
                            disabled={currentIndex === total - 1}
                            className="px-4 py-2 text-sm font-bold text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed uppercase tracking-wider flex items-center gap-2"
                        >
                            PRÓXIMO
                            <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </button>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 text-sm font-bold text-gray-600 hover:text-gray-900 uppercase tracking-wider"
                        >
                            VOLTAR
                        </button>
                        {matchedAsset && (
                            <button
                                onClick={handleDesvincular}
                                className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl uppercase tracking-wider shadow-lg transition-all flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-sm">link_off</span>
                                DESVINCULAR
                            </button>
                        )}
                        <button
                            onClick={handleSave}
                            className={`px-8 py-3 bg-gradient-to-r ${matchedAsset ? 'from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600' : 'from-green-600 to-green-500 hover:from-green-700 hover:to-green-600'} text-white font-bold rounded-xl uppercase tracking-wider shadow-lg transition-all flex items-center gap-2`}
                        >
                            <span className="material-symbols-outlined text-sm">
                                {matchedAsset ? 'autorenew' : 'add_circle'}
                            </span>
                            {matchedAsset ? 'ATUALIZAR ATIVO EXISTENTE' : 'CRIAR NOVO ATIVO'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
