import React, { useState } from 'react';
import { Asset, PartnerShare } from '../types';

interface Props {
  assets: Asset[];
  onUpdateAssets: (assets: Asset[]) => void;
}

// Partner configuration for consistent colors and IDs
const PARTNERS = [
  { name: 'Raquel', color: 'text-blue-600', bg: 'bg-blue-50' },
  { name: 'Marília', color: 'text-teal-600', bg: 'bg-teal-50' },
  { name: 'Wândrio', color: 'text-orange-600', bg: 'bg-orange-50' },
  { name: 'Tilinha', color: 'text-purple-600', bg: 'bg-purple-50' },
];

const PERCENTAGE_OPTIONS = [0, 25, 50, 100];

export const AssetValueEditor: React.FC<Props> = ({ assets, onUpdateAssets }) => {
  // Changed to array for multi-selection
  const [selectedPartners, setSelectedPartners] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Helper to format/parse currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  };

  const parseCurrencyInput = (val: string) => {
    return parseFloat(val.replace(/\./g, '').replace(',', '.')) || 0;
  };

  // Handlers for value updates
  const handleValueChange = (id: string, field: keyof Asset, value: string) => {
    const numValue = parseCurrencyInput(value);
    const updated = assets.map(a => a.id === id ? { ...a, [field]: numValue } : a);
    onUpdateAssets(updated);
  };

  const handlePartnerPercentageChange = (assetId: string, partnerName: string, newValueStr: string) => {
    const newValue = parseFloat(newValueStr) || 0;
    
    const updated = assets.map(asset => {
      if (asset.id === assetId) {
        // Clone partners
        let newPartners = [...asset.partners];
        const existingPartnerIndex = newPartners.findIndex(p => p.name.includes(partnerName));
        
        if (existingPartnerIndex >= 0) {
            newPartners[existingPartnerIndex] = { ...newPartners[existingPartnerIndex], percentage: newValue };
        } else if (newValue > 0) {
            // Add partner if they don't exist but now have percentage
            const pStyle = PARTNERS.find(p => p.name === partnerName);
            // Default color/initials if not found in config
            newPartners.push({
                name: partnerName,
                percentage: newValue,
                initials: partnerName[0],
                color: 'bg-gray-100 text-gray-700'
            });
        }
        return { ...asset, partners: newPartners };
      }
      return asset;
    });
    onUpdateAssets(updated);
  };

  const togglePartnerFilter = (partnerName: string) => {
      setSelectedPartners(prev => {
          if (prev.includes(partnerName)) {
              return prev.filter(p => p !== partnerName);
          } else {
              return [...prev, partnerName];
          }
      });
  };

  // Filtering
  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) || asset.id.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (selectedPartners.length > 0) {
      // Show asset if ANY of the selected partners has percentage > 0 in it
      const hasPartner = asset.partners.some(p => selectedPartners.includes(p.name) && p.percentage > 0);
      return hasPartner;
    }
    return true;
  });

  // Calculations for Totals
  const totalMarket = assets.reduce((sum, a) => sum + a.marketValue, 0);
  const totalIRPF = filteredAssets.reduce((sum, a) => sum + (a.declaredValue || 0), 0);
  const totalMarketFiltered = filteredAssets.reduce((sum, a) => sum + a.marketValue, 0);
  const totalRental = filteredAssets.reduce((sum, a) => sum + (a.rentalValue || 0), 0);

  // Calculate partner totals (Market Value share)
  const getPartnerTotalShare = (pName: string) => {
      // If filters are active, allow showing totals for selected partners only (or show all if you prefer, but let's dim non-selected)
      if (selectedPartners.length > 0 && !selectedPartners.includes(pName)) return null;

      return filteredAssets.reduce((sum, asset) => {
          const partner = asset.partners.find(p => p.name.includes(pName));
          const pct = partner ? partner.percentage : 0;
          return sum + (asset.marketValue * (pct / 100));
      }, 0);
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto pb-32">
       {/* Header Cards */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
           <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-soft flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">TOTAL GERAL DE MERCADO</p>
                    <h2 className="text-4xl font-black text-gray-900">R$ {new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(totalMarket)}</h2>
                    <div className="flex items-center gap-2 mt-2">
                         <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold border border-green-100 flex items-center gap-1">
                             <span className="material-symbols-outlined text-xs">trending_up</span> +12%
                         </span>
                         <span className="text-[10px] text-gray-400 font-medium">vs. ano anterior</span>
                    </div>
                </div>
                <div className="w-20 h-20 rounded-full border-4 border-gray-50 flex items-center justify-center">
                    <span className="material-symbols-outlined text-4xl text-gray-200">currency_exchange</span>
                </div>
           </div>

           <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-soft flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">TOTAL DE ATIVOS</p>
                    <h2 className="text-4xl font-black text-gray-900">{assets.length} <span className="text-lg text-gray-400 font-bold">Imóveis</span></h2>
                    <div className="w-full bg-gray-100 h-1.5 rounded-full mt-4 max-w-[200px] overflow-hidden">
                        <div className="bg-blue-600 h-full w-[80%] rounded-full"></div>
                    </div>
                </div>
                <div className="w-20 h-20 rounded-full border-4 border-gray-50 flex items-center justify-center">
                    <span className="material-symbols-outlined text-4xl text-gray-200">apartment</span>
                </div>
           </div>
       </div>

       {/* Controls Section */}
       <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-2 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
           {/* Search */}
           <div className="relative flex-1 w-full md:max-w-md ml-2">
               <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">search</span>
               <input 
                  type="text"
                  placeholder="Localizar ativo por nome, ID ou endereço..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white text-sm font-medium outline-none text-gray-700"
               />
               <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2 border-l border-gray-100 pl-2">
                   <select className="text-[10px] font-bold text-gray-500 bg-transparent outline-none cursor-pointer uppercase">
                       <option>Todos Tipos</option>
                   </select>
                   <select className="text-[10px] font-bold text-gray-500 bg-transparent outline-none cursor-pointer uppercase">
                       <option>Status</option>
                   </select>
                   <button className="w-8 h-8 flex items-center justify-center bg-gray-50 rounded-lg hover:bg-gray-100 text-gray-500">
                       <span className="material-symbols-outlined text-sm">filter_list_off</span>
                   </button>
               </div>
           </div>
           
           {/* Actions */}
           <div className="flex items-center gap-3 pr-2 w-full md:w-auto justify-end">
               <button className="px-5 py-2.5 bg-[#101622] text-white rounded-xl text-xs font-bold uppercase flex items-center gap-2 hover:bg-black transition-colors shadow-lg">
                   <span className="material-symbols-outlined text-sm">tune</span> Relatórios & Ajustes
               </button>
               <button className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-bold uppercase flex items-center gap-2 hover:bg-gray-50 transition-colors">
                   <span className="material-symbols-outlined text-sm">folder</span> Documentação
               </button>
           </div>
       </div>

       {/* Partner Filter Section */}
       <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 mb-8">
           <div className="flex items-center justify-between mb-4">
               <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">FILTRAR VISÃO POR SÓCIO (MULTI-SELEÇÃO)</span>
               <button onClick={() => setSelectedPartners([])} className="text-[10px] font-bold text-blue-600 uppercase hover:underline">Limpar Seleção</button>
           </div>
           <div className="flex gap-4 overflow-x-auto pb-2">
               {PARTNERS.map(partner => {
                   const isSelected = selectedPartners.includes(partner.name);
                   return (
                       <button
                           key={partner.name}
                           onClick={() => togglePartnerFilter(partner.name)}
                           className={`flex-1 py-3 px-6 rounded-xl border transition-all flex items-center justify-center gap-2 whitespace-nowrap
                               ${isSelected ? 'border-orange-500 ring-2 ring-orange-500/20 bg-white shadow-sm' : 'border-gray-100 bg-gray-50 hover:bg-white hover:border-gray-300'}
                           `}
                       >
                           <div className={`w-2 h-2 rounded-full ${partner.bg.replace('bg-', 'bg-').replace('50', '500')}`}></div>
                           <span className={`text-xs font-black uppercase ${isSelected ? 'text-gray-900' : 'text-gray-500'}`}>
                               {partner.name}
                               {isSelected && <span className="ml-1 material-symbols-outlined text-[10px] align-middle">check</span>}
                           </span>
                       </button>
                   )
               })}
           </div>
       </div>

       {/* Main Table */}
       <div className="bg-white rounded-[1.5rem] border border-gray-200 shadow-sm overflow-hidden mb-24">
           <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                   <thead>
                       <tr className="bg-gray-50/50 border-b border-gray-100">
                           <th className="py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest min-w-[240px]">IMÓVEL ATIVO</th>
                           <th className="py-4 px-4 text-[10px] font-bold text-blue-600 uppercase tracking-widest text-center min-w-[140px]">VALOR IRPF (R$)</th>
                           <th className="py-4 px-4 text-[10px] font-bold text-blue-600 uppercase tracking-widest text-center min-w-[140px]">MERCADO (R$)</th>
                           <th className="py-4 px-4 text-[10px] font-bold text-blue-600 uppercase tracking-widest text-center min-w-[140px]">ALUGUEL (R$)</th>
                           {PARTNERS.map(p => (
                               <th key={p.name} className={`py-4 px-2 text-[10px] font-bold uppercase tracking-widest text-center min-w-[100px] ${p.color}`}>{p.name} (%)</th>
                           ))}
                       </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50">
                       {filteredAssets.map(asset => (
                           <tr key={asset.id} className="hover:bg-blue-50/20 transition-colors group">
                               {/* Name & Status */}
                               <td className="py-4 px-6">
                                   <div className="flex flex-col">
                                       <span className="text-sm font-bold text-gray-900 italic truncate max-w-[220px]" title={asset.name}>{asset.name}</span>
                                       <div className="flex items-center gap-2 mt-1">
                                           <span className="bg-gray-100 text-gray-500 text-[9px] font-bold px-1.5 py-0.5 rounded">ID #{asset.id}</span>
                                           <div className="flex items-center gap-1">
                                               <span className={`w-1.5 h-1.5 rounded-full ${asset.status === 'Locado' ? 'bg-green-500' : asset.status === 'Vago' ? 'bg-red-500' : 'bg-gray-400'}`}></span>
                                               <span className="text-[9px] font-bold text-green-700 uppercase">{asset.status}</span>
                                           </div>
                                       </div>
                                   </div>
                               </td>

                               {/* Inputs */}
                               <td className="py-3 px-2">
                                   <input 
                                       type="text" 
                                       value={formatCurrency(asset.declaredValue || 0)}
                                       onChange={(e) => handleValueChange(asset.id, 'declaredValue', e.target.value)}
                                       className="w-full bg-gray-50 border border-transparent hover:border-gray-200 focus:border-blue-500 focus:bg-white rounded-lg py-2 px-3 text-center text-sm font-bold text-gray-900 outline-none transition-all"
                                   />
                               </td>
                               <td className="py-3 px-2">
                                   <input 
                                       type="text" 
                                       value={formatCurrency(asset.marketValue)}
                                       onChange={(e) => handleValueChange(asset.id, 'marketValue', e.target.value)}
                                       className="w-full bg-gray-50 border border-transparent hover:border-gray-200 focus:border-blue-500 focus:bg-white rounded-lg py-2 px-3 text-center text-sm font-bold text-gray-900 outline-none transition-all"
                                   />
                               </td>
                               <td className="py-3 px-2">
                                   <input 
                                       type="text" 
                                       value={asset.rentalValue > 0 ? formatCurrency(asset.rentalValue) : '-'}
                                       onChange={(e) => handleValueChange(asset.id, 'rentalValue', e.target.value)}
                                       className={`w-full border border-transparent hover:border-gray-200 focus:border-blue-500 focus:bg-white rounded-lg py-2 px-3 text-center text-sm font-bold outline-none transition-all ${asset.rentalValue > 0 ? 'bg-gray-50 text-gray-900' : 'bg-gray-50 text-gray-400'}`}
                                   />
                               </td>

                               {/* Partner Percentages - Dropdown */}
                               {PARTNERS.map(p => {
                                   const partnerData = asset.partners.find(part => part.name.includes(p.name));
                                   const percentage = partnerData ? partnerData.percentage : 0;
                                   const isHighlight = selectedPartners.includes(p.name);
                                   
                                   return (
                                       <td key={p.name} className={`py-3 px-2 ${isHighlight ? 'bg-orange-50/30' : ''}`}>
                                            <div className="flex justify-center">
                                                <div className={`relative rounded-lg overflow-hidden transition-all
                                                    ${percentage > 0 
                                                        ? (isHighlight ? 'bg-orange-100 text-orange-800 ring-1 ring-orange-300' : 'bg-blue-50 text-blue-700') 
                                                        : 'bg-transparent hover:bg-gray-50 text-gray-300'
                                                    }
                                                `}>
                                                    <select
                                                        value={percentage}
                                                        onChange={(e) => handlePartnerPercentageChange(asset.id, p.name, e.target.value)}
                                                        className="w-full py-2 px-1 text-center text-sm font-bold bg-transparent outline-none cursor-pointer appearance-none min-w-[60px]"
                                                        style={{ textAlignLast: 'center' }}
                                                    >
                                                        {PERCENTAGE_OPTIONS.map(opt => (
                                                            <option key={opt} value={opt} className="text-gray-900 bg-white font-medium">
                                                                {opt}%
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                       </td>
                                   )
                               })}
                           </tr>
                       ))}
                   </tbody>
               </table>
           </div>
       </div>

       {/* Consolidated Footer */}
       <div className="fixed bottom-0 left-64 right-0 bg-[#0b0f17] text-white p-6 z-40 border-t border-gray-800 shadow-2xl animate-fade-in-up">
           <div className="max-w-[1600px] mx-auto flex items-center justify-between overflow-x-auto">
               <div className="min-w-[200px] mr-8">
                   <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic block mb-1">TOTAIS CONSOLIDADOS</span>
                   <span className="text-xs text-gray-500">Soma dos valores visíveis na tabela acima.</span>
               </div>

               <div className="flex flex-1 justify-around gap-8 min-w-max">
                   <div className="text-center bg-gray-800/50 rounded-xl px-4 py-2 border border-gray-700">
                       <span className="block text-[9px] font-bold text-gray-400 uppercase mb-1">TOTAL IRPF</span>
                       <span className="text-sm font-bold text-white">R$ {new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(totalIRPF)}</span>
                   </div>
                   <div className="text-center bg-gray-800/50 rounded-xl px-4 py-2 border border-gray-700">
                       <span className="block text-[9px] font-bold text-gray-400 uppercase mb-1">TOTAL MERCADO</span>
                       <span className="text-sm font-bold text-white">R$ {new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(totalMarketFiltered)}</span>
                   </div>
                   <div className="text-center bg-gray-800/50 rounded-xl px-4 py-2 border border-gray-700">
                       <span className="block text-[9px] font-bold text-gray-400 uppercase mb-1">TOTAL ALUGUEL</span>
                       <span className="text-sm font-bold text-white">R$ {new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(totalRental)}</span>
                   </div>
               </div>
               
               <div className="w-px h-10 bg-gray-700 mx-8"></div>

               <div className="flex gap-6 min-w-max">
                   {PARTNERS.map(p => {
                       const total = getPartnerTotalShare(p.name);
                       // Check if this partner is in the selection (if selection exists)
                       const isSelected = selectedPartners.length === 0 || selectedPartners.includes(p.name);
                       const displayValue = total !== null 
                            ? `R$ ${new Intl.NumberFormat('pt-BR', { notation: 'compact', compactDisplay: 'short' }).format(total)}` 
                            : '-';
                       
                       return (
                           <div key={p.name} className={`text-center min-w-[80px] transition-opacity ${isSelected ? 'opacity-100' : 'opacity-30'}`}>
                               <span className={`block text-[9px] font-bold uppercase mb-1 ${p.color.replace('text-', 'text-')}`}>{p.name}</span>
                               <span className={`text-sm font-bold ${isSelected ? 'text-orange-400' : 'text-gray-500'}`}>{displayValue}</span>
                           </div>
                       )
                   })}
               </div>
           </div>
       </div>
    </div>
  );
};