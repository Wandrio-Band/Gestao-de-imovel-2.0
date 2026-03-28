import React, { useState, useMemo } from 'react';
import { Invoice, CATEGORY_ICONS } from './types';
import { formatMoney } from '@/lib/formatters';
import { InvoiceViewer } from './InvoiceViewer';

interface HistoryTabProps {
    invoices: Invoice[];
    onDelete: (id: string) => void;
    onApprove: (id: string) => void;
    onUpdate: (id: string, data: Record<string, unknown>) => Promise<void>;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({ invoices, onDelete, onApprove, onUpdate }) => {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'APROVADO' | 'PENDENTE' | 'SINALIZADO'>('ALL');

    const selectedInvoice = useMemo(() => invoices.find(i => i.id === selectedId) || null, [invoices, selectedId]);

    const filteredList = useMemo(() => {
        return invoices.filter(inv => {
            const matchesSearch = searchQuery === "" ||
                (inv.nome_emissor || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                (inv.valor_total || "").toString().includes(searchQuery);

            let matchesStatus = true;
            if (statusFilter === 'APROVADO') matchesStatus = inv.status === 'APROVADO';
            if (statusFilter === 'PENDENTE') matchesStatus = inv.status === 'PENDENTE';
            if (statusFilter === 'SINALIZADO') matchesStatus = !!inv.auditReason; // Assuming auditReason means flagged

            return matchesSearch && matchesStatus;
        });
    }, [invoices, searchQuery, statusFilter]);

    // Format helpers
    const dateStr = (d?: string) => {
        if (!d) return "-";
        // Convert DD/MM/YYYY to something nicer if needed
        return d;
    };

    return (
        <div className="flex h-[calc(100vh-140px)] w-full overflow-hidden bg-white dark:bg-[#151b2b] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm animate-in zoom-in-95 duration-300">
            {/* Sidebar List */}
            <aside className="w-full md:w-[420px] bg-white dark:bg-[#151b2b] border-r border-slate-200 dark:border-slate-800 flex flex-col z-10">
                <div className="px-5 pt-6 pb-2 border-b border-transparent">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-slate-900 dark:text-white text-2xl font-bold leading-tight">Faturas</h1>
                        <button className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors">
                            <span className="material-symbols-outlined">add_circle</span>
                        </button>
                    </div>

                    {/* Search */}
                    <div className="mb-4">
                        <label className="flex flex-col w-full relative">
                            <input
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="pl-10 pr-4 py-2 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                placeholder="Buscar emissor, ID ou valor..."
                            />
                            <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[20px] pointer-events-none">search</span>
                        </label>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                        {[
                            { id: 'ALL', label: 'Tudo' },
                            { id: 'APROVADO', label: 'Aprovado' },
                            { id: 'PENDENTE', label: 'Pendente' },
                            { id: 'SINALIZADO', label: 'Sinalizado' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setStatusFilter(tab.id as any)}
                                className={`flex shrink-0 items-center justify-center rounded-full px-4 py-1.5 text-xs font-semibold transition-all border
                                    ${statusFilter === tab.id
                                        ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900'
                                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
                    {filteredList.map(inv => (
                        <div
                            key={inv.id}
                            onClick={() => setSelectedId(inv.id)}
                            className={`group flex flex-col gap-2 p-3 rounded-xl cursor-pointer relative overflow-hidden transition-all border
                                ${selectedId === inv.id
                                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                                    : 'bg-white dark:bg-slate-900 border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                }`}
                        >
                            {selectedId === inv.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600"></div>}

                            <div className="flex justify-between items-start pl-2">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 size-10 text-slate-500">
                                        <span className="material-symbols-outlined text-[20px]">
                                            {CATEGORY_ICONS[inv.categoria || 'Outros'] || 'receipt_long'}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-slate-900 dark:text-white text-sm font-bold leading-tight line-clamp-1">{inv.nome_emissor || 'Desconhecido'}</p>
                                        <p className="text-slate-500 dark:text-slate-400 text-xs font-normal mt-0.5">{inv.numero_nota ? `Nota #${inv.numero_nota}` : `#${inv.id.substring(0, 6)}`}</p>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-slate-900 dark:text-white text-sm font-bold">{formatMoney(inv.valor_total)}</p>
                                    <p className="text-slate-500 dark:text-slate-400 text-xs">{dateStr(inv.data)}</p>
                                </div>
                            </div>

                            <div className="flex justify-between items-center pl-2 mt-1">
                                {inv.auditReason ? (
                                    <div className="flex items-center gap-1.5 text-xs font-medium text-amber-600 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-md border border-amber-100 dark:border-amber-800">
                                        <span className="material-symbols-outlined text-[14px]">warning</span>
                                        Risco Audit
                                    </div>
                                ) : (
                                    <div className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md border
                                        ${inv.status === 'APROVADO'
                                            ? 'text-green-700 bg-green-50 border-green-100 dark:bg-green-900/30 dark:border-green-800 dark:text-green-400'
                                            : 'text-slate-600 bg-slate-100 border-slate-200'
                                        }`}>
                                        <span className={`size-1.5 rounded-full mr-1 ${inv.status === 'APROVADO' ? 'bg-green-500' : 'bg-slate-400'}`}></span>
                                        {inv.status || 'Pendente'}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {filteredList.length === 0 && (
                        <div className="text-center p-8 text-slate-400 text-sm">
                            Nenhuma fatura encontrada.
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Content Details */}
            <section className="flex-1 flex flex-col bg-slate-50 dark:bg-[#101622] overflow-hidden relative">
                {selectedInvoice ? (
                    <InvoiceViewer
                        invoice={selectedInvoice}
                        onDelete={onDelete}
                        onApprove={onApprove}
                        onUpdate={onUpdate}
                        availableCategories={Array.from(new Set(invoices.map(i => i.categoria || 'Outros')))}
                    />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                        <span className="material-symbols-outlined text-6xl mb-4 text-slate-300">description</span>
                        <p className="text-lg font-medium">Selecione uma nota fiscal para ver os detalhes</p>
                    </div>
                )}
            </section >
        </div >
    );
};
