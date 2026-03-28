import React, { useState } from 'react';
import { FinancingModal } from './FinancingModal';
import { CashFlowModal } from './CashFlowModal';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Asset, ViewState, CashFlowItem, KPICardProps } from '../../types';
import { formatMoney as formatCurrency } from '@/lib/formatters';
import { generateBankAmortizationTable } from '@/lib/financingHelpers';

interface FinancingDashboardProps {
    asset?: Asset | null;
    onNavigate: (view: ViewState, asset?: Asset) => void;
    onUpdateAsset?: (asset: Asset) => void;
}

// Helper: parse date YYYY-MM-DD to { year, month }
const parseDateYM = (dateStr: string | undefined): { year: number; month: number } | null => {
    if (!dateStr) return null;
    // Supports YYYY-MM-DD or DD/MM/YYYY
    if (dateStr.includes('-')) {
        const [y, m] = dateStr.split('-').map(Number);
        if (y && m) return { year: y, month: m };
    } else if (dateStr.includes('/')) {
        const parts = dateStr.split('/').map(Number);
        if (parts.length === 3) return { year: parts[2], month: parts[1] };
    }
    return null;
};

// Helper: parse currency string to number
const parseCurrencyValue = (val: string | number | undefined | null): number => {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    const clean = String(val).replace(/[R$\s.]/g, '').replace(',', '.');
    return parseFloat(clean) || 0;
};

const monthAbbrevs = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

interface CellEntry {
    amount: number;
    status: 'PAGO' | 'PREVISTO' | 'BALÃO' | 'BANCO';
    isBaloon: boolean;
    isBank: boolean;
    details: string[];
}

