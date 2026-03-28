'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Script from 'next/script';
import { Invoice, InvoiceStats, GmailMessage, CATEGORIES } from './invoices/types';
import { DashboardTab } from './invoices/DashboardTab';
import { HistoryTab } from './invoices/HistoryTab';
import { GmailTab } from './invoices/GmailTab';
import { AuditTab } from './invoices/AuditTab';
import { formatMoney, normalizeDate, normalizeValue } from '@/lib/formatters';

declare global { interface Window { google: Record<string, unknown>; } }

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";


export const InvoiceControl: React.FC = () => {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const invoicesRef = useRef<Invoice[]>([]);
    useEffect(() => { invoicesRef.current = invoices; }, [invoices]);

    const [activeTab, setActiveTab] = useState<'dashboard' | 'list' | 'gmail' | 'audit'>('dashboard');
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingMsg, setProcessingMsg] = useState("");
    const [error, setError] = useState<string | null>(null);

    const [filters, setFilters] = useState({ category: "Todas", year: "Todos", state: "Todos", city: "Todas", issuer: "Todos" });
    const [refreshSignal, setRefreshSignal] = useState(0);
    const refreshDebounceRef = useRef<NodeJS.Timeout | null>(null);

    const triggerRefresh = () => {
        if (refreshDebounceRef.current) clearTimeout(refreshDebounceRef.current);
        refreshDebounceRef.current = setTimeout(() => setRefreshSignal(prev => prev + 1), 500);
    };

    const [gmailToken, setGmailToken] = useState<string | null>(null);
    const [gmailMessages, setGmailMessages] = useState<GmailMessage[]>([]);
    const tokenClient = useRef<any>(null);

    useEffect(() => {
        const fetchInvoices = async () => {
            try {
                const res = await fetch('/api/invoices', { cache: 'no-store', headers: { 'Pragma': 'no-cache', 'Cache-Control': 'no-cache' } });
                if (!res.ok) throw new Error("Falha ao buscar notas");
                const json = await res.json();
                const data = Array.isArray(json) ? json : (json.data || []);
                const normalized: Invoice[] = data.map((d: Record<string, unknown>) => ({
                    ...d,
                    data: normalizeDate(d.data),
                    valor_total: d.valor_total ? Number(d.valor_total) : 0,
                    items: typeof d.items === 'string' ? JSON.parse(d.items || '[]') : (d.items || [])
                }));
                setInvoices(normalized);
            } catch { setError("Erro ao carregar dados locais."); }
        };
        fetchInvoices();
    }, [refreshSignal]);

    useEffect(() => {
        const initGoogle = () => {
            if (window.google && CLIENT_ID) {
                tokenClient.current = window.google.accounts.oauth2.initTokenClient({
                    client_id: CLIENT_ID, scope: 'https://www.googleapis.com/auth/gmail.readonly',
                    callback: async (resp: { access_token: string }) => {
                        if (resp?.access_token) {
                            setGmailToken(resp.access_token);
                            // Store token in httpOnly cookie via server
                            await fetch('/api/gmail/token', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ token: resp.access_token })
                            });
                            fetchGmail(resp.access_token);
                        }
                    },
                });
            }
        };
        // Check if token exists in cookie
        fetch('/api/gmail/token').then(r => r.json()).then(data => {
            if (data.hasToken) setGmailToken('cookie-stored');
        }).catch(() => {});
        const timer = setTimeout(initGoogle, 1000);
        return () => clearTimeout(timer);
    }, []);

    const handleConnectGmail = () => {
        if (!CLIENT_ID) { setError("Google Client ID não configurado"); return; }
        if (tokenClient.current) tokenClient.current.requestAccessToken({ prompt: 'select_account' });
    };

    const handleDisconnectGmail = async () => {
        if (window.google && gmailToken) window.google.accounts.oauth2.revoke(gmailToken, () => { });
        setGmailToken(null); setGmailMessages([]);
        await fetch('/api/gmail/token', { method: 'DELETE' });
    };

    const fetchGmail = async (token: string) => {
        setIsProcessing(true); setProcessingMsg("Buscando e-mails...");
        try {
            const q = encodeURIComponent("subject:(nota OR nfe OR nfs OR danfe OR comprovante OR fatura OR recibo OR boleto OR payment OR documento OR anexo OR invoice) newer_than:90d");
            const res = await fetch(`/api/gmail/messages?q=${q}&maxResults=20`, { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) {
                const errData = await res.json();
                const errorMsg = errData.error?.message || errData.error?.error?.message || (typeof errData.error === 'string' ? errData.error : JSON.stringify(errData.error));
                throw new Error(`Erro API Gmail: ${errorMsg || res.statusText}`);
            }
            const data = await res.json();

            if (data.messages) {
                const ignored = JSON.parse(localStorage.getItem('ignored_gmail_ids') || '[]');
                const imported = JSON.parse(localStorage.getItem('imported_gmail_ids') || '[]');

                // Filter already processed messages to save API calls
                const pendingMessages = data.messages.filter((m: { id: string; [key: string]: unknown }) => !ignored.includes(m.id) && !imported.includes(m.id));
                const processed: GmailMessage[] = [];

                // Process in chunks of 5 using Promise.all for parallelism
                const chunkSize = 5;
                for (let i = 0; i < pendingMessages.length; i += chunkSize) {
                    const chunk = pendingMessages.slice(i, i + chunkSize);
                    setProcessingMsg(`Analisando lotes de e-mails (${i + 1} a ${Math.min(i + chunkSize, pendingMessages.length)} de ${pendingMessages.length})...`);

                    const chunkPromises = chunk.map(async (m: { id: string; [key: string]: unknown }) => {
                        try {
                            const dRes = await fetch(`/api/gmail/messages/${m.id}`, { headers: { Authorization: `Bearer ${token}` } });
                            if (!dRes.ok) return null;
                            const d = await dRes.json();

                            const b64Dec = (s: string) => { try { return decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/')))); } catch (e) { return ""; } };
                            const getTxt = (p: { body?: { data?: string }; parts?: unknown[]; mimeType?: string }): string => {
                                if (p.body?.data && p.mimeType === 'text/plain') return b64Dec(p.body.data);
                                if (p.parts) return (p.parts as { body?: { data?: string }; parts?: unknown[]; mimeType?: string }[]).map(getTxt).join('');
                                return "";
                            };

                            let body = getTxt(d.payload) || d.snippet || "";
                            let aiInput = null;
                            const findAtt = (parts: Record<string, unknown>[]): Record<string, unknown> | undefined => {
                                for (const p of parts) {
                                    if (p.body?.attachmentId && (p.mimeType === 'application/pdf' || p.mimeType.startsWith('image/'))) return p;
                                    if (p.parts) { const r = findAtt(p.parts); if (r) return r; }
                                }
                            };
                            const att = findAtt(d.payload.parts || []);
                            if (att) {
                                const aRes = await fetch(`/api/gmail/attachments?messageId=${m.id}&attachmentId=${att.body.attachmentId}`, { headers: { Authorization: `Bearer ${token}` } });
                                if (aRes.ok) {
                                    const aData = await aRes.json();
                                    if (aData.data) {
                                        aiInput = { type: att.mimeType, base64: `data:${att.mimeType};base64,${aData.data.replace(/-/g, '+').replace(/_/g, '/')}` };
                                    }
                                }
                            }

                            try {
                                const ext = await extractWithAI(aiInput || { text: body }, !!aiInput);
                                if (ext.is_invoice) {
                                    return {
                                        id: d.id,
                                        subject: d.payload.headers.find((h: { name: string; value: string }) => h.name === 'Subject')?.value,
                                        date: d.payload.headers.find((h: { name: string; value: string }) => h.name === 'Date')?.value,
                                        extracted: ext,
                                        isDuplicate: !!findDuplicate(ext),
                                        rawEmail: d,
                                        aiInput,
                                        fullBody: body
                                    } as GmailMessage;
                                }
                            } catch (aiErr: unknown) {
                                console.error(`AI Extraction failed for email ${m.id}:`, aiErr);
                            }
                        } catch (msgErr: unknown) {
                            console.error(`Error processing email ${m.id}:`, msgErr);
                        }
                        return null;
                    });

                    const chunkResults = await Promise.all(chunkPromises);
                    chunkResults.forEach(res => { if (res) processed.push(res); });
                }

                setGmailMessages(processed);
            }
        } catch (e: unknown) {
            console.error("Gmail fetch error:", e);
            setError(`Erro ao sincronizar: ${(e as Error).message}`);
        }
        setIsProcessing(false);
    };

    const extractWithAI = async (input: string | Record<string, unknown>, isFile = true) => {
        const res = await fetch('/api/ai/extract', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: isFile ? input.base64.split(',')[1] : input.text, isFile, mimeType: isFile ? input.type : 'text/plain' }) });
        const data = await res.json();
        if (!res.ok) {
            const errorMsg = data.error?.message || data.error?.error?.message || (typeof data.error === 'string' ? data.error : JSON.stringify(data.error));
            throw new Error(errorMsg || "Falha na extração de Inteligência AI");
        }
        return data;
    };

    const findDuplicate = (newData: Record<string, unknown>) => {
        const clean = (c: string | number | null | undefined) => String(c || '').replace(/\D/g, '');
        const nCNPJ = clean(newData.cnpj_cpf_emissor);
        const nVal = normalizeValue(newData.valor_total).toFixed(2);
        const nNum = String(newData.numero_nota || '').trim();
        return invoicesRef.current.find(inv => {
            if (nCNPJ && clean(inv.cnpj_cpf_emissor) === nCNPJ && nNum && String(inv.numero_nota || '').trim() === nNum) return true;
            return clean(inv.cnpj_cpf_emissor) === nCNPJ && normalizeValue(inv.valor_total).toFixed(2) === nVal && inv.data === normalizeDate(newData.data);
        });
    };

    const handleImportGmail = async (msg: GmailMessage) => {
        setIsProcessing(true);
        try {
            const ext = msg.extracted;
            const existing = findDuplicate(ext);
            if (existing) {
                await fetch(`/api/invoices/${existing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...ext, valor_total: normalizeValue(ext.valor_total), items: ext.items || [], data: normalizeDate(ext.data), status: 'APROVADO' }) });
            } else {
                await fetch('/api/invoices', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...ext, valor_total: normalizeValue(ext.valor_total), items: ext.items || [], data: normalizeDate(ext.data), status: 'APROVADO', source: 'Gmail', fileCopy: msg.aiInput?.base64 }) });
            }
            const imp = JSON.parse(localStorage.getItem('imported_gmail_ids') || '[]');
            localStorage.setItem('imported_gmail_ids', JSON.stringify([...imp, msg.id]));
            setGmailMessages(p => p.filter(m => m.id !== msg.id));
            triggerRefresh();
        } catch (e: unknown) {
            setError(`Erro ao importar: ${(e as Error).message || 'Falha desconhecida'}`);
        }
        setIsProcessing(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir esta nota fiscal?")) return;
        try {
            const res = await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Falha ao excluir');
            triggerRefresh();
        } catch (e: unknown) { setError(`Erro ao excluir: ${(e as Error).message}`); }
    };
    const handleApprove = async (id: string) => {
        try {
            const res = await fetch(`/api/invoices/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'APROVADO' }) });
            if (!res.ok) throw new Error('Falha ao aprovar');
            triggerRefresh();
        } catch (e: unknown) { setError(`Erro ao aprovar: ${(e as Error).message}`); }
    };
    const handleUpdate = async (id: string, data: Record<string, unknown>) => {
        try {
            const res = await fetch(`/api/invoices/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
            if (!res.ok) throw new Error('Falha ao atualizar');
            triggerRefresh();
        } catch (e: unknown) { setError(`Erro ao atualizar: ${(e as Error).message}`); }
    };

    const availableFilters = useMemo(() => ({
        categories: Array.from(new Set([...CATEGORIES, ...invoices.map(i => i.categoria || 'Outros')])).sort(),
        years: Array.from(new Set(invoices.map(i => i.data?.split('/').pop() || ''))).filter(y => !!y).sort().reverse(),
        states: Array.from(new Set(invoices.map(i => i.estado).filter((s): s is string => !!s))),
        cities: Array.from(new Set(invoices.map(i => i.cidade).filter((c): c is string => !!c))).sort(),
        issuers: Array.from(new Set(invoices.map(i => i.nome_emissor).filter((e): e is string => !!e))).sort()
    }), [invoices]);

    const filteredInvoices = useMemo(() => invoices.filter(inv => (filters.category === "Todas" || inv.categoria === filters.category) && (filters.year === "Todos" || inv.data?.endsWith(filters.year)) && (filters.state === "Todos" || inv.estado === filters.state) && (filters.issuer === "Todos" || inv.nome_emissor === filters.issuer)), [invoices, filters]);

    const stats = useMemo<InvoiceStats>(() => {
        const approved = filteredInvoices.filter(i => i.status === 'APROVADO');
        const byCat: Record<string, number> = {};
        approved.forEach(i => { const c = i.categoria || 'Outros'; byCat[c] = (byCat[c] || 0) + (Number(i.valor_total) || 0); });
        return { total: approved.reduce((a, b) => a + (Number(b.valor_total) || 0), 0), count: approved.length, byCat: Object.entries(byCat).sort((a, b) => b[1] - a[1]) };
    }, [filteredInvoices]);

    return (
        <div className="flex flex-col h-full bg-[#f8f9fc] dark:bg-black font-sans text-slate-900 overflow-hidden relative">
            <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
            <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
            <div className="bg-white dark:bg-[#1a2230] border-b border-slate-200 dark:border-slate-800 flex-shrink-0 px-8 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3"><div className="bg-blue-600 p-2 rounded-lg text-white"><span className="material-symbols-outlined">receipt_long</span></div><h1 className="font-bold text-lg text-slate-900 dark:text-white">Gestão Fiscal<span className="text-blue-500">.AI</span></h1></div>
                <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    {[{ id: 'dashboard', label: 'Painel', icon: 'monitoring' }, { id: 'list', label: 'Histórico', icon: 'list' }, { id: 'gmail', label: 'Sincronização', icon: 'mail' }, { id: 'audit', label: 'Auditoria', icon: 'verified_user' }].map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-white dark:bg-[#1a2230] text-blue-600 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}><span className="material-symbols-outlined text-[18px]">{tab.icon}</span>{tab.label}</button>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    <input type="file" id="fup" className="hidden" multiple accept=".pdf,image/*" onChange={async (e) => {
                        setIsProcessing(true);
                        for (const file of Array.from(e.target.files || [])) {
                            const reader = new FileReader(); reader.readAsDataURL(file);
                            await new Promise(r => reader.onload = async () => {
                                try {
                                    const ext = await extractWithAI({ base64: reader.result as string, type: file.type }, true);
                                    await fetch('/api/invoices', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...ext, valor_total: normalizeValue(ext.valor_total), data: normalizeDate(ext.data), status: 'APROVADO', source: 'Upload', fileCopy: reader.result as string }) });
                                } catch (e: unknown) { setError(`Erro no upload: ${(e as Error).message || 'Falha ao processar arquivo'}`); } r(null);
                            });
                        }
                        triggerRefresh(); setIsProcessing(false);
                    }} />
                    <button onClick={() => document.getElementById('fup')?.click()} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 hover:opacity-90">{isProcessing ? <span className="material-symbols-outlined animate-spin text-[16px]">sync</span> : <span className="material-symbols-outlined text-[16px]">upload_file</span>} UPLOAD</button>
                </div>
            </div>
            <div className="flex-1 overflow-auto p-6 md:p-8 relative">
                {error && <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-100 text-red-700 px-6 py-3 rounded-full shadow-lg z-50 font-bold text-sm flex items-center gap-2 animate-in slide-in-from-top-4"><span className="material-symbols-outlined">error</span> {error}<button onClick={() => setError(null)} className="ml-2 hover:underline">OK</button></div>}
                {activeTab === 'dashboard' && <DashboardTab stats={stats} invoices={filteredInvoices} filters={filters} onFilterChange={(k, v) => setFilters(p => ({ ...p, [k]: v }))} availableFilters={availableFilters} onDelete={handleDelete} onApprove={handleApprove} onUpdate={handleUpdate} />}
                {activeTab === 'list' && <HistoryTab invoices={invoices} onDelete={handleDelete} onApprove={handleApprove} onUpdate={handleUpdate} />}
                {activeTab === 'gmail' && <GmailTab isConnected={!!gmailToken} isProcessing={isProcessing} messages={gmailMessages} onConnect={handleConnectGmail} onSync={() => gmailToken && fetchGmail(gmailToken)} onImport={handleImportGmail} onDisconnect={handleDisconnectGmail} processingMsg={processingMsg} invoices={invoices} onReject={(m) => { const x = JSON.parse(localStorage.getItem('ignored_gmail_ids') || '[]'); localStorage.setItem('ignored_gmail_ids', JSON.stringify([...x, m.id])); setGmailMessages(p => p.filter(mi => mi.id !== m.id)); }} onUpdateMessage={(m) => setGmailMessages(p => p.map(mi => mi.id === m.id ? m : mi))} />}
                {activeTab === 'audit' && <AuditTab invoices={invoices} onApprove={handleApprove} onDelete={handleDelete} />}
            </div>
        </div>
    );
};
