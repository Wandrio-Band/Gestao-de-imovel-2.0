'use client';

import React, { useState } from 'react';
import { processConciliation, confirmPaymentAndLearn, PixEntry, ConciliationResult, MatchSuggestion } from '@/app/actions/rental';
import { PaymentMatchCard } from '@/components/rental/PaymentMatchCard';
import Link from 'next/link';
import toast from 'react-hot-toast';

function parseCSVEntries(text: string): PixEntry[] {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];

    const entries: PixEntry[] = [];
    // Skip header line
    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(';').map(c => c.trim().replace(/^"|"$/g, ''));
        if (cols.length < 3) continue;

        // Try common CSV formats: date;description;amount or date;amount;description
        const date = cols[0];
        const amount = parseFloat(cols.find(c => /^-?\d+([.,]\d+)?$/.test(c.replace(/\./g, '').replace(',', '.')))?.replace(/\./g, '').replace(',', '.') || '0');
        const description = cols.find(c => !/^-?\d+([.,]\d+)?$/.test(c.replace(/\./g, '').replace(',', '.')) && c !== date) || '';

        if (amount !== 0 && date) {
            entries.push({
                date,
                amount: Math.abs(amount),
                description,
                payerName: description,
            });
        }
    }
    return entries;
}

export default function ConciliacaoPage() {
    const [results, setResults] = useState<ConciliationResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [stats, setStats] = useState({ total: 0, matched: 0, pending: 0 });

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        toast.loading('Processando extrato...', { id: 'process' });

        try {
            const text = await file.text();
            const entries: PixEntry[] = parseCSVEntries(text);

            if (entries.length === 0) {
                toast.error('Nenhuma transação encontrada no arquivo', { id: 'process' });
                return;
            }

            const processed = await processConciliation(entries);
            setResults(processed);

            const matched = processed.filter(r => r.suggestion?.confidence && r.suggestion.confidence > 0.8).length;
            setStats({
                total: processed.length,
                matched,
                pending: processed.length - matched
            });

            toast.success('Extrato processado com sucesso!', { id: 'process' });
        } catch (error) {
            console.error(error);
            toast.error('Erro ao processar extrato', { id: 'process' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirm = async (entry: PixEntry, suggestion: MatchSuggestion) => {
        if (!suggestion.tenantId) return;

        const toastId = toast.loading('Confirmando baixa...');

        try {
            const res = await confirmPaymentAndLearn(suggestion.tenantId, suggestion.contractId, entry);

            if (res.success) {
                toast.success('Pagamento confirmado e vínculo aprendido!', { id: toastId });
                // Remove from list or mark as done
                setResults(prev => prev.filter(r => r.rawEntry !== entry));
                setStats(prev => ({ ...prev, pending: prev.pending - 1 })); // simple update
            } else {
                toast.error('Erro ao confirmar', { id: toastId });
            }
        } catch (e) {
            toast.error('Erro de conexão', { id: toastId });
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <header className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Conciliação Bancária</h1>
                    <p className="text-gray-500">Importe seu extrato e deixe a IA identificar os pagamentos dos aluguéis.</p>
                </div>

                <div className="flex gap-4">
                    <Link href="/conciliacao/config" className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">settings</span>
                        Configurar Vínculos
                    </Link>
                </div>
            </header>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <span className="text-gray-400 text-xs font-bold uppercase">Total Transações</span>
                    <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <span className="text-green-600 text-xs font-bold uppercase">Identificados (IA)</span>
                    <div className="text-3xl font-bold text-green-600">{stats.matched}</div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <span className="text-orange-500 text-xs font-bold uppercase">Pendentes Aprovação</span>
                    <div className="text-3xl font-bold text-orange-500">{stats.pending}</div>
                </div>
            </div>

            {/* Upload Area */}
            {results.length === 0 ? (
                <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
                    <div className="mx-auto h-12 w-12 text-gray-300 mb-4">
                        📄
                    </div>
                    <h3 className="mt-2 text-sm font-semibold text-gray-900">Importar Extrato Bancário</h3>
                    <p className="mt-1 text-sm text-gray-500">Suporta arquivos OFX e CSV de qualquer banco.</p>
                    <div className="mt-6">
                        <label
                            className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
                        >
                            {isLoading ? 'Processando...' : 'Selecionar Arquivo (.CSV)'}
                            <input
                                type="file"
                                accept=".csv,.ofx,.txt"
                                onChange={handleFileUpload}
                                className="hidden"
                                disabled={isLoading}
                            />
                        </label>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="flex justify-between items-center bg-gray-100 p-2 rounded-lg">
                        <span className="text-sm font-medium text-gray-500 ml-2">Inbox de Validação ({results.length})</span>
                        <div className="flex gap-2">
                            <button className="px-3 py-1 bg-white text-xs font-bold rounded shadow-sm text-blue-600">TODOS</button>
                            <button className="px-3 py-1 bg-transparent text-xs font-bold rounded text-gray-500 hover:bg-gray-200">PENDENTES</button>
                        </div>
                    </div>

                    <div>
                        {results.map((item, idx) => (
                            <PaymentMatchCard
                                key={idx}
                                entry={item.rawEntry}
                                suggestion={item.suggestion}
                                onConfirm={handleConfirm}
                            />
                        ))}
                    </div>

                    {results.length === 0 && (
                        <div className="text-center py-10 text-gray-500">
                            Nenhum pagamento pendente.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
