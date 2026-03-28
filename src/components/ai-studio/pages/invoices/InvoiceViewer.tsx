import React, { useState, useMemo } from 'react';
import { Invoice, CATEGORY_ICONS, BENEFICIARIES } from './types';
import { formatMoney } from '@/lib/formatters';

interface InvoiceViewerProps {
    invoice: Invoice;
    onClose?: () => void;
    onDelete: (id: string) => void;
    onApprove: (id: string) => void;
    onUpdate: (id: string, data: Record<string, unknown>) => Promise<void>;
    availableCategories?: string[];
}

export const InvoiceViewer: React.FC<InvoiceViewerProps> = ({ invoice, onClose, onDelete, onApprove, onUpdate, availableCategories = [] }) => {
    const [activeTab, setActiveTab] = useState<'details' | 'document' | 'audit'>('details');
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");

    const dateStr = (d?: string) => d || "-";

    const categories = useMemo(() => {
        const base = ["Saúde", "Educação", "Reforma", "Eletrônicos", "Outros"];
        const combined = new Set([...base, ...availableCategories]);
        if (invoice.categoria) combined.add(invoice.categoria);
        return Array.from(combined).sort();
    }, [availableCategories, invoice.categoria]);

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

    const currentCatClass = getCategoryStyle(invoice.categoria || 'Outros');

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-[#0f172a] overflow-hidden text-slate-900 dark:text-slate-100 font-sans">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white dark:bg-[#1e293b] border-b border-slate-200 dark:border-slate-700 shadow-sm sticky top-0 z-20">
                <div className="flex items-center gap-4">
                    {onClose && <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"><span className="material-symbols-outlined">close</span></button>}
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-xl font-bold text-slate-900 dark:text-white">{invoice.numero_nota ? `Validação: ${invoice.numero_nota}` : `Validação: ${invoice.id.substring(0, 8)}`}</h1>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wide border ${invoice.status === 'APROVADO' ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-900' : invoice.status === 'PENDENTE' ? 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-900' : 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900'}`}>{invoice.status === 'APROVADO' ? 'Aprovado' : invoice.status === 'PENDENTE' ? 'Revisão Necessária' : 'Rejeitado'}</span>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Recebido em {dateStr(invoice.data)} • via {invoice.source || 'Upload'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => confirm('Rejeitar nota?') && (onDelete(invoice.id), onClose?.())} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-sm font-semibold rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><span className="material-symbols-outlined text-[18px]">thumb_down</span><span className="hidden sm:inline">Rejeitar</span></button>
                    {invoice.status !== 'APROVADO' && <button onClick={() => onApprove(invoice.id)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-md transition-colors shadow-sm"><span className="material-symbols-outlined text-[18px]">check_circle</span><span className="hidden sm:inline">Aprovar Documento</span></button>}
                    <div className="relative group">
                        {isCreatingCategory ? (
                            <div className="flex items-center bg-white dark:bg-slate-800 rounded-md border border-slate-300 dark:border-slate-600 overflow-hidden">
                                <input autoFocus className="h-9 px-3 w-[150px] text-sm font-medium bg-transparent border-none focus:ring-0" placeholder="Nova Categoria" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} onBlur={() => !newCategoryName && setIsCreatingCategory(false)} onKeyDown={async (e) => { if (e.key === 'Enter' && newCategoryName.trim()) { await onUpdate(invoice.id, { categoria: newCategoryName.trim() }); setIsCreatingCategory(false); setNewCategoryName(""); } }} />
                                <button className="px-2 text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700" onClick={() => setIsCreatingCategory(false)}><span className="material-symbols-outlined text-[16px]">close</span></button>
                            </div>
                        ) : (
                            <div className={`relative flex items-center h-10 rounded-md border pl-2 pr-1 transition-all ${currentCatClass}`}>
                                <span className="material-symbols-outlined text-[18px] mr-1.5">{CATEGORY_ICONS[invoice.categoria || 'Outros'] || 'receipt_long'}</span>
                                <select value={invoice.categoria || 'Outros'} onChange={async (e) => { const val = e.target.value; if (val === '__NEW__') setIsCreatingCategory(true); else await onUpdate(invoice.id, { categoria: val }); }} className="bg-transparent border-none text-sm font-bold uppercase cursor-pointer focus:ring-0 pr-8 appearance-none py-1 h-full">{categories.map(c => <option key={c} value={c} className="text-slate-900 bg-white">{c}</option>)}<option value="__NEW__" className="font-bold text-blue-600 bg-blue-50">+ Nova Categoria...</option></select>
                                <span className="material-symbols-outlined absolute right-2 pointer-events-none text-[18px]">expand_more</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-[#1e293b] border-b border-slate-200 dark:border-slate-700 px-6">
                <nav className="-mb-px flex space-x-8">{[{ id: 'details', label: 'Dados Extraídos' }, { id: 'document', label: 'Documento Original' }, { id: 'audit', label: 'Auditoria' }].map(tab => <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200'}`}>{tab.label}</button>)}</nav>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50 dark:bg-[#0f172a]">
                {activeTab === 'details' && (
                    <div className="max-w-[95rem] mx-auto space-y-6">
                        <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                            <div className="grid grid-cols-6 gap-0">
                                <div className="border-r border-slate-100 dark:border-slate-800 pr-4"><label className="text-[10px] font-black text-slate-400 uppercase block mb-3 tracking-widest">Valor Total</label><p className="font-black text-3xl text-slate-900 dark:text-white tracking-tight">{formatMoney(invoice.valor_total)}</p></div>
                                <div className="border-r border-slate-100 dark:border-slate-800 px-4"><label className="text-[10px] font-black text-slate-400 uppercase block mb-3 tracking-widest">Data Emissão</label><p className="font-bold text-2xl text-slate-700 dark:text-slate-300">{dateStr(invoice.data)}</p></div>
                                <div className="border-r border-slate-100 dark:border-slate-800 px-4"><label className="text-[10px] font-black text-slate-400 uppercase block mb-3 tracking-widest">Número</label><p className="font-black text-2xl text-red-600 dark:text-red-500">{invoice.numero_nota || '-'}</p></div>
                                <div className="border-r border-slate-100 dark:border-slate-800 px-4"><label className="text-[10px] font-black text-slate-400 uppercase block mb-3 tracking-widest">Série</label><p className="font-bold text-2xl text-slate-600 dark:text-slate-400">{invoice.serie_nota || '-'}</p></div>
                                <div className="border-r border-slate-100 dark:border-slate-800 px-4"><label className="text-[10px] font-black text-slate-400 uppercase block mb-3 tracking-widest">Município</label><p className="font-bold text-2xl text-slate-600 dark:text-slate-400 uppercase truncate">{invoice.cidade || '-'}</p></div>
                                <div className="pl-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-3 tracking-widest">Status IRPF</label>
                                    {(() => {
                                        const isNonDeductible = invoice.beneficiario === 'NÃO DEDUTÍVEL' || invoice.categoria === 'Reforma' || invoice.categoria === 'Eletrônicos';
                                        const hasBeneficiary = invoice.beneficiario && invoice.beneficiario !== 'NÃO DEDUTÍVEL';
                                        if (isNonDeductible) return <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500"><span className="material-symbols-outlined text-[20px]">money_off</span><span className="text-[10px] font-black uppercase tracking-tight">Não Dedutível</span></div>;
                                        return (
                                            <div className="flex flex-col gap-1.5">
                                                <div className={`flex items-center gap-1.5 ${hasBeneficiary ? 'text-emerald-600' : 'text-amber-500'}`}><span className="material-symbols-outlined text-[20px]">{hasBeneficiary ? 'check_circle' : 'warning'}</span><span className="text-[10px] font-black uppercase tracking-tight">{hasBeneficiary ? 'Dedutível' : 'Pendente'}</span></div>
                                                <select className="text-[9px] font-black bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5 focus:ring-0 text-slate-700 dark:text-slate-300 cursor-pointer h-5 uppercase" value={invoice.beneficiario || ""} onChange={async (e) => e.target.value && await onUpdate(invoice.id, { beneficiario: e.target.value })}>
                                                    <option value="" disabled>Selecionar...</option><option value="NÃO DEDUTÍVEL">NÃO DEDUTÍVEL</option>{BENEFICIARIES.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                                                </select>
                                            </div>
                                        )
                                    })()}
                                </div>
                            </div>
                        </div>

                        <div className="bg-indigo-50/30 border-2 border-indigo-100 dark:border-indigo-950 rounded-xl p-4 mt-8">
                            <div className="flex items-center gap-2 mb-4"><div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-lg shadow-sm"><span className="material-symbols-outlined text-xl">receipt_long</span></div><h3 className="text-sm font-black uppercase tracking-widest text-indigo-900 dark:text-indigo-300">Itens da Nota</h3></div>
                            <div className="bg-white dark:bg-[#1e293b] border border-indigo-100 dark:border-indigo-900/50 rounded-xl overflow-hidden shadow-sm">
                                <div className="grid grid-cols-[40px_1fr_60px_100px_120px_100px] gap-4 px-4 py-3 bg-indigo-50/50 dark:bg-slate-800/50 border-b border-indigo-100 dark:border-indigo-900/50 text-[10px] font-black uppercase tracking-wider text-indigo-400 dark:text-indigo-500"><div className="text-center">#</div><div>Descrição</div><div className="text-center">Qtd.</div><div className="text-right">V. Unit</div><div className="text-right font-black text-indigo-600 dark:text-indigo-400">V. Total</div><div className="text-right">Categoria</div></div>
                                <div className="bg-white dark:bg-[#1e293b] divide-y divide-slate-50 dark:divide-slate-800">
                                    {invoice.items && (invoice.items as Array<Record<string, unknown>>).length > 0 ? (
                                        (invoice.items as Array<Record<string, unknown>>).map((item: Record<string, unknown>, idx: number) => {
                                            const qty = Number(item.quantidade) || 1;
                                            const total = Number(item.valor) || 0;
                                            return <div key={idx} className="grid grid-cols-[40px_1fr_60px_100px_120px_100px] gap-4 px-4 py-3 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/20 transition-colors items-center text-xs group"><div className="text-center text-slate-300 dark:text-slate-600 font-bold group-hover:text-indigo-300">{idx + 1}</div><div className="font-bold text-slate-700 dark:text-slate-200 uppercase leading-snug">{item.descricao}</div><div className="text-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/80 rounded py-0.5 font-medium border border-slate-100 dark:border-slate-700">{qty}</div><div className="text-right text-slate-500 dark:text-slate-400">{formatMoney(total / qty)}</div><div className="text-right font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 text-sm">{formatMoney(total)}</div><div className="text-right"><span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/40 rounded text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase border border-indigo-100 dark:border-indigo-800/50">{item.categoria || '-'}</span></div></div>
                                        })
                                    ) : <div className="p-12 text-center text-slate-400 italic text-xs">Nenhum item detalhado.</div>}
                                </div>
                                <div className="px-4 py-4 bg-indigo-50/20 dark:bg-slate-800/30 border-t border-indigo-50 dark:border-indigo-900/30 flex justify-end items-center gap-4"><span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total dos Itens</span><span className="text-xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">{formatMoney(invoice.valor_total)}</span></div>
                            </div>
                        </div>
                        {invoice.auditReason && <div className="mt-6 flex items-center justify-between bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md px-4 py-3"><div className="flex items-center gap-3"><span className="material-symbols-outlined text-amber-600 dark:text-amber-500">warning</span><p className="text-sm text-amber-800 dark:text-amber-200"><span className="font-bold">Atenção:</span> {invoice.auditReason}</p></div></div>}
                    </div>
                )}
                {activeTab === 'document' && <div className="w-full h-full flex flex-col rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm bg-slate-100 dark:bg-slate-900"><div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-[#1e293b] border-b border-slate-200 dark:border-slate-700"><span className="flex items-center gap-1 cursor-pointer hover:text-slate-600 dark:hover:text-slate-300 text-sm text-slate-500"><span className="material-symbols-outlined text-[16px]">visibility</span>Visualização Original</span><button className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700" onClick={() => { const w = window.open('about:blank'); if (w) w.document.write(`<iframe src="${invoice.fileCopy}" style="width:100%;height:100%;border:none;"></iframe>`); }}><span className="material-symbols-outlined text-[16px]">open_in_new</span>Abrir em nova aba</button></div><div className="relative flex-1 bg-slate-200 dark:bg-slate-900 flex items-center justify-center overflow-auto">{invoice.fileCopy && (invoice.fileCopy.startsWith('data:application/pdf') || invoice.fileCopy.startsWith('data:image/') || invoice.fileCopy.startsWith('https://')) ? <iframe src={invoice.fileCopy} sandbox="allow-same-origin" className="w-full h-full bg-white" title="Doc" /> : <div className="text-slate-400 flex flex-col items-center gap-2"><span className="material-symbols-outlined text-4xl">broken_image</span><span>Visualização indisponível</span></div>}</div></div>}
                {activeTab === 'audit' && <div className="max-w-4xl mx-auto bg-white dark:bg-[#1e293b] rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-8 text-center text-slate-500"><span className="material-symbols-outlined text-4xl mb-2">verified_user</span><h3 className="text-lg font-bold text-slate-900 dark:text-white">Trilha de Auditoria</h3><p className="mb-6">Histórico de alterações e validações.</p><div className="text-left font-mono text-xs bg-slate-50 dark:bg-slate-900 p-4 rounded border border-slate-100 dark:border-slate-700 whitespace-pre-wrap">{JSON.stringify({ id: invoice.id, status: invoice.status, nome_emissor: invoice.nome_emissor, cnpj_cpf_emissor: invoice.cnpj_cpf_emissor, valor_total: invoice.valor_total, categoria: invoice.categoria, beneficiario: invoice.beneficiario, data: invoice.data, source: invoice.source, auditReason: invoice.auditReason, createdAt: invoice.createdAt }, null, 2)}</div></div>}
            </div>
        </div>
    );
};
