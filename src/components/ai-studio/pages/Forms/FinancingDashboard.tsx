import React, { useState } from 'react';
import { FinancingModal } from './FinancingModal';
import { CashFlowModal } from './CashFlowModal';
import { AreaChart, Area, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Asset, ViewState, CashFlowItem, KPICardProps } from '../../types';

interface FinancingDashboardProps {
    asset?: Asset | null;
    onNavigate: (view: ViewState, asset?: Asset) => void;
    onUpdateAsset?: (asset: Asset) => void;
}

const data = [
    { name: 'Jan', value: 2400 },
    { name: 'Feb', value: 1398 },
    { name: 'Mar', value: 9800 },
    { name: 'Apr', value: 3908 },
    { name: 'May', value: 4800 },
    { name: 'Jun', value: 3800 },
    { name: 'Jul', value: 4300 },
];

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

// --- Sub-components for Schedule View ---

const KPICard: React.FC<KPICardProps> = ({ icon, label, value, subtext, colorClass, type = 'standard' }) => (
    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-soft flex flex-col justify-between relative overflow-hidden group hover:border-blue-100 transition-colors">
        <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass}`}>
                    <span className="material-symbols-outlined">{icon}</span>
                </div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
            </div>
        </div>
        <div>
            <h3 className="text-3xl font-black text-gray-900 tracking-tight mb-1">{value}</h3>
            <p className={`text-xs font-bold ${type === 'progress' ? 'text-green-600' : 'text-gray-400'}`}>{subtext}</p>
        </div>
    </div>
);

const CircularProgress = ({ percentage }: { percentage: number }) => {
    const radius = 35;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative w-24 h-24 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
                <circle cx="48" cy="48" r={radius} stroke="#f3f4f6" strokeWidth="8" fill="transparent" />
                <circle
                    cx="48" cy="48" r={radius}
                    stroke="#10B981" strokeWidth="8" fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-black text-gray-900">{percentage}%</span>
                <span className="text-[8px] font-bold text-gray-400 uppercase">Realizado</span>
            </div>
        </div>
    );
};

export const FinancingDashboard: React.FC<FinancingDashboardProps> = ({ asset, onNavigate, onUpdateAsset }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'editing' | 'projected'>('editing');
    const [expandedPartner, setExpandedPartner] = useState<string | null>('Raquel');
    const [scheduleFilter, setScheduleFilter] = useState<'all' | 'realized' | 'projected'>('all');

    // Cash Flow Table State
    const [selectedCashFlowId, setSelectedCashFlowId] = useState<string | null>(null);
    const [isCashFlowModalOpen, setIsCashFlowModalOpen] = useState(false);
    const [editingCashFlowItem, setEditingCashFlowItem] = useState<CashFlowItem | null>(null);

    // Helpers to safely get data
    const formatCurrency = (val: number | string | undefined) => {
        if (val === undefined || val === null) return 'R$ 0,00';
        const num = typeof val === 'string' ? parseFloat(val.replace(/\./g, '').replace(',', '.')) : val;
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num || 0);
    };

    const financing = asset?.financingDetails || {} as any;
    const subtotalConstrutora = financing.subtotalConstrutora || 0;
    const valorFinanciar = financing.valorFinanciar ? parseFloat(financing.valorFinanciar.replace(/\./g, '').replace(',', '.')) : 0;
    const valorTotal = financing.valorTotal ? parseFloat(financing.valorTotal.replace(/\./g, '').replace(',', '.')) : 0;
    const valorQuitado = financing.valorQuitado || 0;
    const saldoDevedor = financing.saldoDevedor || 0;

    // Extração robusta das fases para evitar crash se alguma propriedade faltar
    const rawPhases = financing.phases || {};
    const phases = {
        sinal: rawPhases.sinal || { qtd: 0, unitario: 0 },
        mensais: rawPhases.mensais || { qtd: 0, unitario: 0 },
        baloes: rawPhases.baloes || { qtd: 0, unitario: 0 }
    };

    const sinalTotal = phases.sinal ? phases.sinal.qtd * phases.sinal.unitario : 0;
    const mensaisTotal = phases.mensais ? phases.mensais.qtd * phases.mensais.unitario : 0;
    const cashFlow: CashFlowItem[] = financing.cashFlow || [];

    // Mock Data for Schedule View
    const years = [2024, 2025, 2026];
    const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

    // Generating a grid of mock values to match the screenshot
    const getCellData = (year: number, monthIndex: number) => {
        const isPast = year < 2024 || (year === 2024 && monthIndex < 4); // Jan-Mar 2024 paid
        const isBaloon = (monthIndex === 5 || monthIndex === 11); // Jun and Dec
        const baseValue = 15000;
        const baloonValue = 65000;

        let amount = isBaloon ? baloonValue : baseValue;

        // Simulate slight variations or specific highlights
        if (year === 2026 && monthIndex === 10) return { amount: 28000, status: 'BALÃO', isBaloon: true }; // Nov 2026 Highlight

        return {
            amount,
            status: isPast ? 'PAGO' : 'PREVISTO',
            isBaloon: isBaloon && !isPast
        };
    };

    // Calculate Monthly Totals (Vertical Sum)
    const getMonthlyTotal = (monthIndex: number) => {
        let sum = 0;
        years.forEach((year) => {
            sum += getCellData(year, monthIndex).amount;
        });
        return sum;
    };

    // --- Handlers for Cash Flow ---
    const handleAddCashFlow = () => {
        setEditingCashFlowItem(null);
        setIsCashFlowModalOpen(true);
    };

    const handleEditCashFlow = () => {
        if (!selectedCashFlowId) {
            // Fallback alert, though button should be disabled
            alert("Selecione um lançamento na tabela para editar.");
            return;
        }
        const itemToEdit = cashFlow.find(i => i.id === selectedCashFlowId) || null;
        setEditingCashFlowItem(itemToEdit);
        setIsCashFlowModalOpen(true);
    };

    const handleSaveCashFlow = (newItemData: Partial<CashFlowItem>) => {
        if (!asset || !onUpdateAsset) return;

        let updatedCashFlow = [...cashFlow];

        if (newItemData.id) {
            // Edit existing
            updatedCashFlow = updatedCashFlow.map(item =>
                item.id === newItemData.id ? { ...item, ...newItemData } as CashFlowItem : item
            );
        } else {
            // Create new
            const newItem = {
                ...newItemData,
                id: Date.now().toString(),
            } as CashFlowItem;
            updatedCashFlow.push(newItem);
        }

        // Sort by date (simple string sort for now, better to parse dates in real app)
        // updatedCashFlow.sort...

        const updatedAsset = {
            ...asset,
            financingDetails: {
                ...asset.financingDetails!,
                cashFlow: updatedCashFlow
            }
        };

        onUpdateAsset(updatedAsset);
    };

    return (
        <div className="p-8 max-w-[1600px] mx-auto pb-24 animate-fade-in-up">
            {/* Header */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        {/* Back Button now goes to financial_overview */}
                        <button onClick={() => onNavigate('financial_overview')} className="flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 text-[10px] font-bold uppercase tracking-wide transition-colors">
                            <span className="material-symbols-outlined text-sm">arrow_back</span> Voltar
                        </button>
                        <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold uppercase tracking-wide">Em Andamento</span>
                        <span className="text-sm text-gray-500 font-medium">Fluxo Contratual Aprimorado • {asset?.name || 'Novo Imóvel'}</span>
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Detalhamento do Ativo</h1>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 shadow-sm flex items-center gap-2"
                >
                    <span className="material-symbols-outlined text-lg">edit_document</span> Editar Cadastro
                </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex justify-center mb-10">
                <div className="bg-white p-1.5 rounded-full border border-gray-200 shadow-sm inline-flex">
                    <button
                        onClick={() => setActiveTab('editing')}
                        className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${activeTab === 'editing' ? 'bg-black text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        Modo Edição (Fases)
                    </button>
                    <button
                        onClick={() => setActiveTab('projected')}
                        className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${activeTab === 'projected' ? 'bg-black text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        Cronograma Projetado (Desembolso)
                    </button>
                </div>
            </div>

            {activeTab === 'projected' && (
                <div className="animate-fade-in-up space-y-8">
                    {/* KPI Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <KPICard
                            icon="calendar_month"
                            colorClass="bg-blue-50 text-blue-600"
                            label="Total Previsto para 2024"
                            value="R$ 580.000,00"
                            subtext="+12% vs. ano anterior"
                            type="progress"
                        />
                        <KPICard
                            icon="construction"
                            colorClass="bg-gray-100 text-gray-600"
                            label="Fluxo Construtora Pendente"
                            value="R$ 1.240.000,00"
                            subtext="QUITADO: R$ 800.000,00 (39%)"
                        />
                        <KPICard
                            icon="key"
                            colorClass="bg-blue-50 text-blue-800"
                            label="Início Fase Bancária"
                            value="Nov / 2026"
                            subtext="32 MESES RESTANTES"
                            type="standard"
                        />
                        <div className="bg-white p-4 rounded-[2rem] border border-gray-100 shadow-soft flex items-center justify-between">
                            <div className="h-full flex flex-col justify-center pl-4">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Status de Fluxo</span>
                                <h3 className="text-4xl font-black text-gray-900">65%</h3>
                                <div className="w-24 h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
                                    <div className="w-[65%] h-full bg-green-500 rounded-full"></div>
                                </div>
                            </div>
                            <CircularProgress percentage={65} />
                        </div>
                    </div>

                    {/* Main Table Container */}
                    <div className="bg-white rounded-[2.5rem] shadow-soft border border-gray-100 overflow-hidden">
                        <div className="p-8 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                                    <span className="material-symbols-outlined text-2xl">table_view</span>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Fluxo de Caixa Mensal</h2>
                                    <p className="text-sm text-gray-500">Visão detalhada de desembolsos realizados e futuros.</p>
                                </div>
                            </div>

                            <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-200">
                                <button
                                    onClick={() => setScheduleFilter('realized')}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${scheduleFilter === 'realized' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                                >
                                    Apenas Realizados
                                </button>
                                <button
                                    onClick={() => setScheduleFilter('projected')}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${scheduleFilter === 'projected' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                                >
                                    Apenas Projetados
                                </button>
                                <button
                                    onClick={() => setScheduleFilter('all')}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${scheduleFilter === 'all' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                                >
                                    Visão Geral
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto pb-4">
                            <table className="w-full min-w-[1200px]">
                                <thead>
                                    <tr className="border-b border-gray-100">
                                        <th className="py-6 px-6 text-left text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-gray-50/50 min-w-[100px]">ANO</th>
                                        {months.map(m => (
                                            <th key={m} className="py-6 px-4 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">{m}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {years.map(year => (
                                        <tr key={year} className="group hover:bg-gray-50/50 transition-colors">
                                            <td className="py-6 px-6 bg-white group-hover:bg-gray-50/50 transition-colors sticky left-0 z-10 border-r border-gray-50">
                                                <span className="text-lg font-black text-gray-900">{year}</span>
                                            </td>
                                            {months.map((month, idx) => {
                                                const data = getCellData(year, idx);
                                                const amountK = (data.amount / 1000).toFixed(0) + 'k';

                                                // Opacity Logic based on filter
                                                let opacity = 'opacity-100';
                                                if (scheduleFilter === 'realized' && data.status !== 'PAGO') opacity = 'opacity-20 grayscale';
                                                if (scheduleFilter === 'projected' && data.status === 'PAGO') opacity = 'opacity-20 grayscale';

                                                return (
                                                    <td key={idx} className="py-4 px-2 text-center align-middle">
                                                        <div className={`flex flex-col items-center justify-center gap-1.5 transition-all duration-300 ${opacity}`}>
                                                            {data.status === 'BALÃO' ? (
                                                                <div className="bg-orange-50 border border-orange-100 px-4 py-3 rounded-2xl w-full max-w-[90px] shadow-sm group/cell hover:-translate-y-1 transition-transform">
                                                                    <span className="block text-sm font-black text-gray-900">R$ {amountK}</span>
                                                                    <span className="text-[9px] font-bold text-orange-600 uppercase mt-0.5 block">BALÃO</span>
                                                                </div>
                                                            ) : data.status === 'PAGO' ? (
                                                                <div className="bg-green-50 border border-green-100 px-4 py-3 rounded-2xl w-full max-w-[90px] shadow-sm flex flex-col items-center group/cell hover:-translate-y-1 transition-transform">
                                                                    <span className="block text-sm font-black text-gray-900">R$ {amountK}</span>
                                                                    <div className="flex items-center gap-1 mt-0.5 text-green-700">
                                                                        <span className="material-symbols-outlined text-[10px] font-bold">check</span>
                                                                        <span className="text-[9px] font-bold uppercase">PAGO</span>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="bg-gray-100 border border-gray-200 px-4 py-3 rounded-2xl w-full max-w-[90px] group/cell hover:-translate-y-1 transition-transform">
                                                                    <span className="block text-sm font-bold text-gray-600">R$ {amountK}</span>
                                                                    <span className="text-[9px] font-bold text-gray-400 uppercase mt-0.5 block">PREVISTO</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-gray-50 border-t border-gray-200">
                                    <tr>
                                        <td className="py-6 px-6 text-left border-r border-gray-200">
                                            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block mb-1">TOTAL</span>
                                            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block">MENSAL</span>
                                        </td>
                                        {months.map((m, idx) => {
                                            const total = getMonthlyTotal(idx);
                                            const totalK = (total / 1000).toFixed(0) + 'k';
                                            return (
                                                <td key={idx} className="py-6 px-2 text-center">
                                                    <span className="text-sm font-black text-blue-700">{totalK}</span>
                                                </td>
                                            )
                                        })}
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* Cash Out Projection Chart */}
                    <div className="bg-white rounded-[2.5rem] shadow-soft border border-gray-100 p-8">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Projeção de Cash Out</h2>
                                <p className="text-sm text-gray-500">Visualização de liquidez para os próximos 12 meses</p>
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
                                        formatter={(value: number | undefined) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value || 0)}
                                    />
                                    <Bar dataKey="regular" stackId="a" fill="#2563eb" radius={[0, 0, 4, 4]} />
                                    <Bar dataKey="balloon" stackId="a" fill="#f97316" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="flex justify-between items-center text-xs text-gray-500 font-medium px-2">
                        <span>Última sincronização: <strong className="text-gray-900">Hoje às 14:30</strong></span>
                        <div className="flex items-center gap-4">
                            <button className="font-bold hover:text-gray-900 transition-colors">Voltar</button>
                            <button className="bg-black text-white px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-gray-800 transition-colors shadow-lg">
                                <span className="material-symbols-outlined text-sm">download</span> Exportar Relatório
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'editing' && (
                <>
                    {/* Top Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        {/* Total Imovel */}
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">VALOR TOTAL IMÓVEL</span>
                                <span className="material-symbols-outlined text-gray-300">real_estate_agent</span>
                            </div>
                            <p className="text-2xl font-black text-gray-900">{formatCurrency(valorTotal)}</p>
                            <div className="w-full bg-blue-600 h-1 absolute bottom-0 left-0"></div>
                        </div>
                        {/* Total Quitado */}
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">TOTAL QUITADO (OBRA)</span>
                                <span className="material-symbols-outlined text-green-500">check_circle</span>
                            </div>
                            <p className="text-2xl font-black text-gray-900">{formatCurrency(valorQuitado)}</p>
                            <div className="w-full bg-green-500 h-1 absolute bottom-0 left-0"></div>
                        </div>
                        {/* Saldo Devedor Const */}
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">SALDO DEVEDOR (CONST.)</span>
                                <span className="material-symbols-outlined text-orange-400">engineering</span>
                            </div>
                            <p className="text-2xl font-black text-gray-900">{formatCurrency(saldoDevedor)}</p>
                            <div className="w-full bg-orange-400 h-1 absolute bottom-0 left-0"></div>
                        </div>
                        {/* A Financiar Banco */}
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">A FINANCIAR (BANCO)</span>
                                <span className="material-symbols-outlined text-blue-800">account_balance</span>
                            </div>
                            <p className="text-2xl font-black text-gray-900">{formatCurrency(valorFinanciar)}</p>
                            <div className="w-full bg-blue-900 h-1 absolute bottom-0 left-0"></div>
                        </div>
                    </div>

                    {/* Fase 1 Card */}
                    <div className="bg-white rounded-[1.5rem] border border-gray-200 shadow-sm overflow-hidden mb-6">
                        <div className="bg-gray-50/80 p-5 border-b border-gray-200 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-100 text-primary flex items-center justify-center"><span className="material-symbols-outlined text-lg">engineering</span></div>
                                <div><h3 className="text-sm font-bold text-gray-900">Fase 1: Construtora & Aporte Inicial</h3><p className="text-[10px] text-gray-500">Gerenciamento de fluxo de obra e entrada parcelada.</p></div>
                            </div>
                            <div className="flex items-center gap-2"><span className="text-xs font-bold text-gray-600">Ativar Fase Construtora</span><div className="w-10 h-5 bg-primary rounded-full relative cursor-pointer"><div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div></div></div>
                        </div>

                        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-4">
                                <div className="flex justify-between items-center mb-2"><h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2"><span className="material-symbols-outlined text-xs">calendar_view_week</span> BLOCOS DE PAGAMENTO</h4><button className="text-[10px] font-bold text-primary bg-blue-50 px-3 py-1.5 rounded-full hover:bg-blue-100 transition flex items-center gap-1"><span className="material-symbols-outlined text-xs">add</span> Adicionar Grupo</button></div>

                                {/* Static blocks matching screenshot */}
                                <div className="bg-white border border-gray-200 rounded-xl p-4 flex justify-between items-center hover:shadow-md transition-shadow">
                                    <div className="flex gap-4 items-center">
                                        <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center"><span className="material-symbols-outlined text-sm">payments</span></div>
                                        <div><h5 className="text-sm font-bold text-gray-900">Entrada (Sinal)</h5><p className="text-[10px] text-gray-500">Vencimento: 10/01/2023</p><p className="text-[10px] text-gray-500">Parcela Única</p></div>
                                    </div>
                                    <div className="text-right"><p className="text-[9px] font-bold text-gray-400 uppercase">VALOR TOTAL</p><p className="text-lg font-bold text-gray-900">{formatCurrency(sinalTotal)}</p><p className="text-[9px] text-gray-400">Sem correção INCC</p></div>
                                </div>

                                <div className="bg-white border border-gray-200 rounded-xl p-4 flex justify-between items-center hover:shadow-md transition-shadow">
                                    <div className="flex gap-4 items-center">
                                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><span className="material-symbols-outlined text-sm">calendar_month</span></div>
                                        <div><div className="flex items-center gap-2"><h5 className="text-sm font-bold text-gray-900">Mensais</h5><span className="bg-gray-100 text-gray-600 px-1.5 rounded text-[9px] font-bold">24x Parcelas</span></div><p className="text-[10px] text-gray-500">Início: 10/02/2023</p><p className="text-[10px] text-gray-500">Valor Unitário: {formatCurrency(phases.mensais.unitario)}</p></div>
                                    </div>
                                    <div className="text-right"><p className="text-[9px] font-bold text-gray-400 uppercase">SUBTOTAL GRUPO</p><p className="text-lg font-bold text-gray-900">{formatCurrency(mensaisTotal)}</p><p className="text-[9px] text-orange-500 bg-orange-50 px-1 rounded inline-block">~ + R$ 42,00 (INCC est.)</p></div>
                                </div>

                                <div className="bg-white border border-gray-200 rounded-xl p-4 flex justify-between items-center hover:shadow-md transition-shadow">
                                    <div className="flex gap-4 items-center">
                                        <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center"><span className="material-symbols-outlined text-sm">rocket_launch</span></div>
                                        <div><div className="flex items-center gap-2"><h5 className="text-sm font-bold text-gray-900">Balões Semestrais</h5><span className="bg-gray-100 text-gray-600 px-1.5 rounded text-[9px] font-bold">4x Parcelas</span></div><p className="text-[10px] text-gray-500">Início: 10/06/2023</p><p className="text-[10px] text-gray-500">Valor Unitário: R$ 50.000,00</p></div>
                                    </div>
                                    <div className="text-right"><p className="text-[9px] font-bold text-gray-400 uppercase">SUBTOTAL GRUPO</p><p className="text-lg font-bold text-gray-900">R$ 200.000,00</p><p className="text-[9px] text-orange-500 bg-orange-50 px-1 rounded inline-block">~ + R$ 1.250,00 (INCC est.)</p></div>
                                </div>

                                <div className="bg-blue-50/50 rounded-xl p-4 flex justify-between items-center border border-blue-100">
                                    <span className="text-xs font-bold text-blue-800 uppercase tracking-widest">TOTAL ACUMULADO FASE 1</span>
                                    <div className="flex gap-8">
                                        <div className="text-right"><span className="block text-[9px] font-bold text-gray-400">ORIGINAL</span><span className="text-lg font-black text-gray-900">R$ 520.000,00</span></div>
                                        <div className="text-right"><span className="block text-[9px] font-bold text-blue-400">CORRIGIDO (EST.)</span><span className="text-lg font-black text-blue-600">R$ 521.292,00</span></div>
                                    </div>
                                </div>
                            </div>

                            <div className="lg:col-span-1 border-l border-gray-100 pl-8">
                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-4"><span className="material-symbols-outlined text-sm">tune</span> PARÂMETROS</h4>
                                <div className="border border-gray-200 rounded-xl p-4 mb-4">
                                    <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">ÍNDICE DE CORREÇÃO</label>
                                    <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg border border-gray-200"><span className="text-sm font-bold text-gray-700">INCC-M (FGV)</span><span className="material-symbols-outlined text-sm">expand_more</span></div>
                                </div>
                                <div className="border border-gray-200 rounded-xl p-4">
                                    <div className="flex justify-between mb-2"><span className="text-[9px] font-bold text-gray-400 uppercase">Tendência INCC</span><span className="text-[10px] font-bold text-green-600">↑ 0.5% Mês</span></div>
                                    <div className="h-24 w-full bg-blue-50 rounded-lg mb-2 relative overflow-hidden">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={data}><Area type="monotone" dataKey="value" stroke="#1152d4" strokeWidth={2} fill="#bfdbfe" /></AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="flex justify-between bg-orange-50 p-2 rounded-lg border border-orange-100">
                                        <span className="text-[10px] font-bold text-orange-800">Projeção Acumulada</span>
                                        <span className="text-[10px] font-black text-orange-600">4.52%</span>
                                    </div>
                                    <div className="flex justify-between mt-2 px-1">
                                        <span className="text-[9px] font-medium text-gray-400">Impacto Financeiro Total:</span>
                                        <span className="text-[10px] font-bold text-gray-900">R$ ~32.400</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-center mb-8">
                        <button className="bg-white border border-blue-100 text-blue-600 rounded-full px-6 py-2 text-xs font-bold uppercase shadow-sm flex items-center gap-2 hover:bg-blue-50 transition">
                            <span className="material-symbols-outlined text-sm">key</span> ENTREGA DE CHAVES <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </button>
                    </div>

                    {/* Fase 2 Summary */}
                    <div className="bg-white rounded-[1.5rem] border border-gray-200 shadow-sm p-6 mb-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center"><span className="material-symbols-outlined text-lg">account_balance</span></div>
                            <div><h3 className="text-sm font-bold text-gray-900">Fase 2: Bancária - FINANCIAMENTO PÓS-CHAVES</h3><p className="text-[10px] text-gray-500">Simulação e controle do saldo devedor bancário.</p></div>
                        </div>

                        <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <div className="flex-1">
                                <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">SISTEMA DE AMORTIZAÇÃO</p>
                                <div className="bg-white border border-gray-200 rounded p-2 text-xs font-bold text-gray-700 flex justify-between">SAC (Decrescente) <span className="material-symbols-outlined text-sm">expand_more</span></div>
                            </div>
                            <div className="flex-1">
                                <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">PRAZO TOTAL</p>
                                <div className="bg-white border border-gray-200 rounded p-2 text-xs font-bold text-gray-700 flex justify-between">360 <span className="text-gray-400 font-normal">meses</span></div>
                            </div>
                            <div className="flex-1">
                                <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">TAXA DE JUROS (ANUAL)</p>
                                <div className="bg-white border border-gray-200 rounded p-2 text-xs font-bold text-gray-700 flex justify-between">9.8 <span className="text-gray-400 font-normal">% a.a.</span></div>
                            </div>
                            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 shadow-md transition-colors">
                                <span className="material-symbols-outlined text-sm">calculate</span> Calcular Simulação
                            </button>
                        </div>

                        <div className="mt-4 bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-sm"><span className="material-symbols-outlined text-sm">payments</span></div>
                                <div><p className="text-[9px] font-bold text-blue-700 uppercase">PRIMEIRA PARCELA (ESTIMADA)</p><p className="text-xl font-black text-gray-900">R$ 18.450,22</p></div>
                            </div>
                            <div className="flex gap-8 text-right">
                                <div><p className="text-[9px] text-gray-400">Última Parcela</p><p className="text-xs font-bold text-gray-900">R$ 5.200,45</p></div>
                                <div><p className="text-[9px] text-gray-400">CET Anual</p><p className="text-xs font-bold text-gray-900">10.45%</p></div>
                                <div><p className="text-[9px] text-gray-400">Total Juros</p><p className="text-xs font-bold text-gray-900">R$ 1.2M</p></div>
                            </div>
                        </div>
                    </div>

                    {/* Fluxo de Caixa Table */}
                    <div className="bg-white rounded-[1.5rem] border border-gray-200 shadow-sm overflow-hidden mb-8">
                        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="text-sm font-bold text-gray-900">Fluxo de Caixa Unificado</h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleEditCashFlow}
                                    disabled={!selectedCashFlowId}
                                    className={`px-3 py-1.5 border rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors ${selectedCashFlowId ? 'border-blue-600 bg-blue-600 text-white shadow-md hover:bg-blue-700' : 'border-gray-200 text-gray-300 bg-gray-50 cursor-not-allowed'}`}
                                >
                                    <span className="material-symbols-outlined text-xs">edit</span> Editar Lançamento
                                </button>
                                <button className="px-3 py-1.5 border border-gray-200 rounded-lg text-[10px] font-bold text-gray-600 hover:bg-gray-50 flex items-center gap-1"><span className="material-symbols-outlined text-xs">filter_list</span> Filtrar</button>
                                <button className="px-3 py-1.5 border border-gray-200 rounded-lg text-[10px] font-bold text-gray-600 hover:bg-gray-50 flex items-center gap-1"><span className="material-symbols-outlined text-xs">download</span> Exportar CSV</button>
                                <button
                                    onClick={handleAddCashFlow}
                                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-bold hover:bg-blue-700 flex items-center gap-1"
                                >
                                    <span className="material-symbols-outlined text-xs">add</span> Adicionar Lançamento
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="py-3 px-4 w-10"></th> {/* Selection Column */}
                                        <th className="py-3 px-4 text-[10px] font-bold text-blue-800 uppercase">Vencimento</th>
                                        <th className="py-3 px-4 text-[10px] font-bold text-blue-800 uppercase">Fase</th>
                                        <th className="py-3 px-4 text-[10px] font-bold text-blue-800 uppercase">Descrição</th>
                                        <th className="py-3 px-4 text-[10px] font-bold text-blue-800 uppercase text-right">Correção/Juros</th>
                                        <th className="py-3 px-4 text-[10px] font-bold text-blue-800 uppercase text-right">Val. Final (RAQUEL)</th>
                                        <th className="py-3 px-4 text-[10px] font-bold text-blue-800 uppercase text-right">Val. Final (MARÍLIA)</th>
                                        <th className="py-3 px-4 text-[10px] font-bold text-blue-800 uppercase text-right">Status</th>
                                        <th className="py-3 px-4 w-10"></th> {/* Actions Column */}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {cashFlow.map(item => (
                                        <tr
                                            key={item.id}
                                            onClick={() => setSelectedCashFlowId(item.id === selectedCashFlowId ? null : item.id)}
                                            className={`transition-colors group cursor-pointer ${selectedCashFlowId === item.id ? 'bg-blue-50' : 'hover:bg-blue-50/30'}`}
                                        >
                                            <td className="py-3 px-4">
                                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedCashFlowId === item.id ? 'border-blue-600 bg-blue-600' : 'border-gray-300'}`}>
                                                    {selectedCashFlowId === item.id && <span className="material-symbols-outlined text-[10px] text-white">check</span>}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-xs font-medium text-gray-900">{item.vencimento}</td>
                                            <td className="py-3 px-4"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.fase === 'Fase 1' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{item.fase}</span></td>
                                            <td className="py-3 px-4 text-xs text-gray-700">{item.descricao}</td>
                                            <td className="py-3 px-4 text-xs text-orange-500 text-right">{item.correcao}</td>
                                            <td className="py-3 px-4 text-xs font-medium text-gray-900 text-right">{item.valoresPorSocio['Raquel'] ? formatCurrency(item.valoresPorSocio['Raquel']) : 'N/A'}</td>
                                            <td className="py-3 px-4 text-xs font-medium text-gray-900 text-right">{item.valoresPorSocio['Marília'] ? formatCurrency(item.valoresPorSocio['Marília']) : 'N/A'}</td>
                                            <td className="py-3 px-4 text-right">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${item.status === 'Pago' ? 'bg-green-100 text-green-700' :
                                                    item.status === 'Pendente' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-gray-100 text-gray-400'
                                                    }`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setEditingCashFlowItem(item); setIsCashFlowModalOpen(true); }}
                                                    className="text-gray-400 hover:text-blue-600 p-1 rounded-full hover:bg-blue-100 transition-colors"
                                                >
                                                    <span className="material-symbols-outlined text-sm">edit</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-gray-50 border-t border-gray-200">
                                    <tr>
                                        <td colSpan={5} className="py-3 px-4 text-[10px] font-bold text-gray-500 uppercase">TOTAL PAGO POR SÓCIO</td>
                                        <td className="py-3 px-4 text-xs font-black text-blue-700 text-right">R$ 55.042,00</td>
                                        <td className="py-3 px-4 text-xs font-black text-blue-700 text-right">R$ 55.085,00</td>
                                        <td colSpan={2} className="py-3 px-4 text-[9px] font-bold text-gray-400 text-right">TOTAL: R$ 210.127,00</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* Resumo Socio Table */}
                    <div className="bg-white rounded-[1.5rem] border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-200 bg-gray-50/50">
                            <h3 className="text-sm font-bold text-gray-900">Resumo de Contribuição por Sócio (Fluxo de Caixa)</h3>
                        </div>
                        <div className="w-full">
                            <div className="grid grid-cols-12 bg-white border-b border-gray-100 py-3 px-4 text-[9px] font-bold text-blue-800 uppercase tracking-wide">
                                <div className="col-span-3">Sócio</div>
                                <div className="col-span-3 text-right">Total Pago (Construtora)</div>
                                <div className="col-span-3 text-right">Total Pago (Bancário)</div>
                                <div className="col-span-3 text-right">Total Geral Pago</div>
                            </div>

                            {['Raquel', 'Marília', 'Wândrio', 'Inventário Tilinha'].map((partner, idx) => (
                                <div key={partner} className="border-b border-gray-50 last:border-none">
                                    <div
                                        className="grid grid-cols-12 py-3 px-4 hover:bg-gray-50 cursor-pointer items-center"
                                        onClick={() => setExpandedPartner(expandedPartner === partner ? null : partner)}
                                    >
                                        <div className="col-span-3 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-gray-400 text-sm transition-transform duration-200" style={{ transform: expandedPartner === partner ? 'rotate(180deg)' : 'rotate(0deg)' }}>expand_more</span>
                                            <span className="text-xs font-bold text-gray-900">{partner}</span>
                                        </div>
                                        <div className="col-span-3 text-right text-xs font-medium text-gray-700">R$ 55.042,00</div>
                                        <div className="col-span-3 text-right text-xs font-medium text-gray-400">R$ 0,00</div>
                                        <div className="col-span-3 text-right text-xs font-bold text-blue-700">R$ 55.042,00</div>
                                    </div>

                                    {/* Expanded Details */}
                                    {expandedPartner === partner && (
                                        <div className="bg-gray-50/50 px-4 py-3 border-t border-gray-100 animate-fade-in-up">
                                            <table className="w-full text-left">
                                                <thead>
                                                    <tr>
                                                        <th className="py-2 text-[9px] font-bold text-blue-600 uppercase">Data</th>
                                                        <th className="py-2 text-[9px] font-bold text-blue-600 uppercase">Descrição da Parcela</th>
                                                        <th className="py-2 text-[9px] font-bold text-blue-600 uppercase text-right">Valor Pago</th>
                                                        <th className="py-2 text-[9px] font-bold text-blue-600 uppercase text-right">Fase</th>
                                                        <th className="w-8"></th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    <tr>
                                                        <td className="py-2 text-[10px] text-gray-600">10/01/2023</td>
                                                        <td className="py-2 text-[10px] text-gray-600">Entrada Parcela Única</td>
                                                        <td className="py-2 text-[10px] font-medium text-gray-900 text-right">R$ 50.000,00</td>
                                                        <td className="py-2 text-right"><span className="bg-blue-100 text-blue-600 text-[9px] px-1.5 py-0.5 rounded font-bold">Construtora</span></td>
                                                        <td className="text-center"><span className="material-symbols-outlined text-[10px] text-blue-400 cursor-pointer hover:text-blue-600">open_in_new</span></td>
                                                    </tr>
                                                    <tr>
                                                        <td className="py-2 text-[10px] text-gray-600">10/02/2023</td>
                                                        <td className="py-2 text-[10px] text-gray-600">Mensal 02/24</td>
                                                        <td className="py-2 text-[10px] font-medium text-gray-900 text-right">R$ 5.042,00</td>
                                                        <td className="py-2 text-right"><span className="bg-blue-100 text-blue-600 text-[9px] px-1.5 py-0.5 rounded font-bold">Construtora</span></td>
                                                        <td className="text-center"><span className="material-symbols-outlined text-[10px] text-blue-400 cursor-pointer hover:text-blue-600">open_in_new</span></td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            ))}

                            <div className="grid grid-cols-12 bg-gray-50 py-3 px-4 border-t border-gray-200">
                                <div className="col-span-3 text-[10px] font-black text-gray-900 uppercase">TOTAL CONSOLIDADO</div>
                                <div className="col-span-3 text-right text-xs font-black text-gray-900">R$ 210.127,00</div>
                                <div className="col-span-3 text-right text-xs font-black text-gray-900">R$ 0,00</div>
                                <div className="col-span-3 text-right text-xs font-black text-blue-700">R$ 210.127,00</div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Financiamento Modal Component */}
            <FinancingModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                assetName={asset?.name}
                initialData={asset?.financingDetails}
                onSave={(data) => {
                    if (asset && onUpdateAsset) {
                        const updatedAsset = { ...asset, financingDetails: { ...asset.financingDetails, ...data } };
                        onUpdateAsset(updatedAsset);
                    }
                }}
            />

            <CashFlowModal
                isOpen={isCashFlowModalOpen}
                onClose={() => setIsCashFlowModalOpen(false)}
                initialData={editingCashFlowItem}
                onSave={handleSaveCashFlow}
            />
        </div>
    );
};