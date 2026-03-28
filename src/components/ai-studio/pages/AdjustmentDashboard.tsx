'use client';

import React, { useState, useEffect } from 'react';
import { Asset } from '../types';
import { BCBIndex } from '@/services/bcb';
import { calculateRentAdjustment, getNextAdjustmentDate, AdjustmentResult } from '@/utils/financial';
import { updateRent } from '@/app/actions/assets';

interface Props {
    assets: Asset[];
    igpmHistory: BCBIndex[];
    ipcaHistory: BCBIndex[];
}

export const AdjustmentDashboard: React.FC<Props> = ({ assets, igpmHistory, ipcaHistory }) => {
    const [calculating, setCalculating] = useState(true);
    const [adjustments, setAdjustments] = useState<{ [key: string]: AdjustmentResult & { nextDate: Date } }>({});
    const [processing, setProcessing] = useState<string | null>(null);

    // Filter only rented assets with lease details
    const rentedAssets = assets.filter(a => a.status === 'Locado' && a.leaseDetails);

    useEffect(() => {
        const results: Record<string, AdjustmentResult & { nextDate: Date }> = {};
        rentedAssets.forEach(asset => {
            if (!asset.leaseDetails) return;

            const startDateStr = asset.leaseDetails.inicioVigencia; // YYYY-MM-DD
            if (!startDateStr) return;

            const idxType = asset.leaseDetails.indexador === 'IGPM' ? 'IGPM' : 'IPCA';
            const history = idxType === 'IGPM' ? igpmHistory : ipcaHistory;

            const nextDate = getNextAdjustmentDate(startDateStr);
            // We calculate using indices available. 
            // We pass "lastAdjustmentDate" as the Start Date ANNIVERSARY of previous year?
            // For simplicity, let's pass a date 12 months prior to nextDate.
            const lastAnniversary = new Date(nextDate);
            lastAnniversary.setFullYear(nextDate.getFullYear() - 1);

            const result = calculateRentAdjustment(
                Number(asset.leaseDetails.valorAluguel), // Current Rent
                lastAnniversary,
                history
            );

            results[asset.id] = { ...result, nextDate };
        });
        setAdjustments(results);
        setCalculating(false);
    }, [assets, igpmHistory, ipcaHistory]);

    const handleApply = async (assetId: string, newValue: number) => {
        if (!confirm(`Confirmar reajuste para R$ ${newValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}?`)) return;

        setProcessing(assetId);
        await updateRent(assetId, newValue);
        setProcessing(null);
        // Optimistic update or wait for revalidate? server action revalidates.
        // But we might want to refresh local data representation? 
        // The parent page will reload if we use router.refresh() or just rely on Next.js server action magic.
        window.location.reload();
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <span className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center material-symbols-outlined text-2xl shadow-lg shadow-blue-200">
                            trending_up
                        </span>
                        Painel de Reajustes
                    </h1>
                    <p className="text-gray-500 mt-2 font-medium">
                        Monitore e aplique reajustes contratuais baseados no IGPM ({igpmHistory.length > 0 ? 'Online' : 'Offline'}) e IPCA ({ipcaHistory.length > 0 ? 'Online' : 'Offline'}).
                    </p>
                </div>
            </header>

            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50/50 border-b border-gray-100">
                            <tr>
                                <th className="px-8 py-6 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Imóvel / Inquilino</th>
                                <th className="px-8 py-6 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Base</th>
                                <th className="px-8 py-6 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Índice</th>
                                <th className="px-8 py-6 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Próx. Reajuste</th>
                                <th className="px-8 py-6 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Acumulado (12m)</th>
                                <th className="px-8 py-6 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Novo Valor</th>
                                <th className="px-8 py-6 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {rentedAssets.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-8 py-12 text-center text-gray-500">
                                        Nenhum imóvel locado encontrado.
                                    </td>
                                </tr>
                            ) : rentedAssets.map(asset => {
                                const adj = adjustments[asset.id];
                                if (!adj) return null;

                                const isDue = adj.nextDate <= new Date() ||
                                    (adj.nextDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24) < 30; // 30 days notice

                                return (
                                    <tr key={asset.id} className="group hover:bg-gray-50/50 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                {asset.image ? (
                                                    <div className="w-12 h-12 rounded-xl bg-gray-100 bg-cover bg-center shrink-0 border border-gray-200" style={{ backgroundImage: `url(${asset.image})` }} />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 border border-gray-200 shrink-0">
                                                        <span className="material-symbols-outlined">home</span>
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-bold text-gray-900 line-clamp-1">{asset.name}</p>
                                                    <p className="text-xs text-gray-500 font-medium">{asset.leaseDetails?.nomeInquilino}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="font-bold text-gray-600">
                                                {Number(asset.leaseDetails?.valorAluguel).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${asset.leaseDetails?.indexador === 'IGPM' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                                                {asset.leaseDetails?.indexador || 'IGPM'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className={`font-bold ${isDue ? 'text-orange-600' : 'text-gray-900'}`}>
                                                    {adj.nextDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                                                </span>
                                                {isDue && <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wide">Vencendo</span>}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <span className="font-black text-gray-900">{adj.accumulatedPercentage.toFixed(2)}%</span>
                                                <span className="text-xs text-gray-400 font-medium">({adj.indicesUsed.length} meses)</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="font-black text-primary text-lg">
                                                {adj.newRentValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button
                                                onClick={() => handleApply(asset.id, adj.newRentValue)}
                                                disabled={processing === asset.id}
                                                className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white border-2 border-primary/10 text-primary hover:bg-primary hover:text-white transition-all disabled:opacity-50"
                                                title="Aplicar Reajuste"
                                            >
                                                {processing === asset.id ? (
                                                    <span className="material-symbols-outlined text-base animate-spin">refresh</span>
                                                ) : (
                                                    <span className="material-symbols-outlined text-base">check</span>
                                                )}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
                    <div className="relative z-10">
                        <h3 className="text-xl font-bold mb-2">Sobre o Cálculo</h3>
                        <p className="text-blue-200 text-sm max-w-md">
                            O sistema utiliza a série histórica oficial do Banco Central. O cálculo considera o produtório dos índices mensais (juros compostos) do período de 12 meses anterior ao mês de reajuste.
                        </p>
                    </div>
                </div>
                {/* Visual Placeholder for Charts if needed later */}
            </div>
        </div>
    );
};
