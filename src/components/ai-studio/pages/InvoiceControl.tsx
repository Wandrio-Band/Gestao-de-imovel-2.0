'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Script from 'next/script';
import { Invoice, InvoiceStats, GmailMessage } from './invoices/types';
import { DashboardTab } from './invoices/DashboardTab';
import { HistoryTab } from './invoices/HistoryTab';
import { GmailTab } from './invoices/GmailTab';
import { AuditTab } from './invoices/AuditTab';

declare global {
    interface Window {
        google: any;
    }
}

// --- CONFIGURAÇÃO ---
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
const CATEGORIES = ["Saúde", "Educação", "Reforma", "Eletrônicos", "Outros"];

// Helper date normalizer
const normalizeDate = (dateStr?: string): string => {
    if (!dateStr) return new Date().toLocaleDateString('pt-BR');

    // Clean string
    let clean = dateStr.trim();

    // Handle DD/MM/YY (2 digit year)
    // Handle DD/MM/YY (2 digit year)
    if (/^\d{2}\/\d{2}\/\d{2}$/.test(clean)) {
        const [d, m, y] = clean.split('/');
        return `${d}/${m}/20${y}`;
    }

    // Handle YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
        const [y, m, d] = clean.split('-');
        return `${d}/${m}/${y}`;
    }

    // Handle YYYY/MM/DD
    if (/^\d{4}\/\d{2}\/\d{2}$/.test(clean)) {
        const [y, m, d] = clean.split('/');
        return `${d}/${m}/${y}`;
    }

    return clean;
};

const formatMoney = (v: any) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v) || 0);


