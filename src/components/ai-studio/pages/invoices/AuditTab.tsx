import React, { useState, useMemo } from 'react';
import { Invoice } from './types';

interface AuditTabProps {
    invoices: Invoice[];
    onApprove: (id: string) => void;
    onDelete: (id: string) => void;
}

export const AuditTab: React.FC<AuditTabProps> = ({ invoices, onApprove, onDelete }) => {
    // Helper Component for Sections
    const SectionHeader = ({ title, icon }: { title: string, icon: string }) => (
        <div className="flex items-center gap-2 mb-3 pt-4 border-t border-slate-100 dark:border-slate-800 first:border-0 first:pt-0">
            <span className="material-symbols-outlined text-slate-400 text-sm">{icon}</span>
            <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider">{title}</h4>
        </div>
    );

    const [selectedId, setSelectedId] = useState<string | null>(null);

    const pendingInvoices = useMemo(() => {
        return invoices.filter(i => i.status === 'PENDENTE' || i.status === 'DUPLICATA' || !!i.auditReason);
    }, [invoices]);

    // Auto-select first if none selected
    React.useEffect(() => {
        if (!selectedId && pendingInvoices.length > 0) {
            setSelectedId(pendingInvoices[0].id);
        } else if (selectedId && !pendingInvoices.find(i => i.id === selectedId)) {
            // If selected was approved/deleted, move to next
            setSelectedId(pendingInvoices[0]?.id || null);
        }
    }, [pendingInvoices, selectedId]);

    const selectedInvoice = useMemo(() =>
        pendingInvoices.find(i => i.id === selectedId) || pendingInvoices[0],
        [pendingInvoices, selectedId]);

    // Find potential match for comparison (Smart Merge Candidate)
    const originalInvoice = useMemo(() => {
        if (!selectedInvoice) return null;

        // Exact same logic as InvoiceControl to find the "System" match
        const cleanCNPJ = (c: any) => String(c || '').replace(/\D/g, '');
        const newCNPJ = cleanCNPJ(selectedInvoice.cnpj_cpf_emissor);
        const newVal = parseFloat(selectedInvoice.valor_total as any || 0).toFixed(2);

        return invoices.find(inv => {
            if (inv.status !== 'APROVADO' || inv.id === selectedInvoice.id) return false;

            const sameCNPJ = cleanCNPJ(inv.cnpj_cpf_emissor) === newCNPJ;
            const sameVal = parseFloat(inv.valor_total as any || 0).toFixed(2) === newVal;

            // Strict check: Value MUST match.
            if (!sameVal) return false;
            if (newCNPJ && cleanCNPJ(inv.cnpj_cpf_emissor)) return sameCNPJ;

            // Fallback
            const sameName = (inv.nome_emissor || '').toLowerCase() === (selectedInvoice.nome_emissor || '').toLowerCase();
            const sameDate = inv.data === selectedInvoice.data;
            return sameName || sameDate;
        });
    }, [selectedInvoice, invoices]);

    const formatMoney = (v: any) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v) || 0);

    // Helpers for visual diffs
    const isDivergent = (val1: any, val2: any) => {
        if (!val1 && !val2) return false;
        if (!val1 && val2) return true; // Missing in system
        if (val1 && !val2) return true; // Missing in new
        return String(val1).trim().toLowerCase() !== String(val2).trim().toLowerCase();
    };

    const ComparisonRow = ({ label, systemVal, newVal, type = 'text' }: { label: string, systemVal: any, newVal: any, type?: 'text' | 'money' }) => {
        const displaySystem = type === 'money' ? formatMoney(systemVal) : (systemVal || '-');
        const displayNew = type === 'money' ? formatMoney(newVal) : (newVal || '-');
        const divergent = isDivergent(systemVal, newVal);

        return (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center py-4 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors px-4 rounded-lg">
                {/* Text Label */}
                <div className="md:col-span-3">
                    <p className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-1">{label}</p>
                    {divergent && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-700 uppercase tracking-wide">
                            Divergente
                        </span>
                    )}
                </div>

                {/* System Value */}
                <div className="md:col-span-4">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 md:hidden">No Sistema</label>
                    <div className={`w-full p-2.5 rounded-lg border text-sm font-medium ${!systemVal ? 'bg-slate-100 text-slate-400 border-slate-200 italic' : 'bg-white text-slate-700 border-slate-300'
                        }`}>
                        {displaySystem === '-' ? 'Não informado' : displaySystem}
                    </div>
                </div>

                {/* Arrow */}
                <div className="md:col-span-1 flex justify-center py-2 md:py-0">
                    <span className="material-symbols-outlined text-slate-300">arrow_right_alt</span>
                </div>

                {/* New Value */}
                <div className="md:col-span-4">
                    <label className="block text-[10px] font-bold text-blue-600 uppercase mb-1 md:hidden">Importado (PDF/XML)</label>
                    <div className={`w-full p-2.5 rounded-lg border text-sm font-bold shadow-sm ${divergent ? 'bg-amber-50 border-amber-200 text-slate-900 ring-1 ring-amber-100' : 'bg-white border-slate-300 text-slate-900'
                        }`}>
                        {displayNew}
                    </div>
                </div>
            </div>
        );
    };

    if (!selectedInvoice && pendingInvoices.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[600px] text-slate-400">
                <div className="bg-slate-50 dark:bg-slate-800 p-8 rounded-full mb-4">
                    <span className="material-symbols-outlined text-4xl">check_circle</span>
                </div>
                <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300">Tudo limpo!</h2>
                <p>Nenhuma pendência ou duplicata para revisar.</p>
            </div>
        );
    }

    if (!selectedInvoice) return null; // Should ideally select first one

    return (
        <div className="flex flex-col md:flex-row h-[750px] bg-white dark:bg-[#0f172a] rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden">

            {/* LEFT SIDEBAR LIST */}
            <div className="w-full md:w-[320px] lg:w-[380px] bg-slate-50 dark:bg-[#1e293b] border-r border-slate-200 dark:border-slate-700 flex flex-col flex-shrink-0">
                <div className="p-4 bg-slate-900 text-white shadow-sm z-10">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="material-symbols-outlined text-emerald-400">dns</span>
                        <h3 className="text-xs font-bold uppercase tracking-widest">Fila de Processamento</h3>
                    </div>
                    <p className="text-2xl font-black">{pendingInvoices.length} <span className="text-sm font-medium text-slate-400 opacity-70">Pendentes</span></p>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    {pendingInvoices.map((inv, idx) => (
                        <div
                            key={inv.id}
                            onClick={() => setSelectedId(inv.id)}
                            className={`relative p-4 rounded-xl border transition-all cursor-pointer group ${selectedId === inv.id
                                ? 'bg-white border-l-[4px] border-l-blue-600 border-y-slate-200 border-r-slate-200 shadow-md'
                                : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm opacity-90'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className="font-bold text-slate-400 text-[10px] uppercase">ITEM #{idx + 1}</span>
                                {originalInvoice ? (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-green-100 text-green-700 uppercase">Atualizar Existente</span>
                                ) : (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-700 uppercase">Novo</span>
                                )}
                            </div>
                            <h4 className="font-bold text-slate-800 text-sm leading-tight mb-1 truncate" title={inv.nome_emissor}>{inv.nome_emissor}</h4>
                            <p className="text-slate-500 text-xs font-medium mb-2">{formatMoney(inv.valor_total)}</p>

                            <div className="flex items-center gap-1 text-[10px] text-blue-600 font-bold">
                                <span className="material-symbols-outlined text-[14px]">link</span>
                                {inv.source || 'Upload'}
                            </div>

                            {selectedId === inv.id && (
                                <div className="absolute inset-0 bg-blue-50/10 pointer-events-none rounded-xl"></div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-[#0f172a] relative">

                {/* DETAIL HEADER */}
                <div className="p-6 md:p-8 flex-1 overflow-y-auto pb-32">
                    <div className="mb-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-blue-100 text-blue-600 px-2 py-1 rounded text-xs font-bold uppercase">
                                {originalInvoice ? 'Duplicata Detectada' : 'Novo Registro'}
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white truncate">
                                "{selectedInvoice.nome_emissor}"
                            </h2>
                        </div>
                    </div>

                    {/* AI ANALYSIS BOX */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-5 mb-8 flex gap-4">
                        <div className="bg-white dark:bg-blue-800 p-2 rounded-lg h-fit shadow-sm">
                            <span className="material-symbols-outlined text-blue-600 text-xl">auto_awesome</span>
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-blue-800 dark:text-blue-300 uppercase mb-1">Análise Inteligente da IA</h4>
                            <p className="text-sm text-blue-700 dark:text-blue-200 leading-relaxed">
                                {originalInvoice
                                    ? "Atenção: Embora haja alta similaridade com uma nota existente, detectamos divergências específicas (destacadas em laranja) que exigem sua revisão manual. Recomendamos a atualização caso sejam dados complementares."
                                    : "Este parece ser um documento novo e legítimo. Verifique os dados extraídos antes de aprovar."
                                }
                            </p>
                        </div>
                    </div>

                    {/* COMPARISON SECTIONS */}
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
                            <span className="material-symbols-outlined text-orange-500">info</span>
                            <h3 className="font-bold text-slate-800 text-lg">Informações Gerais</h3>
                        </div>

                        <div className="space-y-2 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                            {/* Headers Row (Desktop) */}
                            <div className="hidden md:grid grid-cols-12 gap-4 px-4 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                <div className="col-span-3">Campo</div>
                                <div className="col-span-4">No Sistema (Original)</div>
                                <div className="col-span-1"></div>
                                <div className="col-span-4 text-blue-600">Final (Novo/Importado)</div>
                            </div>

                            <ComparisonRow
                                label="Descrição/Emissor"
                                systemVal={originalInvoice?.nome_emissor}
                                newVal={selectedInvoice.nome_emissor}
                            />
                            <ComparisonRow
                                label="Valor Total"
                                systemVal={originalInvoice?.valor_total}
                                newVal={selectedInvoice.valor_total}
                                type="money"
                            />
                            <ComparisonRow
                                label="Data Emissão"
                                systemVal={originalInvoice?.data}
                                newVal={selectedInvoice.data}
                            />
                            <ComparisonRow
                                label="Tomador"
                                systemVal={originalInvoice?.nome_tomador}
                                newVal={selectedInvoice.nome_tomador}
                            />
                            <ComparisonRow
                                label="Email Tomador"
                                systemVal={originalInvoice?.email_tomador}
                                newVal={selectedInvoice.email_tomador}
                            />
                            <ComparisonRow
                                label="Endereço Tomador"
                                systemVal={originalInvoice?.endereco_tomador}
                                newVal={selectedInvoice.endereco_tomador}
                            />
                            <ComparisonRow
                                label="Num. Nota"
                                systemVal={originalInvoice?.numero_nota}
                                newVal={selectedInvoice.numero_nota}
                            />
                            <ComparisonRow
                                label="Série da Nota"
                                systemVal={originalInvoice?.serie_nota}
                                newVal={selectedInvoice.serie_nota}
                            />
                            <ComparisonRow
                                label="Beneficiário (IRPF)"
                                systemVal={originalInvoice?.beneficiario}
                                newVal={selectedInvoice.beneficiario}
                            />
                        </div>
                    </div>
                </div>

                {/* ACTION FOOTER */}
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-white dark:bg-[#0f172a] border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3 z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                    <button
                        onClick={() => onDelete(selectedInvoice.id)}
                        className="px-6 py-3 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 font-bold text-sm transition-colors uppercase tracking-wide"
                    >
                        Desvincular & Criar Novo
                    </button>
                    <button
                        onClick={() => onApprove(selectedInvoice.id)}
                        className="px-8 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-200 transition-all uppercase tracking-wide flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-[18px]">sync_alt</span>
                        {originalInvoice ? 'Atualizar Ativo Existente' : 'Aprovar Nota Fiscal'}
                    </button>
                </div>
            </div>
        </div>
    );
};
