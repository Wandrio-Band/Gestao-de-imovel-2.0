import React from 'react';
import { ReconciliationItem, Asset } from '../types';

interface IRPFReviewCardListProps {
    items: ReconciliationItem[];
    currentAssets: Asset[];
    onReviewItem: (item: ReconciliationItem, index: number) => void;
    onDesvincular: (itemId: string) => void;
    onClearAll: () => void;
}

export const IRPFReviewCardList: React.FC<IRPFReviewCardListProps> = ({
    items,
    currentAssets,
    onReviewItem,
    onDesvincular,
    onClearAll
}) => {
    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    const getConfidenceBadge = (score: number) => {
        if (score >= 80) return { label: 'CONFIANÇA: 100%', color: 'bg-green-100 text-green-700' };
        if (score >= 25) return { label: 'CONFIANÇA: 70%', color: 'bg-orange-100 text-orange-700' };
        return { label: 'CONFIANÇA: 0%', color: 'bg-gray-100 text-gray-600' };
    };

    const getStatusBadge = (status: ReconciliationItem['status']) => {
        if (status === 'auto_match') return { label: 'ATUALIZAR EXISTENTE', color: 'bg-blue-600 text-white' };
        if (status === 'suggestion') return { label: 'ATUALIZAR EXISTENTE', color: 'bg-orange-600 text-white' };
        return { label: 'CRIAR NOVO', color: 'bg-green-600 text-white' };
    };

    return (
        <div className="animate-fade-in-up">
            {/* Header */}
            <div className="bg-slate-900 text-white p-6 rounded-t-2xl flex justify-between items-center">
                <h2 className="text-2xl font-black tracking-tight">
                    {items.length} ATIVOS EM PROCESSAMENTO
                </h2>
                <button
                    onClick={onClearAll}
                    className="text-sm font-bold uppercase tracking-wider text-gray-400 hover:text-white transition-colors"
                >
                    LIMPAR TUDO
                </button>
            </div>

            {/* Cards Container */}
            <div className="bg-gray-50 p-6 rounded-b-2xl space-y-4">
                {items.map((item, index) => {
                    const matchedAsset = currentAssets.find(a => a.id === item.matchedAssetId);
                    const statusBadge = getStatusBadge(item.status);
                    const confidenceBadge = getConfidenceBadge(item.matchScore);

                    return (
                        <div
                            key={item.id}
                            className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow"
                        >
                            {/* Header Row */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <span className="font-mono text-sm font-bold text-gray-700">
                                        ITEM #{item.extracted.id_declaracao || index + 1}
                                    </span>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusBadge.color}`}>
                                        {statusBadge.label}
                                    </span>
                                </div>
                            </div>

                            {/* Description */}
                            <p className="text-sm text-gray-700 mb-4 line-clamp-2 leading-relaxed italic">
                                "{item.extracted.descricao}"
                            </p>

                            {/* Metadata Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                                {/* Confidence */}
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-orange-500 text-sm">
                                        analytics
                                    </span>
                                    <span className={`text-xs font-bold px-2 py-1 rounded ${confidenceBadge.color}`}>
                                        {confidenceBadge.label}
                                    </span>
                                </div>

                                {/* Match Link */}
                                {matchedAsset && (
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-blue-500 text-sm">
                                            link
                                        </span>
                                        <span className="text-xs text-gray-600">
                                            VINCULADO A: <span className="font-bold">{matchedAsset.name}</span>
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Value */}
                            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg mb-4">
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                                    Valor do Imóvel IRPF
                                </p>
                                <p className="text-2xl font-black text-blue-600">
                                    {formatCurrency(item.extracted.valor_ir_atual)}
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => onReviewItem(item, index)}
                                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-sm">
                                        visibility
                                    </span>
                                    REVISAR FICHA
                                </button>

                                {matchedAsset && (
                                    <button
                                        onClick={() => onDesvincular(item.id)}
                                        className="text-sm font-medium text-gray-500 hover:text-red-600 uppercase tracking-wider transition-colors"
                                    >
                                        DESVINCULAR
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