export const InvoiceControl: React.FC = () => {
    // --- ESTADO GLOBAL ---
    const [invoices, setInvoices] = useState<Invoice[]>([]);

    const invoicesRef = useRef<Invoice[]>([]);
    useEffect(() => { invoicesRef.current = invoices; }, [invoices]);

    const [activeTab, setActiveTab] = useState<'dashboard' | 'list' | 'gmail' | 'audit'>('dashboard');
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingMsg, setProcessingMsg] = useState("");
    const [error, setError] = useState<string | null>(null);

    // Filters State
    const [filters, setFilters] = useState({
        category: "Todas",
        year: "Todos",
        state: "Todos",
        city: "Todas"
    });

    const [refreshSignal, setRefreshSignal] = useState(0);

    // Gmail State
    const [gmailToken, setGmailToken] = useState<string | null>(null);
    const [gmailMessages, setGmailMessages] = useState<GmailMessage[]>([]);
    const tokenClient = useRef<any>(null);

    // --- CARREGAR DADOS ---
    useEffect(() => {
        const fetchInvoices = async () => {
            try {
                const res = await fetch('/api/invoices', {
                    cache: 'no-store',
                    headers: { 'Pragma': 'no-cache', 'Cache-Control': 'no-cache' }
                });
                if (!res.ok) throw new Error("Falha ao buscar notas");
                const data = await res.json();

                const normalized: Invoice[] = data.map((d: any) => {
                    let parsedItems = [];
                    if (typeof d.items === 'string') {
                        try {
                            parsedItems = JSON.parse(d.items);
                        } catch (e) { console.error("Erro parsing items:", e); }
                    } else if (Array.isArray(d.items)) {
                        parsedItems = d.items;
                    }
                    return {
                        ...d,
                        data: normalizeDate(d.data),
                        valor_total: d.valor_total ? Number(d.valor_total) : 0,
                        items: parsedItems
                    };
                });
                setInvoices(normalized);
            } catch (e) {
                console.error(e);
                setError("Erro ao carregar dados locais.");
            }
        };
        fetchInvoices();
    }, [refreshSignal]);

    // --- GOOGLE AUTH ---
    useEffect(() => {
        const initGoogle = () => {
            if (window.google && CLIENT_ID) {
                tokenClient.current = window.google.accounts.oauth2.initTokenClient({
                    client_id: CLIENT_ID,
                    scope: 'https://www.googleapis.com/auth/gmail.readonly',
                    callback: (tokenResponse: any) => {
                        if (tokenResponse?.access_token) {
                            setGmailToken(tokenResponse.access_token);
                            fetchGmail(tokenResponse.access_token);
                        }
                    },
                });
            }
        };
        const timer = setTimeout(initGoogle, 1000);
        return () => clearTimeout(timer);
    }, []);

    const handleConnectGmail = () => {
        if (!CLIENT_ID) {
            setError("Google Client ID não configurado no .env");
            return;
        }

        const config = { prompt: 'select_account' };

        if (tokenClient.current) {
            tokenClient.current.requestAccessToken(config);
        } else {
            if (window.google) {
                tokenClient.current = window.google.accounts.oauth2.initTokenClient({
                    client_id: CLIENT_ID,
                    scope: 'https://www.googleapis.com/auth/gmail.readonly',
                    callback: (tokenResponse: any) => {
                        if (tokenResponse?.access_token) {
                            setGmailToken(tokenResponse.access_token);
                            fetchGmail(tokenResponse.access_token);
                        }
                    },
                });
                tokenClient.current.requestAccessToken(config);
            }
        }
    };

    const handleDisconnectGmail = () => {
        setGmailToken(null);
        setGmailMessages([]);
        if (window.google) {
            window.google.accounts.oauth2.revoke(gmailToken!, () => { console.log('Token revoked') });
        }
    };

    // --- LOCAL STORAGE TRACKING ---
    const [importedMessageIds, setImportedMessageIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        const stored = localStorage.getItem('imported_gmail_ids');
        if (stored) {
            try {
                setImportedMessageIds(new Set(JSON.parse(stored)));
            } catch (e) {
                console.error("Erro ao carregar IDs importados:", e);
            }
        }
    }, []);

    const markAsImported = (id: string) => {
        const newSet = new Set(importedMessageIds);
        newSet.add(id);
        setImportedMessageIds(newSet);
        localStorage.setItem('imported_gmail_ids', JSON.stringify(Array.from(newSet)));
    };

    // --- LÓGICA GMAIL & IA ---
    const fetchGmail = async (token: string) => {
        setIsProcessing(true);
        setProcessingMsg("Buscando e analisando e-mails fiscais...");
        try {
            const q = encodeURIComponent("subject:(nota fiscal OR DANFE OR comprovante) newer_than:60d");
            const res = await fetch(`/api/gmail/messages?q=${q}&maxResults=50`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) throw new Error("Erro na API Gmail");
            const data = await res.json();
            if (data.messages && data.messages.length > 0) {
                // Filtrar os que já foram importados (localStorage)
                const filtered = data.messages.filter((m: any) => !importedMessageIds.has(m.id));

                if (filtered.length === 0) {
                    setGmailMessages([]);
                    setIsProcessing(false);
                    return;
                }

                const msgs: GmailMessage[] = [];
                const batchSize = 5;
                for (let i = 0; i < filtered.length; i += batchSize) {
                    const batch = filtered.slice(i, i + batchSize);
                    setProcessingMsg(`Analisando lote ${Math.floor(i / batchSize) + 1}...`);

                    const batchResults = await Promise.all(batch.map(async (m: any) => {
                        try {
                            const detailRes = await fetch(`/api/gmail/messages/${m.id}`, { headers: { Authorization: `Bearer ${token}` } });
                            if (!detailRes.ok) return null;
                            const d = await detailRes.json();

                            const b64DecodeUnicode = (str: string) => {
                                try {
                                    return decodeURIComponent(Array.prototype.map.call(atob(str.replace(/-/g, '+').replace(/_/g, '/')), function (c) {
                                        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                                    }).join(''));
                                } catch (e) { return ""; }
                            };

                            const getEmailText = (payload: any): string => {
                                let text = "";
                                if (payload.body && payload.body.data && payload.mimeType === 'text/plain') {
                                    return b64DecodeUnicode(payload.body.data);
                                }
                                if (payload.parts) {
                                    for (const part of payload.parts) {
                                        if (part.mimeType === 'text/plain') {
                                            if (part.body && part.body.data) text += b64DecodeUnicode(part.body.data);
                                        } else if (part.parts) {
                                            text += getEmailText(part);
                                        }
                                    }
                                }
                                return text;
                            };

                            let aiInput = null;
                            let fullBody = getEmailText(d.payload);
                            if (!fullBody || fullBody.length < 50) fullBody = d.snippet || "";

                            // --- ATTACHMENT DISCOVERY & DEBUG ---
                            let debugLog = "\n\n--- DEBUG DE ANEXOS ---";
                            const foundAttachments: any[] = [];

                            const collectAttachments = (nodes: any[]) => {
                                for (const p of nodes) {
                                    if (p.body?.attachmentId) {
                                        foundAttachments.push(p);
                                        debugLog += `\nFound: ${p.filename || 'no-name'} (${p.mimeType})`;
                                    }
                                    if (p.parts) collectAttachments(p.parts);
                                }
                            };
                            if (d.payload.parts) collectAttachments(d.payload.parts);

                            // Select Best Attachment
                            let attPart = null;

                            // 1. PDF
                            attPart = foundAttachments.find(p => p.mimeType === 'application/pdf' || p.filename?.toLowerCase().endsWith('.pdf'));

                            // 2. XML (if no PDF)
                            if (!attPart) {
                                attPart = foundAttachments.find(p => p.mimeType.includes('xml') || p.filename?.toLowerCase().endsWith('.xml'));
                            }

                            // 3. Image (if no PDF or XML)
                            if (!attPart) {
                                attPart = foundAttachments.find(p => p.mimeType.startsWith('image/'));
                            }

                            fullBody += debugLog;

                            if (attPart) {
                                fullBody += `\nSELECTED FOR PROCESSING: ${attPart.filename} (${attPart.mimeType})`;

                                const attRes = await fetch(`/api/gmail/attachments?messageId=${m.id}&attachmentId=${attPart.body.attachmentId}`, { headers: { Authorization: `Bearer ${token}` } });
                                if (attRes.ok) {
                                    const attData = await attRes.json();
                                    if (attData.data) {
                                        const isXML = attPart.mimeType.includes('xml') || (attPart.filename && attPart.filename.toLowerCase().endsWith('.xml'));

                                        if (isXML) {
                                            try {
                                                let decodedXml = b64DecodeUnicode(attData.data);
                                                if (!decodedXml) decodedXml = atob(attData.data.replace(/-/g, '+').replace(/_/g, '/'));
                                                fullBody += `\n\n=== ANEXO XML DETECTADO (${attPart.filename}) ===\n${decodedXml}`;
                                            } catch (e) { console.error("XML Decode Error", e); }
                                        } else {
                                            let mime = attPart.mimeType;
                                            if (attPart.filename?.endsWith('.pdf')) mime = 'application/pdf';
                                            const base64 = attData.data.replace(/-/g, '+').replace(/_/g, '/');
                                            aiInput = { type: mime, base64: `data:${mime};base64,${base64}` };
                                        }
                                    }
                                }
                            } else {
                                fullBody += "\nNO SUPPORTED ATTACHMENT FOUND.";
                            }

                            let extracted: any = {};
                            try {
                                extracted = await extractWithAI(aiInput || { text: fullBody }, !!aiInput);
                                if (extracted.data) extracted.data = normalizeDate(extracted.data);
                            } catch (e) {
                                extracted = { nome_emissor: "Erro na IA", valor_total: 0, categoria: "Outros" };
                            }

                            const isDup = !!findDuplicate(extracted);

                            return {
                                id: d.id,
                                subject: d.payload.headers.find((h: any) => h.name === 'Subject')?.value || '(Sem Assunto)',
                                date: d.payload.headers.find((h: any) => h.name === 'Date')?.value,
                                extracted,
                                isDuplicate: isDup,
                                rawEmail: d,
                                aiInput,
                                fullBody
                            } as GmailMessage;

                        } catch (e) { return null; }
                    }));
                    msgs.push(...(batchResults.filter(m => m !== null) as GmailMessage[]));
                }
                setGmailMessages(msgs);
            } else {
                setGmailMessages([]);
            }
        } catch (e: any) {
            setError(`Gmail Error: ${e.message}`);
        }
        setIsProcessing(false);
    };

    // Helper to learn from past decisions
    const refineCategoryWithHistory = (extracted: any) => {
        // Try to find an existing APPROVED invoice with the same issuer CNPJ or Name
        const pastInvoice = invoicesRef.current.find(inv =>
            inv.status === 'APROVADO' &&
            (
                (extracted.cnpj_cpf_emissor && inv.cnpj_cpf_emissor === extracted.cnpj_cpf_emissor) ||
                (inv.nome_emissor?.toLowerCase() === extracted.nome_emissor?.toLowerCase())
            )
        );

        if (pastInvoice && pastInvoice.categoria) {
            console.log(`Learning from history: Using category '${pastInvoice.categoria}' for issuer '${extracted.nome_emissor}'`);
            return { ...extracted, categoria: pastInvoice.categoria };
        }
        return extracted;
    };

    const refineBeneficiary = (extracted: any, fullText: string) => {
        const validNames = [
            "Wândrio Bandeira dos Anjos",
            "Lucas Massad Bandeira",
            "Raquel Dutra Massad",
            "Ana Júlia Massad Bandeira"
        ];

        // 1. Check if AI already returned a perfect match
        if (extracted.beneficiario && validNames.includes(extracted.beneficiario)) {
            return extracted;
        }

        // 2. Normalize texts for search
        const lowerBody = (fullText || "").toLowerCase();
        const lowerExtracted = (extracted.beneficiario || "").toLowerCase();

        let found = null;

        // 3. Search for Keywords (in both extracted value and full body)
        // Helper to check both sources
        const check = (keywords: string[]) => keywords.some(k => lowerBody.includes(k) || lowerExtracted.includes(k));

        if (check(["lucas", "massad"])) found = "Lucas Massad Bandeira";
        else if (check(["raquel", "dutra"])) found = "Raquel Dutra Massad";
        else if (check(["ana julia", "ana júlia", "julia massad", "júlia massad"])) found = "Ana Júlia Massad Bandeira";
        else if (check(["wândrio", "wandrio", "bandeira dos anjos"])) found = "Wândrio Bandeira dos Anjos";

        if (found) {
            console.log(`Fuzzy Logic: Found beneficiary '${found}'`);
            return { ...extracted, beneficiario: found };
        }

        // 4. Strict Enforcement
        return { ...extracted, beneficiario: null };
    };

    const extractWithAI = async (input: any, isFile = true) => {
        const payload = isFile
            ? { file: { mimeType: input.type, data: input.base64.split(',')[1] } }
            : { text: input.text };

        const res = await fetch('/api/ai/extract', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const parsed = await res.json();
        if (parsed.error) throw new Error(parsed.error);

        // APPLY LEARNING & FUZZY LOGIC
        // We need the full text for fuzzy search if it was a file upload (which it usually is here).
        // Since we don't store full OCR text easily here without re-reading, we rely on AI's ability + basic input text if available.

        let refined = refineCategoryWithHistory(parsed);

        // Post-process beneficiary name using our robust helper
        // Since we don't have full body text easily for files here, pass empty string.
        // The helper scans 'extracted.beneficiario' too, so it works.
        refined = refineBeneficiary(refined, "");

        return refined;
    };

    const findDuplicate = (newData: any) => {
        const cleanCNPJ = (c: any) => String(c || '').replace(/\D/g, '');
        const normDate = (d: any) => normalizeDate(d);

        const newCNPJ = cleanCNPJ(newData.cnpj_cpf_emissor);
        const newVal = normalizeValue(newData.valor_total).toFixed(2);
        const newNum = newData.numero_nota ? String(newData.numero_nota).trim() : null;
        const newSerie = newData.serie_nota ? String(newData.serie_nota).trim() : null;
        const newDate = normDate(newData.data);

        return invoicesRef.current.find(inv => {
            const sameCNPJ = cleanCNPJ(inv.cnpj_cpf_emissor) === newCNPJ;
            const existingVal = normalizeValue(inv.valor_total).toFixed(2);

            // STRONG MATCH: CNPJ + Number (+ Serie optional)
            // If the invoice has a number, and it matches, it's almost certainly the same invoice.
            // We ignore value mismatch here if it's 0 vs Something, as AI might have failed to extract value on one side.
            if (newCNPJ && sameCNPJ && newNum && String(inv.numero_nota).trim() === newNum) {
                // If serie exists on both, must match too
                if (newSerie && inv.serie_nota && String(inv.serie_nota).trim() !== newSerie) return false;
                return true;
            }

            // VALUE MATCH LOGIC
            const sameVal = existingVal === newVal;

            // If values differ significantly (and not 0), likely different invoice (unless Number matched above).
            // Exception: If one value is 0.00 (extraction fail), we might still want to flag it if Date + Name match?
            // For now, let's keep strict value check for non-numbered invoices.
            if (!sameVal) return false;

            if (newCNPJ && sameCNPJ) {
                // Recurring Payment Check: Same CNPJ + Same Value.
                // Must imply Same Date to be a "Duplicate". 
                // Otherwise it's just next month's bill.
                return inv.data === newDate;
            }

            // Fallback: Name + Date + Value
            const sameName = (inv.nome_emissor || '').toLowerCase() === (newData.nome_emissor || '').toLowerCase();
            return sameName && (inv.data === newDate);
        });
    };

    // Helper to fix currency format (450,00 -> 450.00) or (450.00 -> 450.00)
    function normalizeValue(val: string | number | undefined): number {
        if (!val) return 0;
        if (typeof val === 'number') return val;

        // Remove currency symbols and whitespace
        let clean = val.toString().replace(/[R$\s]/g, '');

        // Heuristic: If comma is present and appears after the last dot (or no dot), assume BRL/European (1.234,56 or 123,56)
        if (clean.includes(',') && (!clean.includes('.') || clean.lastIndexOf(',') > clean.lastIndexOf('.'))) {
            clean = clean.replace(/\./g, '').replace(',', '.');
        } else {
            // Assume US/Standard (1,234.56 or 1234.56) - remove commas, keep dots
            clean = clean.replace(/,/g, '');
        }

        return parseFloat(clean) || 0;
    };

    const handleImportGmail = async (msg: GmailMessage) => {
        setIsProcessing(true);
        setProcessingMsg("Salvando...");
        try {
            // Prefer fullBody if available
            const bodyContent = (msg as any).fullBody || msg.rawEmail.snippet;
            const bodyViewer = `data:text/html;base64,${btoa(unescape(encodeURIComponent(bodyContent)))}`;

            // Refine again just in case (though extractWithAI handles it, this handles manual edits if any)
            const refinedData = refineCategoryWithHistory(msg.extracted);
            const cleanValue = normalizeValue(refinedData.valor_total);

            // Also normalize items values if they exist
            const cleanItems = refinedData.items?.map((item: any) => ({
                ...item,
                valor: normalizeValue(item.valor)
            }));

            // Check for duplicate/existing invoice
            const existingInvoice = findDuplicate(refinedData);

            if (existingInvoice) {
                // SMART MERGE LOGIC
                const updates: any = {};
                let enriched = false;

                // Fields to attempt enrichment on
                const fieldsToCheck = [
                    'nome_tomador', 'cpf_cnpj_tomador',
                    'endereco_tomador', 'email_tomador', 'telefone_tomador',
                    'nome_emissor', 'telefone_emissor',
                    'numero_nota', 'serie_nota', 'beneficiario',
                    'fileCopy', 'items'
                ];

                fieldsToCheck.forEach(field => {
                    const existingVal = (existingInvoice as any)[field];
                    const newVal = (refinedData as any)[field];

                    // Helper to check if value is "present"
                    const hasValue = (v: any) => v && v !== '' && v !== '-' && v !== 'não informado' && v !== 'Endereço não extraído';

                    // If existing is empty/null and new has value, update it
                    // For items, only update if existing has no items
                    if (field === 'items') {
                        if ((!existingVal || existingVal.length === 0) && newVal && newVal.length > 0) {
                            updates.items = newVal;
                            enriched = true;
                        }
                    } else if (!hasValue(existingVal) && hasValue(newVal)) {
                        updates[field] = newVal;
                        enriched = true;
                    }
                });

                // If we also found a better file copy (e.g. PDF/XML over HTML)
                if (msg.aiInput && !existingInvoice.fileCopy?.startsWith('data:application/pdf')) {
                    updates.fileCopy = msg.aiInput.base64;
                    enriched = true;
                }

                if (enriched) {
                    console.log(`Enriching Invoice #${existingInvoice.id} with new data from import.`);
                    await fetch(`/api/invoices/${existingInvoice.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            ...updates,
                            auditReason: existingInvoice.auditReason ? `${existingInvoice.auditReason} | Dados complementados via nova importação.` : "Dados complementados automaticamente via nova importação."
                        })
                    });
                    setRefreshSignal(p => p + 1);
                    // Mark message as processed locally without adding new invoice
                    markAsImported(msg.id);
                    setGmailMessages(prev => prev.filter(m => m.id !== msg.id));
                } else {
                    // It's a pure duplicate with no new info.
                    console.log("Invoice is a perfect duplicate with no new data. Skipping creation.");
                    markAsImported(msg.id);
                    setGmailMessages(prev => prev.filter(m => m.id !== msg.id));
                }

            } else {
                // New Invoice
                const newDoc = {
                    ...refinedData,
                    valor_total: cleanValue,
                    items: cleanItems,
                    data: normalizeDate(refinedData.data),
                    status: 'APROVADO',
                    source: 'Gmail',
                    fileCopy: msg.aiInput ? msg.aiInput.base64 : bodyViewer,
                    auditReason: null
                };
                const res = await fetch('/api/invoices', { method: 'POST', body: JSON.stringify(newDoc), headers: { 'Content-Type': 'application/json' } });
                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    throw new Error(errData.error || "Falha ao salvar");
                }

                markAsImported(msg.id);
                setGmailMessages(prev => prev.filter(m => m.id !== msg.id));
                setRefreshSignal(prev => prev + 1);
            }

        } catch (e: any) {
            console.error("Import Error:", e);
            setError(`Erro ao salvar: ${e.message || 'Falha desconhecida'}`);
        }
        setIsProcessing(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Excluir?")) return;
        setInvoices(p => p.filter(i => i.id !== id));
        try { await fetch(`/api/invoices/${id}`, { method: 'DELETE' }); setRefreshSignal(p => p + 1); } catch (e) { setError("Erro ao excluir"); }
    };

    const handleApprove = async (id: string) => {
        try {
            await fetch(`/api/invoices/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'APROVADO', auditReason: null }) });
            setRefreshSignal(p => p + 1);
        } catch (e) { setError("Erro ao aprovar"); }
    };

    const availableFilters = useMemo(() => {
        return {
            categories: Array.from(new Set([...CATEGORIES, ...invoices.map(i => i.categoria || 'Outros')])).sort(),
            years: Array.from(new Set(invoices.map(i => i.data?.split('/').pop() || ''))).filter((y): y is string => !!y).sort().reverse(),
            states: Array.from(new Set(invoices.map(i => i.estado).filter((s): s is string => !!s))),
            cities: Array.from(new Set(invoices.map(i => i.cidade).filter((c): c is string => !!c))).sort()
        };
    }, [invoices]);

    const filteredInvoices = useMemo(() => {
        return invoices.filter(inv => {
            return (filters.category === "Todas" || inv.categoria === filters.category) &&
                (filters.year === "Todos" || (inv.data && inv.data.endsWith(filters.year))) &&
                (filters.state === "Todos" || inv.estado === filters.state);
        });
    }, [invoices, filters]);

    const stats = useMemo<InvoiceStats>(() => {
        const approved = filteredInvoices.filter(i => i.status === 'APROVADO');
        const byCat: Record<string, number> = {};
        approved.forEach(i => {
            const cat = i.categoria || 'Outros';
            byCat[cat] = (byCat[cat] || 0) + (Number(i.valor_total) || 0);
        });
        return {
            total: approved.reduce((a, b) => a + (Number(b.valor_total) || 0), 0),
            count: approved.length,
            byCat: Object.entries(byCat).sort((a, b) => b[1] - a[1])
        };
    }, [filteredInvoices]);
    const handleUpdate = async (id: string, data: any) => {
        try {
            await fetch(`/api/invoices/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
            setRefreshSignal(p => p + 1);
        } catch (e) { setError("Erro ao atualizar"); }
    };




    return (
        <div className="flex flex-col h-full bg-[#f8f9fc] dark:bg-black font-sans text-slate-900 overflow-hidden relative">
            <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
            <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />

            {/* Top Navigation */}
            <div className="bg-white dark:bg-[#1a2230] border-b border-slate-200 dark:border-slate-800 shadow-sm flex-shrink-0 px-8 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-600 p-2 rounded-lg text-white"><span className="material-symbols-outlined">receipt_long</span></div>
                    <h1 className="font-bold text-lg text-slate-900 dark:text-white leading-tight">Gestão Fiscal<span className="text-blue-500">.AI</span></h1>
                </div>

                <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    {[
                        { id: 'dashboard', label: 'Dashboard', icon: 'monitoring' },
                        { id: 'list', label: 'Histórico', icon: 'list' },
                        { id: 'gmail', label: 'Gmail Sync', icon: 'mail' },
                        { id: 'audit', label: 'Auditoria', icon: 'verified_user' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all
                                ${activeTab === tab.id
                                    ? 'bg-white dark:bg-[#1a2230] text-blue-600 dark:text-white shadow-sm'
                                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`
                            }
                        >
                            <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                            {tab.label}
                            {tab.id === 'audit' && invoices.filter(i => i.status === 'PENDENTE').length > 0 &&
                                <span className="ml-1 size-2 rounded-full bg-red-500 animate-pulse"></span>
                            }
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    {activeTab === 'list' && (
                        <button
                            onClick={async () => {
                                if (confirm("ATENÇÃO: Isso apagará TODAS as faturas do banco de dados. Esta ação é irreversível. Deseja continuar?")) {
                                    setIsProcessing(true);
                                    try {
                                        const res = await fetch('/api/invoices/reset', { method: 'DELETE' });
                                        if (res.ok) {
                                            setInvoices([]);
                                            setRefreshSignal(p => p + 1);
                                        } else {
                                            throw new Error("Falha ao limpar banco de dados");
                                        }
                                    } catch (e) {
                                        setError("Erro ao apagar faturas");
                                        console.error(e);
                                    }
                                    setIsProcessing(false);
                                }
                            }}
                            className="bg-red-50 text-red-600 hover:bg-red-100 px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition-colors mr-2"
                        >
                            <span className="material-symbols-outlined text-[16px]">delete_forever</span>
                            Excluir Tudo
                        </button>
                    )}

                    <input type="file" id="fileUpload" className="hidden" multiple accept=".pdf,image/*"
                        onChange={async (e) => {
                            const files = Array.from(e.target.files || []);
                            setIsProcessing(true);
                            // Need to prevent race conditions or UI blocking, so process sequentially
                            for (const file of files) {
                                const reader = new FileReader();
                                reader.readAsDataURL(file);
                                await new Promise<void>((resolve) => {
                                    reader.onload = async () => {
                                        const base64 = reader.result as string;
                                        try {
                                            const ext = await extractWithAI({ base64, type: file.type }, true);

                                            // Normalize data
                                            const cleanValue = normalizeValue(ext.valor_total);
                                            const cleanItems = ext.items?.map((item: any) => ({
                                                ...item,
                                                valor: normalizeValue(item.valor)
                                            }));

                                            // CHECK DUPLICATES
                                            const existing = findDuplicate(ext);
                                            let finalStatus = 'APROVADO';
                                            let finalReason = null;

                                            if (existing) {
                                                finalStatus = 'DUPLICATA';
                                                finalReason = `Duplicidade detectada com a nota de valor ${formatMoney(existing.valor_total)} de ${existing.nome_emissor}`;
                                            }

                                            const newDoc = {
                                                ...ext,
                                                valor_total: cleanValue,
                                                items: cleanItems,
                                                data: normalizeDate(ext.data),
                                                status: finalStatus, // Set DUPLICATA or APROVADO
                                                source: 'Upload',
                                                fileCopy: base64,
                                                auditReason: finalReason
                                            };

                                            await fetch('/api/invoices', { method: 'POST', body: JSON.stringify(newDoc), headers: { 'Content-Type': 'application/json' } });
                                        } catch (e) { console.error(e); }
                                        resolve();
                                    }
                                });
                            }
                            // Small delay to ensure DB updates
                            setTimeout(() => { setIsProcessing(false); setRefreshSignal(p => p + 1); }, 2000);
                        }}
                    />
                    <button onClick={() => document.getElementById('fileUpload')?.click()} disabled={isProcessing} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 hover:opacity-90 transition-opacity">
                        {isProcessing ? <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span> : <span className="material-symbols-outlined text-[16px]">upload_file</span>}
                        UPLOAD
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-auto p-6 md:p-8 relative">
                {error && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-100 text-red-700 px-6 py-3 rounded-full shadow-lg z-50 font-bold text-sm flex items-center gap-2 animate-in slide-in-from-top-4">
                        <span className="material-symbols-outlined">error</span> {error}
                        <button onClick={() => setError(null)} className="ml-2 hover:underline">OK</button>
                    </div>
                )}

                {activeTab === 'dashboard' && (
                    <DashboardTab
                        stats={stats}
                        invoices={filteredInvoices}
                        filters={filters}
                        onFilterChange={(k, v) => setFilters(p => ({ ...p, [k]: v }))}
                        availableFilters={availableFilters}
                        onDelete={handleDelete}
                        onApprove={handleApprove}
                        onUpdate={handleUpdate}
                    />
                )}
                {activeTab === 'list' && (
                    <HistoryTab
                        invoices={invoices}
                        onDelete={handleDelete}
                        onApprove={handleApprove}
                        onUpdate={handleUpdate}
                    />
                )}
                {activeTab === 'gmail' && (
                    <GmailTab
                        isConnected={!!gmailToken}
                        isProcessing={isProcessing}
                        messages={gmailMessages}
                        onConnect={handleConnectGmail}
                        onSync={() => gmailToken && fetchGmail(gmailToken)}
                        onImport={handleImportGmail}
                        onDisconnect={handleDisconnectGmail}
                        processingMsg={processingMsg}
                        invoices={invoices}
                    />
                )}
                {activeTab === 'audit' && (
                    <AuditTab
                        invoices={invoices}
                        onApprove={handleApprove}
                        onDelete={handleDelete}
                    />
                )}
            </div>
        </div>
    );
};
