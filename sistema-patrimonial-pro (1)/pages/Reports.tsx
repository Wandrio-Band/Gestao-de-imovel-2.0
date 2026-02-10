import React, { useState } from 'react';
import { Asset, ViewState } from '../types';
import { MOCK_ASSETS } from '../constants';

interface ReportsProps {
    onNavigate?: (view: ViewState, asset?: Asset) => void;
}

export const Reports: React.FC<ReportsProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'dossier' | 'financial'>('dossier');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const handleCardClick = (asset: Asset) => {
      if (onNavigate) {
          if (activeTab === 'dossier') {
            onNavigate('report_individual', asset);
          } else {
            onNavigate('report_financial', asset);
          }
      }
  };

  // Filter assets that actually have financing for the financial tab
  const displayAssets = activeTab === 'financial' 
    ? MOCK_ASSETS.filter(a => a.financingDetails) 
    : MOCK_ASSETS;

  return (
    <div className="p-8 max-w-[1600px] mx-auto pb-24 animate-fade-in-up">
       <div className="mb-8 flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Central de Relatórios</h1>
            <p className="text-gray-500 mt-1">Exportação de dados consolidados, dossiês e análises financeiras.</p>
        </div>
        
        <div className="flex items-center gap-4">
            {/* View Toggle */}
            <div className="bg-gray-100 p-1 rounded-lg flex items-center border border-gray-200">
                <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md flex items-center justify-center transition-all gap-2 px-3 ${viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    title="Visualização em Lista"
                >
                    <span className="material-symbols-outlined text-[20px]">table_rows</span>
                    <span className="text-xs font-bold hidden sm:inline">Lista</span>
                </button>
                <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md flex items-center justify-center transition-all gap-2 px-3 ${viewMode === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    title="Visualização em Grade"
                >
                    <span className="material-symbols-outlined text-[20px]">grid_view</span>
                    <span className="text-xs font-bold hidden sm:inline">Cards</span>
                </button>
            </div>

            <button className="px-6 py-2.5 bg-black text-white rounded-lg text-sm font-bold shadow-lg hover:bg-gray-800 flex items-center gap-2 transition-colors">
                <span className="material-symbols-outlined">settings</span> Configurar Modelos
            </button>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 mb-8 bg-white p-1.5 rounded-2xl w-fit border border-gray-100 shadow-sm">
          <button 
            onClick={() => setActiveTab('dossier')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'dossier' 
                ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100' 
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
              <span className="material-symbols-outlined text-lg">description</span>
              Dossiês de Imóveis
          </button>
          <button 
            onClick={() => setActiveTab('financial')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'financial' 
                ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100' 
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
              <span className="material-symbols-outlined text-lg">analytics</span>
              Relatórios Financeiros (Executivo)
          </button>
      </div>

      {/* Content Area */}
      <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
        <span className={`w-2 h-6 rounded-full ${activeTab === 'dossier' ? 'bg-blue-600' : 'bg-green-500'}`}></span> 
        {activeTab === 'dossier' ? 'Dossiês Disponíveis' : 'Análises Financeiras Consolidadas'}
      </h2>
      
      {displayAssets.length > 0 ? (
          <>
            {viewMode === 'grid' ? (
                /* --- GRID VIEW --- */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12 animate-fade-in-up">
                    {displayAssets.map(asset => (
                        <div 
                            key={asset.id} 
                            onClick={() => handleCardClick(asset)}
                            className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-soft group hover:border-blue-300 hover:shadow-md transition-all cursor-pointer relative overflow-hidden h-[320px] flex flex-col"
                        >
                            {/* Background Image Effect */}
                            <div className="absolute inset-0 bg-gray-100">
                                {asset.image ? (
                                    <img src={asset.image} className="w-full h-full object-cover opacity-100 group-hover:scale-105 transition-transform duration-500" alt={asset.name} />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                        <span className="material-symbols-outlined text-gray-400">image</span>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                            </div>

                            <div className="relative z-10 flex justify-between items-start mb-auto">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md backdrop-blur-md ${
                                    activeTab === 'dossier' 
                                        ? (asset.type === 'Residencial' ? 'bg-blue-600/80' : 'bg-purple-600/80')
                                        : 'bg-green-600/80'
                                }`}>
                                    <span className="material-symbols-outlined">
                                        {activeTab === 'dossier' ? 'description' : 'insert_chart'}
                                    </span>
                                </div>
                                <div className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold uppercase text-gray-800 shadow-sm">
                                    {activeTab === 'dossier' ? 'Dossiê Pronto' : 'Auditoria Ativa'}
                                </div>
                            </div>
                            
                            <div className="relative z-10 text-white mt-auto">
                                <h3 className="text-lg font-bold mb-1 truncate leading-tight shadow-black drop-shadow-md">{asset.name}</h3>
                                <p className="text-xs text-gray-300 mb-4 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[14px]">location_on</span>
                                    {asset.city}
                                </p>
                                
                                {activeTab === 'financial' && (
                                    <div className="mb-4 grid grid-cols-2 gap-2">
                                        <div className="bg-white/10 rounded-lg p-2 backdrop-blur-sm">
                                            <p className="text-[9px] text-gray-300 uppercase">Saldo Devedor</p>
                                            <p className="text-xs font-bold text-white">R$ 1.2M</p>
                                        </div>
                                        <div className="bg-white/10 rounded-lg p-2 backdrop-blur-sm">
                                            <p className="text-[9px] text-gray-300 uppercase">Prazo</p>
                                            <p className="text-xs font-bold text-white">324 meses</p>
                                        </div>
                                    </div>
                                )}
                                
                                <div className="flex items-center justify-between border-t border-white/20 pt-3">
                                    <span className="text-[10px] font-medium text-gray-300">Atualizado hoje</span>
                                    <span className="text-xs font-bold text-white flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                        Abrir <span className="material-symbols-outlined text-xs">arrow_forward</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                /* --- LIST VIEW --- */
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm mb-12 overflow-hidden animate-fade-in-up">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="py-4 px-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Documento / Ativo</th>
                                    <th className="py-4 px-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Tipo & Localização</th>
                                    <th className="py-4 px-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Status do Relatório</th>
                                    <th className="py-4 px-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Data Atualização</th>
                                    <th className="py-4 px-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {displayAssets.map(asset => (
                                    <tr 
                                        key={asset.id} 
                                        onClick={() => handleCardClick(asset)}
                                        className="hover:bg-blue-50/50 cursor-pointer transition-colors group"
                                    >
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0">
                                                    {asset.image ? (
                                                        <img src={asset.image} alt={asset.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                            <span className="material-symbols-outlined text-lg">image</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900 line-clamp-1">{asset.name}</p>
                                                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wide">ID: {asset.id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <p className="text-xs font-bold text-gray-800">{asset.city} / {asset.state || 'UF'}</p>
                                            <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded mt-1 inline-block">
                                                {asset.type}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${activeTab === 'dossier' ? 'bg-blue-500' : 'bg-green-500'}`}></span>
                                                <span className={`text-xs font-bold ${activeTab === 'dossier' ? 'text-blue-700' : 'text-green-700'}`}>
                                                    {activeTab === 'dossier' ? 'Dossiê Compilado' : 'Auditoria Financeira'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <p className="text-xs font-bold text-gray-900">Hoje</p>
                                            <p className="text-[10px] text-gray-400">14:30</p>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <button className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center hover:bg-black hover:text-white transition-all group-hover:scale-110">
                                                <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
          </>
      ) : (
          <div className="text-center py-20 bg-white rounded-[2rem] border border-gray-100 shadow-sm mb-12">
              <span className="material-symbols-outlined text-4xl text-gray-300 mb-4">folder_off</span>
              <p className="text-gray-500 font-medium">Nenhum ativo com dados financeiros cadastrados para gerar este relatório.</p>
          </div>
      )}

      {/* 2. Consolidated Reports (Bottom Section) */}
      <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
        <span className="w-2 h-6 bg-gray-800 rounded-full"></span> Downloads Consolidados
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
              { title: 'Fechamento Mensal', date: 'Ref: Outubro 2023', type: 'Financeiro', color: 'bg-green-100 text-green-700' },
              { title: 'Posição de Ativos', date: 'Atualizado: Hoje', type: 'Patrimonial', color: 'bg-blue-100 text-blue-700' },
              { title: 'Imposto de Renda', date: 'Ano Base: 2023', type: 'Fiscal', color: 'bg-purple-100 text-purple-700' },
          ].map((report, idx) => (
              <div key={idx} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-soft group hover:border-gray-300 transition-all cursor-pointer">
                  <div className="flex justify-between items-start mb-4">
                      <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${report.color}`}>{report.type}</div>
                      <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                          <span className="material-symbols-outlined text-sm">download</span>
                      </div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{report.title}</h3>
                  <p className="text-xs text-gray-400 mb-6">{report.date}</p>
                  
                  <div className="flex items-center gap-2 border-t border-gray-50 pt-4">
                      <div className="w-6 h-6 rounded bg-red-50 text-red-600 flex items-center justify-center">
                          <span className="material-symbols-outlined text-xs">picture_as_pdf</span>
                      </div>
                      <span className="text-xs font-medium text-gray-500">PDF • Pronto para Download</span>
                  </div>
              </div>
          ))}
      </div>
    </div>
  );
};