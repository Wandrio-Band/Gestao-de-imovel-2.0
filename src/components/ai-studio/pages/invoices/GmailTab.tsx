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
    processingMsg: string;
    invoices?: Invoice[];
}

// Helper functions (moved outside to avoid hoisting ReferenceError)
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
    if (!val1 && val2) return true;
    if (val1 && !val2) return true;
    return String(val1).trim().toLowerCase() !== String(val2).trim().toLowerCase();
};

export const GmailTab: React.FC<GmailTabProps> = ({
    isConnected,
    isProcessing,
    messages,
    onConnect,
    onSync,
    onImport,
    onDisconnect,
    processingMsg,
    invoices = []
}) => {
    const [selectedId, setSelectedId] = useState<string | null>(null);

    // Auto-select first message if none selected
    const selectedMessage = useMemo(() => {
        if (messages.length > 0 && !selectedId) setSelectedId(messages[0].id);
        return messages.find(m => m.id === selectedId) || messages[0];
    }, [messages, selectedId]);

    // Find duplicate if applicable
    const existingInvoice = useMemo(() => {
        if (!selectedMessage) return null;

        // Optimized duplicate check matching InvoiceControl logic
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

            // STRONG MATCH: CNPJ + Number
            if (newCNPJ && sameCNPJ && newNum && String(inv.numero_nota).trim() === newNum) {
                return true;
            }

            // VALUE MATCH LOGIC
            const existingVal = normalizeValue(inv.valor_total).toFixed(2);
            const sameVal = existingVal === newVal;

            if (!sameVal) return false;

            if (newCNPJ && sameCNPJ) {
                // Must imply Same Date to be a duplicate if value matches
                return inv.data === newDate;
            }

            const sameName = (inv.nome_emissor || '').toLowerCase() === (newData.nome_emissor || '').toLowerCase();
            return sameName && (inv.data === newDate);
        });
    }, [selectedMessage, invoices]);




    const ComparisonRow = ({ label, systemVal, newVal, type = 'text' }: { label: string, systemVal: any, newVal: any, type?: 'text' | 'money' }) => {
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

        return (
            <div className="mb-4 last:mb-0">
                <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</label>
                    {divergent && <span className="text-[9px] font-bold text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded">DIVERGENTE</span>}
                </div>

                <div className="flex items-center gap-2 md:gap-4">
                    {/* System Value */}
                    <div className="flex-1 relative group">
                        <div className="absolute -top-2 left-2 bg-white px-1 text-[9px] font-bold text-slate-400">NO SISTEMA</div>
                        <div className="w-full border border-slate-200 rounded-lg px-3 py-2.5 bg-slate-50 text-slate-500 text-sm font-medium h-[42px] flex items-center truncate">
                            {displaySystem}
                        </div>
                    </div>

                    {/* Arrow */}
                    <div className="flex-shrink-0 flex items-center justify-center text-slate-400">
                        <span className="material-symbols-outlined">arrow_right_alt</span>
                    </div>

                    {/* New Value */}
                    <div className="flex-1 relative group">
                        <div className={`absolute -top-2 left-2 px-1 text-[9px] font-bold z-10 ${divergent ? 'bg-orange-50 text-orange-600' : 'bg-white text-blue-600'}`}>IMPORTADO (FINAL)</div>
                        <div className={`w-full border rounded-lg px-3 py-2.5 text-sm font-bold h-[42px] flex items-center shadow-sm relative z-0 ${borderColor} ${bgColor} ${textColor}`}>
                            {displayNew}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const SectionHeader = ({ title, icon, color = 'blue' }: { title: string, icon: string, color?: 'blue' | 'indigo' | 'emerald' }) => {
        const colors = {
            blue: 'text-blue-600 border-blue-100 bg-blue-50',
            indigo: 'text-indigo-600 border-indigo-100 bg-indigo-50',
            emerald: 'text-emerald-600 border-emerald-100 bg-emerald-50'
        };

        return (
            <div className={`flex items-center gap-2 mb-3 mt-6 pb-2 border-b ${colors[color].replace('text-', 'border-').split(' ')[1]}`}>
                <div className={`p-1.5 rounded-lg ${colors[color]}`}>
                    <span className="material-symbols-outlined text-lg">{icon}</span>
                </div>
                <h4 className={`text-xs font-black uppercase tracking-wider ${colors[color].split(' ')[0]}`}>{title}</h4>
            </div>
        );
    };

    if (!isConnected) {
        return (
            <div className="flex flex-col items-center justify-center p-10 h-full animate-in fade-in duration-500">
                {/* Simplified Connect Screen */}
                <div className="text-center">
                    <div className="bg-blue-50 text-blue-600 p-4 rounded-full w-fit mx-auto mb-4"><span className="material-symbols-outlined text-4xl">mark_email_unread</span></div>
                    <h1 className="text-2xl font-black text-slate-900 mb-2">Sincronizar Gmail</h1>
                    <button onClick={onConnect} className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2 mx-auto">
                        <span className="material-symbols-outlined">login</span> Conectar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col md:flex-row h-full bg-white dark:bg-[#0f172a] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden relative">

            {/* LEFT SIDEBAR: LIST */}
            <div className="w-full md:w-[350px] bg-slate-50 dark:bg-[#1e293b] border-r border-slate-200 dark:border-slate-700 flex flex-col flex-shrink-0">
                <div className="p-4 bg-white dark:bg-[#1a2230] border-b border-slate-200 dark:border-slate-700 flex justify-between items-center shadow-sm z-10">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600">{messages.length} E-mails</h3>
                    <button onClick={onSync} disabled={isProcessing} className="p-2 hover:bg-slate-100 rounded-full text-blue-600">
                        <span className={`material-symbols-outlined ${isProcessing ? 'animate-spin' : ''}`}>sync</span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {messages.length === 0 && !isProcessing && <div className="p-8 text-center text-slate-400 text-sm">Nenhum e-mail encontrado.</div>}

                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            onClick={() => setSelectedId(msg.id)}
                            className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedId === msg.id
                                ? 'bg-white border-blue-500 shadow-md ring-1 ring-blue-100'
                                : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm opacity-90'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-[10px] font-bold text-slate-400 truncate max-w-[150px]">{msg.rawEmail.snippet?.substring(0, 20)}...</span>
                                {msg.isDuplicate ? (
                                    <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 uppercase">Já existe</span>
                                ) : (
                                    <span className="text-[9px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-100 uppercase">Novo</span>
                                )}
                            </div>
                            <h4 className="font-bold text-slate-800 text-sm leading-tight mb-1 truncate">{msg.extracted?.nome_emissor || 'Remetente Desconhecido'}</h4>
                            <div className="flex justify-between items-center mt-2">
                                <span className="text-xs font-bold text-slate-700">{msg.extracted?.valor_total ? formatMoney(msg.extracted.valor_total) : '-'}</span>
                                <span className="text-[10px] text-slate-400">{msg.date}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#0f172a] relative overflow-hidden">
                {selectedMessage ? (
                    <>
                        <div className="p-6 overflow-y-auto pb-32 flex-1">
                            <div className="flex items-center gap-3 mb-6">
                                <div className={`px-2 py-1 rounded text-xs font-bold uppercase ${selectedMessage.isDuplicate ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                                    {selectedMessage.isDuplicate ? 'Duplicata Detectada' : 'Novo Registro'}
                                </div>
                                <h2 className="text-xl font-black text-slate-900 truncate flex-1">{selectedMessage.extracted?.nome_emissor}</h2>
                            </div>

                            {/* IRPF DATA BOX */}
                            {(() => {
                                const cat = selectedMessage.extracted?.categoria || existingInvoice?.categoria || 'Outros';
                                const isDeductible = ['Saúde', 'Educação'].includes(cat);
                                const beneficiary = selectedMessage.extracted?.beneficiario || existingInvoice?.beneficiario;

                                if (!isDeductible) {
                                    return (
                                        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl mb-6">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="bg-slate-200 text-slate-500 p-2 rounded-lg">
                                                    <span className="material-symbols-outlined text-xl">money_off</span>
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="text-xs font-black uppercase text-slate-600 tracking-wider">Dados Para Imposto de Renda</h4>
                                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-600 uppercase border border-slate-300">Não Dedutível</span>
                                                    </div>
                                                    <p className="text-sm font-bold text-slate-800 mt-0.5">Status: Despesa Não Dedutível</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <span className="material-symbols-outlined text-slate-400 text-sm">block</span>
                                                <p className="text-xs text-slate-500 italic flex-1">
                                                    Esta categoria de despesa ({cat}) não pode ser deduzida do IRPF.
                                                </p>

                                                <div className="bg-white border border-slate-300 text-slate-600 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm opacity-75">
                                                    <span className="material-symbols-outlined text-sm">edit_off</span>
                                                    Não Dedutível ({cat})
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }

                                return (beneficiary) && (
                                    <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl mb-6">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="bg-emerald-100 text-emerald-600 p-2 rounded-lg">
                                                <span className="material-symbols-outlined text-xl">receipt_long</span>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="text-xs font-black uppercase text-emerald-700 tracking-wider">Dados Para Imposto de Renda</h4>
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase border border-emerald-200">Dedutível</span>
                                                </div>
                                                <p className="text-sm font-bold text-emerald-900 mt-0.5">Status: Despesa Dedutível ({cat})</p>
                                            </div>
                                        </div>

                                        <div className="pl-[52px]">
                                            <label className="block text-[10px] font-bold text-emerald-600 uppercase mb-1">Beneficiário Identificado</label>
                                            <div className="bg-white border border-emerald-200 text-emerald-900 px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-between shadow-sm ring-1 ring-emerald-50">
                                                <div className="flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-emerald-500">person</span>
                                                    {beneficiary}
                                                </div>
                                                <span className="material-symbols-outlined text-emerald-300 text-sm">check_circle</span>
                                            </div>
                                            <p className="text-[10px] text-emerald-600 mt-2 flex items-center gap-1 opacity-80">
                                                <span className="material-symbols-outlined text-[12px]">info</span>
                                                Identificado via IA nas observações da nota.
                                            </p>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* ALERT BOX */}
                            {selectedMessage.isDuplicate && (
                                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mb-6 flex gap-3 items-start">
                                    <span className="material-symbols-outlined text-blue-600 mt-1">auto_awesome</span>
                                    <div>
                                        <h4 className="text-sm font-bold text-blue-900 mb-1">Merge Inteligente Disponível</h4>
                                        <p className="text-sm text-blue-800 leading-relaxed">
                                            Identificamos uma nota similar. Se você importar agora, completaremos os dados faltantes (como endereço ou telefone) na nota original.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* DATA DISPLAY */}
                            <div className="bg-white p-1 rounded-xl space-y-1">
                                {selectedMessage.isDuplicate ? (
                                    // SHOW COMPARISON IF DUPLICATE
                                    <>
                                        <SectionHeader title="Dados da Nota" icon="receipt" color="blue" />
                                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                                            <div className="grid grid-cols-12 gap-4 px-4 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 mb-2">
                                                <div className="col-span-3">Campo</div>
                                                <div className="col-span-4">Sistema</div>
                                                <div className="col-span-1"></div>
                                                <div className="col-span-4 text-slate-900">Importação</div>
                                            </div>
                                            <ComparisonRow label="Valor" systemVal={existingInvoice?.valor_total} newVal={selectedMessage.extracted?.valor_total} type="money" />
                                            <ComparisonRow label="Data" systemVal={existingInvoice?.data} newVal={selectedMessage.extracted?.data} />
                                            <ComparisonRow label="Número" systemVal={existingInvoice?.numero_nota} newVal={selectedMessage.extracted?.numero_nota} />
                                            <ComparisonRow label="Série" systemVal={existingInvoice?.serie_nota} newVal={selectedMessage.extracted?.serie_nota} />
                                        </div>

                                        <SectionHeader title="Emissor" icon="store" color="indigo" />
                                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                                            <ComparisonRow label="Nome" systemVal={existingInvoice?.nome_emissor} newVal={selectedMessage.extracted?.nome_emissor} />
                                            <ComparisonRow label="CNPJ" systemVal={existingInvoice?.cnpj_cpf_emissor} newVal={selectedMessage.extracted?.cnpj_cpf_emissor} />
                                            <ComparisonRow label="Telefone" systemVal={existingInvoice?.telefone_emissor} newVal={selectedMessage.extracted?.telefone_emissor} />
                                        </div>

                                        <SectionHeader title="Tomador" icon="person" color="emerald" />
                                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                                            <ComparisonRow label="Nome" systemVal={existingInvoice?.nome_tomador} newVal={selectedMessage.extracted?.nome_tomador} />
                                            <ComparisonRow label="Email" systemVal={existingInvoice?.email_tomador} newVal={selectedMessage.extracted?.email_tomador} />
                                            <ComparisonRow label="Endereço" systemVal={existingInvoice?.endereco_tomador} newVal={selectedMessage.extracted?.endereco_tomador} />
                                            <ComparisonRow label="Telefone" systemVal={existingInvoice?.telefone_tomador} newVal={selectedMessage.extracted?.telefone_tomador} />
                                        </div>
                                    </>
                                ) : (
                                    // SHOW COMPREHENSIVE LIST IF NEW
                                    <div className="space-y-2">
                                        <SectionHeader title="Dados da Nota" icon="receipt" color="blue" />
                                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-5">
                                            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                                                <div><label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Valor Total</label><p className="font-black text-2xl text-slate-900 dark:text-white tracking-tight">{formatMoney(selectedMessage.extracted?.valor_total)}</p></div>
                                                <div><label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Data Emissão</label><p className="font-bold text-slate-900 dark:text-white">{selectedMessage.extracted?.data}</p></div>
                                                <div><label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Número</label><p className="font-medium text-slate-700 dark:text-slate-300">{selectedMessage.extracted?.numero_nota || '-'}</p></div>
                                                <div><label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Série</label><p className="font-medium text-slate-700 dark:text-slate-300">{selectedMessage.extracted?.serie_nota || '-'}</p></div>
                                            </div>
                                        </div>

                                        <SectionHeader title="Emissor (Prestador)" icon="store" color="indigo" />
                                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 space-y-4">
                                            <div><label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Razão Social</label><p className="font-bold text-lg text-slate-900 dark:text-white">{selectedMessage.extracted?.nome_emissor}</p></div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div><label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">CNPJ</label><p className="font-medium text-slate-600 dark:text-slate-400 font-mono">{selectedMessage.extracted?.cnpj_cpf_emissor || '-'}</p></div>
                                                <div><label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Telefone</label><p className="font-medium text-slate-600 dark:text-slate-400">{selectedMessage.extracted?.telefone_emissor || '-'}</p></div>
                                            </div>
                                            <div><label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Endereço</label><p className="font-medium text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{selectedMessage.extracted?.endereco_emissor || 'Não consta'}</p></div>
                                        </div>


                                        <SectionHeader title="Tomador (Cliente)" icon="person" color="emerald" />
                                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 space-y-4">
                                            <div><label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Nome/Razão Social</label><p className="font-bold text-lg text-slate-900 dark:text-white">{selectedMessage.extracted?.nome_tomador || '-'}</p></div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div><label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">CPF/CNPJ</label><p className="font-medium text-slate-600 dark:text-slate-400 font-mono">{selectedMessage.extracted?.cpf_cnpj_tomador || '-'}</p></div>
                                                <div><label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Email</label><p className="font-medium text-slate-600 dark:text-slate-400">{selectedMessage.extracted?.email_tomador || '-'}</p></div>
                                            </div>
                                            <div><label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Endereço</label><p className="font-medium text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{selectedMessage.extracted?.endereco_tomador || 'Não consta'}</p></div>
                                        </div>

                                        {selectedMessage.extracted?.items && selectedMessage.extracted.items.length > 0 && (
                                            <>
                                                <SectionHeader title="Itens do Serviço" icon="shopping_cart" color="blue" />
                                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-5">
                                                    <ul className="space-y-3">
                                                        {selectedMessage.extracted.items.map((item: any, idx: number) => (
                                                            <li key={idx} className="flex justify-between items-start text-xs border-b border-slate-200 dark:border-slate-700 last:border-0 pb-2 last:pb-0">
                                                                <span className="font-medium text-slate-700 dark:text-slate-300 flex-1 pr-4 leading-relaxed">{item.descricao}</span>
                                                                <span className="font-black text-slate-900 dark:text-white whitespace-nowrap bg-white px-2 py-1 rounded border border-slate-200">{formatMoney(item.valor)}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ACTIONS */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-slate-200 flex justify-end gap-3 z-20">
                            <button onClick={() => onImport(selectedMessage)} className="px-8 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg flex items-center gap-2">
                                <span className="material-symbols-outlined">download</span>
                                {selectedMessage.isDuplicate ? 'Fundir & Atualizar' : 'Importar Nota'}
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <span className="material-symbols-outlined text-5xl mb-4 opacity-50">mail</span>
                        <p>Selecione um email para visualizar</p>
                    </div>
                )}
            </div>
        </div>
    );
};
