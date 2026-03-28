import React, { useMemo } from 'react';
import { Asset, ViewState } from '../types';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { formatMoney } from '@/lib/formatters';
import {
    parseCurrencyValue,
    getFinancingPhase,
    getCashFlowItemTotal,
    generateBankAmortizationTable,
} from '@/lib/financingHelpers';

interface ReportFinancialExecutiveProps {
    asset: Asset | null;
    onNavigate: (view: ViewState) => void;
}

export const ReportFinancialExecutive: React.FC<ReportFinancialExecutiveProps> = ({ asset, onNavigate }) => {
    if (!asset) return null;

    const financing = asset.financingDetails;
    const hasFinancing = !!financing;

    // Detect phase
    const phase = financing ? getFinancingPhase(financing) : 'construtora';
    const isConstrutora = phase === 'construtora' || phase === 'both';
    const isBancario = phase === 'bancario' || phase === 'both';

    // Basic KPIs
    const saldoDevedor = financing?.saldoDevedor || 0;
    const valorQuitado = financing?.valorQuitado || 0;
    const valorTotal = parseCurrencyValue(financing?.valorTotal);
    const subtotalConstrutora = financing?.subtotalConstrutora || valorTotal;
    const valorFinanciar = parseCurrencyValue(financing?.valorFinanciar);
    const prazoMeses = parseInt(financing?.prazoMeses || '0') || 0;
    const jurosAnuais = parseFloat(financing?.jurosAnuais || '0');
    const percentQuitado = subtotalConstrutora > 0 ? Math.round((valorQuitado / subtotalConstrutora) * 100) : 0;

    // Partners
    const partners = asset.partners || [];
    const totalContributed = valorQuitado;

    // Phase 1 data
    const phases = financing?.phases;
    const sinalTotal = (phases?.sinal?.qtd || 0) * (phases?.sinal?.unitario || 0);
    const mensaisTotal = (phases?.mensais?.qtd || 0) * (phases?.mensais?.unitario || 0);
    const baloesTotal = (phases?.baloes?.qtd || 0) * (phases?.baloes?.unitario || 0);

    // Payment status breakdown (Phase 1)
    const statusBreakdown = useMemo(() => {
        const cashFlow = financing?.cashFlow || [];
        if (cashFlow.length === 0) return null;

        let pago = 0, pendente = 0, futuro = 0;
        for (const item of cashFlow) {
            const total = getCashFlowItemTotal(item);
            if (item.status === 'Pago') pago += total;
            else if (item.status === 'Pendente') pendente += total;
            else futuro += total;
        }
        const sum = pago + pendente + futuro;
        return {
            pago, pendente, futuro,
            pagoPct: sum > 0 ? Math.round((pago / sum) * 100) : 0,
            pendentePct: sum > 0 ? Math.round((pendente / sum) * 100) : 0,
            futuroPct: sum > 0 ? Math.round((futuro / sum) * 100) : 0,
        };
    }, [financing]);

    // Evolution chart — phase-aware
    const curveData = useMemo(() => {
        if (!hasFinancing) return [];

        if (isBancario && valorFinanciar > 0 && prazoMeses > 0) {
            // Phase 2: real amortization curve using valorFinanciar
            const monthlyRate = jurosAnuais > 0 ? Math.pow(1 + jurosAnuais / 100, 1 / 12) - 1 : 0;
            const totalMonths = Math.min(prazoMeses, 360);
            const years = Math.ceil(totalMonths / 12);
            const sistema = (financing?.sistemaAmortizacao || 'SAC').toUpperCase();

            let balance = valorFinanciar;
            // PRICE or SAC monthly payment
            let monthlyPayment: number;
            if (sistema === 'PRICE' && monthlyRate > 0) {
                monthlyPayment = valorFinanciar * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
                    (Math.pow(1 + monthlyRate, totalMonths) - 1);
            } else {
                monthlyPayment = valorFinanciar / totalMonths;
            }

            const data = [];
            const startYear = new Date().getFullYear();

            for (let y = 0; y <= years && balance > 0; y++) {
                const interest = balance * monthlyRate * 12;
                data.push({
                    year: (startYear + y).toString(),
                    principal: Math.max(0, balance / 1000000),
                    interest: Math.max(0, interest / 1000000),
                });

                for (let m = 0; m < 12 && balance > 0; m++) {
                    const monthInterest = balance * monthlyRate;
                    const amort = sistema === 'SAC'
                        ? valorFinanciar / totalMonths
                        : Math.max(0, monthlyPayment - monthInterest);
                    balance = Math.max(0, balance - amort);
                }
            }
            return data;
        }

        if (isConstrutora && subtotalConstrutora > 0) {
            // Phase 1: simple staircase (no interest)
            const totalParcelas = (phases?.sinal?.qtd || 0) + (phases?.mensais?.qtd || 0) + (phases?.baloes?.qtd || 0);
            if (totalParcelas <= 0) return [];

            const years = Math.ceil(totalParcelas / 12);
            let balance = subtotalConstrutora;
            const data = [];
            const startYear = new Date().getFullYear();

            let parcelaIndex = 0;
            for (let y = 0; y <= years && balance > 0; y++) {
                data.push({
                    year: (startYear + y).toString(),
                    principal: Math.max(0, balance / 1000000),
                    interest: 0,
                });

                // Reduce by 12 months of payments
                for (let m = 0; m < 12 && parcelaIndex < totalParcelas; m++) {
                    // Determine which phase this payment belongs to
                    const sinalQtd = phases?.sinal?.qtd || 0;
                    const mensaisQtd = phases?.mensais?.qtd || 0;
                    let paymentValue = 0;
                    if (parcelaIndex < sinalQtd) {
                        paymentValue = phases?.sinal?.unitario || 0;
                    } else if (parcelaIndex < sinalQtd + mensaisQtd) {
                        paymentValue = phases?.mensais?.unitario || 0;
                    } else {
                        paymentValue = phases?.baloes?.unitario || 0;
                    }
                    balance = Math.max(0, balance - paymentValue);
                    parcelaIndex++;
                }
            }
            return data;
        }

        return [];
    }, [hasFinancing, isConstrutora, isBancario, subtotalConstrutora, valorFinanciar, prazoMeses, jurosAnuais, phases, financing]);

    return (
        <div className="bg-[#f6f6f8] min-h-screen p-8 animate-fade-in-up pb-24">

            {/* Header Navigation */}
            <div className="max-w-[1200px] mx-auto mb-6 flex items-center gap-2 text-sm text-gray-500">
                <button onClick={() => onNavigate('report_executive')} className="hover:text-black flex items-center gap-1 transition-colors">
                    <span className="material-symbols-outlined text-sm">arrow_back</span> Gestão de Financiamentos
                </button>
                <span>/</span>
                <span className="font-bold text-gray-900">{asset.name}</span>
            </div>

            <div className="max-w-[1200px] mx-auto bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-200">

                {/* Title & Phase Indicator */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Relatório Executivo</h1>
                        <p className="text-blue-600 font-medium text-sm mt-1">Análise consolidada - {asset.name}</p>
                    </div>
                    <div className="flex gap-3">
                        <button className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors">
                            <span className="material-symbols-outlined text-lg">picture_as_pdf</span> Exportar PDF
                        </button>
                        <button
                            onClick={() => onNavigate('debt_management')}
                            className="px-5 py-2.5 bg-[#1152d4] text-white rounded-lg text-xs font-bold hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-100 transition-colors"
                        >
                            <span className="material-symbols-outlined text-lg">arrow_back</span> Voltar à Gestão
                        </button>
                    </div>
                </div>

                {/* Phase Indicator */}
                <div className="mb-8 flex flex-wrap gap-3">
                    {isConstrutora && (
                        <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-600" />
                            <span className="text-xs font-bold text-blue-800">
                                Fase 1: Construtora {financing?.indexador ? `(${financing.indexador})` : ''}
                            </span>
                            {financing?.vencimentoConstrutora && (
                                <span className="text-[10px] text-blue-600 ml-1">Entrega: {financing.vencimentoConstrutora}</span>
                            )}
                        </div>
                    )}
                    {isBancario && (
                        <div className="px-4 py-2 bg-orange-50 border border-orange-200 rounded-lg flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-orange-600" />
                            <span className="text-xs font-bold text-orange-800">
                                Fase 2: Bancário ({financing?.sistemaAmortizacao || 'SAC'}) — {jurosAnuais}% a.a.
                            </span>
                        </div>
                    )}
                </div>

                {/* KPI Cards Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10 border border-gray-100 rounded-2xl p-6 bg-white shadow-soft">
                    <div className="border-r border-gray-100 pr-6 last:border-0 last:pr-0">
                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2">
                            {isConstrutora ? 'SALDO RESTANTE CONSTRUTORA' : 'SALDO DEVEDOR BANCÁRIO'}
                        </p>
                        <p className="text-2xl font-black text-gray-900">{formatMoney(saldoDevedor)}</p>
                    </div>
                    <div className="border-r border-gray-100 px-6 last:border-0 last:pr-0">
                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2">TOTAL JÁ QUITADO</p>
                        <p className="text-xl font-black text-gray-900 mb-1">{formatMoney(valorQuitado)}</p>
                        {percentQuitado > 0 && <p className="text-[10px] font-medium text-gray-400">{percentQuitado}% do total</p>}
                    </div>
                    <div className="border-r border-gray-100 px-6 last:border-0 last:pr-0">
                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2">
                            {isConstrutora ? 'VALOR CONTRATO CONSTRUTORA' : 'VALOR TOTAL ORIGINAL'}
                        </p>
                        <p className="text-xl font-black text-gray-900 mb-1">{formatMoney(isConstrutora ? subtotalConstrutora : valorTotal)}</p>
                    </div>
                    <div className="pl-6">
                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2">
                            {isBancario ? 'PRAZO FINANCIAMENTO' : 'PARCELAS RESTANTES'}
                        </p>
                        {isBancario && prazoMeses > 0 ? (
                            <>
                                <p className="text-xl font-black text-gray-900 mb-1">{prazoMeses} Meses</p>
                                <p className="text-[10px] font-medium text-gray-400">~{Math.round(prazoMeses / 12)} Anos</p>
                            </>
                        ) : (
                            <p className="text-xl font-black text-gray-900">
                                {statusBreakdown
                                    ? `${statusBreakdown.pendentePct + statusBreakdown.futuroPct}% pendente`
                                    : 'N/A'
                                }
                            </p>
                        )}
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column (Chart) */}
                    <div className="lg:col-span-2 bg-white border border-gray-200 rounded-[1.5rem] p-8 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-900">Evolução do Saldo Devedor</h3>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-[#1152d4]"></span>
                                    <span className="text-xs font-medium text-gray-500">Saldo (M)</span>
                                </div>
                                {isBancario && (
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                                        <span className="text-xs font-medium text-gray-500">Juros (M)</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="h-72 w-full">
                            {curveData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={curveData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorPrincipal" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#1152d4" stopOpacity={0.1}/>
                                                <stop offset="95%" stopColor="#1152d4" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                            formatter={(value: number) => formatMoney(value * 1000000)}
                                        />
                                        {isBancario && (
                                            <Area type="monotone" dataKey="interest" stackId="1" stroke="#fb923c" fill="transparent" strokeWidth={3} strokeDasharray="5 5" />
                                        )}
                                        <Area type={isConstrutora && !isBancario ? "stepAfter" : "monotone"} dataKey="principal" stackId="2" stroke="#1152d4" fill="url(#colorPrincipal)" strokeWidth={4} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                                    Dados insuficientes para gerar gráfico de projeção
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column (Phases) */}
                    <div className="lg:col-span-1 bg-white border border-gray-200 rounded-[1.5rem] p-6 shadow-sm flex flex-col">
                        <h3 className="text-lg font-bold text-gray-900 mb-6">Resumo por Fases</h3>

                        {phases ? (
                            <div className="flex-1">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-gray-100">
                                            <th className="pb-3 text-[10px] font-bold text-blue-600 uppercase">FASE</th>
                                            <th className="pb-3 text-[10px] font-bold text-blue-600 uppercase text-right">QTD</th>
                                            <th className="pb-3 text-[10px] font-bold text-blue-600 uppercase text-right">TOTAL</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {phases.sinal?.qtd > 0 && (
                                            <tr>
                                                <td className="py-4">
                                                    <p className="text-sm font-bold text-gray-900">Sinal</p>
                                                    <p className="text-[10px] text-gray-400">{formatMoney(phases.sinal.unitario)} / parcela</p>
                                                </td>
                                                <td className="py-4 text-right text-sm font-medium text-gray-600">{phases.sinal.qtd}x</td>
                                                <td className="py-4 text-right text-sm font-bold text-gray-900">{formatMoney(sinalTotal)}</td>
                                            </tr>
                                        )}
                                        {phases.mensais?.qtd > 0 && (
                                            <tr>
                                                <td className="py-4">
                                                    <p className="text-sm font-bold text-gray-900">Mensais</p>
                                                    <p className="text-[10px] text-gray-400">{formatMoney(phases.mensais.unitario)} / parcela</p>
                                                </td>
                                                <td className="py-4 text-right text-sm font-medium text-gray-600">{phases.mensais.qtd}x</td>
                                                <td className="py-4 text-right text-sm font-bold text-gray-900">{formatMoney(mensaisTotal)}</td>
                                            </tr>
                                        )}
                                        {phases.baloes?.qtd > 0 && (
                                            <tr>
                                                <td className="py-4">
                                                    <p className="text-sm font-bold text-gray-900">Balões</p>
                                                    <p className="text-[10px] text-gray-400">{formatMoney(phases.baloes.unitario)} / parcela</p>
                                                </td>
                                                <td className="py-4 text-right text-sm font-medium text-gray-600">{phases.baloes.qtd}x</td>
                                                <td className="py-4 text-right text-sm font-bold text-gray-900">{formatMoney(baloesTotal)}</td>
                                            </tr>
                                        )}
                                        <tr className="bg-gray-50">
                                            <td className="py-4 pl-2 font-bold text-xs text-gray-700">TOTAL CONSTRUTORA</td>
                                            <td className="py-4 text-right font-medium text-xs text-gray-500"></td>
                                            <td className="py-4 pr-2 text-right font-black text-xs text-gray-900">{formatMoney(sinalTotal + mensaisTotal + baloesTotal)}</td>
                                        </tr>
                                    </tbody>
                                </table>

                                {/* Bank financing summary if exists */}
                                {isBancario && (
                                    <div className="mt-4 bg-orange-50 border border-orange-100 rounded-xl p-4">
                                        <p className="text-[10px] font-bold text-orange-800 uppercase mb-2">Financiamento Bancário</p>
                                        <div className="space-y-1 text-xs text-orange-700">
                                            <div className="flex justify-between"><span>Valor:</span><span className="font-bold">{formatMoney(valorFinanciar)}</span></div>
                                            <div className="flex justify-between"><span>Prazo:</span><span className="font-bold">{prazoMeses} meses</span></div>
                                            <div className="flex justify-between"><span>Juros:</span><span className="font-bold">{jurosAnuais}% a.a.</span></div>
                                            <div className="flex justify-between"><span>Sistema:</span><span className="font-bold">{financing?.sistemaAmortizacao}</span></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : isBancario ? (
                            <div className="flex-1">
                                <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
                                    <p className="text-[10px] font-bold text-orange-800 uppercase mb-2">Financiamento Bancário</p>
                                    <div className="space-y-1 text-xs text-orange-700">
                                        <div className="flex justify-between"><span>Valor:</span><span className="font-bold">{formatMoney(valorFinanciar)}</span></div>
                                        <div className="flex justify-between"><span>Prazo:</span><span className="font-bold">{prazoMeses} meses</span></div>
                                        <div className="flex justify-between"><span>Juros:</span><span className="font-bold">{jurosAnuais}% a.a.</span></div>
                                        <div className="flex justify-between"><span>Sistema:</span><span className="font-bold">{financing?.sistemaAmortizacao}</span></div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                                Nenhuma fase configurada
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom Row */}
                <div className={`grid grid-cols-1 ${partners.length > 0 ? 'md:grid-cols-2' : 'md:grid-cols-1'} gap-8 mt-8`}>

                    {/* Payment Progress (Phase 1) or Composition (Phase 2) */}
                    <div className="bg-white border border-gray-200 rounded-[1.5rem] p-6 shadow-sm">
                        {isConstrutora && statusBreakdown ? (
                            <>
                                <h3 className="text-sm font-bold text-gray-900 mb-6">Progresso dos Pagamentos (Construtora)</h3>

                                {/* Progress bar */}
                                <div className="w-full h-6 rounded-full bg-gray-100 overflow-hidden flex mb-4">
                                    {statusBreakdown.pagoPct > 0 && (
                                        <div className="bg-green-500 h-full transition-all" style={{ width: `${statusBreakdown.pagoPct}%` }} />
                                    )}
                                    {statusBreakdown.pendentePct > 0 && (
                                        <div className="bg-amber-400 h-full transition-all" style={{ width: `${statusBreakdown.pendentePct}%` }} />
                                    )}
                                    {statusBreakdown.futuroPct > 0 && (
                                        <div className="bg-gray-300 h-full transition-all" style={{ width: `${statusBreakdown.futuroPct}%` }} />
                                    )}
                                </div>

                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-green-500" />
                                            <span className="text-xs text-gray-600">Pago</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-sm font-bold text-gray-900">{formatMoney(statusBreakdown.pago)}</span>
                                            <span className="text-xs text-gray-400 ml-2">{statusBreakdown.pagoPct}%</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-amber-400" />
                                            <span className="text-xs text-gray-600">Pendente</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-sm font-bold text-gray-900">{formatMoney(statusBreakdown.pendente)}</span>
                                            <span className="text-xs text-gray-400 ml-2">{statusBreakdown.pendentePct}%</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-gray-300" />
                                            <span className="text-xs text-gray-600">Futuro</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-sm font-bold text-gray-900">{formatMoney(statusBreakdown.futuro)}</span>
                                            <span className="text-xs text-gray-400 ml-2">{statusBreakdown.futuroPct}%</span>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : isConstrutora ? (
                            <>
                                <h3 className="text-sm font-bold text-gray-900 mb-6">Progresso dos Pagamentos (Construtora)</h3>
                                <div className="w-full h-6 rounded-full bg-gray-100 overflow-hidden flex mb-4">
                                    <div className="bg-blue-500 h-full transition-all" style={{ width: `${percentQuitado}%` }} />
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">Quitado: {formatMoney(valorQuitado)}</span>
                                    <span className="font-bold text-blue-600">{percentQuitado}%</span>
                                </div>
                            </>
                        ) : (
                            <>
                                <h3 className="text-sm font-bold text-gray-900 mb-6">Projeção Financiamento Bancário</h3>
                                {(() => {
                                    const bankRows = generateBankAmortizationTable(financing!);
                                    const totalJuros = bankRows.reduce((s, r) => s + r.juros, 0);
                                    const totalAmort = bankRows.reduce((s, r) => s + r.amortizacao, 0);
                                    const totalPago = totalJuros + totalAmort;
                                    const jurosPct = totalPago > 0 ? Math.round((totalJuros / totalPago) * 100) : 0;
                                    return (
                                        <div className="space-y-3">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-gray-500">Total a pagar:</span>
                                                <span className="font-bold text-gray-900">{formatMoney(totalPago)}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-blue-600">Amortização:</span>
                                                <span className="font-bold text-blue-600">{formatMoney(totalAmort)} ({100 - jurosPct}%)</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-orange-600">Juros:</span>
                                                <span className="font-bold text-orange-600">{formatMoney(totalJuros)} ({jurosPct}%)</span>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </>
                        )}
                    </div>

                    {/* Partner Division */}
                    {partners.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-[1.5rem] p-6 shadow-sm flex flex-col">
                            <h3 className="text-lg font-bold text-gray-900 mb-6">Divisão de Custos</h3>

                            <div className="flex-1 space-y-4">
                                <div className="flex justify-between text-[9px] font-bold text-blue-600 uppercase tracking-widest border-b border-gray-100 pb-2">
                                    <span>SÓCIO</span>
                                    <span>%</span>
                                    <span>CONTRIBUÍDO</span>
                                </div>
                                {partners.map((partner, idx) => (
                                    <div key={idx} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: partner.color + '20', color: partner.color }}>
                                                {partner.initials}
                                            </div>
                                            <span className="text-sm font-bold text-gray-900">{partner.name}</span>
                                        </div>
                                        <span className="text-xs font-medium text-gray-500">{partner.percentage}%</span>
                                        <span className="text-sm font-bold text-gray-900">
                                            {formatMoney(totalContributed * (partner.percentage / 100))}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                                <span className="text-[10px] font-bold text-gray-500 uppercase">TOTAL APORTADO</span>
                                <span className="text-lg font-black text-[#1152d4]">{formatMoney(totalContributed)}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
