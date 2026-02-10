
import React from 'react';
import { Asset, ViewState } from '../types';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface ReportFinancialExecutiveProps {
    asset: Asset | null;
    onNavigate: (view: ViewState) => void;
}

export const ReportFinancialExecutive: React.FC<ReportFinancialExecutiveProps> = ({ asset, onNavigate }) => {
    if (!asset) return null;

    // --- Mock Data specific to the screenshot layout ---
    
    // Line Chart Data (Decreasing curve)
    const curveData = Array.from({ length: 25 }, (_, i) => {
        const year = 2024 + i;
        const total = 1.25 - (i * 0.05); // Rough linear decrease
        const interest = total * 0.4;
        return {
            year: year.toString(),
            principal: Math.max(0, total),
            interest: Math.max(0, interest) 
        };
    });

    // Donut Chart Data
    const paymentComposition = [
        { name: 'Amortização Principal', value: 72, color: '#1152d4' }, // Blue
        { name: 'Juros Totais', value: 28, color: '#fb923c' }, // Orange
    ];

    const partners = [
        { name: 'Carlos', share: 40, contributed: 183280, avatar: 'https://i.pravatar.cc/150?img=11' },
        { name: 'Ana S.', share: 60, contributed: 274920, initials: 'AS', color: 'bg-purple-100 text-purple-600' },
    ];

    const formatCurrency = (val: number) => 
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    return (
        <div className="bg-[#f6f6f8] min-h-screen p-8 animate-fade-in-up pb-24">
            
            {/* Header Navigation */}
            <div className="max-w-[1200px] mx-auto mb-6 flex items-center gap-2 text-sm text-gray-500">
                <button onClick={() => onNavigate('report_executive')} className="hover:text-black flex items-center gap-1 transition-colors">
                    <span className="material-symbols-outlined text-sm">arrow_back</span> Gestão de Financiamentos
                </button>
                <span>/</span>
                <span className="font-bold text-gray-900">{asset.name}</span>
            </div>

            <div className="max-w-[1200px] mx-auto bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-200">
                
                {/* Title & Actions */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Relatório Executivo</h1>
                        <p className="text-blue-600 font-medium text-sm mt-1">Análise consolidada - {asset.name}</p>
                    </div>
                    <div className="flex gap-3">
                        <button className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors">
                            <span className="material-symbols-outlined text-lg">picture_as_pdf</span> Exportar PDF
                        </button>
                        <button className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors">
                            <span className="material-symbols-outlined text-lg">table_view</span> Exportar Excel
                        </button>
                        <button 
                            onClick={() => onNavigate('debt_management')}
                            className="px-5 py-2.5 bg-[#1152d4] text-white rounded-lg text-xs font-bold hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-100 transition-colors"
                        >
                            <span className="material-symbols-outlined text-lg">arrow_back</span> Voltar à Gestão
                        </button>
                    </div>
                </div>

                {/* KPI Cards Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10 border border-gray-100 rounded-2xl p-6 bg-white shadow-soft">
                    {/* Saldo Devedor */}
                    <div className="border-r border-gray-100 pr-6 last:border-0 last:pr-0">
                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2">SALDO DEVEDOR TOTAL (ATUAL)</p>
                        <div className="mb-2">
                            <span className="text-xs font-bold text-gray-400 mr-1">R$</span>
                            <span className="text-3xl font-black text-gray-900">1.245.890,00</span>
                        </div>
                        <p className="text-[10px] font-bold text-red-500 flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">trending_up</span> +2.4% (Correção INCC)
                        </p>
                    </div>

                    {/* Total Quitado */}
                    <div className="border-r border-gray-100 px-6 last:border-0 last:pr-0">
                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2">TOTAL JÁ QUITADO</p>
                        <p className="text-xl font-black text-gray-900 mb-1">R$ 458.200,00</p>
                        <p className="text-[10px] font-medium text-gray-400">Fase 1 + Fase 2 (27%)</p>
                    </div>

                    {/* Valor Original */}
                    <div className="border-r border-gray-100 px-6 last:border-0 last:pr-0">
                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2">VALOR TOTAL ORIGINAL</p>
                        <p className="text-xl font-black text-gray-900 mb-1">R$ 1.650.000,00</p>
                        <p className="text-[10px] font-medium text-gray-400">Contrato Base</p>
                    </div>

                    {/* Prazo */}
                    <div className="pl-6">
                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2">PRAZO RESTANTE</p>
                        <p className="text-xl font-black text-gray-900 mb-1">324 Meses</p>
                        <p className="text-[10px] font-medium text-gray-400">~27 Anos</p>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left Column (Chart) */}
                    <div className="lg:col-span-2 bg-white border border-gray-200 rounded-[1.5rem] p-8 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-900">Evolução do Saldo Devedor</h3>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-[#1152d4]"></span>
                                    <span className="text-xs font-medium text-gray-500">Principal</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                                    <span className="text-xs font-medium text-gray-500">Juros</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={curveData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorPrincipal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#1152d4" stopOpacity={0.1}/>
                                            <stop offset="95%" stopColor="#1152d4" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                                    <Area type="monotone" dataKey="interest" stackId="1" stroke="#fb923c" fill="transparent" strokeWidth={3} strokeDasharray="5 5" />
                                    <Area type="monotone" dataKey="principal" stackId="2" stroke="#1152d4" fill="url(#colorPrincipal)" strokeWidth={4} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Right Column (Phases) */}
                    <div className="lg:col-span-1 bg-white border border-gray-200 rounded-[1.5rem] p-6 shadow-sm flex flex-col">
                        <h3 className="text-lg font-bold text-gray-900 mb-6">Resumo por Fases</h3>
                        
                        <div className="flex-1">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-gray-100">
                                        <th className="pb-3 text-[10px] font-bold text-blue-600 uppercase">FASE</th>
                                        <th className="pb-3 text-[10px] font-bold text-blue-600 uppercase text-right">PAGO</th>
                                        <th className="pb-3 text-[10px] font-bold text-blue-600 uppercase text-right">DEVIDO</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    <tr>
                                        <td className="py-4">
                                            <p className="text-sm font-bold text-gray-900">Fase 1</p>
                                            <p className="text-[10px] text-gray-400">Construtora</p>
                                        </td>
                                        <td className="py-4 text-right text-sm font-medium text-green-600">R$ 250k</td>
                                        <td className="py-4 text-right text-sm font-medium text-gray-400">-</td>
                                    </tr>
                                    <tr>
                                        <td className="py-4">
                                            <p className="text-sm font-bold text-gray-900">Fase 2</p>
                                            <p className="text-[10px] text-gray-400">Bancária</p>
                                        </td>
                                        <td className="py-4 text-right text-sm font-medium text-green-600">R$ 208k</td>
                                        <td className="py-4 text-right text-sm font-bold text-gray-900">R$ 1.2M</td>
                                    </tr>
                                    <tr className="bg-gray-50">
                                        <td className="py-4 pl-2 font-bold text-xs text-gray-700">TOTAL</td>
                                        <td className="py-4 text-right font-black text-xs text-gray-900">R$ 458k</td>
                                        <td className="py-4 pr-2 text-right font-black text-xs text-red-500">R$ 1.2M</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-6 bg-orange-50 border border-orange-100 rounded-xl p-4 flex items-start gap-3">
                            <span className="material-symbols-outlined text-orange-600 text-lg mt-0.5">warning</span>
                            <p className="text-[10px] text-orange-800 font-medium leading-relaxed">
                                Juros/Correção acumulados até o momento: <span className="font-bold">R$ 42.350,00</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Bottom Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
                    
                    {/* Composition */}
                    <div className="bg-white border border-gray-200 rounded-[1.5rem] p-6 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-900 mb-6">Composição dos Pagamentos</h3>
                        <div className="flex items-center gap-4">
                            <div className="relative w-32 h-32">
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie data={paymentComposition} innerRadius={40} outerRadius={55} dataKey="value" stroke="none">
                                            {paymentComposition.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-xl font-black text-gray-900">72%</span>
                                    <span className="text-[9px] font-bold text-gray-400 uppercase">Amort.</span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-3">
                                {paymentComposition.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                                        <div>
                                            <p className="text-xs text-gray-500 leading-none mb-0.5">{item.name}</p>
                                            <p className="text-sm font-bold text-gray-900 leading-none">{item.value}%</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* AI Insight */}
                    <div className="bg-[#f0f6ff] border border-blue-100 rounded-[1.5rem] p-6 shadow-sm relative overflow-hidden">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="material-symbols-outlined text-[#1152d4]">auto_awesome</span>
                            <span className="text-xs font-black text-[#1152d4] uppercase tracking-widest">IA INSIGHT FINANCEIRO</span>
                        </div>
                        <div className="absolute top-4 right-4 bg-white/50 w-8 h-8 rounded-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-blue-300 text-sm">settings</span>
                        </div>
                        
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Potencial de Recomposição</h3>
                        <p className="text-xs text-gray-600 leading-relaxed mb-6">
                            A análise preditiva indica que com a taxa atual de amortização, haverá recomposição total do capital investido em <span className="font-bold text-gray-900">3 anos e 2 meses</span>. O risco de alavancagem é classificado como <span className="font-bold text-gray-900">Baixo</span>.
                        </p>
                        
                        <button className="text-[10px] font-bold text-blue-600 uppercase tracking-wide flex items-center gap-1 hover:underline">
                            VER ANÁLISE COMPLETA <span className="material-symbols-outlined text-xs">arrow_forward</span>
                        </button>
                    </div>

                    {/* Partner Division */}
                    <div className="bg-white border border-gray-200 rounded-[1.5rem] p-6 shadow-sm flex flex-col">
                        <h3 className="text-lg font-bold text-gray-900 mb-6">Divisão de Custos</h3>
                        
                        <div className="flex-1 space-y-4">
                            <div className="flex justify-between text-[9px] font-bold text-blue-600 uppercase tracking-widest border-b border-gray-100 pb-2">
                                <span>SÓCIO</span>
                                <span>%</span>
                                <span>CONTRIBUÍDO</span>
                            </div>
                            {partners.map((partner, idx) => (
                                <div key={idx} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        {partner.avatar ? (
                                            <img src={partner.avatar} className="w-8 h-8 rounded-full border border-gray-200" alt={partner.name} />
                                        ) : (
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${partner.color}`}>{partner.initials}</div>
                                        )}
                                        <span className="text-sm font-bold text-gray-900">{partner.name}</span>
                                    </div>
                                    <span className="text-xs font-medium text-gray-500">{partner.share}%</span>
                                    <span className="text-sm font-bold text-gray-900">{formatCurrency(partner.contributed)}</span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                            <span className="text-[10px] font-bold text-gray-500 uppercase">TOTAL APORTADO</span>
                            <span className="text-lg font-black text-[#1152d4]">{formatCurrency(458200)}</span>
                        </div>
                    </div>

                </div>
            </div>

            <div className="max-w-[1200px] mx-auto mt-12 text-center text-xs text-gray-400">
                <p>Sistema Patrimonial PRO © 2024 - Todos os direitos reservados.</p>
            </div>
        </div>
    );
};
    