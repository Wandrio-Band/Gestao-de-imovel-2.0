import React, { useMemo, useState } from 'react';
import { Invoice, CATEGORY_ICONS } from './types';
import { formatMoney } from '@/lib/formatters';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface DashboardTabProps {
    invoices: Invoice[];
    stats: { total: number; count: number; byCat: [string, number][] };
    filters: Record<string, string>;
    onFilterChange: (key: string, value: string) => void;
    availableFilters: { categories: string[]; years: string[]; states: string[]; cities: string[]; issuers: string[] };
    onDelete: (id: string) => void;
    onApprove: (id: string) => void;
    onUpdate: (id: string, data: Record<string, unknown>) => Promise<void>;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({ invoices }) => {
    // --- LÓGICA DE DADOS ---
    const stats = useMemo(() => {
        const approved = invoices.filter(inv => inv.status === 'APROVADO');
        const total = approved.reduce((acc, inv) => acc + (Number(inv.valor_total) || 0), 0);

        const byCatMap: Record<string, number> = {};
        approved.forEach(inv => {
            const cat = inv.categoria || 'Outros';
            byCatMap[cat] = (byCatMap[cat] || 0) + (Number(inv.valor_total) || 0);
        });

        const byCat = Object.entries(byCatMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

        return {
            total,
            count: approved.length,
            pending: invoices.filter(inv => inv.status === 'PENDENTE').length,
            byCat,
            avg: approved.length > 0 ? total / approved.length : 0
        };
    }, [invoices]);

    const chartData = useMemo(() => {
        const currentYear = String(new Date().getFullYear());
        const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
        return months.map((m, i) => ({
            name: m,
            total: invoices
                .filter(inv => {
                    if (!inv.data) return false;
                    const parts = inv.data.split('/');
                    if (parts.length < 3) return false;
                    const month = parseInt(parts[1]) - 1;
                    const year = parts[2];
                    return month === i && year === currentYear && inv.status === 'APROVADO';
                })
                .reduce((acc, inv) => acc + (Number(inv.valor_total) || 0), 0)
        }));
    }, [invoices]);

    const COLORS = ['#3b82f6', '#10b981', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6'];

    return (
        <div className="space-y-6 pt-2 h-full overflow-y-auto no-scrollbar pb-20">

            {/* KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md group">
                    <div className="flex items-center gap-4 mb-3">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-2xl font-bold">account_balance_wallet</span>
                        </div>
                        <span className="text-xs font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Total Aprovado</span>
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{formatMoney(stats.total)}</h3>
                </div>

                <div className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md group">
                    <div className="flex items-center gap-4 mb-3">
                        <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-xl group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-2xl font-bold">receipt_long</span>
                        </div>
                        <span className="text-xs font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Documentos</span>
                    </div>
                    <div className="flex items-end gap-2">
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{stats.count}</h3>
                        <span className="text-sm font-bold text-slate-400 mb-1">unidades</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md group border-l-4 border-l-amber-400">
                    <div className="flex items-center gap-4 mb-3">
                        <div className="p-3 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-xl group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-2xl font-bold">pending_actions</span>
                        </div>
                        <span className="text-xs font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Para Revisão</span>
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{stats.pending}</h3>
                </div>

                <div className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md group">
                    <div className="flex items-center gap-4 mb-3">
                        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-2xl font-bold">analytics</span>
                        </div>
                        <span className="text-xs font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Tíquete Médio</span>
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{formatMoney(stats.avg)}</h3>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                {/* Evolution Chart */}
                <div className="bg-white dark:bg-[#1e293b] p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h4 className="text-sm font-black uppercase text-slate-900 dark:text-white mb-1 tracking-widest">Evolução Mensal</h4>
                            <p className="text-xs text-slate-500 font-bold">Fluxo de gastos acumulados por mês</p>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300">
                            <span className="material-symbols-outlined text-sm">event</span>
                            Ano Atual
                        </div>
                    </div>
                    <div className="h-72 w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} tickFormatter={(value) => `R$${value}`} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px', fontWeight: 'bold' }}
                                    formatter={(v: string | number) => [formatMoney(v), "Total"]}
                                />
                                <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Categories Breakdown */}
                <div className="bg-white dark:bg-[#1e293b] p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h4 className="text-sm font-black uppercase text-slate-900 dark:text-white mb-1 tracking-widest">Distribuição por Categoria</h4>
                            <p className="text-xs text-slate-500 font-bold">Maiores centros de custo do período</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 h-72">
                        <div className="h-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats.byCat}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={85}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {stats.byCat.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(v: string | number) => formatMoney(v)} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="flex flex-col justify-center gap-3 pr-4">
                            {stats.byCat.map((c, i) => (
                                <div key={c.name} className="flex flex-col">
                                    <div className="flex items-center justify-between text-xs mb-1">
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[18px]" style={{ color: COLORS[i % COLORS.length] }}>
                                                {CATEGORY_ICONS[c.name] || 'receipt_long'}
                                            </span>
                                            <span className="font-bold text-slate-700 dark:text-slate-300">{c.name}</span>
                                        </div>
                                        <span className="font-black text-slate-900 dark:text-white">{Math.round((c.value / stats.total) * 100)}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full"
                                            style={{
                                                width: `${(c.value / stats.total) * 100}%`,
                                                backgroundColor: COLORS[i % COLORS.length]
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Issuers List */}
            <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                    <h4 className="text-sm font-black uppercase text-slate-900 dark:text-white tracking-widest">Principais Prestadores de Serviço</h4>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800/50">
                            <tr>
                                <th className="px-6 py-3 text-[10px] font-black uppercase text-slate-400">Emissor</th>
                                <th className="px-6 py-3 text-[10px] font-black uppercase text-slate-400">Categoria</th>
                                <th className="px-6 py-3 text-[10px] font-black uppercase text-slate-400 text-center">Docs</th>
                                <th className="px-6 py-3 text-[10px] font-black uppercase text-slate-400 text-right">Total Acumulado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {(() => {
                                const issuersMap: Record<string, { count: number, total: number, cat: string }> = {};
                                invoices.filter(i => i.status === 'APROVADO').forEach(i => {
                                    const key = i.nome_emissor || 'Desconhecido';
                                    if (!issuersMap[key]) issuersMap[key] = { count: 0, total: 0, cat: i.categoria || 'Outros' };
                                    issuersMap[key].count++;
                                    issuersMap[key].total += Number(i.valor_total) || 0;
                                });
                                return Object.entries(issuersMap)
                                    .sort((a, b) => b[1].total - a[1].total)
                                    .slice(0, 5)
                                    .map(([name, data]) => (
                                        <tr key={name} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3 font-bold text-slate-800 dark:text-slate-200 text-xs">
                                                    <div className="size-8 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 flex items-center justify-center font-black">
                                                        {name.charAt(0)}
                                                    </div>
                                                    {name}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-[10px] font-black uppercase text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                                    {data.cat}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center text-xs font-bold text-slate-600 dark:text-slate-400">{data.count}</td>
                                            <td className="px-6 py-4 text-right text-sm font-black text-slate-900 dark:text-white">{formatMoney(data.total)}</td>
                                        </tr>
                                    ));
                            })()}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
