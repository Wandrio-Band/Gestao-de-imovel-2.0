import React, { useState, useMemo } from 'react';
import { GmailMessage, Invoice } from './types';

interface GmailTabProps {
    isConnected: boolean;
    isProcessing: boolean;
    messages: GmailMessage[];
    onConnect: () => void;
    onSync: () => void;
    onImport: (msg: GmailMessage) => void;
    onDisconnect: () => void;
    onReject: (msg: GmailMessage) => void;
    onUpdateMessage: (msg: GmailMessage) => void;
    processingMsg: string;
    invoices?: Invoice[];
}

const FieldBox = ({ label, value, fullWidth = false, className = '' }: { label: string, value: string | undefined | null, fullWidth?: boolean, className?: string }) => (
    <div className={`border border-slate-200 rounded-lg px-3 py-2 bg-white ${fullWidth ? 'col-span-full' : ''} ${className}`}>
        <label className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5 tracking-wider">{label}</label>
        <p className="font-bold text-sm text-slate-700 dark:text-slate-200 truncate" title={value || ''}>{value || '-'}</p>
    </div>
);

function normalizeDate(dateStr?: string): string {
    if (!dateStr) return '';
    let clean = dateStr.trim();
    if (/^\d{2}\/\d{2}\/\d{2}$/.test(clean)) { const [d, m, y] = clean.split('/'); return `${d}/${m}/20${y}`; }
    if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) { const [y, m, d] = clean.split('-'); return `${d}/${m}/${y}`; }
    return clean;
}

function normalizeValue(val: string | number | undefined): number {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    let clean = val.toString().replace(/[R$\s]/g, '');
    if (clean.includes(',') && (!clean.includes('.') || clean.lastIndexOf(',') > clean.lastIndexOf('.'))) {
        clean = clean.replace(/\./g, '').replace(',', '.');
    } else {
        clean = clean.replace(/,/g, '');
    }
    return parseFloat(clean) || 0;
}

const formatMoney = (v: any) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(normalizeValue(v));

