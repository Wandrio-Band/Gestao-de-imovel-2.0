import React, { useState } from 'react';
import { Asset, ViewState, CashFlowItem } from '../types';
import { formatMoney } from '@/lib/formatters';
import { addMonths, format } from 'date-fns';
import {
    parseCurrencyValue,
    parseDDMMYYYY,
    getFinancingPhase,
    getCashFlowItemTotal,
    generateBankAmortizationTable,
    BankAmortizationRow,
} from '@/lib/financingHelpers';

interface ConsolidatedStatementProps {
    asset: Asset | null;
    onNavigate: (view: ViewState, asset?: Asset) => void;
}

// --- Phase 1 (Construtora) types ---

interface ConstruturaPaymentRow {
    id: string;
    date: string;
    type: 'SINAL' | 'MENSAL' | 'BALÃO' | 'CONTRATAÇÃO';
    description: string;
    valor: number;
    correcaoINCC: string;
    status: 'Pago' | 'Pendente' | 'Futuro';
    saldoRestante: number;
}

// --- Build Phase 1 rows from cashFlow ---

function buildConstruturaFromCashFlow(cashFlow: CashFlowItem[], subtotal: number): ConstruturaPaymentRow[] {
    const rows: ConstruturaPaymentRow[] = [];

    const sorted = [...cashFlow].sort((a, b) => {
        return parseDDMMYYYY(a.vencimento).getTime() - parseDDMMYYYY(b.vencimento).getTime();
    });

    let balance = subtotal;

    // Initial balance row
    if (sorted.length > 0) {
        rows.push({
            id: 'init',
            date: sorted[0].vencimento,
            type: 'CONTRATAÇÃO',
            description: 'Saldo Inicial Construtora',
            valor: 0,
            correcaoINCC: '-',
            status: 'Pago',
            saldoRestante: balance,
        });
    }

    for (const item of sorted) {
        const totalValue = getCashFlowItemTotal(item);

        // Phase 1: payment reduces balance directly (no interest split)
        balance = Math.max(0, balance - totalValue);

        const isBalloon = item.fase?.toLowerCase().includes('bal') || item.descricao?.toLowerCase().includes('balão');
        const isSignal = item.fase?.toLowerCase().includes('sinal') || item.descricao?.toLowerCase().includes('sinal');

        rows.push({
            id: item.id,
            date: item.vencimento,
            type: isBalloon ? 'BALÃO' : isSignal ? 'SINAL' : 'MENSAL',
            description: item.descricao,
            valor: totalValue,
            correcaoINCC: item.correcao || '-',
            status: item.status,
            saldoRestante: balance,
        });
    }

    return rows;
}

// --- Build Phase 1 rows from phases ---

function buildConstruturaFromPhases(financing: Asset['financingDetails']): ConstruturaPaymentRow[] {
    if (!financing?.phases) return [];

    const rows: ConstruturaPaymentRow[] = [];
    const phases = financing.phases;
    const subtotal = financing.subtotalConstrutora || parseCurrencyValue(financing.valorTotal);
    let balance = subtotal;

    // Determine start date
    let startDate = new Date();
    if (financing.vencimentoConstrutora) {
        const parsed = new Date(financing.vencimentoConstrutora);
        if (!isNaN(parsed.getTime())) startDate = parsed;
    } else if (financing.dataAssinatura) {
        const parsed = new Date(financing.dataAssinatura);
        if (!isNaN(parsed.getTime())) startDate = parsed;
    }

    // Initial balance
    rows.push({
        id: 'init',
        date: format(startDate, 'dd/MM/yyyy'),
        type: 'CONTRATAÇÃO',
        description: 'Saldo Inicial Construtora',
        valor: 0,
        correcaoINCC: '-',
        status: 'Futuro',
        saldoRestante: balance,
    });

    let monthOffset = 0;

    // Sinal
    if (phases.sinal?.qtd > 0 && phases.sinal?.unitario > 0) {
        for (let s = 0; s < phases.sinal.qtd; s++) {
            const date = addMonths(startDate, monthOffset);
            balance = Math.max(0, balance - phases.sinal.unitario);
            rows.push({
                id: `sinal-${s}`,
                date: format(date, 'dd/MM/yyyy'),
                type: 'SINAL',
                description: `Sinal ${s + 1}/${phases.sinal.qtd}`,
                valor: phases.sinal.unitario,
                correcaoINCC: '-',
                status: 'Futuro',
                saldoRestante: balance,
            });
            monthOffset++;
        }
    }

    // Mensais
    if (phases.mensais?.qtd > 0 && phases.mensais?.unitario > 0) {
        for (let m = 0; m < phases.mensais.qtd; m++) {
            const date = addMonths(startDate, monthOffset);
            balance = Math.max(0, balance - phases.mensais.unitario);
            rows.push({
                id: `mensal-${m}`,
                date: format(date, 'dd/MM/yyyy'),
                type: 'MENSAL',
                description: `Parcela Mensal ${m + 1}/${phases.mensais.qtd}`,
                valor: phases.mensais.unitario,
                correcaoINCC: '-',
                status: 'Futuro',
                saldoRestante: balance,
            });
            monthOffset++;
        }
    }

    // Balões
    if (phases.baloes?.qtd > 0 && phases.baloes?.unitario > 0) {
        const sinalCount = phases.sinal?.qtd || 0;
        for (let b = 0; b < phases.baloes.qtd; b++) {
            const balaoMonth = sinalCount + ((b + 1) * 6);
            const date = addMonths(startDate, balaoMonth);
            balance = Math.max(0, balance - phases.baloes.unitario);
            rows.push({
                id: `balao-${b}`,
                date: format(date, 'dd/MM/yyyy'),
                type: 'BALÃO',
                description: `Balão ${b + 1}/${phases.baloes.qtd}`,
                valor: phases.baloes.unitario,
                correcaoINCC: '-',
                status: 'Futuro',
                saldoRestante: balance,
            });
        }
    }

    // Sort chronologically
    rows.sort((a, b) => {
        if (a.id === 'init') return -1;
        if (b.id === 'init') return 1;
        return parseDDMMYYYY(a.date).getTime() - parseDDMMYYYY(b.date).getTime();
    });

    return rows;
}

