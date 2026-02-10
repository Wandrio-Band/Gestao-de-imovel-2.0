import React, { useState } from 'react';
import { Asset, ViewState, AmortizationResult } from '../types';
import { AmortizationModal } from './Forms/AmortizationModal';
import { FinancingModal } from './Forms/FinancingModal';

interface DebtDetailsProps {
    asset: Asset | null;
    onNavigate: (view: ViewState, asset?: Asset) => void;
    onSimulationComplete?: (result: AmortizationResult) => void;
    onUpdateAsset?: (asset: Asset) => void;
}

export const DebtDetails: React.FC<DebtDetailsProps> = ({ asset, onNavigate, onSimulationComplete, onUpdateAsset }) => {
    const [isAmortizationModalOpen, setIsAmortizationModalOpen] = useState(false);
    const [isFinancingModalOpen, setIsFinancingModalOpen] = useState(false);

    if (!asset || !asset.financingDetails) {
        return (
            <div className="p-8 flex flex-col items-center justify-center h-full">
                <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">error</span>
                <h2 className="text-xl font-bold text-gray-900">Nenhum contrato selecionado</h2>
                <button 
                    onClick={() => onNavigate('debt_management')} 
                    className="mt-4 px-6 py-2 bg-black text-white rounded-lg font-bold text-sm"
                >
                    Voltar para Gestão de Dívida
                </button>
            </div>
        );
    }

    const fin = asset.financingDetails;
    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    const handleSaveConditions = (newData: any) => {
        if (asset && onUpdateAsset) {
            const updatedAsset = {
                ...asset,
                financingDetails: { ...asset.financingDetails, ...newData }
            };
            onUpdateAsset(updatedAsset);
            setIsFinancingModalOpen(false);
        }
    };

    return (
        <div className="p-8 max-w-[1600px] mx-auto pb-24">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button 
                    onClick={() => onNavigate('debt_management')}
                    className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-gray-600 transition-colors shadow-sm"
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-wide border border-blue-100">
                            {fin.indexador?.includes('INCC') ? 'Construtora' : 'Financiamento Bancário'}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">• Contrato #{asset.id}992</span>
                    </div>
                    <h1 className="text-2xl font-black text-gray-900">{asset.name}</h1>
                </div>
                <div className="ml-auto flex gap-3">
                    <button 
                        onClick={() => onNavigate('financing_details', asset)}
                        className="px-4 py-2 bg-black text-white rounded-lg text-xs font-bold hover:bg-gray-800 shadow-md flex items-center gap-2 transition-colors"
                    >
                        <span className="material-symbols-outlined text-sm">edit_calendar</span>
                        Cronograma & Edição
                    </button>
                    <button 
                        onClick={() => onNavigate('consolidated_statement', asset)}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50 shadow-sm flex items-center gap-2 transition-colors"
                    >
                         <span className="material-symbols-outlined text-sm">picture_as_pdf</span> Extrato Consolidado
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Info & Stats */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Main Debt Card */}
                    <div className="bg-[#101622] text-white p-6 rounded-[2rem] shadow-xl relative overflow-hidden">
                         <div className="absolute top-0 right-0 p-6 opacity-10">
                             <span className="material-symbols-outlined text-9xl">account_balance_wallet</span>
                         </div>
                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 relative z-10">SALDO DEVEDOR ATUAL</p>
                         <h2 className="text-4xl font-black text-white mb-2 relative z-10">{formatCurrency(fin.saldoDevedor || 0)}</h2>
                         <div className="flex items-center gap-2 relative z-10 mb-6">
                             <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                             <span className="text-xs font-bold text-gray-300">Atualizado hoje</span>
                         </div>
                         
                         <div className="grid grid-cols-2 gap-4 border-t border-gray-700 pt-4 relative z-10">
                             <div>
                                 <p className="text-[9px] text-gray-500 uppercase font-bold">Taxa Efetiva</p>
                                 <p className="text-sm font-bold">{fin.jurosAnuais}% a.a. + {fin.indexador}</p>
                             </div>
                             <div className="text-right">
                                 <p className="text-[9px] text-gray-500 uppercase font-bold">Prazo Restante</p>
                                 <p className="text-sm font-bold">{fin.prazoMeses} meses</p>
                             </div>
                         </div>
                    </div>

                    {/* Next Payment Card */}
                    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-soft">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                <span className="material-symbols-outlined text-gray-500">calendar_clock</span> Próximo Vencimento
                            </h3>
                            <span className="bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Em 15 dias</span>
                        </div>
                        <div className="flex justify-between items-end mb-2">
                            <div>
                                <p className="text-2xl font-black text-gray-900">{formatCurrency(fin.phases?.mensais?.unitario || 0)}</p>
                                <p className="text-xs text-gray-400 font-medium">Parcela 14/360</p>
                            </div>
                            <button className="px-4 py-2 bg-black text-white rounded-lg text-xs font-bold shadow-md hover:bg-gray-800 transition-colors">
                                Pagar Agora
                            </button>
                        </div>
                    </div>

                    {/* Progress */}
                    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-soft">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Progresso de Quitação</h3>
                        <div className="relative h-4 w-full bg-gray-100 rounded-full overflow-hidden mb-2">
                            <div className="absolute top-0 left-0 h-full bg-green-500 w-[35%] rounded-full"></div>
                        </div>
                        <div className="flex justify-between text-xs font-bold">
                            <span className="text-green-600">35% Quitado</span>
                            <span className="text-gray-400">65% Pendente</span>
                        </div>
                    </div>
                </div>

                {/* Right Column: Actions Cockpit */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Action Grid */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <span className="material-symbols-outlined text-gray-400">bolt</span> Ações Rápidas
                            </h3>
                            <button 
                                onClick={() => onNavigate('saved_simulations')}
                                className="text-[10px] font-bold text-blue-600 hover:underline uppercase tracking-wide cursor-pointer"
                            >
                                Ver Simulações Salvas
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button 
                                onClick={() => setIsAmortizationModalOpen(true)}
                                className="bg-white p-5 rounded-2xl border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all text-left group"
                            >
                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <span className="material-symbols-outlined">calculate</span>
                                </div>
                                <h4 className="text-sm font-bold text-gray-900 mb-1">Simular Amortização</h4>
                                <p className="text-xs text-gray-500">Calcule o desconto antecipando parcelas ou reduzindo o prazo.</p>
                            </button>

                            <button className="bg-white p-5 rounded-2xl border border-gray-200 hover:border-green-400 hover:shadow-md transition-all text-left group">
                                <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center mb-3 group-hover:bg-green-600 group-hover:text-white transition-colors">
                                    <span className="material-symbols-outlined">payments</span>
                                </div>
                                <h4 className="text-sm font-bold text-gray-900 mb-1">Registrar Pagamento Extra</h4>
                                <p className="text-xs text-gray-500">Lance aportes manuais ou uso de FGTS para abater saldo.</p>
                            </button>

                            {/* Removed Portabilidade Button per request */}

                            <button 
                                onClick={() => setIsFinancingModalOpen(true)}
                                className="bg-white p-5 rounded-2xl border border-gray-200 hover:border-orange-400 hover:shadow-md transition-all text-left group md:col-span-2"
                            >
                                <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mb-3 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                                    <span className="material-symbols-outlined">edit_document</span>
                                </div>
                                <h4 className="text-sm font-bold text-gray-900 mb-1">Editar Condições</h4>
                                <p className="text-xs text-gray-500">Ajuste indexadores, datas, taxas ou valores cadastrados manualmente.</p>
                            </button>
                        </div>
                    </div>

                    {/* Recent History Table */}
                    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-soft overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-sm font-bold text-gray-900">Histórico Recente</h3>
                            <button className="text-xs font-bold text-blue-600 hover:text-blue-800">Ver Todos</button>
                        </div>
                        <table className="w-full text-left">
                            <tbody className="divide-y divide-gray-50">
                                <tr className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-sm">arrow_downward</span>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-gray-900">Pagamento Mensal</p>
                                                <p className="text-[10px] text-gray-500">Ref: Outubro/2023</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-xs font-medium text-gray-600">10/10/2023</td>
                                    <td className="p-4 text-right text-xs font-bold text-gray-900">- R$ 5.240,00</td>
                                    <td className="p-4 text-right"><span className="bg-green-50 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold">Confirmado</span></td>
                                </tr>
                                <tr className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-sm">trending_up</span>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-gray-900">Correção Monetária</p>
                                                <p className="text-[10px] text-gray-500">IPCA +0.2%</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-xs font-medium text-gray-600">01/10/2023</td>
                                    <td className="p-4 text-right text-xs font-bold text-gray-900">+ R$ 412,00</td>
                                    <td className="p-4 text-right"><span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-bold">Ajuste</span></td>
                                </tr>
                                <tr className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-sm">flash_on</span>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-gray-900">Amortização Extra</p>
                                                <p className="text-[10px] text-gray-500">Redução de prazo</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-xs font-medium text-gray-600">15/09/2023</td>
                                    <td className="p-4 text-right text-xs font-bold text-gray-900">- R$ 50.000,00</td>
                                    <td className="p-4 text-right"><span className="bg-green-50 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold">Confirmado</span></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <AmortizationModal 
                isOpen={isAmortizationModalOpen}
                onClose={() => setIsAmortizationModalOpen(false)}
                currentDebt={fin.saldoDevedor || 0}
                currentTerm={parseInt(fin.prazoMeses || '0')}
                interestRateYear={parseFloat(fin.jurosAnuais || '0')}
                assetName={asset.name}
                onConfirm={(result) => {
                    if (onSimulationComplete) onSimulationComplete(result);
                }}
            />

            <FinancingModal 
                isOpen={isFinancingModalOpen}
                onClose={() => setIsFinancingModalOpen(false)}
                onSave={handleSaveConditions}
                assetName={asset.name}
                initialData={fin}
            />
        </div>
    );
};