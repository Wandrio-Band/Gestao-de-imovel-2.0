import React from 'react';
import { AmortizationResult, ViewState } from '../types';

interface SavedSimulationsProps {
    reports: AmortizationResult[];
    onViewReport: (report: AmortizationResult) => void;
    onDeleteReport: (id: string) => void;
    onNavigate: (view: ViewState) => void;
}

const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return dateString.split('-').reverse().join('/');
}

export const SavedSimulations: React.FC<SavedSimulationsProps> = ({ reports, onViewReport, onDeleteReport, onNavigate }) => {
    
    return (
        <div className="p-8 max-w-[1600px] mx-auto pb-24 animate-fade-in-up">
            {/* Header */}
            <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => onNavigate('debt_management')}
                        className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-gray-600 transition-colors shadow-sm"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Simulações Salvas</h1>
                        <p className="text-gray-500 mt-1">Histórico de cenários de amortização e economia projetada.</p>
                    </div>
                </div>
            </div>

            {reports.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm text-center">
                    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                        <span className="material-symbols-outlined text-4xl text-gray-300">folder_open</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Nenhuma simulação salva</h3>
                    <p className="text-gray-500 max-w-md mb-8">Realize simulações de amortização na tela de detalhes da dívida para compará-las aqui.</p>
                    <button 
                        onClick={() => onNavigate('debt_management')}
                        className="px-6 py-3 bg-black text-white rounded-xl font-bold text-sm shadow-lg hover:bg-gray-800 transition-all"
                    >
                        Ir para Gestão de Dívida
                    </button>
                </div>
            ) : (
                <div className="bg-white rounded-[2rem] border border-gray-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="py-4 px-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Data Simulação</th>
                                    <th className="py-4 px-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Imóvel / Contrato</th>
                                    <th className="py-4 px-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Estratégia</th>
                                    <th className="py-4 px-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Aporte Extra</th>
                                    <th className="py-4 px-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Economia Projetada</th>
                                    <th className="py-4 px-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Impacto Principal</th>
                                    <th className="py-4 px-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {reports.map((report) => (
                                    <tr key={report.id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="py-4 px-6 text-xs font-medium text-gray-600">
                                            {formatDate(report.simulationDate)}
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="text-sm font-bold text-gray-900 block truncate max-w-[250px]">{report.assetName}</span>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase inline-flex items-center gap-1 ${
                                                report.strategy === 'term' 
                                                ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                                                : 'bg-purple-50 text-purple-700 border border-purple-100'
                                            }`}>
                                                <span className="material-symbols-outlined text-[10px]">
                                                    {report.strategy === 'term' ? 'update' : 'payments'}
                                                </span>
                                                {report.strategy === 'term' ? 'Prazo' : 'Parcela'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-right text-xs font-bold text-gray-900">
                                            {formatCurrency(report.extraPayment)}
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <span className="text-sm font-black text-green-600 bg-green-50 px-2 py-1 rounded">
                                                {formatCurrency(report.savings)}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-center text-xs text-gray-700 font-medium">
                                            {report.strategy === 'term' ? (
                                                <span>-{report.monthsReduced} meses</span>
                                            ) : (
                                                <div className="flex flex-col items-center">
                                                    <span className="text-[10px] text-gray-400 uppercase">Nova Parcela</span>
                                                    <span className="font-bold">{formatCurrency(report.simulated.monthlyPayment)}</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <div className="flex justify-center gap-2">
                                                <button 
                                                    onClick={() => onViewReport(report)}
                                                    className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors"
                                                    title="Ver Relatório"
                                                >
                                                    <span className="material-symbols-outlined text-sm">visibility</span>
                                                </button>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); if(report.id) onDeleteReport(report.id); }}
                                                    className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors"
                                                    title="Excluir"
                                                >
                                                    <span className="material-symbols-outlined text-sm">delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};