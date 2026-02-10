import React from 'react';
import { ViewState, Asset } from '../types';

interface SidebarProps {
  currentView: ViewState;
  onNavigate: (view: ViewState, asset?: Asset) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate }) => {
  
  // Helper to check if a main section should be active based on current view
  const isSectionActive = (mainView: ViewState, subItems?: { view: ViewState }[], relatedViews?: ViewState[]) => {
      if (currentView === mainView) return true;
      if (subItems?.some(i => i.view === currentView)) return true;
      if (relatedViews?.includes(currentView)) return true;
      return false;
  };

  const NavItem = ({ view, icon, label, subItems, relatedViews }: { view: ViewState; icon: string; label: string; subItems?: { view: ViewState, label: string }[], relatedViews?: ViewState[] }) => {
    const isActive = isSectionActive(view, subItems, relatedViews);
    
    return (
      <div className="mb-2">
        <button
          onClick={() => onNavigate(view)}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
            isActive 
              ? 'bg-black text-white shadow-lg shadow-gray-200' 
              : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          <span className={`material-symbols-outlined ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}`}>{icon}</span>
          <span className="font-bold text-sm">{label}</span>
        </button>
        {isActive && subItems && (
          <div className="ml-12 mt-2 flex flex-col gap-1 border-l-2 border-gray-100 pl-3">
            {subItems.map(item => {
               // Logic to keep sub-items highlighted when in their child views
               const isSubItemActive = currentView === item.view || 
                   (item.view === 'financial_overview' && currentView === 'financing_details') ||
                   (item.view === 'debt_management' && ['debt_details', 'consolidated_statement', 'saved_simulations', 'amortization_result'].includes(currentView));

               return (
                  <button
                    key={item.view}
                    onClick={(e) => { e.stopPropagation(); onNavigate(item.view); }}
                    className={`text-left text-xs font-semibold py-1.5 transition-colors ${isSubItemActive ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    {item.label}
                  </button>
               );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-64 h-full bg-white border-r border-gray-100 flex flex-col flex-shrink-0">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white">
          <span className="material-symbols-outlined text-lg">domain</span>
        </div>
        <div className="flex flex-col">
          <span className="font-extrabold text-sm tracking-tight">ASSET<span className="text-primary">MANAGER</span></span>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Premium Estate</span>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 overflow-y-auto no-scrollbar">
        <div className="mb-6">
          <p className="px-4 text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2">Principal</p>
          <NavItem view="dashboard" icon="dashboard" label="Dashboard" />
          <NavItem 
            view="assets_list" 
            icon="apartment" 
            label="Ativos" 
            subItems={[
              { view: 'assets_grid', label: 'Galeria de Cards' },
              { view: 'assets_list', label: 'Lista Tabela' },
              { view: 'asset_values', label: 'Edição de Valores' },
              { view: 'asset_new', label: 'Novo Cadastro' }
            ]}
            relatedViews={['asset_new', 'asset_values']}
          />
          <NavItem view="audit" icon="pie_chart" label="Sócios & Cotas" />
        </div>

        <div className="mb-6">
          <p className="px-4 text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2">Financeiro</p>
          <NavItem 
             view="financial_overview" 
             icon="payments" 
             label="Gestão Financeira" 
             subItems={[
              { view: 'financial_overview', label: 'Visão Geral' },
              { view: 'financial_schedule', label: 'Cronograma Consolidado' },
              { view: 'debt_management', label: 'Gestão de Dívida' }
            ]}
            relatedViews={[
                'financing_details', 
                'financial_schedule',
                'debt_management', 
                'debt_details', 
                'consolidated_statement', 
                'amortization_result', 
                'saved_simulations'
            ]}
          />
          <NavItem view="ai_assistant" icon="smart_toy" label="Assistente IA" />
        </div>

        <div>
          <p className="px-4 text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2">Documentos</p>
          <NavItem view="report_executive" icon="description" label="Relatórios" 
             subItems={[
              { view: 'report_executive', label: 'Relatório Executivo' },
              { view: 'report_config', label: 'Exportar Dados' }
            ]}
            relatedViews={['report_individual', 'report_financial']}
          />
        </div>
      </nav>

      <div className="p-4 border-t border-gray-100">
        <button className="flex items-center gap-3 px-4 py-2 w-full rounded-lg hover:bg-gray-50 transition-colors group">
          <img src="https://picsum.photos/id/64/100/100" className="w-8 h-8 rounded-full border-2 border-white shadow-sm" alt="User" />
          <div className="flex flex-col items-start">
            <span className="text-xs font-bold text-gray-800">Ricardo Silva</span>
            <span className="text-[10px] text-gray-400 font-medium">Administrador</span>
          </div>
          <span className="material-symbols-outlined ml-auto text-gray-300 text-sm">expand_more</span>
        </button>
      </div>
    </div>
  );
};