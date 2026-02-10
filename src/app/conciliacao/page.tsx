'use client';

import React, { useState } from 'react';
import { processConciliation, confirmPaymentAndLearn, PixEntry, ConciliationResult } from '@/app/actions/rental';
import { PaymentMatchCard } from '@/components/rental/PaymentMatchCard';
import Link from 'next/link';
import toast from 'react-hot-toast';

// Mock Data for Simulation (since we don't have real OFX parser on client yet)
const MOCK_OFX_ENTRIES: PixEntry[] = [
    {
        date: '2026-02-05',
        amount: 2500.00,
        description: 'PIX RECEBIDO - JOAO DA SILVA'
    },
    {
        date: '2026-02-05',
        amount: 3200.50,
        description: 'TRANSF. REC. RS CONFECCOES LTDA' // Matches 'Raquel' via alias ideally
    },
    {
        date: '2026-02-06',
        amount: 150.00,
        description: 'DEVOLUÇÃO COMPRA MERCADO'
    }
];

export default function ConciliacaoPage() {
    const [results, setResults] = useState<ConciliationResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [stats, setStats] = useState({ total: 0, matched: 0, pending: 0 });

    const handleSimulateUpload = async () => {
        setIsLoading(true);
        toast.loading('Processando extrato...', { id: 'process' });

        try {
            const processed = await processConciliation(MOCK_OFX_ENTRIES);
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

    const handleConfirm = async (entry: PixEntry, suggestion: any) => {
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
                        <button
                            onClick={handleSimulateUpload}
                            disabled={isLoading}
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            {isLoading ? 'Processando...' : 'Simular Upload (Demo)'}
                        </button>
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
