"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ViewState, Asset, AmortizationResult } from '@/components/ai-studio/types';
import { getAssets, saveAsset, deleteAsset } from '@/app/actions/assets';
import toast from 'react-hot-toast';

interface AssetContextType {
    currentView: ViewState;
    setCurrentView: (view: ViewState) => void;
    assets: Asset[];
    setAssets: React.Dispatch<React.SetStateAction<Asset[]>>;
    selectedAsset: Asset | null;
    setSelectedAsset: React.Dispatch<React.SetStateAction<Asset | null>>;
    simulationResult: AmortizationResult | null;
    setSimulationResult: React.Dispatch<React.SetStateAction<AmortizationResult | null>>;
    savedReports: AmortizationResult[];
    setSavedReports: React.Dispatch<React.SetStateAction<AmortizationResult[]>>;
    handleNavigate: (view: ViewState, asset?: Asset) => void;
    handleSimulationComplete: (result: AmortizationResult) => void;
    handleSaveReport: (report: AmortizationResult) => void;
    handleDeleteReport: (id: string) => void;
    handleViewSavedReport: (report: AmortizationResult) => void;
    handleUpdateAsset: (updatedAsset: Asset) => void;
    handleUpdateAssetsBulk: (updatedAssets: Asset[]) => void;
    handleDeleteAsset: (id: string) => Promise<void>;
}

const AssetContext = createContext<AssetContextType | undefined>(undefined);

