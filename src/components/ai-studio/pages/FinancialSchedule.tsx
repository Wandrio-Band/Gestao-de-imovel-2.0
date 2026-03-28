import React, { useState, useMemo, useEffect } from 'react';
import { useAssetContext } from '@/context/AssetContext';
import { Asset, CashFlowItem } from '../types';
import { addMonths } from 'date-fns';
import { formatMoney } from '@/lib/formatters';
import { generateBankAmortizationTable, getFinancingPhase, parseCurrencyValue as parseCurrencyHelper } from '@/lib/financingHelpers';

interface MonthlyData {
  amount: number;
  highlight?: {
    type: 'CHAVES' | 'SINAL' | 'BALÃO';
    value: string;
  };
  paid?: boolean;
  status?: 'Pago' | 'Pendente' | 'Futuro';
  phase?: 'construtora' | 'bancario';
}

interface AssetSchedule {
  id: string;
  name: string;
  type: string;
  data: (MonthlyData | null)[];
}

interface YearBlock {
  year: number;
  status: 'PLANEJAMENTO' | 'VIGENTE' | 'HISTÓRICO';
  theme: 'orange' | 'green' | 'purple';
  assets: AssetSchedule[];
}

function parseDDMMYYYY(dateStr: string): Date | null {
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const [d, m, y] = parts.map(Number);
    if (d && m && y) return new Date(y, m - 1, d);
  }
  return null;
}

function parseCurrencyValue(val: string | number | undefined): number {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  const clean = val.replace(/[R$\s.]/g, '').replace(',', '.');
  return parseFloat(clean) || 0;
}

