import React from 'react';
import { useAssetContext } from '@/context/AssetContext';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Asset, ViewState } from '../types';

interface DebtManagementProps {
    onNavigate?: (view: ViewState, asset?: Asset) => void;
}

const cashOutData = [
    { name: 'Jan', regular: 450000, balloon: 0 },
    { name: 'Fev', regular: 450000, balloon: 0 },
    { name: 'Mar', regular: 480000, balloon: 0 },
    { name: 'Abr', regular: 450000, balloon: 0 },
    { name: 'Mai', regular: 450000, balloon: 800000 },
    { name: 'Jun', regular: 450000, balloon: 0 },
    { name: 'Jul', regular: 450000, balloon: 0 },
    { name: 'Ago', regular: 450000, balloon: 950000 },
    { name: 'Set', regular: 450000, balloon: 0 },
    { name: 'Out', regular: 450000, balloon: 0 },
    { name: 'Nov', regular: 450000, balloon: 0 },
    { name: 'Dez', regular: 500000, balloon: 0 },
];

export const DebtManagement: React.FC<DebtManagementProps> = ({ onNavigate }) => {
    // 1. Calculate Debt Metrics from Assets
    const { assets } = useAssetContext();
    const assetsWithDebt = assets.filter(a => a.financingDetails);

    const totalMarketValue = assets.reduce((acc, curr) => acc + curr.marketValue, 0);

    const totalDebt = assetsWithDebt.reduce((acc, curr) => {
        // Parse string "1.000,00" to number
        const saldo = curr.financingDetails?.saldoDevedor || 0;
        return acc + saldo;
    }, 0);

    const totalMonthlyService = assetsWithDebt.reduce((acc, curr) => {
        // Estimate monthly payment based on active phases (simplified logic for mock)
        const phases = curr.financingDetails?.phases;
        if (!phases) return acc;
        const mensal = (phases.mensais?.qtd > 0) ? phases.mensais.unitario : 0;
        return acc + mensal;
    }, 0);

    const ltv = (totalDebt / totalMarketValue) * 100;

    // 2. Prepare Chart Data
    const debtByIndexer = [
        { name: 'INCC (Obras)', value: 0, color: '#f59e0b' }, // Orange
        { name: 'IPCA (Bancário)', value: 0, color: '#3b82f6' }, // Blue
        { name: 'IGP-M', value: 0, color: '#8b5cf6' }, // Purple
        { name: 'CDI', value: 0, color: '#10b981' }  // Green
    ];

    assetsWithDebt.forEach(asset => {
        const debt = asset.financingDetails?.saldoDevedor || 0;
        const indexer = asset.financingDetails?.indexador || 'OUTROS';

        if (indexer.includes('INCC') || !asset.financingDetails?.vencimentoPrimeira) {
            debtByIndexer[0].value += debt;
        } else if (indexer.includes('IPCA')) {
            debtByIndexer[1].value += debt;
        } else if (indexer.includes('IGP')) {
            debtByIndexer[2].value += debt;
        } else {
            debtByIndexer[3].value += debt;
        }
    });

    // Filter out empty indexers
    const activeIndexers = debtByIndexer.filter(i => i.value > 0);

    const formatCurrency = (val: number | string) => {
        if (typeof val === 'string') return `R$ ${val}`;
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    return (
        <div className="p-8 max-w-[1600px] mx-auto pb-24 animate-fade-in-up">
            {/* Header */}
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded bg-red-50 text-red-700 text-[10px] font-bold uppercase tracking-wide border border-red-100">Passivos & Alavancagem</span>
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Gestão de Dívida</h1>
                    <p className="text-gray-500 mt-1">Monitoramento de saldo devedor, taxas e amortizações.</p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Total Debt */}
                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-soft relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">SALDO DEVEDOR TOTAL</span>
                        <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
                            <span className="material-symbols-outlined">trending_down</span>
                        </div>
                    </div>
                    <h3 className="text-3xl font-black text-gray-900 mb-1">{formatCurrency(totalDebt)}</h3>
                    <p className="text-xs text-gray-400">Principal + Juros Acumulados</p>
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-red-500"></div>
                </div>

                {/* Monthly Service */}
                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-soft relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">SERVIÇO DA DÍVIDA (MÊS)</span>
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                            <span className="material-symbols-outlined">payments</span>
                        </div>
                    </div>
                    <h3 className="text-3xl font-black text-gray-900 mb-1">{formatCurrency(totalMonthlyService)}</h3>
                    <p className="text-xs text-gray-400">Fluxo de Caixa Comprometido</p>
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600"></div>
                </div>

                {/* LTV */}
                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-soft relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">LTV (LOAN-TO-VALUE)</span>
                        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                            <span className="material-symbols-outlined">pie_chart</span>
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-3xl font-black text-gray-900 mb-1">{ltv.toFixed(1)}%</h3>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${ltv < 30 ? 'bg-green-100 text-green-700' : ltv < 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                            {ltv < 30 ? 'SAUDÁVEL' : 'ATENÇÃO'}
                        </span>
                    </div>
                    <p className="text-xs text-gray-400">Alavancagem sobre Patrimônio</p>
                    <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3 overflow-hidden">
                        <div className="h-full bg-orange-500" style={{ width: `${ltv}%` }}></div>
                    </div>
                </div>

                {/* Weighted Rate */}
                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-soft relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">TAXA MÉDIA PONDERADA</span>
                        <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                            <span className="material-symbols-outlined">percent</span>
                        </div>
                    </div>
                    <h3 className="text-3xl font-black text-gray-900 mb-1">9.85% <span className="text-sm font-bold text-gray-400">a.a.</span></h3>
                    <p className="text-xs text-gray-400">+ IPCA (Inflação)</p>
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-purple-600"></div>
                </div>
            </div>

            {/* Active Contracts Table (Updated per request) */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-soft overflow-hidden mb-8">
                <div className="p-6 border-b border-gray-100 bg-white flex justify-between items-center">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <span className="material-symbols-outlined text-gray-500">list_alt</span>
                        Situação Financeira dos Ativos
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-100 bg-white">
                                <th className="py-5 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-1/4">Imóvel / Contrato</th>
                                <th className="py-5 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Valor Total Imóvel</th>
                                <th className="py-5 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Total Quitado (Obra)</th>
                                <th className="py-5 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Saldo Devedor (Const.)</th>
                                <th className="py-5 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">A Financiar (Banco)</th>
                                <th className="py-5 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Status</th>
                                <th className="py-5 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 bg-white">
                            {assetsWithDebt.map((asset) => {
                                const fin = asset.financingDetails!;
                                const debt = fin.saldoDevedor || 0;
                                const paid = fin.valorQuitado || 0;
                                const total = fin.valorTotal; // String
                                const bankFinance = fin.valorFinanciar; // String

                                return (
                                    <tr key={asset.id} className="hover:bg-gray-50/50 transition-colors group cursor-pointer" onClick={() => onNavigate && onNavigate('debt_details', asset)}>

                                        {/* Imóvel / Contrato */}
                                        <td className="py-6 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                    {asset.image ? (
                                                        <img src={asset.image} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="material-symbols-outlined text-gray-400">apartment</span>
                                                    )}
                                                </div>
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-sm font-bold text-gray-900">{asset.name}</span>
                                                    <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">ALIENADO FIDUCIARIAMENTE</span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Valor Total Imóvel */}
                                        <td className="py-6 px-6 text-right">
                                            <div className="flex flex-col items-end gap-1">
                                                <span className="text-sm font-black text-gray-900">{formatCurrency(total)}</span>
                                                <span className="material-symbols-outlined text-gray-300 text-xs">real_estate_agent</span>
                                            </div>
                                        </td>

                                        {/* Total Quitado (Obra) */}
                                        <td className="py-6 px-6 text-right">
                                            <div className="flex flex-col items-end gap-1">
                                                <span className="text-sm font-black text-green-600">{formatCurrency(paid)}</span>
                                                <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                                                    <div className="h-full bg-green-500 w-full"></div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Saldo Devedor (Const.) */}
                                        <td className="py-6 px-6 text-right">
                                            <div className="flex flex-col items-end gap-1">
                                                <span className="text-sm font-black text-orange-500">{formatCurrency(debt)}</span>
                                                <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                                                    <div className="h-full bg-orange-400 w-1/2"></div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* A Financiar (Banco) */}
                                        <td className="py-6 px-6 text-right">
                                            <div className="flex flex-col items-end gap-1">
                                                <span className="text-sm font-black text-blue-800">{formatCurrency(bankFinance)}</span>
                                                <span className="material-symbols-outlined text-blue-200 text-xs">account_balance</span>
                                            </div>
                                        </td>

                                        {/* Status */}
                                        <td className="py-6 px-6 text-center">
                                            <span className="inline-block px-3 py-1 rounded-sm text-[10px] font-bold uppercase bg-green-50 text-green-700 border border-green-100 tracking-wide">
                                                EM DIA
                                            </span>
                                        </td>

                                        {/* Ações */}
                                        <td className="py-6 px-6 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onNavigate && onNavigate('financing_details', asset); }}
                                                    className="w-8 h-8 rounded-full hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition-colors flex items-center justify-center"
                                                    title="Ver Cronograma & Edição"
                                                >
                                                    <span className="material-symbols-outlined text-lg">edit_calendar</span>
                                                </button>
                                                <button
                                                    className="text-gray-300 hover:text-gray-600 transition-colors"
                                                >
                                                    <span className="material-symbols-outlined text-xl">chevron_right</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Chart: Indexer Composition */}
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-soft p-8 flex flex-col items-center justify-center relative">
                    <h3 className="text-sm font-bold text-gray-900 absolute top-8 left-8">Exposição por Indexador</h3>
                    <div className="h-64 w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={activeIndexers}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {activeIndexers.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value: any) => formatCurrency(Number(value))}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Legend */}
                        <div className="flex justify-center gap-4 flex-wrap mt-[-20px]">
                            {activeIndexers.map((entry, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></span>
                                    <span className="text-xs font-bold text-gray-500">{entry.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Maturity Profile (Mock Bar Chart) */}
                <div className="lg:col-span-2 bg-white rounded-[2rem] border border-gray-100 shadow-soft p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm font-bold text-gray-900">Perfil de Vencimento da Dívida (Próximos 5 anos)</h3>
                        <select className="bg-gray-50 border-none text-xs font-bold rounded-lg px-3 py-1.5 outline-none cursor-pointer">
                            <option>Principal + Juros</option>
                            <option>Apenas Principal</option>
                        </select>
                    </div>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[
                                { year: '2024', amount: 120000 },
                                { year: '2025', amount: 480000 }, // High due to "keys" or balloon
                                { year: '2026', amount: 150000 },
                                { year: '2027', amount: 155000 },
                                { year: '2028', amount: 160000 },
                            ]}>
                                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 'bold', fill: '#9ca3af' }} />
                                <Tooltip
                                    cursor={{ fill: '#f3f4f6', radius: 8 }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    formatter={(value: any) => formatCurrency(Number(value))}
                                />
                                <Bar dataKey="amount" fill="#111827" radius={[6, 6, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Cash Out Projection Chart */}
            <div className="bg-white rounded-[2rem] shadow-soft border border-gray-100 p-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Projeção de Cash Out (Consolidado)</h2>
                        <p className="text-sm text-gray-500">Visualização de liquidez para os próximos 12 meses em toda a carteira</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-[#2563eb]"></span>
                            <span className="text-[10px] font-bold text-gray-500 uppercase">MENSAL REGULAR</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-[#f97316]"></span>
                            <span className="text-[10px] font-bold text-gray-500 uppercase">PARCELAS BALÃO</span>
                        </div>
                    </div>
                </div>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={cashOutData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }} barSize={40}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280', fontWeight: 'bold' }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(value) => `R$ ${(value / 1000000).toFixed(1)}M`} />
                            <Tooltip
                                cursor={{ fill: '#f9fafb' }}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                formatter={(value: any) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Number(value))}
                            />
                            <Bar dataKey="regular" stackId="a" fill="#2563eb" radius={[0, 0, 4, 4]} />
                            <Bar dataKey="balloon" stackId="a" fill="#f97316" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};