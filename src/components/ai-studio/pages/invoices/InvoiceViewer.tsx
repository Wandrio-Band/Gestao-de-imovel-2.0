import React, { useState, useMemo } from 'react';
import { Invoice, CATEGORY_ICONS } from './types';

interface InvoiceViewerProps {
    invoice: Invoice;
    onClose?: () => void;
    onDelete: (id: string) => void;
    onApprove: (id: string) => void;
    onUpdate: (id: string, data: any) => Promise<void>;
    availableCategories?: string[];
}

export const InvoiceViewer: React.FC<InvoiceViewerProps> = ({ invoice, onClose, onDelete, onApprove, onUpdate, availableCategories = [] }) => {
    const [activeTab, setActiveTab] = useState<'details' | 'document' | 'audit'>('details');

    // State for custom category
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");

    // Helpers
    const formatMoney = (v: any) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v) || 0);
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
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white dark:bg-[#1e293b] border-b border-slate-200 dark:border-slate-700 shadow-sm sticky top-0 z-20">
                <div className="flex items-center gap-4">
                    {onClose && (
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    )}
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                                {invoice.numero_nota ? `Validação: ${invoice.numero_nota}` : `Validação: ${invoice.id.substring(0, 8)}`}
                            </h1>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wide border
                                ${invoice.status === 'APROVADO'
                                    ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-900'
                                    : invoice.status === 'PENDENTE'
                                        ? 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-900'
                                        : 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900'
                                }`}>
                                {invoice.status === 'APROVADO' ? 'Aprovado' : invoice.status === 'PENDENTE' ? 'Revisão Necessária' : 'Rejeitado'}
                            </span>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Recebido em {dateStr(invoice.data)} • via {invoice.source || 'Upload'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => { if (confirm('Rejeitar/Excluir esta nota?')) { onDelete(invoice.id); if (onClose) onClose(); } }}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-sm font-semibold rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                        <span className="material-symbols-outlined text-[18px]">thumb_down</span>
                        <span className="hidden sm:inline">Rejeitar</span>
                    </button>

                    {invoice.status !== 'APROVADO' && (
                        <button
                            onClick={() => onApprove(invoice.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-md transition-colors shadow-sm"
                        >
                            <span className="material-symbols-outlined text-[18px]">check_circle</span>
                            <span className="hidden sm:inline">Aprovar Documento</span>
                        </button>
                    )}

                    {/* Category Editor in Header */}
                    <div className="relative group">
                        {isCreatingCategory ? (
                            <div className="flex items-center bg-white dark:bg-slate-800 rounded-md border border-slate-300 dark:border-slate-600 overflow-hidden">
                                <input
                                    autoFocus
                                    className="h-9 px-3 w-[150px] text-sm font-medium bg-transparent border-none focus:ring-0"
                                    placeholder="Nova Categoria"
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    onBlur={() => { if (!newCategoryName) setIsCreatingCategory(false); }}
                                    onKeyDown={async (e) => {
                                        if (e.key === 'Enter') {
                                            if (newCategoryName.trim()) {
                                                await onUpdate(invoice.id, { categoria: newCategoryName.trim() });
                                                setIsCreatingCategory(false);
                                                setNewCategoryName("");
                                            }
                                        }
                                    }}
                                />
                                <button className="px-2 text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700" onClick={() => setIsCreatingCategory(false)}>
                                    <span className="material-symbols-outlined text-[16px]">close</span>
                                </button>
                            </div>
                        ) : (
                            <div className={`relative flex items-center h-10 rounded-md border pl-2 pr-1 transition-all ${currentCatClass}`}>
                                <span className="material-symbols-outlined text-[18px] mr-1.5">{CATEGORY_ICONS[invoice.categoria || 'Outros'] || 'receipt_long'}</span>
                                <select
                                    value={invoice.categoria || 'Outros'}
                                    onChange={async (e) => {
                                        const val = e.target.value;
                                        if (val === '__NEW__') setIsCreatingCategory(true);
                                        else await onUpdate(invoice.id, { categoria: val });
                                    }}
                                    className="bg-transparent border-none text-sm font-bold uppercase cursor-pointer focus:ring-0 pr-8 appearance-none py-1 h-full"
                                >
                                    {categories.map(c => <option key={c} value={c} className="text-slate-900 bg-white">{c}</option>)}
                                    <option value="__NEW__" className="font-bold text-blue-600 bg-blue-50">+ Nova Categoria...</option>
                                </select>
                                <span className="material-symbols-outlined absolute right-2 pointer-events-none text-[18px]">expand_more</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white dark:bg-[#1e293b] border-b border-slate-200 dark:border-slate-700 px-6">
                <nav className="-mb-px flex space-x-8">
                    {[
                        { id: 'details', label: 'Dados Extraídos' },
                        { id: 'document', label: 'Documento Original' },
                        { id: 'audit', label: 'Auditoria' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                                ${activeTab === tab.id
                                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50 dark:bg-[#0f172a]">

                {activeTab === 'details' && (
                    <div className="max-w-[95rem] mx-auto space-y-6">

                        {/* Summary Banner */}
                        <div className="bg-white dark:bg-[#1e293b] rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-slate-100 dark:border-slate-700">
                                <div className="flex flex-wrap gap-8 md:gap-12">
                                    <div>
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nota Fiscal</p>
                                        <p className="text-3xl font-bold text-slate-900 dark:text-white">{invoice.numero_nota || invoice.id.substring(0, 8)}</p>
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Data de Emissão</p>
                                        <p className="text-xl font-medium text-slate-900 dark:text-white">{dateStr(invoice.data)}</p>
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Município</p>
                                        <p className="text-xl font-medium text-slate-900 dark:text-white">{invoice.cidade ? `${invoice.cidade}/${invoice.estado || ''}` : '-'}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Valor Total</p>
                                    <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">{formatMoney(invoice.valor_total)}</p>
                                </div>
                            </div>

                            {/* Cards Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                                {/* Provider */}
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-100 dark:border-slate-700 flex gap-4 items-start">
                                    <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg text-blue-600 dark:text-blue-400 shrink-0">
                                        <span className="material-symbols-outlined">storefront</span>
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Prestador de Serviço (Emissor)</p>
                                        <h3 className="font-bold text-slate-900 dark:text-white text-lg truncate mb-2">{invoice.nome_emissor || 'Não Informado'}</h3>
                                        <div className="space-y-1 text-sm text-slate-500 dark:text-slate-400">
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-[16px] text-slate-400">badge</span>
                                                <span>CNPJ: {invoice.cnpj_cpf_emissor || '-'}</span>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <span className="material-symbols-outlined text-[16px] text-slate-400 mt-0.5">location_on</span>
                                                <span className="truncate">{invoice.endereco_emissor || 'Endereço não extraído'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Taker */}
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-100 dark:border-slate-700 flex gap-4 items-start">
                                    <div className="bg-slate-100 dark:bg-slate-700 p-3 rounded-lg text-slate-600 dark:text-slate-300 shrink-0">
                                        <span className="material-symbols-outlined">person</span>
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tomador de Serviço</p>
                                        <h3 className="font-bold text-slate-900 dark:text-white text-lg truncate mb-2">{invoice.nome_tomador || 'Não Informado'}</h3>
                                        <div className="space-y-1 text-sm text-slate-500 dark:text-slate-400">
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-[16px] text-slate-400">badge</span>
                                                <span>CPF/CNPJ: {invoice.cpf_cnpj_tomador || '-'}</span>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <span className="material-symbols-outlined text-[16px] text-slate-400 mt-0.5">location_on</span>
                                                <span className="truncate">{invoice.endereco_tomador || 'Endereço não extraído'}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-[16px] text-slate-400">mail</span>
                                                <span>{invoice.email_tomador || '-'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* IRPF DATA BOX (Always Visible & Editable) */}
                            {/* IRPF DATA BOX (Always Visible & Editable) */}
                            {(() => {
                                // Logic to determine if it is dedutible
                                const isNonDeductible = invoice.beneficiario === 'NÃO DEDUTÍVEL' || invoice.categoria === 'Reforma';
                                const hasBeneficiary = invoice.beneficiario && invoice.beneficiario !== 'NÃO DEDUTÍVEL';

                                return (
                                    <div className={`mt-6 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all border
                                        ${isNonDeductible
                                            ? 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                                            : hasBeneficiary
                                                ? 'bg-emerald-50/50 border-emerald-100 hover:bg-emerald-50'
                                                : 'bg-amber-50/50 border-amber-100 hover:bg-amber-50'
                                        }`}>
                                        <div className="flex gap-4 items-start">
                                            <div className={`p-3 rounded-xl shrink-0 
                                                ${isNonDeductible
                                                    ? 'bg-slate-200 text-slate-600'
                                                    : hasBeneficiary ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                <span className="material-symbols-outlined text-2xl">{isNonDeductible ? 'money_off' : 'receipt_long'}</span>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className={`text-sm font-black uppercase tracking-wide 
                                                        ${isNonDeductible ? 'text-slate-700' : hasBeneficiary ? 'text-emerald-900' : 'text-amber-900'}`}>
                                                        Dados Para Imposto de Renda
                                                    </h4>
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border 
                                                        ${isNonDeductible
                                                            ? 'bg-slate-200 text-slate-600 border-slate-300'
                                                            : hasBeneficiary
                                                                ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                                                : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                                                        {isNonDeductible ? 'Não Dedutível' : hasBeneficiary ? 'Dedutível' : 'Atenção'}
                                                    </span>
                                                </div>

                                                <div className="flex flex-col gap-1">
                                                    <div className="flex flex-wrap items-baseline gap-2">
                                                        <span className={`text-sm font-bold ${isNonDeductible ? 'text-slate-600' : hasBeneficiary ? 'text-emerald-800' : 'text-amber-800'}`}>
                                                            Status:
                                                        </span>
                                                        <span className={`text-lg font-bold 
                                                            ${isNonDeductible ? 'text-slate-800' : hasBeneficiary ? 'text-emerald-950' : 'text-amber-950 opacity-100'}`}>
                                                            {isNonDeductible ? 'Despesa Não Dedutível' : (invoice.beneficiario || 'Não Identificado — Clique em Corrigir')}
                                                        </span>
                                                    </div>
                                                    <p className={`text-xs italic flex items-center gap-1 ${isNonDeductible ? 'text-slate-500' : hasBeneficiary ? 'text-emerald-600/80' : 'text-amber-700'}`}>
                                                        <span className="material-symbols-outlined text-[14px]">{isNonDeductible ? 'block' : hasBeneficiary ? 'info' : 'warning'}</span>
                                                        {isNonDeductible
                                                            ? 'Esta categoria de despesa não pode ser deduzida do IRPF.'
                                                            : (hasBeneficiary ? 'Extraído automaticamente.' : 'O sistema não encontrou o beneficiário nas observações.')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 shrink-0 items-center">
                                            <div className="flex flex-col items-end gap-1">
                                                {/* Dropdown for Correction */}
                                                <div className="relative group">
                                                    <select
                                                        className={`appearance-none pl-9 pr-8 py-2 text-sm font-bold rounded-lg border shadow-sm transition-all cursor-pointer focus:ring-2 focus:ring-offset-1 outline-none
                                                            ${isNonDeductible
                                                                ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 focus:ring-slate-500'
                                                                : invoice.beneficiario
                                                                    ? 'bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50 focus:ring-emerald-500'
                                                                    : 'bg-white border-amber-200 text-amber-700 hover:bg-amber-50 focus:ring-amber-500 animate-pulse'}`}
                                                        value={invoice.beneficiario || ""}
                                                        onChange={async (e) => {
                                                            const val = e.target.value;
                                                            if (val) await onUpdate(invoice.id, { beneficiario: val });
                                                        }}
                                                    >
                                                        <option value="" disabled>Selecionar Beneficiário...</option>
                                                        <option value="NÃO DEDUTÍVEL">NÃO DEDUTÍVEL (Reforma/Outros)</option>
                                                        <option disabled>───────</option>
                                                        <option value="Wândrio Bandeira dos Anjos">Wândrio Bandeira dos Anjos</option>
                                                        <option value="Lucas Massad Bandeira">Lucas Massad Bandeira</option>
                                                        <option value="Raquel Dutra Massad">Raquel Dutra Massad</option>
                                                        <option value="Ana Júlia Massad Bandeira">Ana Júlia Massad Bandeira</option>
                                                    </select>
                                                    <span className={`material-symbols-outlined absolute left-2.5 top-2 text-[18px] pointer-events-none 
                                                        ${isNonDeductible ? 'text-slate-500' : invoice.beneficiario ? 'text-emerald-600' : 'text-amber-600'}`}>edit</span>
                                                    <span className={`material-symbols-outlined absolute right-2 top-2 text-[18px] pointer-events-none 
                                                        ${isNonDeductible ? 'text-slate-500' : invoice.beneficiario ? 'text-emerald-600' : 'text-amber-600'}`}>expand_more</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Warning Banner */}
                            {invoice.auditReason && (
                                <div className="mt-6 flex items-center justify-between bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-amber-600 dark:text-amber-500">warning</span>
                                        <p className="text-sm text-amber-800 dark:text-amber-200">
                                            <span className="font-bold">Atenção:</span> {invoice.auditReason}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Items Table */}
                        <div className="bg-white dark:bg-[#1e293b] rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-white dark:bg-[#1e293b]">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-blue-600">list_alt</span>
                                    <h3 className="font-bold text-slate-900 dark:text-white">Itens da Nota (Produtos/Serviços)</h3>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                                        <tr>
                                            <th className="px-6 py-3 w-16 text-center">Item</th>
                                            <th className="px-6 py-3">Descrição</th>
                                            <th className="px-6 py-3 text-center w-24">Qtd.</th>
                                            <th className="px-6 py-3 text-right">V. Unit.</th>
                                            <th className="px-6 py-3 text-right font-extrabold text-slate-700 dark:text-slate-300">V. Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-300">
                                        {invoice.items && invoice.items.length > 0 ? (
                                            invoice.items.map((item: any, idx: number) => (
                                                <tr key={idx} className="bg-white dark:bg-[#1e293b] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                                    <td className="px-6 py-4 text-center text-slate-400 font-mono text-xs">{idx + 1}</td>
                                                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{item.descricao}</td>
                                                    <td className="px-6 py-4 text-center font-mono text-slate-500">{item.quantidade || '-'}</td>
                                                    <td className="px-6 py-4 text-right font-mono text-slate-500">{item.valor ? formatMoney(Number(item.valor) / (Number(item.quantidade) || 1)) : '-'}</td>
                                                    <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-white font-mono">{item.valor ? formatMoney(item.valor) : '-'}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">Nenhum item detalhado encontrado</td>
                                            </tr>
                                        )}
                                    </tbody>
                                    <tfoot className="bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
                                        <tr>
                                            <td className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider" colSpan={4}>Valor Total dos Itens</td>
                                            <td className="px-6 py-4 text-right text-lg font-bold text-blue-600 dark:text-blue-400 font-mono bg-blue-50/50 dark:bg-blue-900/10">
                                                {formatMoney(invoice.valor_total)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>

                    </div>
                )}

                {activeTab === 'document' && (
                    <div className="w-full h-full flex flex-col rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm bg-slate-100 dark:bg-slate-900">
                        <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-[#1e293b] border-b border-slate-200 dark:border-slate-700">
                            <div className="flex gap-4">
                                <span className="flex items-center gap-1 cursor-pointer hover:text-slate-600 dark:hover:text-slate-300 text-sm text-slate-500">
                                    <span className="material-symbols-outlined text-[16px]">visibility</span>
                                    Visualização Original
                                </span>
                            </div>
                            <button className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700" onClick={() => {
                                const w = window.open('about:blank');
                                if (w) { w.document.write(`<iframe src="${invoice.fileCopy}" style="width:100%;height:100%;border:none;"></iframe>`); }
                            }}>
                                <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                                Abrir em nova aba
                            </button>
                        </div>
                        <div className="relative flex-1 bg-slate-200 dark:bg-slate-900 flex items-center justify-center overflow-auto">
                            {invoice.fileCopy ? (
                                <iframe
                                    src={invoice.fileCopy}
                                    className="w-full h-full bg-white"
                                    title="Document Preview"
                                />
                            ) : (
                                <div className="text-slate-400 flex flex-col items-center gap-2">
                                    <span className="material-symbols-outlined text-4xl">broken_image</span>
                                    <span>Visualização indisponível</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'audit' && (
                    <div className="max-w-4xl mx-auto bg-white dark:bg-[#1e293b] rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-8 text-center text-slate-500">
                        <span className="material-symbols-outlined text-4xl mb-2">verified_user</span>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Trilha de Auditoria</h3>
                        <p className="mb-6">Histórico de alterações e validações desta nota fiscal.</p>

                        <div className="text-left font-mono text-xs bg-slate-50 dark:bg-slate-900 p-4 rounded border border-slate-100 dark:border-slate-700 whitespace-pre-wrap">
                            {JSON.stringify(invoice, null, 2)}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};