export function AssetProvider({ children }: { children: ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [currentView, setCurrentView] = useState<ViewState>('dashboard');
    const [assets, setAssets] = useState<Asset[]>([]);
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

    // Initial Load
    useEffect(() => {
        const loadAssets = async () => {
            try {
                const data = await getAssets();
                setAssets(data);
            } catch (error) {
                console.error("Failed to load assets:", error);
            }
        };
        loadAssets();
    }, []);

    // State to hold the result of a simulation to be passed to the report page
    const [simulationResult, setSimulationResult] = useState<AmortizationResult | null>(null);

    // State to hold saved simulations (mock persistence)
    const [savedReports, setSavedReports] = useState<AmortizationResult[]>([]);

    // Sync currentView with Pathname
    useEffect(() => {
        if (pathname === '/dashboard') setCurrentView('dashboard');
        else if (pathname === '/assets') setCurrentView('assets_list');
        else if (pathname === '/assets/new') setCurrentView('asset_new');
        else if (pathname === '/assets/values') setCurrentView('asset_values');
        else if (pathname === '/assets/import') setCurrentView('import_irpf');
        else if (pathname === '/financial') setCurrentView('financial_overview');
        else if (pathname === '/financial/schedule') setCurrentView('financial_schedule');
        else if (pathname === '/financial/debt') setCurrentView('debt_management');
        else if (pathname.startsWith('/financial/details')) setCurrentView('financing_details');
        else if (pathname.startsWith('/financial/debt/details')) setCurrentView('debt_details');
        else if (pathname === '/partners') setCurrentView('audit');
        else if (pathname === '/reports') setCurrentView('report_executive');
        else if (pathname === '/reports/individual') setCurrentView('report_individual');
        else if (pathname === '/reports/financial') setCurrentView('report_financial');
        else if (pathname === '/ai-assistant') setCurrentView('ai_assistant');
        else if (pathname === '/simulations') setCurrentView('saved_simulations');
        else if (pathname === '/simulations/result') setCurrentView('amortization_result');
        else if (pathname === '/financial/consolidated') setCurrentView('consolidated_statement');
    }, [pathname]);

    const handleNavigate = (view: ViewState, asset?: Asset) => {
        // Update local state first (optimistic)
        setCurrentView(view);

        // Handle asset selection
        if (asset) {
            const freshAsset = assets.find(a => a.id === asset.id) || asset;
            setSelectedAsset(freshAsset);
        } else if (view === 'asset_new') {
            setSelectedAsset(null);
        }

        // Perform routing
        switch (view) {
            case 'dashboard': router.push('/dashboard'); break;
            case 'assets_list': router.push('/assets'); break;
            case 'assets_grid': router.push('/assets?view=grid'); break;
            case 'asset_new': router.push('/assets/new'); break;
            case 'asset_values': router.push('/assets/values'); break;
            case 'import_irpf': router.push('/assets/import'); break;
            case 'financial_overview': router.push('/financial'); break;
            case 'financial_schedule': router.push('/financial/schedule'); break;
            case 'debt_management': router.push('/financial/debt'); break;
            case 'financing_details': router.push('/financial/details'); break;
            case 'debt_details': router.push('/financial/debt/details'); break;
            case 'consolidated_statement': router.push('/financial/consolidated'); break;
            case 'audit': router.push('/partners'); break;
            case 'report_executive': router.push('/reports'); break;
            case 'report_config': router.push('/reports'); break; // Same page for now
            case 'report_individual': router.push('/reports/individual'); break;
            case 'report_financial': router.push('/reports/financial'); break;
            case 'ai_assistant': router.push('/ai-assistant'); break;
            case 'saved_simulations': router.push('/simulations'); break;
            case 'amortization_result': router.push('/simulations/result'); break;
            default: router.push('/dashboard');
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

    const handleUpdateAsset = async (updatedAsset: Asset) => {
        // Store previous state for potential rollback
        const previousAssets = [...assets];

        // Optimistic Update - Update UI immediately
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
        setSelectedAsset(updatedAsset);

        // Show loading toast
        const toastId = toast.loading('Salvando alterações...');

        try {
            // Server Persist in background
            const result = await saveAsset(updatedAsset);

            if (result.success) {
                // Reload from database to ensure consistency
                const freshAssets = await getAssets();
                setAssets(freshAssets);

                toast.success('Alterações salvas!', { id: toastId });
            } else {
                throw new Error('Save failed');
            }
        } catch (error) {
            // Rollback on error
            setAssets(previousAssets);
            toast.error('Erro ao salvar. Revertido.', { id: toastId });
            console.error('Failed to save asset:', error);
        }
    };

    const handleUpdateAssetsBulk = async (updatedAssets: Asset[]) => {
        setAssets(updatedAssets);
        // Persist each modified asset
        // In a real bulk scenario we might want a bulkSave action, but for now loop is fine for small number
        for (const asset of updatedAssets) {
            await saveAsset(asset);
        }
    };

    const handleDeleteAsset = async (id: string) => {
        // Store previous state for potential rollback
        const previousAssets = [...assets];

        // Optimistic Update - Remove from UI immediately
        setAssets(prevAssets => prevAssets.filter(a => a.id !== id));

        // Show loading toast
        const toastId = toast.loading('Deletando ativo...');

        try {
            // Server Persist in background
            const result = await deleteAsset(id);

            if (result.success) {
                // CRITICAL: Reload from database after successful delete
                const freshAssets = await getAssets();
                setAssets(freshAssets);

                toast.success('Ativo deletado!', { id: toastId });
                // Reset selected asset if it was the deleted one
                if (selectedAsset?.id === id) {
                    setSelectedAsset(null);
                }
            } else {
                throw new Error('Delete failed');
            }
        } catch (error) {
            // Rollback on error
            setAssets(previousAssets);
            toast.error('Erro ao deletar. Revertido.', { id: toastId });
            console.error('Failed to delete asset:', error);
        }
    };

    return (
        <AssetContext.Provider value={{
            currentView,
            setCurrentView,
            assets,
            setAssets,
            selectedAsset,
            setSelectedAsset,
            simulationResult,
            setSimulationResult,
            savedReports,
            setSavedReports,
            handleNavigate,
            handleSimulationComplete,
            handleSaveReport,
            handleDeleteReport,
            handleViewSavedReport,
            handleUpdateAsset,
            handleUpdateAssetsBulk,
            handleDeleteAsset
        }}>
            {children}
        </AssetContext.Provider>
    );
}

export function useAssetContext() {
    const context = useContext(AssetContext);
    if (context === undefined) {
        throw new Error('useAssetContext must be used within an AssetProvider');
    }
    return context;
}
