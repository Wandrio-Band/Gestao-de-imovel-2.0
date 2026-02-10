import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { Dashboard } from './pages/Dashboard';
import { AssetTable } from './pages/AssetTable';
import { AssetRegistration } from './pages/Forms/AssetRegistration';
import { FinancingDashboard } from './pages/Forms/FinancingDashboard';
import { FinancialAssetList } from './pages/FinancialAssetList';
import { DebtManagement } from './pages/DebtManagement';
import { DebtDetails } from './pages/DebtDetails';
import { ConsolidatedStatement } from './pages/ConsolidatedStatement';
import { AmortizationReport } from './pages/AmortizationReport';
import { SavedSimulations } from './pages/SavedSimulations';
import { AssetValueEditor } from './pages/AssetValueEditor';
import { PartnerAudit } from './pages/PartnerAudit';
import { AIAssistant } from './pages/AIAssistant';
import { Reports } from './pages/Reports';
import { ReportIndividual } from './pages/ReportIndividual';
import { ReportFinancialExecutive } from './pages/ReportFinancialExecutive';
import { FinancialSchedule } from './pages/FinancialSchedule'; 
import { ImportIRPF } from './pages/ImportIRPF';
import { ViewState, Asset, AmortizationResult } from './types';
import { MOCK_ASSETS } from './constants';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [assets, setAssets] = useState<Asset[]>(MOCK_ASSETS);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  
  // State to hold the result of a simulation to be passed to the report page
  const [simulationResult, setSimulationResult] = useState<AmortizationResult | null>(null);
  
  // State to hold saved simulations (mock persistence)
  const [savedReports, setSavedReports] = useState<AmortizationResult[]>([]);

  const handleNavigate = (view: ViewState, asset?: Asset) => {
    setCurrentView(view);
    if (asset) {
        // Ensure we select the latest version of the asset from state if ID matches
        const freshAsset = assets.find(a => a.id === asset.id) || asset;
        setSelectedAsset(freshAsset);
    } else if (view === 'asset_new') {
        setSelectedAsset(null); // Clear selection for new asset
    }
  };

  const handleSimulationComplete = (result: AmortizationResult) => {
      setSimulationResult(result);
      setCurrentView('amortization_result');
  };

  const handleSaveReport = (report: AmortizationResult) => {
      const newReport = { ...report, id: Date.now().toString() };
      setSavedReports(prev => [newReport, ...prev]);
      alert('Relatório de Simulação Salvo com Sucesso!');
      handleNavigate('saved_simulations');
  };

  const handleDeleteReport = (id: string) => {
      if (window.confirm('Tem certeza que deseja excluir esta simulação?')) {
          setSavedReports(prev => prev.filter(r => r.id !== id));
      }
  };

  const handleViewSavedReport = (report: AmortizationResult) => {
      setSimulationResult(report);
      setCurrentView('amortization_result');
  };

  const handleUpdateAsset = (updatedAsset: Asset) => {
      setAssets(prevAssets => {
          const index = prevAssets.findIndex(a => a.id === updatedAsset.id);
          if (index >= 0) {
              const newAssets = [...prevAssets];
              newAssets[index] = updatedAsset;
              return newAssets;
          } else {
              return [...prevAssets, updatedAsset];
          }
      });
      // Update selected asset reference as well
      setSelectedAsset(updatedAsset);
  };

  const handleUpdateAssetsBulk = (updatedAssets: Asset[]) => {
      setAssets(updatedAssets);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'assets_list':
      case 'assets_grid':
        return <AssetTable 
                  assets={assets} 
                  onUpdateAssets={setAssets} 
                  onNavigate={handleNavigate}
                  viewMode={currentView}
               />;
      case 'asset_new':
        return <AssetRegistration 
                  asset={selectedAsset || undefined} 
                  onNavigate={handleNavigate} 
                  onUpdateAsset={handleUpdateAsset}
               />;
      case 'asset_values':
        return <AssetValueEditor assets={assets} onUpdateAssets={handleUpdateAssetsBulk} />;
      case 'financial_overview':
        return <FinancialAssetList onNavigate={handleNavigate} />;
      case 'financing_details':
        return <FinancingDashboard 
                  asset={selectedAsset} 
                  onNavigate={handleNavigate} 
                  onUpdateAsset={handleUpdateAsset}
               />;
      case 'financial_schedule':
        return <FinancialSchedule />;
      case 'debt_management':
        return <DebtManagement onNavigate={handleNavigate} />;
      case 'debt_details':
        return <DebtDetails 
                  asset={selectedAsset} 
                  onNavigate={handleNavigate} 
                  onSimulationComplete={handleSimulationComplete}
                  onUpdateAsset={handleUpdateAsset}
               />;
      case 'consolidated_statement':
        return <ConsolidatedStatement asset={selectedAsset} onNavigate={handleNavigate} />;
      case 'amortization_result':
        return <AmortizationReport 
                  result={simulationResult} 
                  onBack={() => handleNavigate('saved_simulations')} 
                  onSave={handleSaveReport}
               />;
      case 'saved_simulations':
        return <SavedSimulations 
                  reports={savedReports} 
                  onViewReport={handleViewSavedReport}
                  onDeleteReport={handleDeleteReport}
                  onNavigate={handleNavigate}
               />;
      case 'audit':
        return <PartnerAudit />;
      case 'ai_assistant':
        return <AIAssistant />;
      case 'report_executive':
      case 'report_config':
        return <Reports onNavigate={handleNavigate} />;
      case 'report_individual':
        return <ReportIndividual asset={selectedAsset} onNavigate={handleNavigate} />;
      case 'report_financial':
        return <ReportFinancialExecutive asset={selectedAsset} onNavigate={handleNavigate} />;
      case 'import_irpf':
        return <ImportIRPF 
                  onNavigate={handleNavigate} 
                  onUpdateAssets={handleUpdateAssetsBulk}
                  currentAssets={assets}
               />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-[#f6f6f8] overflow-hidden font-sans text-[#0d121b]">
      <Sidebar currentView={currentView} onNavigate={handleNavigate} />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}