const isDivergent = (val1: any, val2: any) => {
    if (!val1 && !val2) return false;
    if (!val1 || !val2) return true;
    const normalize = (s: any) => String(s || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
    const s1 = normalize(val1);
    const s2 = normalize(val2);
    if (s1 === s2) return false;
    const cleanBiz = (s: string) => s.replace(/\b(ltda|me|epp|sa|s\.a|inc|limitada|servicos|comercio)\b/g, '').trim();
    const b1 = cleanBiz(s1);
    const b2 = cleanBiz(s2);
    if (b1 === b2) return false;
    if (b1.length > 5 && b2.length > 5) { if (b1.includes(b2) || b2.includes(b1)) return false; }
    return true;
};

const fetchCep = async (cep: string) => {
    try {
        const clean = cep.replace(/\D/g, '');
        if (clean.length !== 8) return null;
        const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
        if (!res.ok) return null;
        const data = await res.json();
        if (data.erro) return null;
        return data;
    } catch (e) { return null; }
};

export const GmailTab: React.FC<GmailTabProps> = ({ isConnected, isProcessing, messages, onConnect, onSync, onImport, onDisconnect, onReject, onUpdateMessage, processingMsg, invoices = [] }) => {
    const CATEGORIES = ["Saúde", "Educação", "Reforma", "Eletrônicos", "Outros"];
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [editedCategory, setEditedCategory] = useState<string>('Outros');
    const [viewMode, setViewMode] = useState<'extracted' | 'original'>('extracted');
    const [activeFilter, setActiveFilter] = useState<'all' | 'new' | 'synced' | 'divergent'>('all');

    const invoiceIndex = useMemo(() => {
        const index = new Map<string, Invoice>();
        const cleanCNPJ = (c: any) => String(c || '').replace(/\D/g, '');
        invoices.forEach(inv => {
            const key = `${cleanCNPJ(inv.cnpj_cpf_emissor)}_${normalizeValue(inv.valor_total).toFixed(2)}`;
            if (!index.has(key)) index.set(key, inv);
        });
        return index;
    }, [invoices]);

    const displayedMessages = useMemo(() => {
        if (activeFilter === 'all') return messages;
        const cleanCNPJ = (c: any) => String(c || '').replace(/\D/g, '');
        return messages.filter(m => {
            if (activeFilter === 'new') return !m.isDuplicate;
            if (!m.isDuplicate) return false;
            const newData = m.extracted;
            const key = `${cleanCNPJ(newData?.cnpj_cpf_emissor)}_${normalizeValue(newData?.valor_total).toFixed(2)}`;
            const inv = invoiceIndex.get(key);
            if (!inv) return activeFilter === 'synced';
            const isDiv = [
                isDivergent(inv.nome_emissor, newData?.nome_emissor),
                normalizeValue(inv.valor_total).toFixed(2) !== normalizeValue(newData?.valor_total).toFixed(2),
                (inv.numero_nota || '') != (newData?.numero_nota || ''),
                isDivergent(inv.data, newData?.data),
                isDivergent(inv.endereco_tomador, newData?.endereco_tomador),
                isDivergent(inv.cep_emissor, newData?.cep_emissor),
                isDivergent(inv.logradouro_emissor, newData?.logradouro_emissor),
                isDivergent(inv.numero_emissor, newData?.numero_emissor),
                isDivergent(inv.bairro_emissor, newData?.bairro_emissor),
                isDivergent(inv.cidade, newData?.cidade),
                isDivergent(inv.estado, newData?.estado),
                isDivergent(inv.cep_tomador, newData?.cep_tomador),
                isDivergent(inv.logradouro_tomador, newData?.logradouro_tomador),
                isDivergent(inv.numero_tomador, newData?.numero_tomador),
                isDivergent(inv.bairro_tomador, newData?.bairro_tomador),
                isDivergent(inv.cidade_tomador, newData?.cidade_tomador),
                isDivergent(inv.estado_tomador, newData?.estado_tomador)
            ].some(Boolean);
            return activeFilter === 'divergent' ? isDiv : !isDiv;
        });
    }, [messages, activeFilter, invoiceIndex]);

    const selectedMessage = useMemo(() => {
        if (displayedMessages.length > 0 && (!selectedId || !displayedMessages.find(m => m.id === selectedId))) {
            return displayedMessages.find(m => m.id === selectedId) || displayedMessages[0];
        }
        return messages.find(m => m.id === selectedId) || displayedMessages[0];
    }, [displayedMessages, messages, selectedId]);

    React.useEffect(() => {
        if (selectedMessage) {
            setEditedCategory(selectedMessage.extracted?.categoria || (invoices.find(i => i.id === selectedMessage.id)?.categoria) || 'Outros');
        }
    }, [selectedMessage, invoices]);

    const existingInvoice = useMemo(() => {
        if (!selectedMessage) return null;
        const newData = selectedMessage.extracted;
        if (!newData) return null;
        const cleanCNPJ = (c: any) => String(c || '').replace(/\D/g, '');
        const normDate = (d: any) => normalizeDate(d);
        const newCNPJ = cleanCNPJ(newData.cnpj_cpf_emissor);
        const newVal = normalizeValue(newData.valor_total).toFixed(2);
        const newNum = newData.numero_nota ? String(newData.numero_nota).trim() : null;
        const newDate = normDate(newData.data);

        return invoices.find(inv => {
            const sameCNPJ = cleanCNPJ(inv.cnpj_cpf_emissor) === newCNPJ;
            const existingVal = normalizeValue(inv.valor_total).toFixed(2);
            if (newCNPJ && sameCNPJ && newNum && String(inv.numero_nota).trim() === newNum) {
                const newSerie = newData.serie_nota ? String(newData.serie_nota).trim() : null;
                if (newSerie && inv.serie_nota && String(inv.serie_nota).trim() !== newSerie) return false;
                return true;
            }
            if (existingVal !== newVal) return false;
            if (newCNPJ && sameCNPJ) return inv.data === newDate;
            const sameName = (inv.nome_emissor || '').toLowerCase() === (newData.nome_emissor || '').toLowerCase();
            return sameName && (inv.data === newDate);
        });
    }, [selectedMessage, invoices]);

    const ComparisonRow = ({ label, systemVal, newVal, type = 'text', field }: { label: string, systemVal: any, newVal: any, type?: 'text' | 'money', field?: string }) => {
        const displaySystem = type === 'money' ? formatMoney(systemVal) : (systemVal || '-');
        const displayNew = type === 'money' ? formatMoney(newVal) : (newVal || '-');
        let divergent = false;
        if (type === 'money') {
            divergent = normalizeValue(systemVal).toFixed(2) !== normalizeValue(newVal).toFixed(2);
        } else {
            divergent = isDivergent(systemVal, newVal);
        }
        const borderColor = divergent ? 'border-orange-300' : 'border-slate-200';
        const bgColor = divergent ? 'bg-orange-50' : 'bg-white';
        const textColor = divergent ? 'text-orange-900' : 'text-slate-700';

        const handleEdit = (e: any) => {
            if (!selectedMessage || !field) return;
            const updated = { ...selectedMessage };
            if (!updated.extracted) updated.extracted = {};
            updated.extracted[field] = e.target.value;
            onUpdateMessage(updated);
        };
        const handleUseSystem = () => {
            if (!selectedMessage || !field) return;
            const updated = { ...selectedMessage };
            if (!updated.extracted) updated.extracted = {};
            updated.extracted[field] = systemVal;
            onUpdateMessage(updated);
        };

        return (
            <div className="grid grid-cols-12 gap-4 mb-2 items-center last:mb-0">
                <div className="col-span-3 flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</label>
                    {divergent && <span className="bg-orange-100 text-orange-600 px-1 py-0.5 rounded text-[8px] font-bold ml-1">DIV</span>}
                </div>
                <div className="col-span-4 relative group">
                    {divergent && field && (
                        <button onClick={handleUseSystem} className="absolute -top-2 right-0 flex items-center gap-1 bg-slate-800 hover:bg-black text-white px-1.5 py-0.5 rounded-full shadow-md cursor-pointer transition-all text-[8px] uppercase tracking-wide font-black z-20 hover:scale-105 opacity-0 group-hover:opacity-100" title="Manter o valor do sistema">
                            <span className="material-symbols-outlined text-[9px]">check</span>
                        </button>
                    )}
                    <div className={`w-full border ${divergent ? 'border-slate-300' : 'border-slate-200'} rounded-lg px-2 py-1.5 bg-slate-50 text-slate-500 text-xs font-medium min-h-[32px] flex items-center`}>
                        <span className="w-full truncate" title={String(displaySystem)}>{displaySystem}</span>
                    </div>
                </div>
                <div className="col-span-1 flex justify-center text-slate-300"><span className="material-symbols-outlined text-sm">arrow_right_alt</span></div>
                <div className="col-span-4 relative">
                    {field ? (
                        <input type="text" value={newVal || ''} onChange={handleEdit} className={`w-full border rounded-lg px-2 py-1.5 text-xs font-bold min-h-[32px] flex items-center shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${borderColor} ${bgColor} ${textColor}`} />
                    ) : (
                        <div className={`w-full border rounded-lg px-2 py-1.5 text-xs font-bold min-h-[32px] flex items-center shadow-sm ${borderColor} ${bgColor} ${textColor}`}>
                            <span className="w-full truncate" title={String(displayNew)}>{displayNew}</span>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const AddressBlock = ({ prefix, extracted, onUpdate }: { prefix: 'emissor' | 'tomador', extracted: any, onUpdate: (data: any) => void }) => {
        const [loadingCep, setLoadingCep] = useState(false);
        const handleChange = (field: string, val: string) => onUpdate({ ...extracted, [field]: val });
        const handleBlurCep = async () => {
            const cep = extracted[`cep_${prefix}`];
            if (!cep || cep.length < 8) return;
            setLoadingCep(true);
            const data = await fetchCep(cep);
            setLoadingCep(false);
            if (data) {
                onUpdate({
                    ...extracted,
                    [`cep_${prefix}`]: data.cep,
                    [`logradouro_${prefix}`]: data.logradouro,
                    [`bairro_${prefix}`]: data.bairro,
                    [`${prefix === 'emissor' ? 'cidade' : 'cidade_tomador'}`]: data.localidade,
                    [`${prefix === 'emissor' ? 'estado' : 'estado_tomador'}`]: data.uf,
                    [`endereco_${prefix}`]: `${data.logradouro}, ${extracted[`numero_${prefix}`] || 'S/N'} - ${data.bairro}, ${data.localidade}/${data.uf}`
                });
            }
        };
        return (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 mt-2 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-400"></div>
                <h5 className="text-[10px] font-bold uppercase text-slate-500 mb-2 pl-2">Endereço Completo ({prefix})</h5>
                <div className="grid grid-cols-4 gap-2">
                    <div className="col-span-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">CEP</label>
                        <div className="relative">
                            <input value={extracted[`cep_${prefix}`] || ''} onChange={e => handleChange(`cep_${prefix}`, e.target.value)} onBlur={handleBlurCep} placeholder="00000-000" className="w-full border border-slate-300 rounded p-1.5 text-xs font-bold" />
                            {loadingCep && <span className="absolute right-2 top-1.5 text-blue-500 animate-spin material-symbols-outlined text-xs">sync</span>}
                        </div>
                    </div>
                    <div className="col-span-3">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Logradouro (Rua/Av)</label>
                        <input value={extracted[`logradouro_${prefix}`] || ''} onChange={e => handleChange(`logradouro_${prefix}`, e.target.value)} className="w-full border border-slate-300 rounded p-1.5 text-xs" />
                    </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                    <div className="col-span-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Número</label>
                        <input value={extracted[`numero_${prefix}`] || ''} onChange={e => handleChange(`numero_${prefix}`, e.target.value)} className="w-full border border-slate-300 rounded p-1.5 text-xs font-bold" />
                    </div>
                    <div className="col-span-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Compl.</label>
                        <input value={extracted[`complemento_${prefix}`] || ''} onChange={e => handleChange(`complemento_${prefix}`, e.target.value)} className="w-full border border-slate-300 rounded p-1.5 text-xs" />
                    </div>
                    <div className="col-span-2">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Bairro</label>
                        <input value={extracted[`bairro_${prefix}`] || ''} onChange={e => handleChange(`bairro_${prefix}`, e.target.value)} className="w-full border border-slate-300 rounded p-1.5 text-xs" />
                    </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                    <div className="col-span-3">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Cidade</label>
                        <input value={extracted[prefix === 'emissor' ? 'cidade' : 'cidade_tomador'] || ''} onChange={e => handleChange(prefix === 'emissor' ? 'cidade' : 'cidade_tomador', e.target.value)} className="w-full border border-slate-300 rounded p-1.5 text-xs bg-slate-100" />
                    </div>
                    <div className="col-span-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">UF</label>
                        <input value={extracted[prefix === 'emissor' ? 'estado' : 'estado_tomador'] || ''} onChange={e => handleChange(prefix === 'emissor' ? 'estado' : 'estado_tomador', e.target.value)} className="w-full border border-slate-300 rounded p-1.5 text-xs bg-slate-100" />
                    </div>
                </div>
            </div>
        );
    };

    const AddressComparisonBlock = ({ prefix, extracted, system, onUpdate }: { prefix: 'emissor' | 'tomador', extracted: any, system: any, onUpdate: (data: any) => void }) => {
        const getField = (base: string) => {
            if (prefix === 'emissor') {
                if (base === 'cidade') return 'cidade';
                if (base === 'estado') return 'estado';
                return `${base}_emissor`;
            }
            return `${base}_tomador`;
        };
        const fields = [{ label: 'CEP', base: 'cep' }, { label: 'Logradouro', base: 'logradouro' }, { label: 'Número', base: 'numero' }, { label: 'Complemento', base: 'complemento' }, { label: 'Bairro', base: 'bairro' }, { label: 'Cidade', base: 'cidade' }, { label: 'UF', base: 'estado' }];
        return (
            <div className="space-y-0 text-xs">
                <div className="flex items-center gap-2 mb-2 pb-1 border-b border-slate-100">
                    <span className="material-symbols-outlined text-[14px] text-blue-400">compare_arrows</span>
                    <span className="text-[10px] font-bold uppercase text-slate-400">Comparação Detalhada de Endereço</span>
                </div>
                {fields.map(f => {
                    const fieldName = getField(f.base);
                    return <ComparisonRow key={fieldName} label={f.label} systemVal={system?.[fieldName]} newVal={extracted?.[fieldName]} field={fieldName} />;
                })}
            </div>
        );
    };

    const SectionHeader = ({ title, icon, color = 'blue' }: { title: string, icon: string, color?: 'blue' | 'indigo' | 'emerald' | 'orange' }) => {
        const colors = { blue: 'text-blue-600 border-blue-100 bg-blue-50', indigo: 'text-indigo-600 border-indigo-100 bg-indigo-50', emerald: 'text-emerald-600 border-emerald-100 bg-emerald-50', orange: 'text-orange-600 border-orange-100 bg-orange-50' };
        return (
            <div className={`flex items-center gap-2 mb-3 mt-6 pb-2 border-b ${colors[color].replace('text-', 'border-').split(' ')[1]}`}>
                <div className={`p-1.5 rounded-lg ${colors[color]}`}><span className="material-symbols-outlined text-lg">{icon}</span></div>
                <h4 className={`text-xs font-black uppercase tracking-wider ${colors[color].split(' ')[0]}`}>{title}</h4>
            </div>
        );
    };

    const stats = useMemo(() => {
        const total = messages.length;
        const doubles = messages.filter(m => m.isDuplicate).length;
        const news = messages.filter(m => !m.isDuplicate).length;
        const divergencies = messages.filter(m => {
            if (!m.isDuplicate) return false;
            const newData = m.extracted;
            const inv = invoices.find(i => {
                const cleanCNPJ = (c: any) => String(c || '').replace(/\D/g, '');
                return cleanCNPJ(i.cnpj_cpf_emissor) === cleanCNPJ(newData?.cnpj_cpf_emissor) && normalizeValue(i.valor_total).toFixed(2) === normalizeValue(newData?.valor_total).toFixed(2);
            });
            if (!inv) return false;
            return [isDivergent(inv.nome_emissor, newData?.nome_emissor), normalizeValue(inv.valor_total).toFixed(2) !== normalizeValue(newData?.valor_total).toFixed(2), (inv.numero_nota || '') != (newData?.numero_nota || ''), isDivergent(inv.data, newData?.data), isDivergent(inv.endereco_tomador, newData?.endereco_tomador), isDivergent(inv.cep_emissor, newData?.cep_emissor), isDivergent(inv.logradouro_emissor, newData?.logradouro_emissor), isDivergent(inv.numero_emissor, newData?.numero_emissor), isDivergent(inv.bairro_emissor, newData?.bairro_emissor), isDivergent(inv.cidade, newData?.cidade), isDivergent(inv.estado, newData?.estado), isDivergent(inv.cep_tomador, newData?.cep_tomador), isDivergent(inv.logradouro_tomador, newData?.logradouro_tomador), isDivergent(inv.numero_tomador, newData?.numero_tomador), isDivergent(inv.bairro_tomador, newData?.bairro_tomador), isDivergent(inv.cidade_tomador, newData?.cidade_tomador), isDivergent(inv.estado_tomador, newData?.estado_tomador)].some(Boolean);
        }).length;
        return { total, news, doubles, divergencies, synced: doubles - divergencies };
    }, [messages, invoices]);

    if (!isConnected) {
        return (
            <div className="flex flex-col items-center justify-center p-10 h-full animate-in fade-in duration-500">
                <div className="text-center">
                    <div className="bg-blue-50 text-blue-600 p-4 rounded-full w-fit mx-auto mb-4"><span className="material-symbols-outlined text-4xl">mark_email_unread</span></div>
                    <h1 className="text-2xl font-black text-slate-900 mb-2">Sincronizar Gmail</h1>
                    <button onClick={onConnect} className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2 mx-auto"><span className="material-symbols-outlined">login</span> Conectar</button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full gap-4">
            {messages.length > 0 && (
                <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between animate-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-6">
                        <button onClick={() => setActiveFilter('all')} className={`flex items-center gap-3 pr-6 border-r border-slate-200 cursor-pointer transition-all hover:opacity-80 appearance-none text-left ${activeFilter === 'all' ? 'opacity-100' : 'opacity-60 grayscale'}`}>
                            <div className="p-2 bg-slate-100 rounded-lg text-slate-600"><span className="material-symbols-outlined">analytics</span></div>
                            <div><p className="text-[10px] font-bold text-slate-400 uppercase">Total Analisado</p><p className="text-xl font-black text-slate-800">{stats.total} <span className="text-xs font-bold text-slate-400">e-mails</span></p></div>
                        </button>
                        <div className="flex gap-4">
                            <button onClick={() => setActiveFilter('new')} className={`px-4 py-1.5 rounded-lg border flex flex-col items-center cursor-pointer transition-all active:scale-95 ${activeFilter === 'new' ? 'bg-green-50 border-green-200 shadow-sm ring-1 ring-green-100 scale-105' : 'bg-white border-slate-100 hover:bg-slate-50 opacity-70'}`}>
                                <span className="text-[10px] font-bold text-green-600 uppercase">Novas Importações</span><span className="text-lg font-black text-green-700">{stats.news}</span>
                            </button>
                            <button onClick={() => setActiveFilter('synced')} className={`px-4 py-1.5 rounded-lg border flex flex-col items-center cursor-pointer transition-all active:scale-95 ${activeFilter === 'synced' ? 'bg-blue-50 border-blue-200 shadow-sm ring-1 ring-blue-100 scale-105' : 'bg-white border-slate-100 hover:bg-slate-50 opacity-70'}`}>
                                <span className="text-[10px] font-bold text-blue-600 uppercase">Sincronizadas</span><span className="text-lg font-black text-blue-700">{stats.synced}</span>
                            </button>
                            <button onClick={() => setActiveFilter('divergent')} className={`px-4 py-1.5 rounded-lg border flex flex-col items-center cursor-pointer transition-all active:scale-95 ${activeFilter === 'divergent' ? 'bg-orange-50 border-orange-200 shadow-sm ring-1 ring-orange-100 scale-105' : 'bg-white border-slate-100 hover:bg-slate-50 opacity-70'}`}>
                                <span className="text-[10px] font-bold text-orange-600 uppercase">Divergentes</span><span className="text-lg font-black text-orange-700">{stats.divergencies}</span>
                            </button>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Status da Importação</p>
                        <div className="flex items-center gap-1 mt-1"><span className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-yellow-400 animate-pulse' : 'bg-green-500'}`}></span><span className="text-xs font-bold text-slate-600">{isProcessing ? processingMsg : 'Concluído'}</span></div>
                    </div>
                </div>
            )}
            <div className="flex-1 flex flex-col md:flex-row min-h-0 bg-white dark:bg-[#0f172a] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden relative">
                <div className="w-full md:w-[350px] bg-slate-50 dark:bg-[#1e293b] border-r border-slate-200 dark:border-slate-700 flex flex-col flex-shrink-0">
                    <div className="p-4 bg-white dark:bg-[#1a2230] border-b border-slate-200 dark:border-slate-700 flex justify-between items-center shadow-sm z-10 transition-colors duration-300">
                        <div className="flex flex-col"><h3 className="text-sm font-bold uppercase tracking-wider text-slate-600 transition-all">{activeFilter === 'all' ? 'Todos os E-mails' : activeFilter === 'new' ? 'Novas Importações' : activeFilter === 'synced' ? 'Sincronizadas' : 'Divergentes'}</h3><span className="text-[10px] font-bold text-slate-400">{displayedMessages.length} item(s)</span></div>
                        <div className="flex items-center gap-1">
                            <button onClick={onDisconnect} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-red-500" title="Desconectar Gmail"><span className="material-symbols-outlined text-[20px]">logout</span></button>
                            <button onClick={onSync} disabled={isProcessing} className="p-2 hover:bg-slate-100 rounded-full text-blue-600" title="Sincronizar"><span className={`material-symbols-outlined ${isProcessing ? 'animate-spin' : ''}`}>sync</span></button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {displayedMessages.length === 0 && !isProcessing && <div className="p-8 text-center text-slate-400 text-sm flex flex-col items-center"><span className="material-symbols-outlined text-4xl mb-2 text-slate-300">filter_list_off</span>Nenhum e-mail encontrado.</div>}
                        {displayedMessages.map((msg) => (
                            <div key={msg.id} onClick={() => setSelectedId(msg.id)} className={`p-3 rounded-lg border border-l-4 cursor-pointer transition-all ${selectedId === msg.id ? 'bg-blue-100 border-blue-600 border-l-blue-600 shadow-md ring-1 ring-blue-300 scale-[1.05] z-10 relative' : 'bg-white border-slate-200 border-l-slate-200 hover:border-blue-300 hover:shadow-sm opacity-90'}`}>
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-[10px] font-bold text-slate-400 truncate max-w-[150px]">{msg.extracted?.numero_nota ? `Nota #${msg.extracted.numero_nota}` : (msg.rawEmail.snippet?.substring(0, 20) + '...')}</span>
                                    {(() => {
                                        if (msg.isDuplicate) {
                                            const cleanCNPJ = (c: any) => String(c || '').replace(/\D/g, '');
                                            const normDate = (d: any) => normalizeDate(d);
                                            const newData = msg.extracted;
                                            const newCNPJ = cleanCNPJ(newData?.cnpj_cpf_emissor);
                                            const newVal = normalizeValue(newData?.valor_total).toFixed(2);
                                            const newNum = newData?.numero_nota ? String(newData.numero_nota).trim() : null;
                                            const newDate = normDate(newData?.data);
                                            const inv = invoices.find(i => {
                                                const sameCNPJ = cleanCNPJ(i.cnpj_cpf_emissor) === newCNPJ;
                                                if (newCNPJ && sameCNPJ && newNum && String(i.numero_nota).trim() === newNum) return true;
                                                if (normalizeValue(i.valor_total).toFixed(2) !== newVal) return false;
                                                if (newCNPJ && sameCNPJ) return i.data === newDate;
                                                return (i.nome_emissor || '').toLowerCase() === (newData?.nome_emissor || '').toLowerCase() && i.data === newDate;
                                            });
                                            if (inv) {
                                                const divergent = [isDivergent(inv.nome_emissor, newData?.nome_emissor), normalizeValue(inv.valor_total).toFixed(2) !== newVal, (inv.numero_nota || '') != (newData?.numero_nota || ''), isDivergent(inv.data, newData?.data), isDivergent(inv.endereco_tomador, newData?.endereco_tomador), isDivergent(inv.cep_emissor, newData?.cep_emissor), isDivergent(inv.logradouro_emissor, newData?.logradouro_emissor), isDivergent(inv.numero_emissor, newData?.numero_emissor), isDivergent(inv.bairro_emissor, newData?.bairro_emissor), isDivergent(inv.cidade, newData?.cidade), isDivergent(inv.estado, newData?.estado), isDivergent(inv.cep_tomador, newData?.cep_tomador), isDivergent(inv.logradouro_tomador, newData?.logradouro_tomador), isDivergent(inv.numero_tomador, newData?.numero_tomador), isDivergent(inv.bairro_tomador, newData?.bairro_tomador), isDivergent(inv.cidade_tomador, newData?.cidade_tomador), isDivergent(inv.estado_tomador, newData?.estado_tomador)].some(Boolean);
                                                return divergent ? <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 uppercase flex items-center gap-1"><span className="material-symbols-outlined text-[10px]">warning</span> Divergente</span> : <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 uppercase flex items-center gap-1"><span className="material-symbols-outlined text-[10px]">check_circle</span> Sincronizado</span>;
                                            }
                                            return <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 uppercase">Já existe</span>;
                                        }
                                        return <span className="text-[9px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-100 uppercase">Novo</span>;
                                    })()}
                                </div>
                                <h4 className="font-bold text-slate-800 text-sm leading-tight mb-1 truncate">{msg.extracted?.nome_emissor || 'Remetente Desconhecido'}</h4>
                                <div className="flex justify-between items-center mt-2"><span className="text-xs font-bold text-slate-700">{msg.extracted?.valor_total ? formatMoney(msg.extracted.valor_total) : '-'}</span><span className="text-[10px] text-slate-400">{msg.extracted?.data || msg.date?.split(' ').slice(0, 4).join(' ')}</span></div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#0f172a] relative overflow-hidden">
                    {selectedMessage ? (
                        <>
                            <div className="p-6 overflow-y-auto pb-32 flex-1 scrollbar-thin">
                                <div className="flex flex-col gap-6 mb-6">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-3 mb-1"><h2 className="text-3xl font-black text-[#1e293b]">Validação: {selectedMessage.extracted?.numero_nota || '-'}</h2><div className="px-2 py-0.5 bg-[#e6f4ea] text-[#1e8e3e] text-[10px] font-black rounded uppercase tracking-wider">APROVADO</div></div>
                                            <p className="text-xs text-slate-400 font-medium tracking-tight">Recebido em {selectedMessage.date || '-'} • via Gmail</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button onClick={() => confirm('Rejeitar este documento?') && (onReject(selectedMessage), setSelectedId(null))} className="flex items-center gap-2 px-6 py-2.5 rounded-xl border-2 border-red-50 text-red-500 hover:bg-red-50 transition-all font-bold text-sm"><span className="material-symbols-outlined text-xl">thumb_down</span>Rejeitar</button>
                                            <div className="flex items-center gap-2 bg-[#caf0ea] rounded-xl px-5 py-2.5 text-[#00695c] shadow-sm"><span className="material-symbols-outlined text-xl">monitor_heart</span><select value={editedCategory} onChange={(e) => setEditedCategory(e.target.value)} className="bg-transparent border-none p-0 text-sm font-black focus:ring-0 cursor-pointer uppercase leading-none">{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select><span className="material-symbols-outlined text-lg">expand_more</span></div>
                                        </div>
                                    </div>
                                    <div className="flex items-center border-b border-slate-100 px-2 gap-12">
                                        <button onClick={() => setViewMode('extracted')} className={`pb-4 text-[13px] font-bold transition-all relative ${viewMode === 'extracted' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>Dados Extraídos{viewMode === 'extracted' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />}</button>
                                        <button onClick={() => setViewMode('original')} className={`pb-4 text-[13px] font-bold transition-all relative ${viewMode === 'original' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>Documento Original{viewMode === 'original' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />}</button>
                                    </div>
                                </div>
                                {viewMode === 'original' ? (
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl h-[600px] flex items-center justify-center overflow-hidden">{selectedMessage.aiInput ? (selectedMessage.aiInput.type === 'application/pdf' ? <iframe src={selectedMessage.aiInput.base64} className="w-full h-full" title="PDF Viewer" /> : <img src={selectedMessage.aiInput.base64} alt="Doc" className="max-w-full max-h-full object-contain" />) : <div className="p-6 w-full h-full overflow-auto bg-white whitespace-pre-wrap font-mono text-xs text-slate-600">{selectedMessage.fullBody || "N/A"}</div>}</div>
                                ) : (
                                    <>
                                        {selectedMessage.isDuplicate && <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl mb-4 flex gap-3 items-start"><span className="material-symbols-outlined text-blue-600 mt-0.5 text-lg">auto_awesome</span><div><h4 className="text-xs font-bold text-blue-900 mb-0.5">Merge Inteligente Disponível</h4><p className="text-xs text-blue-800 leading-relaxed">Identificamos uma nota similar. Completaremos os dados faltantes.</p></div></div>}
                                        <div className="bg-white p-1 rounded-xl space-y-1">
                                            {selectedMessage.isDuplicate ? (
                                                <>
                                                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-6"><div className="grid grid-cols-6 gap-0"><div className="border-r border-slate-100 last:border-0 pr-4"><label className="text-[10px] font-black text-slate-400 uppercase block mb-3 tracking-widest">Valor Total</label><p className="font-black text-3xl text-[#1e293b] tracking-tight">{formatMoney(selectedMessage.extracted?.valor_total)}</p></div><div className="border-r border-slate-100 last:border-0 px-4"><label className="text-[10px] font-black text-slate-400 uppercase block mb-3 tracking-widest">Data Emissão</label><p className="font-bold text-2xl text-[#475569]">{selectedMessage.extracted?.data}</p></div><div className="border-r border-slate-100 last:border-0 px-4"><label className="text-[10px] font-black text-slate-400 uppercase block mb-3 tracking-widest">Número</label><p className="font-black text-2xl text-[#dc2626]">{selectedMessage.extracted?.numero_nota || '-'}</p></div><div className="border-r border-slate-100 last:border-0 px-4"><label className="text-[10px] font-black text-slate-400 uppercase block mb-3 tracking-widest">Série</label><p className="font-bold text-2xl text-[#475569]">{selectedMessage.extracted?.serie_nota || '-'}</p></div><div className="border-r border-slate-100 last:border-0 px-4"><label className="text-[10px] font-black text-slate-400 uppercase block mb-3 tracking-widest">Município</label><p className="font-bold text-2xl text-[#475569] uppercase truncate">{selectedMessage.extracted?.cidade || '-'}</p></div><div className="pl-4"><label className="text-[10px] font-black text-slate-400 uppercase block mb-3 tracking-widest">IRPF</label>{['Saúde', 'Educação'].includes(editedCategory) ? <div className="flex flex-col gap-1.5"><div className="flex items-center gap-1.5 text-emerald-600"><span className="material-symbols-outlined text-[18px]">check_circle</span><span className="text-[10px] font-black uppercase tracking-tight">Dedutível</span></div><select value={selectedMessage.extracted?.beneficiario || ''} onChange={(e) => onUpdateMessage({ ...selectedMessage, extracted: { ...selectedMessage.extracted, beneficiario: e.target.value } })} className="text-[9px] font-black bg-emerald-50 border border-emerald-100 rounded px-1.5 py-0.5 focus:ring-0 text-emerald-900 cursor-pointer h-5 uppercase"><option value="">Beneficiário...</option><option value="Wândrio">Wândrio</option><option value="Lucas">Lucas</option><option value="Raquel">Raquel</option></select></div> : <div className="flex items-center gap-1.5 text-slate-400"><span className="material-symbols-outlined text-[18px]">remove_circle_outline</span><span className="text-[10px] font-black uppercase tracking-tight">Não dedutível</span></div>}</div></div></div>
                                                    <div className="mb-6"><div className="flex items-center gap-2 mb-2"><div className="p-1 px-2 bg-indigo-50 text-indigo-600 rounded-lg flex items-center gap-2"><span className="material-symbols-outlined text-sm">receipt_long</span><span className="text-[10px] font-black uppercase tracking-wider text-indigo-900">Itens da Nota</span></div></div>{selectedMessage.extracted?.items?.length > 0 ? <div className="bg-white border border-indigo-100 rounded-xl overflow-hidden shadow-sm"><div className="grid grid-cols-[30px_1fr_60px_80px_80px_100px] gap-2 px-4 py-2 bg-indigo-50/50 border-b border-indigo-100 text-[9px] font-black uppercase tracking-wider text-indigo-400"><div className="text-center">#</div><div>Descrição</div><div className="text-center">Qtd.</div><div className="text-right">V. Unit</div><div className="text-right">V. Total</div><div className="text-right">Categoria</div></div><div className="bg-white divide-y divide-slate-50">{selectedMessage.extracted.items.map((item: any, idx: number) => <div key={idx} className="grid grid-cols-[30px_1fr_60px_80px_80px_100px] gap-2 px-4 py-2 hover:bg-indigo-50/30 transition-colors items-center text-[10px] group"><div className="text-center text-slate-300 font-bold group-hover:text-indigo-300">{idx + 1}</div><div className="font-bold text-slate-700 uppercase leading-snug">{item.descricao}</div><div className="text-center text-slate-500 bg-slate-50 rounded py-0.5 font-medium border border-slate-100">{Number(item.quantidade) || 1}</div><div className="text-right text-slate-500">{formatMoney((Number(item.valor) || 0) / (Number(item.quantidade) || 1))}</div><div className="text-right font-black text-slate-900 group-hover:text-indigo-700">{formatMoney(Number(item.valor) || 0)}</div><div className="text-right"><span className="px-1.5 py-0.5 bg-slate-100 rounded text-[8px] font-bold text-slate-500 uppercase">{item.categoria || '-'}</span></div></div>)}</div></div> : <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center"><p className="text-[10px] italic text-slate-400">Nenhum item detalhado.</p></div>}</div>
                                                    <SectionHeader title="Dados da Nota" icon="receipt" color="blue" /><div className="bg-slate-50 border border-slate-100 rounded-xl p-4"><div className="grid grid-cols-12 gap-4 px-4 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 mb-2"><div className="col-span-3">Campo</div><div className="col-span-4">Sistema</div><div className="col-span-1"></div><div className="col-span-4 text-slate-900">Importação</div></div><ComparisonRow label="Valor" systemVal={existingInvoice?.valor_total} newVal={selectedMessage.extracted?.valor_total} type="money" field="valor_total" /><ComparisonRow label="Data" systemVal={existingInvoice?.data} newVal={selectedMessage.extracted?.data} field="data" /><ComparisonRow label="Número" systemVal={existingInvoice?.numero_nota} newVal={selectedMessage.extracted?.numero_nota} field="numero_nota" /><ComparisonRow label="Série" systemVal={existingInvoice?.serie_nota} newVal={selectedMessage.extracted?.serie_nota} field="serie_nota" /></div>
                                                    <SectionHeader title="Emissor" icon="store" color="indigo" /><div className="bg-slate-50 border border-slate-100 rounded-xl p-4"><ComparisonRow label="Nome" systemVal={existingInvoice?.nome_emissor} newVal={selectedMessage.extracted?.nome_emissor} field="nome_emissor" /><ComparisonRow label="CNPJ" systemVal={existingInvoice?.cnpj_cpf_emissor} newVal={selectedMessage.extracted?.cnpj_cpf_emissor} field="cnpj_cpf_emissor" /><ComparisonRow label="Telefone" systemVal={existingInvoice?.telefone_emissor} newVal={selectedMessage.extracted?.telefone_emissor} field="telefone_emissor" /><div className="mt-4 pt-4 border-t border-slate-100"><AddressComparisonBlock prefix="emissor" extracted={selectedMessage.extracted || {}} system={existingInvoice || {}} onUpdate={(d) => onUpdateMessage({ ...selectedMessage, extracted: d })} /></div></div>
                                                    <SectionHeader title="Tomador" icon="person" color="emerald" /><div className="bg-slate-50 border border-slate-100 rounded-xl p-4"><ComparisonRow label="Nome" systemVal={existingInvoice?.nome_tomador} newVal={selectedMessage.extracted?.nome_tomador} field="nome_tomador" /><ComparisonRow label="Email" systemVal={existingInvoice?.email_tomador} newVal={selectedMessage.extracted?.email_tomador} field="email_tomador" /><ComparisonRow label="Telefone" systemVal={existingInvoice?.telefone_tomador} newVal={selectedMessage.extracted?.telefone_tomador} field="telefone_tomador" /><div className="mt-4 pt-4 border-t border-slate-100"><AddressComparisonBlock prefix="tomador" extracted={selectedMessage.extracted || {}} system={existingInvoice || {}} onUpdate={(d) => onUpdateMessage({ ...selectedMessage, extracted: d })} /></div></div>
                                                </>
                                            ) : (
                                                <div className="space-y-4">
                                                    <div><SectionHeader title="Dados Principais" icon="info" color="blue" /><div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm"><div className="grid grid-cols-6 gap-0"><div className="border-r border-slate-100 last:border-0 pr-4"><label className="text-[10px] font-black text-slate-400 uppercase block mb-3 tracking-widest">Valor Total</label><p className="font-black text-3xl text-[#1e293b] tracking-tight">{formatMoney(selectedMessage.extracted?.valor_total)}</p></div><div className="border-r border-slate-100 last:border-0 px-4"><label className="text-[10px] font-black text-slate-400 uppercase block mb-3 tracking-widest">Data Emissão</label><p className="font-bold text-2xl text-[#475569]">{selectedMessage.extracted?.data}</p></div><div className="border-r border-slate-100 last:border-0 px-4"><label className="text-[10px] font-black text-slate-400 uppercase block mb-3 tracking-widest">Número</label><p className="font-black text-2xl text-[#dc2626]">{selectedMessage.extracted?.numero_nota || '-'}</p></div><div className="border-r border-slate-100 last:border-0 px-4"><label className="text-[10px] font-black text-slate-400 uppercase block mb-3 tracking-widest">Série</label><p className="font-bold text-2xl text-[#475569]">{selectedMessage.extracted?.serie_nota || '-'}</p></div><div className="border-r border-slate-100 last:border-0 px-4"><label className="text-[10px] font-black text-slate-400 uppercase block mb-3 tracking-widest">Município</label><p className="font-bold text-2xl text-[#475569] uppercase truncate">{selectedMessage.extracted?.cidade || '-'}</p></div><div className="pl-4"><label className="text-[10px] font-black text-slate-400 uppercase block mb-3 tracking-widest">IRPF</label>{['Saúde', 'Educação'].includes(editedCategory) ? <div className="flex flex-col gap-1.5"><div className="flex items-center gap-1.5 text-emerald-600"><span className="material-symbols-outlined text-[18px]">check_circle</span><span className="text-[10px] font-black uppercase tracking-tight">Dedutível</span></div><select value={selectedMessage.extracted?.beneficiario || ''} onChange={(e) => onUpdateMessage({ ...selectedMessage, extracted: { ...selectedMessage.extracted, beneficiario: e.target.value } })} className="text-[9px] font-black bg-emerald-50 border border-emerald-100 rounded px-1.5 py-0.5 focus:ring-0 text-emerald-900 cursor-pointer h-5 uppercase"><option value="">Beneficiário...</option><option value="Wândrio">Wândrio</option><option value="Lucas">Lucas</option><option value="Raquel">Raquel</option></select></div> : <div className="flex items-center gap-1.5 text-slate-400"><span className="material-symbols-outlined text-[18px]">remove_circle_outline</span><span className="text-[10px] font-black uppercase tracking-tight">Não dedutível</span></div>}</div></div></div></div>
                                                    <div className="bg-indigo-50/30 border-2 border-indigo-100 rounded-xl p-4 mt-6"><div className="flex items-center justify-between mb-4"><div className="flex items-center gap-2"><div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><span className="material-symbols-outlined text-xl">receipt_long</span></div><h4 className="text-sm font-black uppercase tracking-wider text-indigo-900">Itens da Nota</h4></div></div>{selectedMessage.extracted?.items?.length > 0 ? <div className="bg-white border border-indigo-100 rounded-xl overflow-hidden shadow-sm"><div className="grid grid-cols-[40px_1fr_60px_100px_120px_100px] gap-4 px-4 py-3 bg-indigo-50/50 border-b border-indigo-100 text-[10px] font-black uppercase tracking-wider text-indigo-400"><div className="text-center">#</div><div>Descrição</div><div className="text-center">Qtd.</div><div className="text-right">V. Unit</div><div className="text-right">V. Total</div><div className="text-right">Categoria</div></div><div className="bg-white divide-y divide-slate-50">{selectedMessage.extracted.items.map((item: any, idx: number) => <div key={idx} className="grid grid-cols-[40px_1fr_60px_100px_120px_100px] gap-4 px-4 py-3 hover:bg-indigo-50/30 transition-colors items-center text-xs group"><div className="text-center text-slate-300 font-bold group-hover:text-indigo-300">{idx + 1}</div><div className="font-bold text-slate-700 uppercase leading-snug">{item.descricao}</div><div className="text-center text-slate-500 bg-slate-50 rounded py-0.5 font-medium border border-slate-100">{Number(item.quantidade) || 1}</div><div className="text-right text-slate-500">{formatMoney((Number(item.valor) || 0) / (Number(item.quantidade) || 1))}</div><div className="text-right font-black text-slate-900 group-hover:text-indigo-700 text-sm">{formatMoney(Number(item.valor) || 0)}</div><div className="text-right"><span className="px-2 py-0.5 bg-indigo-50 rounded text-[9px] font-black text-indigo-600 uppercase border border-indigo-100">{item.categoria || '-'}</span></div></div>)}</div></div> : <div className="bg-white border border-indigo-100 rounded-xl p-8 text-center"><p className="text-xs italic text-indigo-300">Nenhum item detalhado.</p></div>}</div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                                        <div><SectionHeader title="Prestador (Emissor)" icon="store" color="blue" /><div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-3 h-full mt-2"><FieldBox label="Razão Social" value={selectedMessage.extracted?.nome_emissor} fullWidth /><div className="grid grid-cols-2 gap-3"><FieldBox label="CNPJ" value={selectedMessage.extracted?.cnpj_cpf_emissor} /><FieldBox label="Telefone" value={selectedMessage.extracted?.telefone_emissor} /></div><div className="pt-2"><AddressBlock prefix="emissor" extracted={selectedMessage.extracted || {}} onUpdate={(d) => onUpdateMessage({ ...selectedMessage, extracted: d })} /></div></div></div>
                                                        <div><SectionHeader title="Tomador de Serviço" icon="person" color="orange" /><div className="bg-orange-50 border border-orange-100 rounded-xl p-4 space-y-3 h-full mt-2"><FieldBox label="Nome Completo" value={selectedMessage.extracted?.nome_tomador} fullWidth /><div className="grid grid-cols-2 gap-3"><FieldBox label="CPF/CNPJ" value={selectedMessage.extracted?.cpf_cnpj_tomador} /><FieldBox label="E-mail" value={selectedMessage.extracted?.email_tomador} /></div><div className="pt-2"><AddressBlock prefix="tomador" extracted={selectedMessage.extracted || {}} onUpdate={(d) => onUpdateMessage({ ...selectedMessage, extracted: d })} /></div></div></div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-slate-200 flex justify-end gap-3 z-20">
                                <button onClick={() => confirm('Descartar item?') && (onReject(selectedMessage), setSelectedId(null))} className="px-4 py-3 rounded-lg border border-red-200 text-red-600 font-bold text-sm hover:bg-red-50 flex items-center gap-2"><span className="material-symbols-outlined">delete</span>Descartar Item</button>
                                <button onClick={() => onImport({ ...selectedMessage, extracted: { ...selectedMessage.extracted, categoria: editedCategory } })} className="px-8 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg flex items-center gap-2"><span className="material-symbols-outlined">download</span>{selectedMessage.isDuplicate ? 'Fundir & Atualizar' : 'Importar Nota'}</button>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400"><span className="material-symbols-outlined text-5xl mb-4 opacity-50">mail</span><p>Selecione um email para visualizar</p></div>
                    )}
                </div>
            </div>
        </div>
    );
};