// --- Status badge ---

function StatusBadge({ status }: { status: 'Pago' | 'Pendente' | 'Futuro' }) {
    const styles = {
        Pago: 'bg-green-100 text-green-700',
        Pendente: 'bg-amber-100 text-amber-700',
        Futuro: 'bg-gray-100 text-gray-500',
    };
    return (
        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${styles[status]}`}>
            {status}
        </span>
    );
}

function TypeBadge({ type }: { type: string }) {
    const styles: Record<string, string> = {
        'CONTRATAÇÃO': 'bg-gray-100 text-gray-600',
        'BALÃO': 'bg-amber-100 text-amber-700',
        'SINAL': 'bg-green-100 text-green-700',
        'MENSAL': 'bg-blue-50 text-blue-600',
    };
    return (
        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${styles[type] || 'bg-gray-100 text-gray-600'}`}>
            {type}
        </span>
    );
}

// --- Main Component ---

export const ConsolidatedStatement: React.FC<ConsolidatedStatementProps> = ({ asset, onNavigate }) => {
    const [activeTab, setActiveTab] = useState<'construtora' | 'bancario'>('construtora');

    if (!asset || !asset.financingDetails) {
        return (
            <div className="p-8 flex flex-col items-center justify-center h-full">
                <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">error</span>
                <h2 className="text-xl font-bold text-gray-900">Informações de financiamento não encontradas</h2>
                <button
                    onClick={() => onNavigate('debt_management')}
                    className="mt-4 px-6 py-2 bg-black text-white rounded-lg font-bold text-sm"
                >
                    Voltar
                </button>
            </div>
        );
    }

    const financing = asset.financingDetails;
    const phase = getFinancingPhase(financing);

    // --- Phase 1 data ---
    const hasCashFlow = financing.cashFlow && financing.cashFlow.length > 0;
    const hasPhases = financing.phases && (
        (financing.phases.sinal?.qtd > 0 && financing.phases.sinal?.unitario > 0) ||
        (financing.phases.mensais?.qtd > 0 && financing.phases.mensais?.unitario > 0)
    );

    const subtotalConstrutora = financing.subtotalConstrutora || parseCurrencyValue(financing.valorTotal);

    let construturaRows: ConstruturaPaymentRow[] = [];
    let construturaDataSource = '';

    if (hasCashFlow) {
        construturaRows = buildConstruturaFromCashFlow(financing.cashFlow!, subtotalConstrutora);
        construturaDataSource = 'Lançamentos registrados';
    } else if (hasPhases) {
        construturaRows = buildConstruturaFromPhases(financing);
        construturaDataSource = 'Projeção baseada nas fases';
    }

    const hasConstrutora = construturaRows.length > 0;

    // Phase 1 KPIs
    const paymentRows = construturaRows.filter(r => r.id !== 'init');
    const totalPago = paymentRows.filter(r => r.status === 'Pago').reduce((s, r) => s + r.valor, 0);
    const totalPendente = paymentRows.filter(r => r.status !== 'Pago').reduce((s, r) => s + r.valor, 0);
    const progressPercent = subtotalConstrutora > 0 ? Math.round((totalPago / subtotalConstrutora) * 100) : 0;

    // --- Phase 2 data ---
    const valorFinanciar = parseCurrencyValue(financing.valorFinanciar);
    const hasBancario = valorFinanciar > 0 && !!financing.sistemaAmortizacao && !!financing.prazoMeses;
    const bankRows: BankAmortizationRow[] = hasBancario ? generateBankAmortizationTable(financing) : [];
    const firstBankPayment = bankRows.length > 0 ? bankRows[0].prestacao : 0;

    // Determine initial tab
    const effectiveTab = (activeTab === 'bancario' && !hasBancario) ? 'construtora' :
        (activeTab === 'construtora' && !hasConstrutora) ? 'bancario' : activeTab;

    // Empty state
    if (!hasConstrutora && !hasBancario) {
        return (
            <div className="p-8 max-w-[1600px] mx-auto pb-24">
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => onNavigate('debt_details', asset)}
                        className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-gray-600 transition-colors shadow-sm"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Painel de Pagamentos</h1>
                        <p className="text-sm text-gray-500 font-medium mt-0.5">{asset.name}</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                    <span className="material-symbols-outlined text-5xl text-gray-300 mb-4">receipt_long</span>
                    <h3 className="text-lg font-bold text-gray-700 mb-2">Nenhum lançamento registrado</h3>
                    <p className="text-sm text-gray-400 max-w-md mx-auto">
                        Adicione lançamentos no fluxo de caixa do financiamento ou configure as fases de pagamento para visualizar o painel.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-[1600px] mx-auto pb-24">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => onNavigate('debt_details', asset)}
                        className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-gray-600 transition-colors shadow-sm"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Painel de Pagamentos</h1>
                        <p className="text-sm text-gray-500 font-medium mt-0.5">{asset.name}</p>
                    </div>
                </div>

                {/* Phase tabs */}
                <div className="flex items-center gap-2">
                    {hasConstrutora && (
                        <button
                            onClick={() => setActiveTab('construtora')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${effectiveTab === 'construtora'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            Fase 1 — Construtora
                        </button>
                    )}
                    {hasBancario && (
                        <button
                            onClick={() => setActiveTab('bancario')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${effectiveTab === 'bancario'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            Fase 2 — Financiamento Bancário
                        </button>
                    )}
                </div>
            </div>

            {/* ===== PHASE 1: CONSTRUTORA ===== */}
            {effectiveTab === 'construtora' && hasConstrutora && (
                <>
                    {/* Construtora KPIs */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">VALOR CONTRATO CONSTRUTORA</p>
                            <p className="text-2xl font-black text-gray-900">{formatMoney(subtotalConstrutora)}</p>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">TOTAL PAGO</p>
                            <p className="text-2xl font-black text-green-600">{formatMoney(totalPago)}</p>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">TOTAL PENDENTE</p>
                            <p className="text-2xl font-black text-amber-600">{formatMoney(totalPendente)}</p>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">PROGRESSO</p>
                            <div className="flex items-end gap-2">
                                <p className="text-2xl font-black text-blue-600">{progressPercent}%</p>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
                                <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
                            </div>
                        </div>
                    </div>

                    {/* Construtora summary bar */}
                    <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 mb-6 flex flex-wrap gap-6 text-xs">
                        <div><span className="text-gray-400 font-bold">Valor Construtora:</span> <span className="font-bold text-gray-800">{formatMoney(subtotalConstrutora)}</span></div>
                        {financing.indexador && <div><span className="text-gray-400 font-bold">Indexador:</span> <span className="font-bold text-gray-800">{financing.indexador}</span></div>}
                        <div><span className="text-gray-400 font-bold">Parcelas:</span> <span className="font-bold text-gray-800">{paymentRows.length}</span></div>
                        {construturaDataSource && (
                            <span className="px-3 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-full border border-amber-200 ml-auto">
                                {construturaDataSource}
                            </span>
                        )}
                    </div>

                    {/* Construtora Table */}
                    <div className="bg-white rounded-[1.5rem] border border-gray-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50/80 border-b border-gray-200 sticky top-0 z-10 backdrop-blur-sm">
                                    <tr>
                                        <th className="py-4 px-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Data</th>
                                        <th className="py-4 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Descrição</th>
                                        <th className="py-4 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Tipo</th>
                                        <th className="py-4 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Valor</th>
                                        <th className="py-4 px-4 text-[10px] font-bold text-purple-600 uppercase tracking-widest text-right">Correção INCC</th>
                                        <th className="py-4 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Status</th>
                                        <th className="py-4 px-6 text-[10px] font-bold text-gray-900 uppercase tracking-widest text-right">Saldo Restante</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {construturaRows.map((row) => (
                                        <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="py-4 px-6 text-xs font-bold text-gray-900 whitespace-nowrap">{row.date}</td>
                                            <td className="py-4 px-4 text-xs font-medium text-gray-700">{row.description}</td>
                                            <td className="py-4 px-4 text-center"><TypeBadge type={row.type} /></td>
                                            <td className="py-4 px-4 text-right text-xs font-bold text-gray-900">
                                                {row.valor > 0 ? formatMoney(row.valor) : '-'}
                                            </td>
                                            <td className="py-4 px-4 text-right text-xs font-medium text-purple-600">
                                                {row.correcaoINCC !== '-' ? row.correcaoINCC : '-'}
                                            </td>
                                            <td className="py-4 px-4 text-center"><StatusBadge status={row.status} /></td>
                                            <td className="py-4 px-6 text-right text-xs font-black text-gray-900 bg-gray-50/50">
                                                {formatMoney(row.saldoRestante)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* ===== PHASE 2: BANCO ===== */}
            {effectiveTab === 'bancario' && hasBancario && (
                <>
                    {/* Bank KPIs */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">VALOR FINANCIAMENTO</p>
                            <p className="text-2xl font-black text-gray-900">{formatMoney(valorFinanciar)}</p>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">PRESTAÇÃO MENSAL (1ª)</p>
                            <p className="text-2xl font-black text-blue-600">{formatMoney(firstBankPayment)}</p>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">JUROS ANUAIS</p>
                            <p className="text-2xl font-black text-orange-600">{financing.jurosAnuais || '0'}% a.a.</p>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">PRAZO</p>
                            <p className="text-2xl font-black text-gray-900">{financing.prazoMeses} meses</p>
                        </div>
                    </div>

                    {/* Bank summary bar */}
                    <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 mb-6 flex flex-wrap gap-6 text-xs">
                        <div><span className="text-gray-400 font-bold">Valor Financiamento:</span> <span className="font-bold text-gray-800">{formatMoney(valorFinanciar)}</span></div>
                        <div><span className="text-gray-400 font-bold">Sistema:</span> <span className="font-bold text-gray-800">{financing.sistemaAmortizacao}</span></div>
                        <div><span className="text-gray-400 font-bold">Juros:</span> <span className="font-bold text-gray-800">{financing.jurosAnuais}% a.a.</span></div>
                        <div><span className="text-gray-400 font-bold">Prazo:</span> <span className="font-bold text-gray-800">{financing.prazoMeses} meses</span></div>
                        {financing.indexador && <div><span className="text-gray-400 font-bold">Indexador:</span> <span className="font-bold text-gray-800">{financing.indexador}</span></div>}
                        <span className="px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-full border border-blue-200 ml-auto">
                            Projeção Tabela {financing.sistemaAmortizacao}
                        </span>
                    </div>

                    {/* Bank Amortization Table */}
                    <div className="bg-white rounded-[1.5rem] border border-gray-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50/80 border-b border-gray-200 sticky top-0 z-10 backdrop-blur-sm">
                                    <tr>
                                        <th className="py-4 px-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Parcela</th>
                                        <th className="py-4 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Data</th>
                                        <th className="py-4 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Prestação</th>
                                        <th className="py-4 px-4 text-[10px] font-bold text-blue-600 uppercase tracking-widest text-right">Amortização</th>
                                        <th className="py-4 px-4 text-[10px] font-bold text-orange-600 uppercase tracking-widest text-right">Juros</th>
                                        <th className="py-4 px-6 text-[10px] font-bold text-gray-900 uppercase tracking-widest text-right">Saldo Devedor</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {bankRows.map((row) => (
                                        <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="py-3 px-6 text-xs font-bold text-gray-500">{row.parcela}</td>
                                            <td className="py-3 px-4 text-xs font-bold text-gray-900 whitespace-nowrap">{row.date}</td>
                                            <td className="py-3 px-4 text-right text-xs font-bold text-gray-900">{formatMoney(row.prestacao)}</td>
                                            <td className="py-3 px-4 text-right text-xs font-bold text-blue-600 bg-blue-50/30">{formatMoney(row.amortizacao)}</td>
                                            <td className="py-3 px-4 text-right text-xs font-medium text-orange-600">{formatMoney(row.juros)}</td>
                                            <td className="py-3 px-6 text-right text-xs font-black text-gray-900 bg-gray-50/50">{formatMoney(row.saldoDevedor)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            <div className="mt-6 text-center text-xs text-gray-400 font-medium">
                <p>Os valores apresentados são calculados com base nos dados registrados no sistema.</p>
                {effectiveTab === 'bancario' && <p>A tabela de financiamento bancário é uma projeção e não considera correção monetária futura.</p>}
            </div>
        </div>
    );
};
