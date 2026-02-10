import React from 'react';
import { Asset, ViewState } from '../types';
import { useAssetContext } from '@/context/AssetContext';
import { EmptyState } from '@/components/EmptyState';
import { CashFlowGrid } from './FinancialOverview/CashFlowGrid';
import { ProjectedCashFlowChart } from './FinancialOverview/ProjectedCashFlowChart';
import { getProjectedCashFlow, CashFlowProjection } from '@/app/actions/financial';
import { useState, useEffect } from 'react';

// ... interactions ...

interface FinancialAssetListProps {
    onNavigate: (view: ViewState, asset?: Asset) => void;
}

export const FinancialAssetList: React.FC<FinancialAssetListProps> = ({ onNavigate }) => {
    // Filter only assets that might have financial relevance (or all if you prefer)
    // For this mock, we assume all can have financing, but we highlight those that do.
    const { assets } = useAssetContext();
    const financialAssets = assets;

    const [cashFlowData, setCashFlowData] = useState<CashFlowProjection[]>([]);
    const [loadingCashFlow, setLoadingCashFlow] = useState(true);

    useEffect(() => {
        const loadCashFlow = async () => {
            setLoadingCashFlow(true);
            const data = await getProjectedCashFlow(12);
            setCashFlowData(data);
            setLoadingCashFlow(false);
        };
        loadCashFlow();
    }, []);

    const formatCurrency = (val: number | string) => {
        if (typeof val === 'string') return `R$ ${val}`;
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    // Calculate Global KPIs
    const totalDebt = financialAssets.reduce((acc, curr) => acc + (curr.financingDetails?.saldoDevedor || 0), 0);
    const totalPaid = financialAssets.reduce((acc, curr) => acc + (curr.financingDetails?.valorQuitado || 0), 0);
    const totalAssetsValue = financialAssets.reduce((acc, curr) => acc + curr.marketValue, 0);
    const globalProgress = (totalPaid / (totalPaid + totalDebt)) * 100 || 0;

    // Yield Calculations
    const totalAnnualRent = financialAssets.reduce((acc, curr) => acc + (curr.rentalValue * 12), 0);
    const avgYield = totalAssetsValue > 0 ? (totalAnnualRent / totalAssetsValue) * 100 : 0;

    return (
        <div className="p-8 max-w-[1600px] mx-auto pb-24 animate-fade-in-up">

            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Gestão Financeira</h1>
                    <p className="text-gray-500 mt-1">Visão consolidada de passivos, financiamentos e fluxo de caixa por ativo.</p>
                </div>
                <div className="flex gap-3">
                    <button className="px-5 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-bold shadow-sm hover:bg-gray-50 flex items-center gap-2">
                        <span className="material-symbols-outlined">filter_list</span> Filtrar
                    </button>
                    <button className="px-5 py-2.5 bg-[#1152d4] text-white rounded-xl text-sm font-bold shadow-lg hover:bg-blue-700 flex items-center gap-2">
                        <span className="material-symbols-outlined">add</span> Novo Financiamento
                    </button>
                </div>
            </div>

            {/* Empty State */}
            {financialAssets.length === 0 ? (
                <EmptyState
                    icon="account_balance"
                    title="Nenhum Ativo com Financiamento"
                    description="Cadastre ativos e configure seus financiamentos para visualizar a gestão financeira consolidada do portfólio."
                    action={{
                        label: "Cadastrar Primeiro Ativo",
                        onClick: () => onNavigate('asset_new')
                    }}
                />
            ) : (
                <>
                    {/* Global KPIs */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                        <div className="bg-[#101622] p-6 rounded-[2rem] text-white shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-6 opacity-10">
                                <span className="material-symbols-outlined text-8xl">account_balance</span>
                            </div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 relative z-10">SALDO DEVEDOR TOTAL</p>
                            <h2 className="text-3xl font-black mb-2 relative z-10">{formatCurrency(totalDebt)}</h2>
                            <div className="flex items-center gap-2 relative z-10">
                                <span className="bg-red-500/20 text-red-300 px-2 py-0.5 rounded text-[10px] font-bold border border-red-500/30">PASSIVO</span>
                                <span className="text-[10px] text-gray-400">Consolidado da Carteira</span>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-soft relative overflow-hidden">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">TOTAL JÁ QUITADO</p>
                            <h2 className="text-3xl font-black text-gray-900 mb-2">{formatCurrency(totalPaid)}</h2>
                            <div className="w-full bg-gray-100 h-2 rounded-full mt-4 overflow-hidden">
                                <div className="bg-green-500 h-full rounded-full" style={{ width: `${globalProgress}%` }}></div>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-2 text-right">{globalProgress.toFixed(1)}% do Total Contratado</p>
                        </div>

                        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-soft relative overflow-hidden">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">PRÓXIMOS VENCIMENTOS (30 DIAS)</p>
                                    <h2 className="text-3xl font-black text-gray-900 mb-2">R$ 18.450,00</h2>
                                </div>
                                <div className="w-10 h-10 bg-yellow-50 text-yellow-600 rounded-xl flex items-center justify-center">
                                    <span className="material-symbols-outlined">calendar_clock</span>
                                </div>
                            </div>
                            <div className="flex -space-x-2 mt-2">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500 relative z-10">
                                        <span className="material-symbols-outlined text-xs">apartment</span>
                                    </div>
                                ))}
                                <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 relative z-0 pl-1">
                                    +2
                                </div>
                            </div>
                        </div>


                        {/* Yield KPI Card */}
                        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-soft relative overflow-hidden group">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">YIELD MÉDIO (ANUAL)</p>
                            <h2 className="text-3xl font-black text-[#1152d4] mb-2">{avgYield.toFixed(2)}%</h2>
                            <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${avgYield > 6 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                                    {avgYield > 6 ? 'Excelente' : 'Atenção'}
                                </span>
                                <span className="text-[10px] text-gray-400">Retorno sobre Valor de Mercado</span>
                            </div>
                            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-blue-50 rounded-full opacity-50 group-hover:scale-150 transition-transform"></div>
                        </div>
                    </div>

                    {/* Projected Cash Flow Section */}
                    <div className="mb-12 space-y-8">
                        <ProjectedCashFlowChart data={cashFlowData} isLoading={loadingCashFlow} />
                        {!loadingCashFlow && cashFlowData.length > 0 && (
                            <CashFlowGrid data={cashFlowData} />
                        )}
                    </div>

                    {/* Assets Grid */}
                    <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <span className="w-2 h-6 bg-blue-600 rounded-full"></span> Carteira de Ativos
                    </h2>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {financialAssets.map(asset => {
                            const hasFinancing = !!asset.financingDetails;

                            return (
                                <div
                                    key={asset.id}
                                    onClick={() => onNavigate('financing_details', asset)}
                                    className="bg-white rounded-[2rem] border border-gray-100 shadow-soft group hover:shadow-xl hover:border-blue-200 transition-all cursor-pointer overflow-hidden flex flex-col h-full"
                                >
                                    {/* Image Header - Compact */}
                                    <div className="h-32 w-full relative bg-gray-200">
                                        {asset.image ? (
                                            <img src={asset.image} alt={asset.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                <span className="material-symbols-outlined text-4xl">image</span>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-90"></div>

                                        <div className="absolute bottom-4 left-6 right-6">
                                            <h3 className="text-white font-bold text-lg truncate shadow-black drop-shadow-sm">{asset.name}</h3>
                                            <p className="text-white/70 text-[10px] uppercase font-bold tracking-wide">{asset.city} • {asset.neighborhood}</p>
                                        </div>
                                    </div>

                                    {/* Financial Body - Replicating Screenshot */}
                                    <div className="p-6 flex-1 flex flex-col gap-4">
                                        {hasFinancing && asset.financingDetails ? (
                                            <div className="grid grid-cols-2 gap-4">

                                                {/* VALOR TOTAL IMÓVEL */}
                                                <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm relative overflow-hidden">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest">VALOR TOTAL IMÓVEL</span>
                                                        <span className="material-symbols-outlined text-blue-200 text-lg">real_estate_agent</span>
                                                    </div>
                                                    <p className="text-lg font-black text-gray-900">{formatCurrency(asset.financingDetails.valorTotal)}</p>
                                                    <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600"></div>
                                                </div>

                                                {/* TOTAL QUITADO (OBRA) */}
                                                <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm relative overflow-hidden">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest">TOTAL QUITADO (OBRA)</span>
                                                        <span className="material-symbols-outlined text-green-500 text-lg">check_circle</span>
                                                    </div>
                                                    <p className="text-lg font-black text-gray-900">{formatCurrency(asset.financingDetails.valorQuitado || 0)}</p>
                                                    <div className="absolute bottom-0 left-0 w-full h-1 bg-green-500"></div>
                                                </div>

                                                {/* SALDO DEVEDOR (CONST.) */}
                                                <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm relative overflow-hidden">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest">SALDO DEVEDOR (CONST.)</span>
                                                        <span className="material-symbols-outlined text-orange-400 text-lg">construction</span>
                                                    </div>
                                                    <p className="text-lg font-black text-gray-900">{formatCurrency(asset.financingDetails.saldoDevedor || 0)}</p>
                                                    <div className="absolute bottom-0 left-0 w-full h-1 bg-orange-400"></div>
                                                </div>

                                                {/* A FINANCIAR (BANCO) */}
                                                <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm relative overflow-hidden">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest">A FINANCIAR (BANCO)</span>
                                                        <span className="material-symbols-outlined text-blue-800 text-lg">account_balance</span>
                                                    </div>
                                                    <p className="text-lg font-black text-gray-900">{formatCurrency(asset.financingDetails.valorFinanciar)}</p>
                                                    <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-800"></div>
                                                </div>

                                            </div>
                                        ) : (
                                            <div className="flex-1 flex flex-col items-center justify-center text-center py-12 opacity-50 border-2 border-dashed border-gray-200 rounded-xl">
                                                <span className="material-symbols-outlined text-3xl text-gray-300 mb-2">money_off</span>
                                                <p className="text-xs font-bold text-gray-400">Nenhum financiamento cadastrado</p>
                                                <button className="mt-4 text-[10px] font-bold text-blue-600 uppercase hover:underline">
                                                    Iniciar Cadastro
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Yield section */}
                                    <div className="px-6 pb-2">
                                        <div className="grid grid-cols-1 gap-2 mt-4 pt-4 border-t border-gray-100">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase">RENTABILIDADE (YIELD)</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-black text-gray-900">
                                                        {asset.marketValue > 0 ? ((asset.rentalValue * 12 / asset.marketValue) * 100).toFixed(2) : '0.00'}%
                                                    </span>
                                                    <span className="text-[9px] text-gray-400 font-medium">a.a.</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer Action */}
                                    <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase">Atualizado hoje</span>
                                        <span className="text-[10px] font-bold text-blue-600 uppercase group-hover:underline transition-all flex items-center gap-1">
                                            Ver Detalhes <span className="material-symbols-outlined text-xs">arrow_forward</span>
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )
            }
        </div >
    );
};