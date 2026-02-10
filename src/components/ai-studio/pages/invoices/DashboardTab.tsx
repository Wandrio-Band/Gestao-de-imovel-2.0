import React, { useMemo } from 'react';
import { InvoiceStats, Invoice, CATEGORY_ICONS } from './types';
import { InvoiceViewer } from './InvoiceViewer';

interface DashboardTabProps {
    stats: InvoiceStats;
    invoices: Invoice[];
    filters: {
        category: string;
        year: string;
        state: string;
        city: string;
    };
    onFilterChange: (key: string, value: string) => void;
    availableFilters: {
        categories: string[];
        years: string[];
        states: string[];
        cities: string[];
    };
    onDelete: (id: string) => void;
    onApprove: (id: string) => void;
    onUpdate: (id: string, data: any) => Promise<void>;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({ stats, invoices, filters, onFilterChange, availableFilters, onDelete, onApprove, onUpdate }) => {
    const [selectedInvoiceId, setSelectedInvoiceId] = React.useState<string | null>(null);

    // Calculate Monthly Evolution
    const monthlyData = useMemo(() => {
        const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
        const data = new Array(12).fill(0);

        invoices.forEach(inv => {
            if (inv.status !== 'APROVADO') return;
            if (!inv.data) return;
            const parts = inv.data.split('/');
            if (parts.length === 3) {
                const monthIndex = parseInt(parts[1]) - 1;
                if (monthIndex >= 0 && monthIndex < 12) {
                    data[monthIndex] += (Number(inv.valor_total) || 0);
                }
            }
        });
        return months.map((m, i) => ({ name: m, value: data[i] }));
    }, [invoices]);

    const maxMonthlyValue = Math.max(...monthlyData.map(d => d.value), 1); // Avoid div by zero

    const selectedInvoice = useMemo(() => invoices.find(i => i.id === selectedInvoiceId), [invoices, selectedInvoiceId]);

    // Category Color Helper
    const getCategoryStyle = (cat: string) => {
        const map: Record<string, string> = {
            'Saúde': 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800',
            'Educação': 'bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800',
            'Reforma': 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
            'Eletrônicos': 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
            'Outros': 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
        };
        return map[cat] || map['Outros'];
    };

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500 relative">

            {/* Modal Overlay */}
            {selectedInvoice && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={(e) => { if (e.target === e.currentTarget) setSelectedInvoiceId(null); }}
                >
                    <div className="bg-white dark:bg-[#101622] rounded-2xl w-full max-w-[95vw] h-[90vh] md:h-[95vh] shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200">
                        <InvoiceViewer
                            invoice={selectedInvoice}
                            onClose={() => setSelectedInvoiceId(null)}
                            onDelete={(id) => { onDelete(id); setSelectedInvoiceId(null); }}
                            onApprove={onApprove}
                            onUpdate={onUpdate}
                            availableCategories={availableFilters.categories}
                        />
                    </div>
                </div>
            )}

            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl md:text-4xl font-black leading-tight tracking-tight text-slate-900 dark:text-white">Dashboard Analítico</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-base font-normal">Visão geral das suas métricas fiscais e insights de IA</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    {/* Category Filter */}
                    <div className="relative">
                        <select
                            value={filters.category}
                            onChange={(e) => onFilterChange('category', e.target.value)}
                            className="appearance-none h-10 pl-4 pr-10 rounded-lg bg-white dark:bg-[#1a2230] border border-slate-200 dark:border-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer text-slate-700 dark:text-slate-200"
                        >
                            <option value="Todas">Categoria</option>
                            {availableFilters.categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none">expand_more</span>
                    </div>

                    {/* Year Filter */}
                    <div className="relative">
                        <select
                            value={filters.year}
                            onChange={(e) => onFilterChange('year', e.target.value)}
                            className="appearance-none h-10 pl-4 pr-10 rounded-lg bg-white dark:bg-[#1a2230] border border-slate-200 dark:border-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer text-slate-700 dark:text-slate-200"
                        >
                            <option value="Todos">Ano</option>
                            {availableFilters.years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none">expand_more</span>
                    </div>

                    {/* State Filter */}
                    <div className="relative">
                        <select
                            value={filters.state}
                            onChange={(e) => onFilterChange('state', e.target.value)}
                            className="appearance-none h-10 pl-4 pr-10 rounded-lg bg-white dark:bg-[#1a2230] border border-slate-200 dark:border-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer text-slate-700 dark:text-slate-200"
                        >
                            <option value="Todos">Estado</option>
                            {availableFilters.states.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none">expand_more</span>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Total Spent */}
                <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-[#1a2230] border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-8xl text-blue-600">payments</span>
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider">Gasto Total</p>
                            <span className="material-symbols-outlined text-slate-400">more_horiz</span>
                        </div>
                        <p className="text-slate-900 dark:text-white text-4xl font-black leading-tight tracking-tight mb-2">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.total)}
                        </p>
                        {/* Placeholder for trend */}
                        <div className="flex items-center gap-2 opacity-0">
                            <span className="flex items-center justify-center rounded-full bg-green-50 dark:bg-green-900/30 px-2 py-0.5 text-green-700 dark:text-green-400 text-xs font-bold">
                                <span className="material-symbols-outlined text-sm mr-1">trending_up</span> 12%
                            </span>
                            <span className="text-slate-500 dark:text-slate-500 text-sm">vs mês anterior</span>
                        </div>
                    </div>
                </div>

                {/* Total Invoices */}
                <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-[#1a2230] border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-8xl text-blue-600">description</span>
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider">Total de Notas</p>
                            <span className="material-symbols-outlined text-slate-400">more_horiz</span>
                        </div>
                        <p className="text-slate-900 dark:text-white text-4xl font-black leading-tight tracking-tight mb-2">
                            {stats.count}
                        </p>
                        <div className="flex items-center gap-2 opacity-0">
                            <span className="flex items-center justify-center rounded-full bg-green-50 dark:bg-green-900/30 px-2 py-0.5 text-green-700 dark:text-green-400 text-xs font-bold">
                                <span className="material-symbols-outlined text-sm mr-1">trending_up</span> 5%
                            </span>
                            <span className="text-slate-500 dark:text-slate-500 text-sm">vs mês anterior</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Category Distribution */}
                <div className="flex flex-col rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a2230] shadow-sm p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <p className="text-slate-900 dark:text-white text-lg font-bold leading-normal">Distribuição por Categoria</p>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-normal leading-normal">Baseado nas notas filtradas</p>
                        </div>
                    </div>

                    <div className="grid gap-y-6 grid-cols-[auto_1fr] items-center">
                        {stats.byCat.slice(0, 5).map(([cat, total], idx) => {
                            const percent = stats.total > 0 ? (total / stats.total) * 100 : 0;
                            const colors = ['bg-blue-600', 'bg-blue-400', 'bg-indigo-400', 'bg-cyan-400', 'bg-teal-400'];
                            const color = colors[idx % colors.length];

                            return (
                                <React.Fragment key={cat}>
                                    <div className="flex items-center gap-2 pr-4">
                                        <div className={`w-2 h-2 rounded-full ${color}`}></div>
                                        <p className="text-slate-900 dark:text-slate-300 text-sm font-medium leading-normal w-24 truncate">{cat}</p>
                                    </div>
                                    <div className="h-8 flex-1 w-full bg-slate-100 dark:bg-slate-700 rounded-r-lg relative overflow-hidden group">
                                        <div className={`absolute top-0 left-0 h-full ${color} rounded-r-lg transition-all duration-1000`} style={{ width: `${percent}%` }}></div>
                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 dark:text-slate-300 z-10">{percent.toFixed(1)}%</span>
                                    </div>
                                </React.Fragment>
                            );
                        })}
                        {stats.byCat.length === 0 && (
                            <div className="col-span-2 text-center text-slate-400 py-4 italic">Nenhum dado disponível</div>
                        )}
                    </div>
                </div>

                {/* Monthly Evolution */}
                <div className="flex flex-col rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a2230] shadow-sm p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <p className="text-slate-900 dark:text-white text-lg font-bold leading-normal">Evolução Mensal</p>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-normal leading-normal">Tendência de Despesas</p>
                        </div>
                    </div>

                    <div className="flex-1 flex items-end justify-between gap-2 md:gap-4 h-[250px] pt-4 px-2">
                        {monthlyData.map((m, i) => {
                            const heightPercent = maxMonthlyValue > 0 ? (m.value / maxMonthlyValue) * 100 : 0;
                            // Just show a few months or all? Tailwind Grid might squash them. 12 bars is fine.
                            return (
                                <div key={i} className="flex flex-col items-center gap-2 h-full justify-end flex-1 group" title={`${m.name}: R$ ${m.value.toFixed(2)}`}>
                                    <div className="w-full bg-blue-100 dark:bg-blue-900/30 rounded-t-sm group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-all relative flex items-end" style={{ height: `${Math.max(heightPercent, 2)}%` }}>
                                        <div className="w-full bg-blue-600 h-1 rounded-t-sm opacity-50 group-hover:opacity-100"></div>
                                    </div>
                                    <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold">{m.name}</p>
                                </div>
                            )
                        })}
                    </div>
                </div>

            </div>

            {/* Filtered List Table */}
            <div className="flex flex-col rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a2230] shadow-sm overflow-hidden mt-6 animate-in slide-in-from-bottom-2 duration-500">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <div>
                        <p className="text-slate-900 dark:text-white text-lg font-bold">Detalhamento das Notas</p>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Listagem completa dos registros filtrados</p>
                    </div>
                    <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-3 py-1 rounded-full">
                        {invoices.length} registro(s)
                    </span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                        <thead className="bg-slate-100/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-extrabold uppercase text-xs tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Data</th>
                                <th className="px-6 py-4">Emissor</th>
                                <th className="px-6 py-4">Categoria</th>
                                <th className="px-6 py-4 text-right">Valor</th>
                                <th className="px-6 py-4 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {invoices.length > 0 ? (
                                invoices.map((invoice, idx) => (
                                    <tr key={invoice.id} onClick={() => setSelectedInvoiceId(invoice.id)} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group">
                                        <td className="px-6 py-4 whitespace-nowrap font-medium group-hover:text-blue-600 transition-colors">{invoice.data}</td>
                                        <td className="px-6 py-4 truncate max-w-[200px]" title={invoice.nome_emissor}>{invoice.nome_emissor || 'Sem Emissor'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${getCategoryStyle(invoice.categoria || 'Outros')}`}>
                                                <span className="material-symbols-outlined text-[14px] mr-1.5">{CATEGORY_ICONS[invoice.categoria || 'Outros'] || 'receipt_long'}</span>
                                                {invoice.categoria || 'Outros'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-white">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(invoice.valor_total) || 0)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold
                                                ${invoice.status === 'APROVADO' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                    invoice.status === 'PENDENTE' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                }`}>
                                                {invoice.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                                        Nenhuma nota encontrada para os filtros selecionados
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
