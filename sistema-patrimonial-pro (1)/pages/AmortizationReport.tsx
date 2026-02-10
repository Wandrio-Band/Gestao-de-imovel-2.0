import React from 'react';
import { AmortizationResult } from '../types';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface Props {
    result: AmortizationResult | null;
    onBack: () => void;
    onSave: (result: AmortizationResult) => void;
}

const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

const formatCompact = (val: number) => 
    new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(val);

export const AmortizationReport: React.FC<Props> = ({ result, onBack, onSave }) => {
    if (!result) return null;

    // --- Mock Data Generation for Charts based on Result ---
    
    // 1. Evolution Curve Data
    const generateCurveData = () => {
        const data = [];
        const steps = 10;
        const originalStep = result.original.balance / steps;
        const simulatedStep = result.simulated.balance / steps;
        
        for (let i = 0; i <= steps; i++) {
            data.push({
                name: `Ano ${i}`,
                Original: Math.max(0, result.original.balance - (originalStep * i)),
                Simulado: Math.max(0, result.simulated.balance - (simulatedStep * i)) // Rough linear approx for viz
            });
        }
        return data;
    };
    const curveData = generateCurveData();

    // 2. Pie Data (Composition)
    const pieDataOriginal = [
        { name: 'Principal', value: result.original.balance, color: '#e5e7eb' },
        { name: 'Juros', value: result.original.totalInterest, color: '#1152d4' },
    ];
    const pieDataSimulated = [
        { name: 'Principal', value: result.simulated.balance, color: '#e5e7eb' },
        { name: 'Juros', value: result.simulated.totalInterest, color: '#10b981' },
    ];

    // 3. Table Data (Detailed)
    const generateTableRows = () => {
        const rows = [];
        const years = [2024, 2025, 2030, 2035];
        let balance = result.original.balance;
        
        years.forEach((year, idx) => {
            rows.push({
                year,
                balance: balance * (1 - (idx * 0.2)), // Mock decay
                payment: result.original.monthlyPayment,
                interest: result.original.monthlyPayment * 0.4,
                amortization: result.original.monthlyPayment * 0.6,
                extra: year === parseInt(result.simulationDate.split('-')[0]) ? result.extraPayment : 0,
                final: balance * (1 - ((idx + 1) * 0.2))
            });
        });
        return rows;
    };
    const tableRows = generateTableRows();


    return (
        <div className="bg-[#f6f6f8] min-h-full p-8 animate-fade-in-up pb-32">
            {/* Top Bar / Warning */}
            <div className="bg-green-50 border border-green-100 text-green-800 px-6 py-3 rounded-xl flex items-center gap-2 text-xs font-bold uppercase tracking-wide mb-8 max-w-[1200px] mx-auto">
                <span className="material-symbols-outlined text-sm">verified</span>
                Visão de Auditoria Técnica Ativada: Detalhando impacto do aporte extraordinário.
            </div>

            <div className="max-w-[1200px] mx-auto space-y-8">
                
                {/* Header */}
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">Relatório Técnico - Impacto Bancário Detalhado</h1>
                    <p className="text-gray-500">Simulação avançada para {result.assetName} | Sistema SAC</p>
                </div>

                {/* Summary Box */}
                <div className="bg-white rounded-[2rem] p-10 shadow-soft border border-gray-100 flex flex-col md:flex-row gap-10 items-center">
                    <div className="flex-1">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">RESUMO DO RESULTADO</p>
                        <p className="text-gray-800 text-lg leading-relaxed font-medium">
                            Com a antecipação realizada, o financiamento será quitado em <span className="font-black text-black underline decoration-green-400 decoration-2">Junho de 2045</span>, 
                            antecipando a data original em <span className="font-black text-black">{result.monthsReduced} meses</span>. 
                            A operação resultará em um montante total economizado de <span className="font-black text-green-600">{formatCurrency(result.savings)}</span> em juros bancários não pagos.
                        </p>
                    </div>
                    <div className="bg-gray-50 rounded-3xl p-8 min-w-[300px] text-center">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">ECONOMIA TOTAL</p>
                        <p className="text-4xl font-black text-green-500">{formatCompact(result.savings)}</p>
                    </div>
                </div>

                {/* Comparison Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Without Anticipation */}
                    <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden">
                        <div className="flex justify-between items-start mb-8">
                            <h3 className="text-2xl font-black text-gray-900">Sem Antecipação</h3>
                            <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded text-[10px] font-bold uppercase">CENÁRIO BASE</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                            <div>
                                <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">VALOR EMPRESTADO</p>
                                <p className="text-sm font-black text-gray-900">{formatCurrency(result.original.balance)}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">TOTAL A SER PAGO</p>
                                <p className="text-sm font-black text-red-500">{formatCurrency(result.original.totalPaid)}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">TOTAL DE JUROS</p>
                                <p className="text-sm font-black text-gray-900">{formatCurrency(result.original.totalInterest)}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">PARCELAS</p>
                                <p className="text-sm font-black text-gray-900">{result.original.term} meses</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">CET (ANUAL)</p>
                                <p className="text-sm font-black text-gray-900">10.8% a.a.</p>
                            </div>
                        </div>
                    </div>

                    {/* With Anticipation */}
                    <div className="bg-white p-8 rounded-[2rem] border-2 border-green-500/20 shadow-xl shadow-green-100 relative overflow-hidden">
                        <div className="flex justify-between items-start mb-8">
                            <h3 className="text-2xl font-black text-green-600">Com Antecipação</h3>
                            <span className="bg-green-500 text-white px-3 py-1 rounded text-[10px] font-bold uppercase shadow-sm">SIMULADO</span>
                        </div>

                        <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                            <div>
                                <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">NOVO SALDO</p>
                                <p className="text-sm font-black text-gray-900">{formatCurrency(result.simulated.balance)}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">TOTAL A SER PAGO</p>
                                <p className="text-sm font-black text-green-600">{formatCurrency(result.simulated.totalPaid)}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">TOTAL DE JUROS</p>
                                <p className="text-sm font-black text-gray-900">{formatCurrency(result.simulated.totalInterest)}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">PARCELAS</p>
                                <p className="text-sm font-black text-green-600">{result.simulated.term} meses</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">PRAZO REDUZIDO</p>
                                <p className="text-sm font-black text-gray-900">- {result.monthsReduced} meses</p>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-dashed border-green-200">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">ECONOMIA REAL GERADA</p>
                                    <p className="text-2xl font-black text-green-600">{formatCurrency(result.savings)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">APORTE REALIZADO</p>
                                    <p className="text-sm font-bold text-gray-900">{formatCurrency(result.extraPayment)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Evolution Chart */}
                    <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-900">Evolução de Saldo Devedor</h3>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2"><div className="w-3 h-1 bg-gray-300 rounded-full"></div><span className="text-[10px] font-bold text-gray-400 uppercase">Original</span></div>
                                <div className="flex items-center gap-2"><div className="w-3 h-1 bg-[#1152d4] rounded-full"></div><span className="text-[10px] font-bold text-blue-600 uppercase">Simulado</span></div>
                            </div>
                        </div>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={curveData}>
                                    <defs>
                                        <linearGradient id="colorOriginal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#e5e7eb" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#e5e7eb" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorSimulado" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#1152d4" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#1152d4" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                                    <Tooltip />
                                    <Area type="monotone" dataKey="Original" stroke="#9ca3af" strokeDasharray="5 5" fillOpacity={1} fill="url(#colorOriginal)" />
                                    <Area type="monotone" dataKey="Simulado" stroke="#1152d4" strokeWidth={3} fillOpacity={1} fill="url(#colorSimulado)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Donut Charts */}
                    <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col items-center justify-center">
                        <h3 className="text-lg font-bold text-gray-900 mb-6">Composição da Parcela</h3>
                        <div className="flex gap-4">
                            <div className="relative w-28 h-28">
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie data={pieDataOriginal} innerRadius={35} outerRadius={50} dataKey="value" stroke="none">
                                            {pieDataOriginal.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-[8px] font-bold text-gray-400 uppercase">Original</span>
                                    <span className="text-sm font-black text-gray-900">40%</span>
                                </div>
                            </div>
                            <div className="relative w-28 h-28">
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie data={pieDataSimulated} innerRadius={35} outerRadius={50} dataKey="value" stroke="none">
                                            {pieDataSimulated.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-[8px] font-bold text-green-600 uppercase">Simulado</span>
                                    <span className="text-sm font-black text-gray-900">25%</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-center gap-4 mt-6">
                             <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-gray-200"></div><span className="text-[9px] font-bold text-gray-400 uppercase">Amortização</span></div>
                             <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-600"></div><span className="text-[9px] font-bold text-gray-400 uppercase">Juros</span></div>
                        </div>
                    </div>
                </div>

                {/* Detailed Table */}
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-gray-100">
                        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">RESULTADO DETALHADO (AMORTIZAÇÃO)</h3>
                    </div>
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-[9px] font-bold text-gray-400 uppercase tracking-widest">ANO</th>
                                <th className="px-6 py-4 text-[9px] font-bold text-gray-400 uppercase tracking-widest">SALDO INICIAL</th>
                                <th className="px-6 py-4 text-[9px] font-bold text-gray-400 uppercase tracking-widest">PARCELA (AVG)</th>
                                <th className="px-6 py-4 text-[9px] font-bold text-gray-400 uppercase tracking-widest">JUROS</th>
                                <th className="px-6 py-4 text-[9px] font-bold text-gray-400 uppercase tracking-widest">AMORTIZAÇÃO</th>
                                <th className="px-6 py-4 text-[9px] font-bold text-blue-600 uppercase tracking-widest">AMORT. EXTRA</th>
                                <th className="px-6 py-4 text-[9px] font-bold text-gray-400 uppercase tracking-widest text-right">SALDO FINAL</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {tableRows.map((row, idx) => (
                                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-xs font-bold text-gray-900">{row.year}</td>
                                    <td className="px-6 py-4 text-xs font-medium text-gray-500">{formatCurrency(row.balance + (row.balance * 0.1))}</td>
                                    <td className="px-6 py-4 text-xs font-bold text-gray-900">{formatCurrency(row.payment)}</td>
                                    <td className="px-6 py-4 text-xs font-medium text-gray-500">{formatCurrency(row.interest)}</td>
                                    <td className="px-6 py-4 text-xs font-medium text-gray-500">{formatCurrency(row.amortization)}</td>
                                    <td className="px-6 py-4 text-xs font-bold text-blue-600">
                                        {row.extra > 0 ? formatCurrency(row.extra) : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-xs font-black text-gray-900 text-right">{formatCurrency(row.final)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Actions Footer */}
                <div className="flex gap-4 mt-8 pb-12">
                    <button 
                        onClick={() => onSave(result)}
                        className="flex-1 bg-black text-white py-4 rounded-xl font-bold text-sm shadow-xl hover:bg-gray-800 transition-all uppercase tracking-wide flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined">save</span>
                        Salvar Relatório
                    </button>
                    <button 
                        onClick={onBack}
                        className="flex-1 bg-white border border-gray-200 text-gray-900 py-4 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all uppercase tracking-wide"
                    >
                        Voltar ao Início
                    </button>
                </div>

                <div className="flex justify-between items-center border-t border-gray-200 pt-8">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">© 2024 PROPSIM PRO • RELATÓRIO TÉCNICO V1</span>
                    <div className="flex gap-6">
                        <button className="text-[10px] font-bold text-gray-400 uppercase hover:text-gray-600">Baixar Memória de Cálculo</button>
                        <button className="text-[10px] font-bold text-gray-400 uppercase hover:text-gray-600">Ver Nota Técnica</button>
                    </div>
                </div>

            </div>
        </div>
    );
};