export const FinancialSchedule: React.FC = () => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const [expandedYears, setExpandedYears] = useState<number[]>([]);
  const { assets } = useAssetContext();

  const toggleYear = (year: number) => {
    setExpandedYears(prev =>
      prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year]
    );
  };

  const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

  const activeDebtAssets = useMemo(() => {
    return assets.filter(asset => {
      if (!asset.financingDetails) return false;
      const fin = asset.financingDetails;
      const hasSaldoDevedor = (fin.saldoDevedor || 0) > 0;
      const hasValorFinanciar = parseCurrencyHelper(fin.valorFinanciar) > 0;
      const hasCashFlow = (fin.cashFlow?.length || 0) > 0;
      const hasPhases = !!(fin.phases?.sinal?.qtd || fin.phases?.mensais?.qtd || fin.phases?.baloes?.qtd);
      return hasSaldoDevedor || hasValorFinanciar || hasCashFlow || hasPhases;
    });
  }, [assets]);

  const formatCompact = (val: number) => {
    if (val >= 1000000) return `R$ ${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `R$ ${(val / 1000).toFixed(0)}k`;
    return `R$ ${val}`;
  };

  // Build schedule from real financing data
  const generateSchedule = (year: number): AssetSchedule[] => {
    const results: AssetSchedule[] = [];

    for (const asset of activeDebtAssets) {
      const financing = asset.financingDetails!;
      const phase = getFinancingPhase(financing);
      const monthlyPayment = financing.phases?.mensais?.unitario || 0;
      const cashFlow = financing.cashFlow || [];

      // === PHASE 1: Construtora ===
      if (phase === 'construtora' || phase === 'both') {
        const monthMap = new Map<number, { amount: number; highlight?: MonthlyData['highlight']; status?: 'Pago' | 'Pendente' | 'Futuro' }>();

        for (const item of cashFlow) {
          const date = parseDDMMYYYY(item.vencimento);
          if (!date || date.getFullYear() !== year) continue;

          const monthIdx = date.getMonth();
          const totalValue = Object.values(item.valoresPorSocio).reduce((a, b) => a + b, 0);

          const existing = monthMap.get(monthIdx);
          const currentAmount = (existing?.amount || 0) + totalValue;

          let highlight = existing?.highlight;
          const faseLower = (item.fase || '').toLowerCase();
          const descLower = (item.descricao || '').toLowerCase();

          if (faseLower.includes('bal') || descLower.includes('balão')) {
            highlight = { type: 'BALÃO', value: formatCompact(totalValue) };
          } else if (faseLower.includes('sinal') || descLower.includes('sinal')) {
            highlight = { type: 'SINAL', value: formatCompact(totalValue) };
          } else if (faseLower.includes('chave') || descLower.includes('chave')) {
            highlight = { type: 'CHAVES', value: formatCompact(totalValue) };
          }

          let status = existing?.status;
          if (item.status === 'Pago') status = 'Pago';
          else if (!status) status = item.status;

          monthMap.set(monthIdx, { amount: currentAmount, highlight, status });
        }

        if (cashFlow.length === 0 && financing.phases) {
          let startDate = new Date();
          if (financing.vencimentoConstrutora) {
            const parsed = new Date(financing.vencimentoConstrutora);
            if (!isNaN(parsed.getTime())) startDate = parsed;
          } else if (financing.vencimentoPrimeira) {
            const parsed = new Date(financing.vencimentoPrimeira);
            if (!isNaN(parsed.getTime())) startDate = parsed;
          }

          let monthOffset = 0;

          if (financing.phases.sinal?.qtd > 0 && financing.phases.sinal?.unitario > 0) {
            for (let s = 0; s < financing.phases.sinal.qtd; s++) {
              const date = addMonths(startDate, monthOffset);
              if (date.getFullYear() === year) {
                const mi = date.getMonth();
                const existing = monthMap.get(mi);
                monthMap.set(mi, {
                  amount: (existing?.amount || 0) + financing.phases.sinal.unitario,
                  highlight: { type: 'SINAL', value: formatCompact(financing.phases.sinal.unitario) }
                });
              }
              monthOffset++;
            }
          }

          if (financing.phases.mensais?.qtd > 0 && financing.phases.mensais?.unitario > 0) {
            for (let m = 0; m < financing.phases.mensais.qtd; m++) {
              const date = addMonths(startDate, monthOffset);
              if (date.getFullYear() === year) {
                const mi = date.getMonth();
                const existing = monthMap.get(mi);
                monthMap.set(mi, {
                  amount: (existing?.amount || 0) + financing.phases.mensais.unitario,
                  highlight: existing?.highlight,
                });
              }
              monthOffset++;
            }
          }

          if (financing.phases.baloes?.qtd > 0 && financing.phases.baloes?.unitario > 0) {
            const sinalCount = financing.phases.sinal?.qtd || 0;
            for (let b = 0; b < financing.phases.baloes.qtd; b++) {
              const balaoMonth = sinalCount + ((b + 1) * 6);
              const date = addMonths(startDate, balaoMonth);
              if (date.getFullYear() === year) {
                const mi = date.getMonth();
                const existing = monthMap.get(mi);
                monthMap.set(mi, {
                  amount: (existing?.amount || 0) + financing.phases.baloes.unitario,
                  highlight: { type: 'BALÃO', value: formatCompact(financing.phases.baloes.unitario) }
                });
              }
            }
          }
        }

        const hasCashFlowData = cashFlow.length > 0;
        const yearData: (MonthlyData | null)[] = Array(12).fill(null).map((_, monthIndex) => {
          const isPast = year < currentYear || (year === currentYear && monthIndex < currentMonth);
          const entry = monthMap.get(monthIndex);

          if (entry) {
            const realStatus = entry.status || (isPast ? 'Pago' : 'Futuro');
            return {
              amount: entry.amount,
              paid: realStatus === 'Pago',
              status: realStatus,
              highlight: entry.highlight,
              phase: 'construtora' as const,
            };
          }

          if (monthlyPayment > 0) {
            let startDate = new Date();
            if (financing.vencimentoConstrutora) {
              const parsed = new Date(financing.vencimentoConstrutora);
              if (!isNaN(parsed.getTime())) startDate = parsed;
            }
            const monthDate = new Date(year, monthIndex, 1);
            const endDate = financing.prazoMeses
              ? addMonths(startDate, parseInt(financing.prazoMeses) || 0)
              : addMonths(startDate, 360);

            if (monthDate >= startDate && monthDate <= endDate) {
              return {
                amount: monthlyPayment,
                paid: hasCashFlowData ? false : isPast,
                status: (hasCashFlowData ? 'Futuro' : (isPast ? 'Pago' : 'Futuro')) as 'Pago' | 'Pendente' | 'Futuro',
                phase: 'construtora' as const,
              };
            }
          }

          return null;
        });

        // Only add if there's data for this year
        if (yearData.some(d => d !== null)) {
          results.push({
            id: asset.id,
            name: phase === 'both' ? `${asset.name} — Construtora` : asset.name,
            type: phase === 'both' ? `${asset.type} · Fase 1` : asset.type,
            data: yearData
          });
        }
      }

      // === PHASE 2: Financiamento Bancário ===
      if (phase === 'bancario' || phase === 'both') {
        const bankRows = generateBankAmortizationTable(financing);

        if (bankRows.length > 0) {
          const bankMonthMap = new Map<number, number>();

          for (const row of bankRows) {
            const dateParts = row.date.split('/');
            if (dateParts.length === 3) {
              const [, m, y] = dateParts.map(Number);
              if (y === year) {
                const monthIdx = m - 1;
                bankMonthMap.set(monthIdx, (bankMonthMap.get(monthIdx) || 0) + row.prestacao);
              }
            }
          }

          const bankYearData: (MonthlyData | null)[] = Array(12).fill(null).map((_, monthIndex) => {
            const amount = bankMonthMap.get(monthIndex);
            if (amount && amount > 0) {
              return {
                amount,
                paid: false,
                status: 'Futuro' as const,
                phase: 'bancario' as const,
              };
            }
            return null;
          });

          if (bankYearData.some(d => d !== null)) {
            const sistema = (financing.sistemaAmortizacao || 'SAC').toUpperCase();
            results.push({
              id: `${asset.id}-bank`,
              name: phase === 'both' ? `${asset.name} — Bancário` : asset.name,
              type: `${asset.type} · ${sistema}`,
              data: bankYearData
            });
          }
        }
      }
    }

    return results;
  };

  const yearStatus = (year: number): { status: YearBlock['status']; theme: YearBlock['theme'] } => {
    if (year > currentYear) return { status: 'PLANEJAMENTO', theme: 'orange' };
    if (year === currentYear) return { status: 'VIGENTE', theme: 'green' };
    return { status: 'HISTÓRICO', theme: 'purple' };
  };

  // Calculate year range — extend to cover bank financing projections
  const yearRange = useMemo(() => {
    let maxYear = currentYear + 1;
    for (const asset of activeDebtAssets) {
      const financing = asset.financingDetails!;
      const prazo = parseInt(financing.prazoMeses || '0') || 0;
      if (prazo > 0 && financing.vencimentoPrimeira) {
        const start = new Date(financing.vencimentoPrimeira);
        if (!isNaN(start.getTime())) {
          const endYear = start.getFullYear() + Math.ceil(prazo / 12);
          if (endYear > maxYear) maxYear = Math.min(endYear, currentYear + 30); // cap at 30 years
        }
      }
    }
    const years: number[] = [];
    for (let y = maxYear; y >= currentYear - 1; y--) {
      years.push(y);
    }
    return years;
  }, [activeDebtAssets, currentYear]);

  const scheduleData: YearBlock[] = yearRange.map(year => ({
    year,
    ...yearStatus(year),
    assets: generateSchedule(year),
  })).filter(block => block.assets.length > 0);

  // Auto-expand all years with data on first render
  useEffect(() => {
    if (expandedYears.length === 0 && scheduleData.length > 0) {
      setExpandedYears(scheduleData.map(b => b.year));
    }
  }, [scheduleData.length]);

  const getThemeClasses = (theme: 'orange' | 'green' | 'purple') => {
    switch (theme) {
      case 'orange': return {
        bg: 'bg-orange-50',
        text: 'text-orange-700',
        pill: 'bg-orange-100',
        total: 'text-orange-600',
        badge: 'bg-orange-500 text-white'
      };
      case 'green': return {
        bg: 'bg-green-50',
        text: 'text-green-700',
        pill: 'bg-green-100',
        total: 'text-green-600',
        badge: 'bg-green-500 text-white'
      };
      case 'purple': return {
        bg: 'bg-purple-50',
        text: 'text-purple-700',
        pill: 'bg-purple-100',
        total: 'text-purple-600',
        badge: 'bg-purple-500 text-white'
      };
    }
  };

  const getMonthlyTotal = (yearBlock: YearBlock, monthIndex: number) => {
    let total = 0;
    yearBlock.assets.forEach(asset => {
      const d = asset.data[monthIndex];
      if (d) total += d.amount;
    });
    return total;
  };

  if (activeDebtAssets.length === 0) {
    return (
      <div className="p-8 max-w-[1600px] mx-auto pb-24 animate-fade-in-up">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Cronograma Financeiro</h1>
          <p className="text-gray-500 mt-2 text-lg">Visão detalhada de aportes para ativos com saldo devedor.</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <span className="material-symbols-outlined text-5xl text-gray-300 mb-4">calendar_month</span>
          <h3 className="text-lg font-bold text-gray-700 mb-2">Nenhum ativo com financiamento ativo</h3>
          <p className="text-sm text-gray-400">Cadastre detalhes de financiamento em um ativo para visualizar o cronograma.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[100vw] overflow-hidden pb-24 animate-fade-in-up">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-end max-w-[1600px] mx-auto">
        <div>
          <div className="flex items-center gap-2 mb-2 text-[10px] font-bold text-blue-600 uppercase tracking-widest">
            <span>AUDITORIA TÉCNICA</span>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span>CONTROLE CONSOLIDADO DE FLUXO</span>
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Cronograma Financeiro</h1>
          <p className="text-gray-500 mt-2 text-lg">Visão detalhada de aportes para ativos com saldo devedor.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-6 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 flex items-center gap-2 shadow-sm transition-all">
            <span className="material-symbols-outlined">download</span> Auditoria PDF
          </button>
          <button className="px-6 py-3 bg-[#101622] text-white rounded-xl text-sm font-bold hover:bg-black flex items-center gap-2 shadow-lg transition-all">
            <span className="material-symbols-outlined">table_chart</span> Relatório Consolidado
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-[2.5rem] shadow-soft border border-gray-100 overflow-hidden max-w-[1600px] mx-auto">
        <div className="overflow-x-auto pb-4">
          <div className="min-w-[1400px]">

            {/* Header Row */}
            <div className="flex px-8 py-6 border-b border-gray-100 text-[10px] font-black text-blue-600 uppercase tracking-widest bg-white sticky top-0 z-20">
              <div className="w-[300px] flex-shrink-0 sticky left-0 bg-white z-30 pl-4 border-r border-gray-50">ATIVO SELECIONADO</div>
              <div className="flex-1 grid grid-cols-12 gap-0 min-w-[900px]">
                {months.map(m => (
                  <div key={m} className="text-center">{m}</div>
                ))}
              </div>
            </div>

            {/* Year Blocks */}
            <div className="divide-y divide-gray-50">
              {scheduleData.map(block => {
                const styles = getThemeClasses(block.theme);
                const isExpanded = expandedYears.includes(block.year);

                return (
                  <div key={block.year} className={`${styles.bg} transition-colors`}>
                    {/* Year Header */}
                    <div
                      className="px-8 py-6 flex items-center justify-between cursor-pointer"
                      onClick={() => toggleYear(block.year)}
                    >
                      <div className="flex items-center gap-6 w-[300px] flex-shrink-0 sticky left-0 z-10 pl-4">
                        <div className={`w-10 h-10 rounded-full bg-white/50 flex items-center justify-center transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                          <span className="material-symbols-outlined text-gray-600">expand_less</span>
                        </div>
                        <h2 className="text-4xl font-black text-gray-900 tracking-tighter">{block.year}</h2>
                        <span className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wide ${styles.pill} ${styles.text}`}>
                          {block.status}
                        </span>
                      </div>

                      <div className="flex-1 grid grid-cols-12 gap-0 min-w-[900px]">
                        {months.map((m, idx) => {
                          const total = getMonthlyTotal(block, idx);
                          return (
                            <div key={`${block.year}-${m}`} className="text-center border-l border-transparent">
                              <span className="text-xs font-bold text-gray-900 block">{total > 0 ? formatCompact(total) : '-'}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Assets Rows */}
                    {isExpanded && (
                      <div className="bg-white/50 pb-6 space-y-2">
                        {block.assets.map((asset, assetIdx) => {
                          const isBankRow = asset.id.endsWith('-bank');
                          return (
                          <div key={assetIdx} className={`mx-4 rounded-2xl p-0 flex items-stretch shadow-sm border transition-colors group overflow-hidden ${isBankRow ? 'bg-blue-50/30 border-blue-100 hover:border-blue-200' : 'bg-white border-gray-100/50 hover:border-gray-200'}`}>
                            <div className={`w-[300px] flex-shrink-0 pl-8 pr-6 py-4 border-r sticky left-0 z-10 flex flex-col justify-center ${isBankRow ? 'border-blue-100 bg-blue-50/30' : 'border-gray-100 bg-white'}`}>
                              <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-r-lg ${isBankRow ? 'bg-blue-500' : styles.badge.split(' ')[0]}`}></div>
                              <h3 className={`text-base font-black leading-tight truncate ${isBankRow ? 'text-blue-900' : 'text-gray-900'}`}>{asset.name}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                <p className={`text-[10px] font-bold uppercase tracking-wide ${isBankRow ? 'text-blue-400' : 'text-gray-400'}`}>{asset.type}</p>
                                {isBankRow && (
                                  <span className="px-1.5 py-0.5 bg-blue-100 text-blue-600 text-[8px] font-black rounded uppercase tracking-wider">Financiamento</span>
                                )}
                              </div>
                            </div>

                            <div className="flex-1 grid grid-cols-12 gap-0 min-w-[900px]">
                              {asset.data.map((monthData, mIdx) => {
                                const isBancario = monthData?.phase === 'bancario';
                                return (
                                  <div key={mIdx} className={`relative h-20 flex flex-col items-center justify-center border-r border-gray-50 last:border-0 group/cell transition-colors ${isBancario ? 'bg-blue-50/40 hover:bg-blue-50' : 'bg-white hover:bg-gray-50'}`}>
                                    {monthData ? (
                                      <>
                                        <span className={`text-sm font-bold ${
                                          isBancario
                                            ? 'text-blue-700'
                                            : monthData.paid
                                              ? 'text-gray-400'
                                              : monthData.status === 'Pendente'
                                                ? 'text-amber-600'
                                                : 'text-gray-600'
                                        }`}>
                                          {monthData.amount > 0 ? formatCompact(monthData.amount) : '-'}
                                        </span>

                                        {isBancario && (
                                          <span className="text-[8px] font-bold text-blue-400 uppercase tracking-wider mt-0.5">Banco</span>
                                        )}

                                        {monthData.paid && !monthData.highlight && !isBancario && (
                                          <span className="material-symbols-outlined text-[10px] text-green-500 absolute top-2 right-2">check_circle</span>
                                        )}
                                        {monthData.status === 'Pendente' && !monthData.highlight && (
                                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 absolute top-2 right-2" />
                                        )}

                                        {monthData.highlight && (
                                          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 shadow-xl px-3 py-2 rounded-lg flex flex-col items-center min-w-[90px] border ring-1 ring-white/20
                                            ${monthData.highlight.type === 'CHAVES' ? 'bg-orange-500 text-white border-orange-400' :
                                            monthData.highlight.type === 'SINAL' ? 'bg-green-500 text-white border-green-400' : 'bg-[#101622] text-white border-gray-700'}
                                          `}>
                                            <span className="text-xs font-black">{monthData.highlight.value}</span>
                                            <div className="flex items-center gap-1 mt-0.5">
                                              <span className="material-symbols-outlined text-[10px]">
                                                {monthData.highlight.type === 'CHAVES' ? 'key' : 'payments'}
                                              </span>
                                              <span className="text-[8px] font-bold uppercase tracking-wider">{monthData.highlight.type}</span>
                                            </div>
                                          </div>
                                        )}
                                      </>
                                    ) : (
                                      <span className="text-gray-200">-</span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          );
                        })}

                        <div className="mt-4 px-8 py-4 flex items-center">
                          <div className="w-[300px] flex-shrink-0 pl-4 sticky left-0 bg-transparent z-10">
                            <span className={`text-xs font-black uppercase tracking-widest ${styles.total}`}>TOTAL MENSAL {block.year}</span>
                          </div>
                          <div className="flex-1 grid grid-cols-12 gap-0 min-w-[900px]">
                            {months.map((_, idx) => {
                              const total = getMonthlyTotal(block, idx);
                              const isPeak = total > 50000;
                              return (
                                <div key={idx} className="text-center">
                                  <span className={`text-sm font-black ${isPeak ? styles.total : 'text-gray-900'}`}>
                                    {total > 0 ? formatCompact(total) : '-'}
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 max-w-[1600px] mx-auto flex flex-wrap gap-6 px-4 text-xs font-semibold text-gray-500">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-gray-200 border border-gray-300" />
          <span>Construtora (Fase 1)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-blue-200 border border-blue-300" />
          <span>Financiamento Bancário (Fase 2)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-green-500 text-sm">check_circle</span>
          <span>Pago</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span>Pendente</span>
        </div>
      </div>
    </div>
  );
};