// Build projection grid from financing phases
function buildProjectionGrid(
    phases: { sinal: { qtd: number; unitario: number }; mensais: { qtd: number; unitario: number }; baloes: { qtd: number; unitario: number } },
    startDateStr: string | undefined,
    signatureDateStr: string | undefined,
    cashFlowItems: CashFlowItem[],
    bankFinancing?: {
        valorFinanciar: number;
        prazoMeses: number;
        jurosAnuais: number;
        sistemaAmortizacao: string;
        vencimentoPrimeira: string;
    }
): { years: number[]; grid: Map<string, CellEntry>; bankGrid: Map<string, CellEntry> } {
    const grid = new Map<string, CellEntry>();
    const bankGrid = new Map<string, CellEntry>();
    const today = new Date();
    const currentYM = today.getFullYear() * 12 + today.getMonth();

    const addToGrid = (year: number, month: number, amount: number, detail: string, forceBaloon = false) => {
        // month is 1-indexed
        const key = `${year}-${month}`;
        const existing = grid.get(key) || { amount: 0, status: 'PREVISTO' as const, isBaloon: false, isBank: false, details: [] };
        existing.amount += amount;
        existing.details.push(detail);
        if (forceBaloon) existing.isBaloon = true;

        // Mark as paid if month is in the past
        const cellYM = year * 12 + (month - 1);
        if (cellYM < currentYM) {
            existing.status = 'PAGO';
        } else if (forceBaloon) {
            existing.status = 'BALÃO';
        } else {
            existing.status = 'PREVISTO';
        }
        grid.set(key, existing);
    };

    const startDate = parseDateYM(startDateStr) || parseDateYM(signatureDateStr);
    if (!startDate && !bankFinancing) return { years: [], grid, bankGrid };

    if (startDate) {
        // 1. Sinal - on signature date
        const sigDate = parseDateYM(signatureDateStr) || startDate;
        if (phases.sinal.qtd > 0 && phases.sinal.unitario > 0) {
            const total = phases.sinal.qtd * phases.sinal.unitario;
            addToGrid(sigDate.year, sigDate.month, total, `Sinal (${phases.sinal.qtd}x)`);
        }

        // 2. Mensais - starting from vencimentoConstrutora
        if (phases.mensais.qtd > 0 && phases.mensais.unitario > 0) {
            for (let i = 0; i < phases.mensais.qtd; i++) {
                const d = new Date(startDate.year, startDate.month - 1 + i, 1);
                addToGrid(d.getFullYear(), d.getMonth() + 1, phases.mensais.unitario, `Mensal ${i + 1}/${phases.mensais.qtd}`);
            }
        }

        // 3. Balões semestrais - every 6 months from start
        if (phases.baloes.qtd > 0 && phases.baloes.unitario > 0) {
            for (let i = 0; i < phases.baloes.qtd; i++) {
                const monthOffset = (i + 1) * 6;
                const d = new Date(startDate.year, startDate.month - 1 + monthOffset, 1);
                addToGrid(d.getFullYear(), d.getMonth() + 1, phases.baloes.unitario, `Balão ${i + 1}/${phases.baloes.qtd}`, true);
            }
        }

        // 4. Cash flow manual items
        for (const item of cashFlowItems) {
            const parsed = parseDateYM(item.vencimento);
            if (parsed) {
                const total = Object.values(item.valoresPorSocio).reduce((a, b) => a + b, 0);
                addToGrid(parsed.year, parsed.month, total, item.descricao);
            }
        }
    }

    // 5. Bank financing (Phase 2)
    if (bankFinancing && bankFinancing.valorFinanciar > 0 && bankFinancing.prazoMeses > 0 && bankFinancing.vencimentoPrimeira) {
        const bankRows = generateBankAmortizationTable({
            valorFinanciar: String(bankFinancing.valorFinanciar),
            prazoMeses: String(bankFinancing.prazoMeses),
            jurosAnuais: bankFinancing.jurosAnuais,
            sistemaAmortizacao: bankFinancing.sistemaAmortizacao || 'SAC',
            vencimentoPrimeira: bankFinancing.vencimentoPrimeira,
        } as any);

        for (const row of bankRows) {
            // Parse DD/MM/YYYY from row.date
            const parts = row.date.split('/');
            if (parts.length === 3) {
                const month = parseInt(parts[1]);
                const year = parseInt(parts[2]);
                const key = `${year}-${month}`;
                bankGrid.set(key, {
                    amount: row.prestacao,
                    status: 'BANCO',
                    isBaloon: false,
                    isBank: true,
                    details: [`Parcela ${row.parcela}/${bankFinancing.prazoMeses} — Amort: R$ ${row.amortizacao.toFixed(0)} + Juros: R$ ${row.juros.toFixed(0)}`]
                });
            }
        }
    }

    // Determine year range from both grids
    const allKeys = [...Array.from(grid.keys()), ...Array.from(bankGrid.keys())];
    if (allKeys.length === 0) return { years: [], grid, bankGrid };
    const allYears = allKeys.map(k => parseInt(k.split('-')[0]));
    const minYear = Math.min(...allYears);
    const maxYear = Math.max(...allYears);
    const years: number[] = [];
    for (let y = minYear; y <= maxYear; y++) years.push(y);

    return { years, grid, bankGrid };
}

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

    const financing = asset?.financingDetails || {} as any;
    const subtotalConstrutora = financing.subtotalConstrutora || 0;
    const valorFinanciar = financing.valorFinanciar ? parseCurrencyValue(financing.valorFinanciar) : 0;
    const valorTotal = financing.valorTotal ? parseCurrencyValue(financing.valorTotal) : 0;
    const valorQuitado = financing.valorQuitado || 0;

    // Extração robusta das fases para evitar crash se alguma propriedade faltar
    const rawPhases = financing.phases || {};
    const phases = {
        sinal: rawPhases.sinal || { qtd: 0, unitario: 0 },
        mensais: rawPhases.mensais || { qtd: 0, unitario: 0 },
        baloes: rawPhases.baloes || { qtd: 0, unitario: 0 }
    };

    const sinalTotal = phases.sinal ? phases.sinal.qtd * phases.sinal.unitario : 0;
    const mensaisTotal = phases.mensais ? phases.mensais.qtd * phases.mensais.unitario : 0;
    const baloesTotal = phases.baloes ? phases.baloes.qtd * phases.baloes.unitario : 0;
    const cashFlow: CashFlowItem[] = financing.cashFlow || [];

    // Bank financing params
    const bankFinancingParams = (financing.valorFinanciar && financing.prazoMeses && financing.vencimentoPrimeira) ? {
        valorFinanciar: parseCurrencyValue(financing.valorFinanciar),
        prazoMeses: financing.prazoMeses,
        jurosAnuais: financing.jurosAnuais || 0,
        sistemaAmortizacao: financing.sistemaAmortizacao || 'SAC',
        vencimentoPrimeira: financing.vencimentoPrimeira,
    } : undefined;

    // Build projection grid from REAL data
    const projection = buildProjectionGrid(
        phases,
        financing.vencimentoConstrutora,
        financing.dataAssinatura,
        cashFlow,
        bankFinancingParams
    );
    const years = projection.years;
    const months = monthAbbrevs;

    // Get cell data from projection grid (construtora)
    const getCellData = (year: number, monthIndex: number): CellEntry => {
        const key = `${year}-${monthIndex + 1}`; // monthIndex is 0-based, grid uses 1-based
        return projection.grid.get(key) || { amount: 0, status: 'PREVISTO' as const, isBaloon: false, isBank: false, details: [] };
    };

    // Get cell data from bank grid
    const getBankCellData = (year: number, monthIndex: number): CellEntry => {
        const key = `${year}-${monthIndex + 1}`;
        return projection.bankGrid.get(key) || { amount: 0, status: 'BANCO' as const, isBaloon: false, isBank: true, details: [] };
    };

    const hasBankData = projection.bankGrid.size > 0;

    // Calculate Monthly Totals (Vertical Sum)
    const getMonthlyTotal = (monthIndex: number) => {
        let sum = 0;
        years.forEach((year) => {
            sum += getCellData(year, monthIndex).amount;
        });
        return sum;
    };

    // --- KPI Calculations from real data ---
    const totalProjected = sinalTotal + mensaisTotal + baloesTotal;
    const today = new Date();
    const currentYM = today.getFullYear() * 12 + today.getMonth();

    // Calculate paid vs pending from the grid
    let totalPaid = 0;
    let totalPending = 0;
    for (const [key, entry] of projection.grid.entries()) {
        if (entry.status === 'PAGO') {
            totalPaid += entry.amount;
        } else {
            totalPending += entry.amount;
        }
    }

    const pctRealized = totalProjected > 0 ? Math.round((totalPaid / totalProjected) * 100) : 0;

    // Saldo devedor = total construtora - o que já foi pago
    const saldoDevedor = Math.max(0, totalProjected - totalPaid);

    // Find the first banking date or last construction date
    const lastConstructionDate = parseDateYM(financing.vencimentoConstrutora);
    const bankStartEstimate = lastConstructionDate
        ? (() => {
            const d = new Date(lastConstructionDate.year, lastConstructionDate.month - 1 + (phases.mensais.qtd || 0), 1);
            return `${monthAbbrevs[d.getMonth()]} / ${d.getFullYear()}`;
        })()
        : 'N/D';
    const monthsRemaining = lastConstructionDate
        ? Math.max(0, (lastConstructionDate.year * 12 + lastConstructionDate.month - 1 + (phases.mensais.qtd || 0)) - currentYM)
        : 0;

    // Build cashOutData for chart from projection grid (next 12 months from start)
    const cashOutData = monthAbbrevs.map((name, idx) => {
        let regular = 0;
        let balloon = 0;
        let bank = 0;
        for (const year of years) {
            const entry = getCellData(year, idx);
            if (entry.isBaloon) {
                balloon += entry.amount;
            } else {
                regular += entry.amount;
            }
            const bankEntry = getBankCellData(year, idx);
            bank += bankEntry.amount;
        }
        return { name, regular, balloon, bank };
    });

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
                            label="Total Previsto (Construtora)"
                            value={formatCurrency(totalProjected)}
                            subtext={`Sinal + ${phases.mensais.qtd}x Mensais + ${phases.baloes.qtd}x Balões`}
                            type="standard"
                        />
                        <KPICard
                            icon="construction"
                            colorClass="bg-gray-100 text-gray-600"
                            label="Fluxo Construtora Pendente"
                            value={formatCurrency(totalPending)}
                            subtext={`QUITADO: ${formatCurrency(totalPaid)} (${pctRealized}%)`}
                        />
                        <KPICard
                            icon="key"
                            colorClass="bg-blue-50 text-blue-800"
                            label="Início Fase Bancária"
                            value={bankStartEstimate}
                            subtext={`${monthsRemaining} MESES RESTANTES`}
                            type="standard"
                        />
                        <div className="bg-white p-4 rounded-[2rem] border border-gray-100 shadow-soft flex items-center justify-between">
                            <div className="h-full flex flex-col justify-center pl-4">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Status de Fluxo</span>
                                <h3 className="text-4xl font-black text-gray-900">{pctRealized}%</h3>
                                <div className="w-24 h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
                                    <div style={{ width: `${pctRealized}%` }} className="h-full bg-green-500 rounded-full"></div>
                                </div>
                            </div>
                            <CircularProgress percentage={pctRealized} />
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

                        {hasBankData && (
                            <div className="px-8 py-4 bg-blue-50/50 border-b border-blue-100 flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-blue-700 text-sm">account_balance</span>
                                    <span className="text-xs font-bold text-blue-800">Financiamento Bancário (Fase 2)</span>
                                </div>
                                <span className="text-[10px] text-blue-600">
                                    {financing.sistemaAmortizacao || 'SAC'} · {financing.prazoMeses} parcelas · {financing.jurosAnuais}% a.a.
                                </span>
                                <div className="flex items-center gap-3 ml-auto">
                                    <div className="flex items-center gap-1">
                                        <span className="text-[11px]">🏗</span>
                                        <span className="text-[9px] font-bold text-gray-500">Construtora</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="text-[11px]">✅</span>
                                        <span className="text-[9px] font-bold text-green-600">Pago</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="text-[11px]">⚡</span>
                                        <span className="text-[9px] font-bold text-orange-500">Balão</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="text-[11px]">🏦</span>
                                        <span className="text-[9px] font-bold text-blue-600">Banco</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="overflow-x-auto pb-4">
                            {years.length === 0 ? (
                                <div className="p-12 text-center">
                                    <span className="material-symbols-outlined text-4xl text-gray-300 mb-4 block">calendar_month</span>
                                    <p className="text-sm font-bold text-gray-500">Nenhum cronograma gerado.</p>
                                    <p className="text-xs text-gray-400 mt-1">Cadastre as fases do financiamento (sinal, mensais, balões) e defina as datas para gerar o cronograma projetado.</p>
                                </div>
                            ) : (
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
                                            <td className="py-4 px-6 bg-white group-hover:bg-gray-50/50 transition-colors sticky left-0 z-10 border-r border-gray-50">
                                                <span className="text-lg font-black text-gray-900">{year}</span>
                                            </td>
                                            {months.map((_, idx) => {
                                                const cd = getCellData(year, idx);
                                                const bd = getBankCellData(year, idx);
                                                const hasC = cd.amount > 0;
                                                const hasB = bd.amount > 0;

                                                if (!hasC && !hasB) {
                                                    return <td key={idx} className="py-2 px-0.5 text-center"><span className="text-[10px] text-gray-300">—</span></td>;
                                                }

                                                const fmtK = (v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
                                                let opacity = '';
                                                if (scheduleFilter === 'realized' && cd.status !== 'PAGO') opacity = 'opacity-20 grayscale';
                                                if (scheduleFilter === 'projected' && cd.status === 'PAGO') opacity = 'opacity-20 grayscale';

                                                // Inline single-line format: 🏗 3k 🏦 2k — balão gets ⚡ instead of 🏗
                                                const items: React.ReactNode[] = [];
                                                if (hasC) {
                                                    const isBal = cd.status === 'BALÃO';
                                                    const isPago = cd.status === 'PAGO';
                                                    const color = isBal ? 'text-orange-600 font-black' : isPago ? 'text-green-700 font-bold' : 'text-gray-700 font-bold';
                                                    items.push(
                                                        <span key="c" className={`inline-flex items-center gap-0.5 ${color}`}>
                                                            <span className="text-[10px]">{isBal ? '⚡' : isPago ? '✅' : '🏗'}</span>
                                                            <span className="text-[11px]">{fmtK(cd.amount)}</span>
                                                        </span>
                                                    );
                                                }
                                                if (hasB) {
                                                    items.push(
                                                        <span key="b" className="inline-flex items-center gap-0.5 text-blue-700 font-bold">
                                                            <span className="text-[10px]">🏦</span>
                                                            <span className="text-[11px]">{fmtK(bd.amount)}</span>
                                                        </span>
                                                    );
                                                }

                                                return (
                                                    <td key={idx} className={`py-2 px-0.5 text-center ${opacity}`}>
                                                        <div className="flex flex-col items-center gap-0">
                                                            {items.map((item, i) => (
                                                                <div key={i}>{item}</div>
                                                            ))}
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
                                            const totalK = total > 0 ? (total >= 1000 ? (total / 1000).toFixed(0) + 'k' : formatCurrency(total)) : '—';
                                            return (
                                                <td key={idx} className="py-6 px-2 text-center">
                                                    <span className="text-sm font-black text-blue-700">{totalK}</span>
                                                </td>
                                            )
                                        })}
                                    </tr>
                                </tfoot>
                            </table>
                            )}
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
                                {hasBankData && (
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-[#1e40af]"></span>
                                    <span className="text-[10px] font-bold text-gray-500 uppercase">FINANCIAMENTO BANCÁRIO</span>
                                </div>
                                )}
                            </div>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={cashOutData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }} barSize={40}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280', fontWeight: 'bold' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
                                    <Tooltip
                                        cursor={{ fill: '#f9fafb' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                        formatter={(value: number | undefined) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value || 0)}
                                    />
                                    <Bar dataKey="regular" stackId="a" fill="#2563eb" radius={[0, 0, 4, 4]} />
                                    <Bar dataKey="balloon" stackId="a" fill="#f97316" radius={[0, 0, 0, 0]} />
                                    <Bar dataKey="bank" stackId="a" fill="#1e40af" radius={[4, 4, 0, 0]} />
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

                                {/* Dynamic blocks from financing phases */}
                                {phases.sinal.qtd > 0 && phases.sinal.unitario > 0 && (
                                <div className="bg-white border border-gray-200 rounded-xl p-4 flex justify-between items-center hover:shadow-md transition-shadow">
                                    <div className="flex gap-4 items-center">
                                        <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center"><span className="material-symbols-outlined text-sm">payments</span></div>
                                        <div><h5 className="text-sm font-bold text-gray-900">Entrada (Sinal)</h5><p className="text-[10px] text-gray-500">Data: {financing.dataAssinatura ? financing.dataAssinatura.split('-').reverse().join('/') : 'N/D'}</p><p className="text-[10px] text-gray-500">{phases.sinal.qtd}x {formatCurrency(phases.sinal.unitario)}</p></div>
                                    </div>
                                    <div className="text-right"><p className="text-[9px] font-bold text-gray-400 uppercase">VALOR TOTAL</p><p className="text-lg font-bold text-gray-900">{formatCurrency(sinalTotal)}</p></div>
                                </div>
                                )}

                                {phases.mensais.qtd > 0 && phases.mensais.unitario > 0 && (
                                <div className="bg-white border border-gray-200 rounded-xl p-4 flex justify-between items-center hover:shadow-md transition-shadow">
                                    <div className="flex gap-4 items-center">
                                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><span className="material-symbols-outlined text-sm">calendar_month</span></div>
                                        <div><div className="flex items-center gap-2"><h5 className="text-sm font-bold text-gray-900">Mensais</h5><span className="bg-gray-100 text-gray-600 px-1.5 rounded text-[9px] font-bold">{phases.mensais.qtd}x Parcelas</span></div><p className="text-[10px] text-gray-500">Início: {financing.vencimentoConstrutora ? financing.vencimentoConstrutora.split('-').reverse().join('/') : 'N/D'}</p><p className="text-[10px] text-gray-500">Valor Unitário: {formatCurrency(phases.mensais.unitario)}</p></div>
                                    </div>
                                    <div className="text-right"><p className="text-[9px] font-bold text-gray-400 uppercase">SUBTOTAL GRUPO</p><p className="text-lg font-bold text-gray-900">{formatCurrency(mensaisTotal)}</p></div>
                                </div>
                                )}

                                {phases.baloes.qtd > 0 && phases.baloes.unitario > 0 && (
                                <div className="bg-white border border-gray-200 rounded-xl p-4 flex justify-between items-center hover:shadow-md transition-shadow">
                                    <div className="flex gap-4 items-center">
                                        <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center"><span className="material-symbols-outlined text-sm">rocket_launch</span></div>
                                        <div><div className="flex items-center gap-2"><h5 className="text-sm font-bold text-gray-900">Balões Semestrais</h5><span className="bg-gray-100 text-gray-600 px-1.5 rounded text-[9px] font-bold">{phases.baloes.qtd}x Parcelas</span></div><p className="text-[10px] text-gray-500">A cada 6 meses</p><p className="text-[10px] text-gray-500">Valor Unitário: {formatCurrency(phases.baloes.unitario)}</p></div>
                                    </div>
                                    <div className="text-right"><p className="text-[9px] font-bold text-gray-400 uppercase">SUBTOTAL GRUPO</p><p className="text-lg font-bold text-gray-900">{formatCurrency(baloesTotal)}</p></div>
                                </div>
                                )}

                                <div className="bg-blue-50/50 rounded-xl p-4 flex justify-between items-center border border-blue-100">
                                    <span className="text-xs font-bold text-blue-800 uppercase tracking-widest">TOTAL ACUMULADO FASE 1</span>
                                    <div className="flex gap-8">
                                        <div className="text-right"><span className="block text-[9px] font-bold text-gray-400">ORIGINAL</span><span className="text-lg font-black text-gray-900">{formatCurrency(subtotalConstrutora)}</span></div>
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
                                    <div className="h-16 w-full bg-gray-50 rounded-lg mb-2 flex items-center justify-center text-[10px] text-gray-400">
                                        Dados INCC em tempo real indisponíveis
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
                                <div className="bg-white border border-gray-200 rounded p-2 text-xs font-bold text-gray-700 flex justify-between">{financing.sistemaAmortizacao || 'SAC'} {financing.sistemaAmortizacao === 'PRICE' ? '(Constante)' : '(Decrescente)'} <span className="material-symbols-outlined text-sm">expand_more</span></div>
                            </div>
                            <div className="flex-1">
                                <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">PRAZO TOTAL</p>
                                <div className="bg-white border border-gray-200 rounded p-2 text-xs font-bold text-gray-700 flex justify-between">{financing.prazoMeses || '—'} <span className="text-gray-400 font-normal">meses</span></div>
                            </div>
                            <div className="flex-1">
                                <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">TAXA DE JUROS (ANUAL)</p>
                                <div className="bg-white border border-gray-200 rounded p-2 text-xs font-bold text-gray-700 flex justify-between">{financing.jurosAnuais || '—'} <span className="text-gray-400 font-normal">% a.a.</span></div>
                            </div>
                            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 shadow-md transition-colors">
                                <span className="material-symbols-outlined text-sm">calculate</span> Calcular Simulação
                            </button>
                        </div>

                        {valorFinanciar > 0 && financing.prazoMeses && financing.jurosAnuais ? (() => {
                            const prazo = parseInt(financing.prazoMeses) || 360;
                            const taxaMensal = (parseCurrencyValue(financing.jurosAnuais) / 100) / 12;
                            const isSAC = financing.sistemaAmortizacao !== 'PRICE';
                            const amortizacao = valorFinanciar / prazo;
                            const primeiraParcela = isSAC ? amortizacao + (valorFinanciar * taxaMensal) :
                                taxaMensal > 0 ? valorFinanciar * (taxaMensal * Math.pow(1 + taxaMensal, prazo)) / (Math.pow(1 + taxaMensal, prazo) - 1) : valorFinanciar / prazo;
                            const ultimaParcela = isSAC ? amortizacao + (amortizacao * taxaMensal) : primeiraParcela;
                            const totalJuros = isSAC ? (valorFinanciar * taxaMensal * (prazo + 1)) / 2 : (primeiraParcela * prazo) - valorFinanciar;
                            return (
                            <div className="mt-4 bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-sm"><span className="material-symbols-outlined text-sm">payments</span></div>
                                    <div><p className="text-[9px] font-bold text-blue-700 uppercase">PRIMEIRA PARCELA (ESTIMADA)</p><p className="text-xl font-black text-gray-900">{formatCurrency(primeiraParcela)}</p></div>
                                </div>
                                <div className="flex gap-8 text-right">
                                    <div><p className="text-[9px] text-gray-400">Última Parcela</p><p className="text-xs font-bold text-gray-900">{formatCurrency(ultimaParcela)}</p></div>
                                    <div><p className="text-[9px] text-gray-400">Total Juros (Est.)</p><p className="text-xs font-bold text-gray-900">{formatCurrency(totalJuros)}</p></div>
                                </div>
                            </div>
                            );
                        })() : (
                        <div className="mt-4 bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
                            <p className="text-xs text-gray-400">Preencha prazo e juros para ver a simulação bancária.</p>
                        </div>
                        )}
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
                                        <td colSpan={5} className="py-3 px-4 text-[10px] font-bold text-gray-500 uppercase">TOTAL POR SÓCIO</td>
                                        <td className="py-3 px-4 text-xs font-black text-blue-700 text-right">
                                            {formatCurrency(cashFlow.reduce((sum, item) => sum + (item.valoresPorSocio['Raquel'] || 0), 0))}
                                        </td>
                                        <td className="py-3 px-4 text-xs font-black text-blue-700 text-right">
                                            {formatCurrency(cashFlow.reduce((sum, item) => sum + (item.valoresPorSocio['Marília'] || 0), 0))}
                                        </td>
                                        <td colSpan={2} className="py-3 px-4 text-[9px] font-bold text-gray-400 text-right">
                                            TOTAL: {formatCurrency(cashFlow.reduce((sum, item) => sum + Object.values(item.valoresPorSocio).reduce((a, b) => a + b, 0), 0))}
                                        </td>
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

                            {['Raquel', 'Marília', 'Wândrio', 'Inventário Tilinha'].map((partner, idx) => {
                                const partnerConstTotal = cashFlow.reduce((sum, item) => sum + (item.valoresPorSocio[partner] || 0), 0);
                                return (
                                <div key={partner} className="border-b border-gray-50 last:border-none">
                                    <div
                                        className="grid grid-cols-12 py-3 px-4 hover:bg-gray-50 cursor-pointer items-center"
                                        onClick={() => setExpandedPartner(expandedPartner === partner ? null : partner)}
                                    >
                                        <div className="col-span-3 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-gray-400 text-sm transition-transform duration-200" style={{ transform: expandedPartner === partner ? 'rotate(180deg)' : 'rotate(0deg)' }}>expand_more</span>
                                            <span className="text-xs font-bold text-gray-900">{partner}</span>
                                        </div>
                                        <div className="col-span-3 text-right text-xs font-medium text-gray-700">{formatCurrency(partnerConstTotal)}</div>
                                        <div className="col-span-3 text-right text-xs font-medium text-gray-400">{formatCurrency(0)}</div>
                                        <div className="col-span-3 text-right text-xs font-bold text-blue-700">{formatCurrency(partnerConstTotal)}</div>
                                    </div>

                                    {/* Expanded Details */}
                                    {expandedPartner === partner && (
                                        <div className="bg-gray-50/50 px-4 py-3 border-t border-gray-100 animate-fade-in-up">
                                            <table className="w-full text-left">
                                                <thead>
                                                    <tr>
                                                        <th className="py-2 text-[9px] font-bold text-blue-600 uppercase">Data</th>
                                                        <th className="py-2 text-[9px] font-bold text-blue-600 uppercase">Descrição</th>
                                                        <th className="py-2 text-[9px] font-bold text-blue-600 uppercase text-right">Valor</th>
                                                        <th className="py-2 text-[9px] font-bold text-blue-600 uppercase text-right">Fase</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {cashFlow.filter(item => item.valoresPorSocio[partner]).map(item => (
                                                        <tr key={item.id}>
                                                            <td className="py-2 text-[10px] text-gray-600">{item.vencimento}</td>
                                                            <td className="py-2 text-[10px] text-gray-600">{item.descricao}</td>
                                                            <td className="py-2 text-[10px] font-medium text-gray-900 text-right">{formatCurrency(item.valoresPorSocio[partner])}</td>
                                                            <td className="py-2 text-right"><span className="bg-blue-100 text-blue-600 text-[9px] px-1.5 py-0.5 rounded font-bold">{item.fase}</span></td>
                                                        </tr>
                                                    ))}
                                                    {cashFlow.filter(item => item.valoresPorSocio[partner]).length === 0 && (
                                                        <tr><td colSpan={4} className="py-3 text-center text-[10px] text-gray-400">Nenhum lançamento registrado</td></tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )})}

                            {(() => {
                                const totalConstrutora = cashFlow.reduce((sum, item) => sum + Object.values(item.valoresPorSocio).reduce((a, b) => a + b, 0), 0);
                                return (
                                <div className="grid grid-cols-12 bg-gray-50 py-3 px-4 border-t border-gray-200">
                                    <div className="col-span-3 text-[10px] font-black text-gray-900 uppercase">TOTAL CONSOLIDADO</div>
                                    <div className="col-span-3 text-right text-xs font-black text-gray-900">{formatCurrency(totalConstrutora)}</div>
                                    <div className="col-span-3 text-right text-xs font-black text-gray-900">{formatCurrency(0)}</div>
                                    <div className="col-span-3 text-right text-xs font-black text-blue-700">{formatCurrency(totalConstrutora)}</div>
                                </div>
                                );
                            })()}
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