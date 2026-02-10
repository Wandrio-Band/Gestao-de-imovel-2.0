import React, { useState, useMemo } from 'react';
import { MOCK_ASSETS } from '../constants';
import { Asset } from '../types';

// Interfaces for data structure
interface MonthlyData {
  amount: number;
  highlight?: {
    type: 'CHAVES' | 'SINAL' | 'BALÃO';
    value: string;
  };
  paid?: boolean;
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

export const FinancialSchedule: React.FC = () => {
  const [expandedYears, setExpandedYears] = useState<number[]>([2026, 2025, 2024]);

  const toggleYear = (year: number) => {
    setExpandedYears(prev => 
      prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year]
    );
  };

  const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

  // 1. Filter Assets with Active Debt
  const activeDebtAssets = useMemo(() => {
      return MOCK_ASSETS.filter(asset => 
          asset.financingDetails && 
          (asset.financingDetails.saldoDevedor || 0) > 0
      );
  }, []);

  // 2. Generate Schedule Data based on Assets
  const generateMockSchedule = (year: number): AssetSchedule[] => {
      return activeDebtAssets.map(asset => {
          const financing = asset.financingDetails!;
          const monthlyPayment = financing.phases?.mensais?.unitario || 5000; // Fallback value
          
          // Generate 12 months of data based on the year
          const yearData = Array(12).fill(null).map((_, monthIndex) => {
              const isPast = year < 2025 || (year === 2025 && monthIndex < 2); // Mock "Current Date" is approx March 2025
              
              // Simulate Balloons/Keys based on random logic for prototype visualization
              // In a real app, this would check `financing.cashFlow` dates
              let highlight = undefined;
              let amount = monthlyPayment;

              // Mock logic for specific highlights
              if (asset.id.includes('HORIZON') && year === 2025 && monthIndex === 5) {
                  amount = 50000;
                  highlight = { type: 'BALÃO', value: 'R$ 50k' };
              }
              if (asset.id.includes('SP04') && year === 2026 && monthIndex === 0) {
                  amount = 150000;
                  highlight = { type: 'CHAVES', value: 'R$ 150k' };
              }

              return {
                  amount: amount,
                  paid: isPast,
                  highlight: highlight as any
              };
          });

          return {
              id: asset.id,
              name: asset.name,
              type: asset.type,
              data: yearData
          };
      });
  };

  const scheduleData: YearBlock[] = [
    {
      year: 2026,
      status: 'PLANEJAMENTO',
      theme: 'orange',
      assets: generateMockSchedule(2026)
    },
    {
      year: 2025,
      status: 'VIGENTE',
      theme: 'green',
      assets: generateMockSchedule(2025)
    },
    {
      year: 2024,
      status: 'HISTÓRICO',
      theme: 'purple',
      assets: generateMockSchedule(2024)
    }
  ];

  const formatCompact = (val: number) => {
    return `R$ ${(val / 1000).toFixed(0)}k`;
  };

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

  // Helper to calculate totals for a specific month in a specific year block
  const getMonthlyTotal = (yearBlock: YearBlock, monthIndex: number) => {
    let total = 0;
    yearBlock.assets.forEach(asset => {
      const d = asset.data[monthIndex];
      if (d) {
        total += d.amount;
      }
    });
    return total;
  };

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

      {/* Main Container with Horizontal Scroll */}
      <div className="bg-white rounded-[2.5rem] shadow-soft border border-gray-100 overflow-hidden max-w-[1600px] mx-auto">
         
         <div className="overflow-x-auto pb-4">
             {/* Inner Container to force width */}
             <div className="min-w-[1400px]"> 
                 
                 {/* Global Header Row */}
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

                                    {/* Monthly Totals Header Summary */}
                                    <div className="flex-1 grid grid-cols-12 gap-0 min-w-[900px]">
                                         {months.map((m, idx) => {
                                             const total = getMonthlyTotal(block, idx);
                                             return (
                                                 <div key={`${block.year}-${m}`} className="text-center border-l border-transparent">
                                                     <span className="text-xs font-bold text-gray-900 block">{formatCompact(total)}</span>
                                                 </div>
                                             )
                                         })}
                                    </div>
                                </div>

                                {/* Assets Rows */}
                                {isExpanded && (
                                    <div className="bg-white/50 pb-6 space-y-2">
                                        {block.assets.map((asset, assetIdx) => (
                                            <div key={assetIdx} className="bg-white mx-4 rounded-2xl p-0 flex items-stretch shadow-sm border border-gray-100/50 hover:border-gray-200 transition-colors group overflow-hidden">
                                                
                                                {/* Asset Info Column (Sticky) */}
                                                <div className="w-[300px] flex-shrink-0 pl-8 pr-6 py-4 border-r border-gray-100 bg-white sticky left-0 z-10 flex flex-col justify-center">
                                                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-r-lg ${styles.badge.split(' ')[0]}`}></div>
                                                    <h3 className="text-base font-black text-gray-900 leading-tight truncate">{asset.name}</h3>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mt-1">{asset.type}</p>
                                                </div>

                                                {/* Monthly Data Grid */}
                                                <div className="flex-1 grid grid-cols-12 gap-0 min-w-[900px]">
                                                    {asset.data.map((monthData, mIdx) => (
                                                        <div key={mIdx} className="relative h-20 flex flex-col items-center justify-center border-r border-gray-50 last:border-0 group/cell bg-white hover:bg-gray-50 transition-colors">
                                                            {monthData ? (
                                                                <>
                                                                    <span className={`text-sm font-bold ${monthData.paid ? 'text-gray-400' : 'text-gray-600'}`}>
                                                                        {monthData.amount > 0 ? formatCompact(monthData.amount) : '-'}
                                                                    </span>
                                                                    
                                                                    {/* Paid Check */}
                                                                    {monthData.paid && !monthData.highlight && (
                                                                        <span className="material-symbols-outlined text-[10px] text-green-500 absolute top-2 right-2">check_circle</span>
                                                                    )}

                                                                    {/* Highlight Pill */}
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
                                                    ))}
                                                </div>
                                            </div>
                                        ))}

                                        {/* Footer Total Row for Year */}
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
                                                                {formatCompact(total)}
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
    </div>
  );
};
