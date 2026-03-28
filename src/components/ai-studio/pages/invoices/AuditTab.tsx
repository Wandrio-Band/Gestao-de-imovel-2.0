import React, { useState, useMemo } from 'react';
import { Invoice } from './types';
import { formatMoney } from '@/lib/formatters';

interface AuditTabProps {
    invoices: Invoice[];
    onApprove: (id: string) => void;
    onDelete: (id: string) => void;
}

export const AuditTab: React.FC<AuditTabProps> = ({ invoices, onApprove, onDelete }) => {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const pendingInvoices = useMemo(() => invoices.filter(i => i.status === 'PENDENTE' || i.status === 'DUPLICATA' || !!i.auditReason), [invoices]);

    React.useEffect(() => {
        if (!selectedId && pendingInvoices.length > 0) {
            setSelectedId(pendingInvoices[0].id);
        } else if (selectedId && !pendingInvoices.find(i => i.id === selectedId)) {
            setSelectedId(pendingInvoices[0]?.id || null);
        }
    }, [pendingInvoices]); // eslint-disable-line react-hooks/exhaustive-deps

    const selectedInvoice = useMemo(() => pendingInvoices.find(i => i.id === selectedId) || pendingInvoices[0], [pendingInvoices, selectedId]);

    const originalInvoice = useMemo(() => {
        if (!selectedInvoice) return null;
        const clean = (c: string | undefined) => String(c || '').replace(/\D/g, '');
        const nCNPJ = clean(selectedInvoice.cnpj_cpf_emissor);
        const nVal = parseFloat(String(selectedInvoice.valor_total || 0)).toFixed(2);
        const nDate = String(selectedInvoice.data || '').trim();
        return invoices.find(inv => {
            if (inv.status !== 'APROVADO' || inv.id === selectedInvoice.id) return false;
            const invVal = parseFloat(String(inv.valor_total || 0)).toFixed(2);
            if (invVal !== nVal) return false;
            if (!nCNPJ || clean(inv.cnpj_cpf_emissor) !== nCNPJ) return false;
            // Also match date to avoid false positives
            if (nDate && inv.data && String(inv.data).trim() !== nDate) return false;
            return true;
        });
    }, [selectedInvoice, invoices]);

    const ComparisonRow = ({ label, systemVal, newVal, type = 'text' }: { label: string, systemVal: string | number | null, newVal: string | number | null, type?: 'text' | 'money' }) => {
        const dSys = type === 'money' ? formatMoney(systemVal) : (systemVal || '-');
        const dNew = type === 'money' ? formatMoney(newVal) : (newVal || '-');
        const divergent = String(systemVal || '').trim().toLowerCase() !== String(newVal || '').trim().toLowerCase();
        return (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center py-4 border-b border-slate-100 hover:bg-slate-50 transition-colors px-4 rounded-lg">
                <div className="md:col-span-3"><p className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-1">{label}</p>{divergent && <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-700 uppercase">Divergente</span>}</div>
                <div className="md:col-span-4"><div className={`w-full p-2.5 rounded-lg border text-sm font-medium ${!systemVal ? 'bg-slate-100 text-slate-400' : 'bg-white text-slate-700 border-slate-300'}`}>{dSys === '-' ? 'Não informado' : dSys}</div></div>
                <div className="md:col-span-1 flex justify-center"><span className="material-symbols-outlined text-slate-300">arrow_right_alt</span></div>
                <div className="md:col-span-4"><div className={`w-full p-2.5 rounded-lg border text-sm font-bold shadow-sm ${divergent ? 'bg-amber-50 border-amber-200 text-slate-900 ring-1 ring-amber-100' : 'bg-white border-slate-300 text-slate-900'}`}>{dNew}</div></div>
            </div>
        );
    };

    if (!selectedInvoice && pendingInvoices.length === 0) return <div className="flex flex-col items-center justify-center h-[600px] text-slate-400"><div className="bg-slate-50 p-8 rounded-full mb-4"><span className="material-symbols-outlined text-4xl">check_circle</span></div><h2 className="text-xl font-bold text-slate-700">Tudo limpo!</h2><p>Nenhuma pendência para revisar.</p></div>;
    if (!selectedInvoice) return null;

    return (
        <div className="flex flex-col md:flex-row h-[750px] bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="w-full md:w-[320px] bg-slate-50 border-r border-slate-200 flex flex-col flex-shrink-0">
                <div className="p-4 bg-slate-900 text-white"><h3 className="text-xs font-bold uppercase tracking-widest">Fila de Processamento</h3><p className="text-2xl font-black">{pendingInvoices.length} <span className="text-sm font-medium opacity-70">Pendentes</span></p></div>
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    {pendingInvoices.map((inv, idx) => (
                        <div key={inv.id} onClick={() => setSelectedId(inv.id)} className={`relative p-4 rounded-xl border cursor-pointer ${selectedId === inv.id ? 'bg-white border-l-[4px] border-l-blue-600 shadow-md' : 'bg-white hover:border-blue-300 opacity-90'}`}>
                            <div className="flex justify-between items-start mb-1"><span className="font-bold text-slate-400 text-[10px]">ITEM #{idx + 1}</span><span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${originalInvoice ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'} uppercase`}>{originalInvoice ? 'Sinc.' : 'Novo'}</span></div>
                            <h4 className="font-bold text-slate-800 text-sm leading-tight mb-1 truncate">{inv.nome_emissor}</h4><p className="text-slate-500 text-xs font-medium">{formatMoney(inv.valor_total)}</p>
                        </div>
                    ))}
                </div>
            </div>
            <div className="flex-1 flex flex-col h-full bg-white relative">
                <div className="p-8 flex-1 overflow-y-auto pb-32">
                    <div className="flex items-center gap-3 mb-6"><div className="bg-blue-100 text-blue-600 px-2 py-1 rounded text-xs font-bold uppercase">{originalInvoice ? 'Duplicata Detectada' : 'Novo Registro'}</div><h2 className="text-2xl font-black text-slate-900">"{selectedInvoice.nome_emissor}"</h2></div>
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 mb-8 flex gap-4"><div className="p-2 bg-white rounded-lg h-fit shadow-sm"><span className="material-symbols-outlined text-blue-600">auto_awesome</span></div><div><h4 className="text-sm font-bold text-blue-800 uppercase mb-1">Análise da IA</h4><p className="text-sm text-blue-700">{originalInvoice ? "Divergências detectadas em relação ao sistema. Por favor revise." : "Documento novo. Valide os dados."}</p></div></div>
                    <div className="space-y-2 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                        <div className="hidden md:grid grid-cols-12 gap-4 px-4 pb-2 text-[10px] font-bold uppercase text-slate-400"><div className="col-span-3">Campo</div><div className="col-span-4">No Sistema</div><div className="col-span-1"></div><div className="col-span-4 text-blue-600">Importado</div></div>
                        <ComparisonRow label="Emissor" systemVal={originalInvoice?.nome_emissor} newVal={selectedInvoice.nome_emissor} />
                        <ComparisonRow label="Valor" systemVal={originalInvoice?.valor_total} newVal={selectedInvoice.valor_total} type="money" />
                        <ComparisonRow label="Data" systemVal={originalInvoice?.data} newVal={selectedInvoice.data} />
                        <ComparisonRow label="Tomador" systemVal={originalInvoice?.nome_tomador} newVal={selectedInvoice.nome_tomador} />
                        <ComparisonRow label="NF #" systemVal={originalInvoice?.numero_nota} newVal={selectedInvoice.numero_nota} />
                        <ComparisonRow label="Beneficiário" systemVal={originalInvoice?.beneficiario} newVal={selectedInvoice.beneficiario} />
                    </div>
                </div>
                <div className="p-6 bg-white border-t flex justify-end gap-3"><button onClick={() => onDelete(selectedInvoice.id)} className="px-6 py-3 rounded-lg border text-slate-600 hover:bg-slate-50 font-bold text-sm uppercase">Excluir</button><button onClick={() => onApprove(selectedInvoice.id)} className="px-8 py-3 rounded-lg bg-blue-600 text-white font-bold text-sm shadow-lg uppercase tracking-wide flex items-center gap-2"><span className="material-symbols-outlined">check_circle</span>Aprovar</button></div>
            </div>
        </div>
    );
};
