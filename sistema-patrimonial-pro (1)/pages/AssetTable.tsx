import React, { useState, useRef, useCallback } from 'react';
import { ViewState, Asset, PartnerShare } from '../types';
import { AssetRegistration } from './Forms/AssetRegistration';

interface AssetTableProps {
  assets: Asset[];
  onUpdateAssets: (assets: Asset[]) => void;
  onNavigate: (view: ViewState, asset?: Asset) => void;
  viewMode?: ViewState;
}

const getPartnerStyle = (name: string) => {
  switch (name) {
    case 'Wândrio': return { initials: 'W', color: 'bg-orange-100 text-orange-700' };
    case 'Raquel': return { initials: 'R', color: 'bg-purple-100 text-purple-700' };
    case 'Marília': return { initials: 'M', color: 'bg-pink-100 text-pink-700' };
    case 'Tilinha': return { initials: 'T', color: 'bg-blue-100 text-blue-700' };
    default: return { initials: name.charAt(0), color: 'bg-gray-100 text-gray-700' };
  }
};

export const AssetTable: React.FC<AssetTableProps> = ({ assets, onUpdateAssets, onNavigate, viewMode = 'assets_list' }) => {
  const [isQuickEditMode, setIsQuickEditMode] = useState(false);
  const [selectedAssetForModal, setSelectedAssetForModal] = useState<Asset | null>(null);

  // Column Resizing State
  const [colWidths, setColWidths] = useState({
    index: 60,
    name: 280,
    type: 140,
    location: 180,
    status: 120,
    partners: 220,
    marketValue: 160,
    rentalValue: 140,
    actions: 100
  });

  const resizingRef = useRef<{ col: keyof typeof colWidths | null, startX: number, startWidth: number }>({ col: null, startX: 0, startWidth: 0 });

  // Helper to format currency
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  // Helper to handle general field changes
  const handleInputChange = (id: string, field: keyof Asset, value: any) => {
    const updated = assets.map(asset => {
      if (asset.id === id) {
        return { ...asset, [field]: value };
      }
      return asset;
    });
    onUpdateAssets(updated);
  };

  const handleRowClick = (asset: Asset) => {
    if (!isQuickEditMode) {
        setSelectedAssetForModal(asset);
    }
  };

  const handleModalSave = (updatedAsset: Asset) => {
      const updated = assets.map(a => a.id === updatedAsset.id ? updatedAsset : a);
      if(!assets.find(a => a.id === updatedAsset.id)) {
          updated.push(updatedAsset);
      }
      onUpdateAssets(updated);
  }

  // --- Resizing Logic ---
  const startResize = (e: React.MouseEvent, col: keyof typeof colWidths) => {
    e.preventDefault();
    e.stopPropagation();
    resizingRef.current = {
      col,
      startX: e.clientX,
      startWidth: colWidths[col]
    };
    document.body.style.cursor = 'col-resize';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!resizingRef.current.col) return;
    
    const { col, startX, startWidth } = resizingRef.current;
    const diff = e.clientX - startX;
    const newWidth = Math.max(50, startWidth + diff);

    setColWidths(prev => ({
      ...prev,
      [col]: newWidth
    }));
  }, []);

  const handleMouseUp = useCallback(() => {
    resizingRef.current.col = null;
    document.body.style.cursor = 'default';
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);


  const Resizer = ({ col }: { col: keyof typeof colWidths }) => (
    <div
        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-400 z-20 group"
        onMouseDown={(e) => startResize(e, col)}
    >
        <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-transparent group-hover:bg-blue-400 h-full"></div>
    </div>
  );

  return (
    <>
    <div className="p-6 max-w-[1600px] mx-auto flex flex-col h-full space-y-6">
      
      {/* Search and Top Actions */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
                <div className="relative flex-1 max-w-md">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                    <input 
                        type="text" 
                        placeholder="Localizar Ativo..." 
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                </div>
                <select className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 outline-none cursor-pointer hover:bg-gray-50">
                    <option>Todos os Tipos</option>
                </select>
                <select className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 outline-none cursor-pointer hover:bg-gray-50">
                    <option>Todos os Status</option>
                </select>
            </div>
            
            <div className="flex items-center gap-3">
                {/* View Toggle */}
                <div className="bg-gray-100 p-1 rounded-lg flex items-center border border-gray-200">
                    <button
                        onClick={() => onNavigate('assets_list')}
                        className={`p-2 rounded-md flex items-center justify-center transition-all ${viewMode === 'assets_list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        title="Visualização em Lista"
                    >
                        <span className="material-symbols-outlined text-[20px]">table_rows</span>
                    </button>
                    <button
                        onClick={() => onNavigate('assets_grid')}
                        className={`p-2 rounded-md flex items-center justify-center transition-all ${viewMode === 'assets_grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        title="Visualização em Grade"
                    >
                        <span className="material-symbols-outlined text-[20px]">grid_view</span>
                    </button>
                </div>

                <div className="h-6 w-px bg-gray-200 mx-2"></div>
                <button 
                    onClick={() => onNavigate('asset_new')}
                    className="px-6 py-2.5 bg-[#3b82f6] text-white rounded-lg text-sm font-bold hover:bg-blue-600 shadow-sm flex items-center gap-2 transition-colors"
                >
                    <span className="material-symbols-outlined text-lg">add</span> Novo Ativo
                </button>
            </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-gray-200 pb-1 overflow-x-auto">
            <button onClick={() => onNavigate('dashboard')} className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wide hover:text-gray-900">Dashboard</button>
            <button className="px-6 py-2 bg-[#111827] text-white rounded-lg text-xs font-bold uppercase tracking-wide shadow-sm">Imóveis</button>
            <button onClick={() => onNavigate('import_irpf')} className="px-4 py-2 text-xs font-bold text-purple-600 uppercase tracking-wide hover:bg-purple-50 rounded-lg flex items-center gap-1 transition-colors">
                <span className="material-symbols-outlined text-sm">upload_file</span> Importar IRPF
            </button>
            <button onClick={() => onNavigate('audit')} className="px-4 py-2 text-xs font-bold text-green-600 uppercase tracking-wide hover:bg-green-50 rounded-lg flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">pie_chart</span> Participações
            </button>
            <button onClick={() => onNavigate('financial_overview')} className="px-4 py-2 text-xs font-bold text-orange-600 uppercase tracking-wide hover:bg-orange-50 rounded-lg flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">account_balance</span> Financiamentos
            </button>
            <button onClick={() => onNavigate('report_executive')} className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wide hover:text-gray-900">Relatórios</button>
            <button className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wide hover:text-gray-900">Documentação</button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-3 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Aquisição</p>
              <p className="text-2xl font-black text-gray-900">R$ 104.578.465,22</p>
          </div>
          <div className="md:col-span-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Mercado</p>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-bold">+39%</span>
              </div>
              <p className="text-2xl font-black text-gray-900">R$ 145.750.000,00</p>
          </div>
          <div className="md:col-span-3 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Ativos Cadastrados</p>
              <div className="flex items-baseline gap-2">
                 <p className="text-2xl font-black text-[#3b82f6]">{assets.length}</p>
                 <span className="text-sm font-medium text-gray-500">Imóveis</span>
              </div>
          </div>
          <div className="md:col-span-2 flex flex-col justify-center gap-2">
              <div className="bg-white px-4 py-3 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center cursor-pointer hover:bg-gray-50">
                  <span className="text-xs font-medium text-gray-600">Colunas: <span className="font-bold text-gray-900">Visíveis (8)</span></span>
              </div>
               {viewMode === 'assets_list' && (
               <div 
                  onClick={() => setIsQuickEditMode(!isQuickEditMode)}
                  className={`bg-white px-4 py-3 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center cursor-pointer transition-colors ${isQuickEditMode ? 'ring-2 ring-primary border-primary' : 'hover:bg-gray-50'}`}
               >
                  <span className="text-xs font-medium text-gray-600">Edição Rápida</span>
                  <div className={`w-8 h-4 rounded-full relative transition-colors ${isQuickEditMode ? 'bg-primary' : 'bg-gray-200'}`}>
                      <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${isQuickEditMode ? 'right-0.5' : 'left-0.5'}`}></div>
                  </div>
              </div>
              )}
          </div>
      </div>

      {viewMode === 'assets_list' ? (
      /* --- Table View --- */
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm flex-1 flex flex-col overflow-hidden animate-fade-in-up">
          {/* Section Header */}
          <div className="px-6 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-green-500 text-lg">check_circle</span>
                  <span className="text-xs font-bold text-green-700 uppercase tracking-widest">Ativos Declarados (IRPF)</span>
              </div>
              <span className="bg-[#3b82f6] text-white text-xs font-bold px-2 py-0.5 rounded">{assets.length}</span>
          </div>

          <div className="flex-1 overflow-auto">
              <table className="min-w-full text-left border-collapse table-fixed">
                  <thead className="bg-gray-100 border-b border-gray-200 sticky top-0 z-10">
                      <tr>
                          <th style={{ width: colWidths.index }} className="relative py-4 px-2 text-[10px] font-black text-gray-600 uppercase tracking-widest text-center select-none">
                              # <Resizer col="index" />
                          </th>
                          <th style={{ width: colWidths.name }} className="relative py-4 px-6 text-[10px] font-black text-gray-600 uppercase tracking-widest select-none">
                              Imóvel <Resizer col="name" />
                          </th>
                          <th style={{ width: colWidths.type }} className="relative py-4 px-6 text-[10px] font-black text-gray-600 uppercase tracking-widest select-none">
                              Tipo <Resizer col="type" />
                          </th>
                          <th style={{ width: colWidths.location }} className="relative py-4 px-6 text-[10px] font-black text-gray-600 uppercase tracking-widest select-none">
                              Município/UF <Resizer col="location" />
                          </th>
                          <th style={{ width: colWidths.status }} className="relative py-4 px-6 text-[10px] font-black text-gray-600 uppercase tracking-widest text-center select-none">
                              Status <Resizer col="status" />
                          </th>
                          <th style={{ width: colWidths.partners }} className="relative py-4 px-6 text-[10px] font-black text-gray-600 uppercase tracking-widest select-none">
                              Proprietários <Resizer col="partners" />
                          </th>
                          <th style={{ width: colWidths.marketValue }} className="relative py-4 px-6 text-[10px] font-black text-gray-600 uppercase tracking-widest text-right select-none">
                              Valor Mercado <Resizer col="marketValue" />
                          </th>
                          <th style={{ width: colWidths.rentalValue }} className="relative py-4 px-6 text-[10px] font-black text-gray-600 uppercase tracking-widest text-right select-none">
                              Locação <Resizer col="rentalValue" />
                          </th>
                          <th style={{ width: colWidths.actions }} className="relative py-4 px-6 text-[10px] font-black text-gray-600 uppercase tracking-widest text-center select-none">
                              Ações <Resizer col="actions" />
                          </th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                      {assets.map((asset, index) => (
                          <tr 
                            key={asset.id} 
                            className={`
                                ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} 
                                hover:bg-blue-50 transition-colors group 
                                ${!isQuickEditMode ? 'cursor-pointer' : ''}
                            `}
                            onClick={() => handleRowClick(asset)}
                          >
                             <td className="py-4 px-2 text-center text-xs text-gray-400 font-medium overflow-hidden text-ellipsis whitespace-nowrap">{index + 1}</td>
                              
                              <td className="py-4 px-6 align-top">
                                  <div className="flex flex-col gap-1 overflow-hidden">
                                      <span className="text-sm font-bold text-gray-900 truncate" title={asset.name}>{asset.name}</span>
                                      <div className="flex items-center gap-1">
                                        <span className="text-[10px] text-gray-400 font-medium bg-gray-100 px-1.5 py-0.5 rounded w-fit whitespace-nowrap">ID: {asset.id}</span>
                                      </div>
                                  </div>
                              </td>

                              <td className="py-4 px-6 align-top">
                                  {isQuickEditMode ? (
                                      <select 
                                        value={asset.type} 
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => handleInputChange(asset.id, 'type', e.target.value)}
                                        className="text-xs font-bold text-gray-600 uppercase border border-gray-300 rounded px-2 py-1 w-full"
                                      >
                                          <option value="Residencial">Residencial</option>
                                          <option value="Comercial">Comercial</option>
                                          <option value="Terreno">Terreno</option>
                                          <option value="Industrial">Industrial</option>
                                      </select>
                                  ) : (
                                      <span className="text-xs font-bold text-gray-600 uppercase truncate block">{asset.type}</span>
                                  )}
                              </td>

                              <td className="py-4 px-6 align-top">
                                  <div className="flex flex-col overflow-hidden">
                                      <span className="text-xs font-medium text-gray-900 truncate">Belo Horizonte</span>
                                      <span className="text-[10px] text-gray-400 truncate">Minas Gerais/MG</span>
                                  </div>
                              </td>

                              <td className="py-4 px-6 text-center align-top">
                                  {isQuickEditMode ? (
                                      <select 
                                        value={asset.status} 
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => handleInputChange(asset.id, 'status', e.target.value)}
                                        className="text-[10px] font-bold uppercase border border-gray-300 rounded px-2 py-1 w-full"
                                      >
                                          <option value="Locado">Locado</option>
                                          <option value="Vago">Vago</option>
                                          <option value="Em Reforma">Em Reforma</option>
                                          <option value="Uso Próprio">Uso Próprio</option>
                                      </select>
                                  ) : (
                                      <span className={`inline-block px-3 py-1 rounded-md text-[10px] font-bold uppercase truncate max-w-full ${
                                          asset.status === 'Locado' ? 'bg-blue-100 text-blue-700' : 
                                          asset.status === 'Vago' ? 'bg-yellow-100 text-yellow-700' :
                                          'bg-gray-100 text-gray-600'
                                      }`}>
                                          {asset.status === 'Locado' ? 'ALUGADO' : asset.status.toUpperCase()}
                                      </span>
                                  )}
                              </td>

                              <td className="py-4 px-6 align-top">
                                  {isQuickEditMode ? (
                                      <div className="flex flex-col gap-2 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                                          {asset.partners.map((p, i) => (
                                              <div key={i} className="flex items-center gap-1 bg-gray-50 p-1.5 rounded-lg border border-gray-200">
                                                  <span className="text-[10px] font-bold">{p.name}</span>
                                                  <span className="text-[10px] text-gray-500 ml-auto">{p.percentage}%</span>
                                              </div>
                                          ))}
                                      </div>
                                  ) : (
                                      <div className="flex flex-col gap-2 overflow-hidden">
                                          {asset.partners.map((p, i) => (
                                              <div key={i} className="flex items-center gap-2 overflow-hidden">
                                                  <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold uppercase ${p.color}`}>
                                                      {p.initials}
                                                  </div>
                                                  <div className="flex flex-col truncate">
                                                      <span className="text-[10px] font-bold text-gray-500 truncate" title={`${p.percentage}% ${p.name}`}>{p.percentage}% {p.name}</span>
                                                  </div>
                                              </div>
                                          ))}
                                      </div>
                                  )}
                              </td>

                              <td className="py-4 px-6 text-right align-top">
                                  <span className="text-sm font-bold text-gray-900 truncate block">{formatCurrency(asset.marketValue)}</span>
                              </td>

                              <td className="py-4 px-6 text-right align-top">
                                  {asset.rentalValue > 0 ? (
                                      <span className="text-sm font-bold text-green-600 bg-green-50 px-2 py-1 rounded truncate block">{formatCurrency(asset.rentalValue)}</span>
                                  ) : (
                                      <span className="text-gray-300">-</span>
                                  )}
                              </td>

                              <td className="py-4 px-6 text-center align-top">
                                  <div className="flex items-center justify-center gap-2">
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); setSelectedAssetForModal(asset); }}
                                        className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                                      >
                                          <span className="material-symbols-outlined text-sm">edit</span>
                                      </button>
                                  </div>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>
      ) : (
      /* --- Grid View (Cards) --- */
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20 animate-fade-in-up">
          {assets.map(asset => (
              <div 
                  key={asset.id}
                  onClick={() => handleRowClick(asset)}
                  className="bg-white rounded-[2rem] border border-gray-100 shadow-soft group hover:shadow-md hover:border-blue-200 transition-all cursor-pointer overflow-hidden flex flex-col"
              >
                  <div className="h-48 w-full relative bg-gray-200">
                      {asset.image ? (
                          <img src={asset.image} alt={asset.name} className="w-full h-full object-cover" />
                      ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <span className="material-symbols-outlined text-4xl">image</span>
                          </div>
                      )}
                      <div className="absolute top-4 right-4 flex gap-2">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase backdrop-blur-md shadow-sm ${
                              asset.status === 'Locado' ? 'bg-green-500/90 text-white' : 
                              asset.status === 'Vago' ? 'bg-red-500/90 text-white' : 'bg-gray-800/90 text-white'
                          }`}>
                              {asset.status}
                          </span>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-12">
                           <h3 className="text-white font-bold text-lg truncate shadow-black drop-shadow-sm">{asset.name}</h3>
                           <p className="text-white/80 text-xs flex items-center gap-1"><span className="material-symbols-outlined text-[10px]">location_on</span> {asset.city}</p>
                      </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                              <p className="text-[9px] font-bold text-gray-400 uppercase">Valor Mercado</p>
                              <p className="text-sm font-black text-gray-900">{formatCurrency(asset.marketValue)}</p>
                          </div>
                          <div>
                              <p className="text-[9px] font-bold text-gray-400 uppercase">Área Total</p>
                              <p className="text-sm font-bold text-gray-900">{asset.areaTotal || 0} m²</p>
                          </div>
                      </div>
                      
                      <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center">
                          <div className="flex -space-x-2">
                              {asset.partners.slice(0,3).map((p, i) => (
                                  <div key={i} className={`w-6 h-6 rounded-full border border-white flex items-center justify-center text-[8px] font-bold text-white ${p.color ? p.color.replace('text-', 'bg-').replace('100', '500').split(' ')[0] : 'bg-gray-500'}`}>
                                      {p.initials}
                                  </div>
                              ))}
                              {asset.partners.length > 3 && (
                                  <div className="w-6 h-6 rounded-full border border-white bg-gray-200 flex items-center justify-center text-[8px] font-bold text-gray-600">+{asset.partners.length - 3}</div>
                              )}
                          </div>
                          <button className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                              Ver Detalhes <span className="material-symbols-outlined text-xs">arrow_forward</span>
                          </button>
                      </div>
                  </div>
              </div>
          ))}
      </div>
      )}
    </div>
    
    {/* Edit/View Asset Modal */}
    {selectedAssetForModal && (
        <AssetRegistration 
            onNavigate={onNavigate} 
            asset={selectedAssetForModal}
            isModal={true}
            onClose={() => setSelectedAssetForModal(null)}
            onUpdateAsset={(updated) => handleModalSave(updated)}
        />
    )}
    </>
  );
};