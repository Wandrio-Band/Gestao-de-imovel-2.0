/**
 * @fileoverview Contexto global para gerenciamento de estado de ativos imobiliários.
 * 
 * Este módulo fornece um Context React que centraliza o gerenciamento de:
 * 1. Navegação entre visualizações (dashboard, assets, financial, etc)
 * 2. Lista de ativos com operações CRUD
 * 3. Seleção de ativo em foco
 * 4. Resultados de simulações de amortização
 * 5. Relatórios salvos
 * 
 * Ciclo de vida:
 * - AssetProvider: Wrapper que fornece contexto para toda a árvore de componentes
 * - useAssetContext: Hook para consumir o contexto em componentes filhos
 * 
 * State tree:
 * ```
 * AssetContext
 * ├── currentView: ViewState (dashboard | assets_list | asset_new | ...)
 * ├── assets: Asset[] (lista de ativos)
 * ├── selectedAsset: Asset | null (ativo em foco)
 * ├── simulationResult: AmortizationResult | null (resultado de simulação)
 * ├── savedReports: AmortizationResult[] (simulações salvas em memória)
 * └── handlers: funções para atualizar estado
 * ```
 */

"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ViewState, Asset, AmortizationResult } from '@/components/ai-studio/types';
import { getAssets, saveAsset, deleteAsset } from '@/app/actions/assets';
import toast from 'react-hot-toast';

/**
 * @typedef {Object} AssetContextType
 * @description Interface do contexto com todo estado e handlers de ativos.
 * 
 * @property {ViewState} currentView - Visualização ativa (dashboard, assets_list, etc)
 * @property {Function} setCurrentView - Setter para currentView
 * 
 * @property {Asset[]} assets - Array de todos os ativos carregados
 * @property {Function} setAssets - Setter para substituir lista completa de ativos
 * 
 * @property {Asset | null} selectedAsset - Ativo selecionado para edição/visualização
 * @property {Function} setSelectedAsset - Setter para ativo selecionado
 * 
 * @property {AmortizationResult | null} simulationResult - Resultado de simulação de amortização
 * @property {Function} setSimulationResult - Setter para resultado de simulação
 * 
 * @property {AmortizationResult[]} savedReports - Simulações salvas em memória (localStorage pode ser adicionado)
 * @property {Function} setSavedReports - Setter para lista de relatórios salvos
 * 
 * @property {Function} handleNavigate - Navega para visualização e define ativo se necessário
 * @property {Function} handleSimulationComplete - Marca simulação como completa e navega
 * @property {Function} handleSaveReport - Salva relatório de simulação
 * @property {Function} handleDeleteReport - Deleta relatório salvo
 * @property {Function} handleViewSavedReport - Carrega relatório salvo para visualização
 * @property {Function} handleUpdateAsset - Atualiza um ativo com otimismo
 * @property {Function} handleUpdateAssetsBulk - Atualiza múltiplos ativos
 * @property {Function} handleDeleteAsset - Deleta um ativo
 */
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

/**
 * Provider que encapsula a aplicação e fornece contexto de ativos.
 * 
 * @component
 * @param {Object} props - Props do componente
 * @param {ReactNode} props.children - Componentes filhos que consumirão o contexto
 * @returns {ReactNode} JSX com contexto fornecido
 * 
 * @description
 * Responsabilidades:
 * 1. Carrega lista inicial de ativos ao montar
 * 2. Sincroniza currentView com pathname via useEffect
 * 3. Fornece handlers para operações CRUD de ativos
 * 4. Implementa otimismo (atualiza UI antes de confirmar servidor)
 * 5. Gerencia simulações de amortização e relatórios
 * 
 * Padrão de atualização otimista:
 * - Atualiza estado local (setAssets)
 * - Exibe toast de carregamento
 * - Faz requisição ao servidor
 * - Se sucesso: recarrega dados do servidor para garantir consistência
 * - Se erro: faz rollback ao estado anterior
 * 
 * @example
 * <AssetProvider>
 *   <Dashboard />
 *   <AssetList />
 * </AssetProvider>
 */
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
        else if (pathname.startsWith('/financial/debt/details')) setCurrentView('debt_details');
        else if (pathname.startsWith('/financial/details')) setCurrentView('financing_details');
        else if (pathname === '/partners') setCurrentView('audit');
        else if (pathname === '/reports') setCurrentView('report_executive');
        else if (pathname === '/reports/individual') setCurrentView('report_individual');
        else if (pathname === '/reports/financial') setCurrentView('report_financial');
        else if (pathname === '/ai-assistant') setCurrentView('ai_assistant');
        else if (pathname === '/simulations') setCurrentView('saved_simulations');
        else if (pathname === '/simulations/result') setCurrentView('amortization_result');
        else if (pathname === '/financial/consolidated') setCurrentView('consolidated_statement');
    }, [pathname]);

    /**
     * Navega para visualização especificada e opcionalmente seleciona um ativo.
     * 
     * @function handleNavigate
     * @param {ViewState} view - Visualização destino
     * @param {Asset} [asset] - Ativo opcional para selecionar
     * 
     * @description
     * 1. Atualiza currentView imediatamente (otimismo)
     * 2. Se ativo fornecido, tenta buscar versão fresca do banco
     * 3. Se nova asset, limpa seleção
     * 4. Realiza router.push para rota correspondente
     */
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

    /**
     * Marca simulação como completa e navega para visualização de resultado.
     * @function handleSimulationComplete
     * @param {AmortizationResult} result - Resultado da simulação
     */
    const handleSimulationComplete = (result: AmortizationResult) => {
        setSimulationResult(result);
        setCurrentView('amortization_result');
    };

    /**
     * Salva relatório de simulação na memória e navega para lista.
     * @function handleSaveReport
     * @param {AmortizationResult} report - Relatório para salvar
     */
    const handleSaveReport = (report: AmortizationResult) => {
        const newReport = { ...report, id: Date.now().toString() };
        setSavedReports(prev => [newReport, ...prev]);
        alert('Relatório de Simulação Salvo com Sucesso!');
        handleNavigate('saved_simulations');
    };

    /**
     * Deleta relatório salvo após confirmação do usuário.
     * @function handleDeleteReport
     * @param {string} id - ID do relatório para deletar
     */
    const handleDeleteReport = (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir esta simulação?')) {
            setSavedReports(prev => prev.filter(r => r.id !== id));
        }
    };

    /**
     * Carrega relatório salvo para visualização.
     * @function handleViewSavedReport
     * @param {AmortizationResult} report - Relatório para visualizar
     */
    const handleViewSavedReport = (report: AmortizationResult) => {
        setSimulationResult(report);
        setCurrentView('amortization_result');
    };

    /**
     * Atualiza um ativo com padrão otimista (UI → Servidor → Validação).
     * 
     * @async
     * @function handleUpdateAsset
     * @param {Asset} updatedAsset - Ativo com dados atualizados
     * 
     * @description
     * Padrão de atualização otimista:
     * 1. Armazena estado anterior para rollback
     * 2. Atualiza estado local imediatamente
     * 3. Exibe toast de carregamento
     * 4. Realiza requisição ao servidor
     * 5. Se sucesso:
     *    - Recarrega dados completos do servidor
     *    - Exibe toast de sucesso
     * 6. Se erro:
     *    - Faz rollback ao estado anterior
     *    - Exibe toast de erro
     *    - Registra erro no console
     */
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

    /**
     * Atualiza múltiplos ativos em lote.
     * 
     * @async
     * @function handleUpdateAssetsBulk
     * @param {Asset[]} updatedAssets - Array de ativos para atualizar
     * 
     * @description
     * Nota: Implementação atual itera sobre cada ativo.
     * Para produção, considerar criar ação de bulk update no servidor.
     */
    const handleUpdateAssetsBulk = async (updatedAssets: Asset[]) => {
        setAssets(updatedAssets);
        // Persist each modified asset
        // In a real bulk scenario we might want a bulkSave action, but for now loop is fine for small number
        for (const asset of updatedAssets) {
            await saveAsset(asset);
        }
    };

    /**
     * Deleta um ativo com padrão otimista.
     * 
     * @async
     * @function handleDeleteAsset
     * @param {string} id - ID do ativo para deletar
     * @throws {Promise<void>}
     * 
     * @description
     * Mesmo padrão otimista que handleUpdateAsset:
     * 1. Remove do estado local
     * 2. Realiza requisição DELETE ao servidor
     * 3. Se sucesso: recarrega lista completa
     * 4. Se erro: faz rollback
     */
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

/**
 * Hook para consumir o contexto de ativos em componentes filhos.
 * 
 * @hook
 * @returns {AssetContextType} Contexto com estado e handlers
 * @throws {Error} Se usado fora de um AssetProvider
 * 
 * @example
 * function MyComponent() {
 *   const { assets, handleUpdateAsset } = useAssetContext();
 *   // ...
 * }
 */
export function useAssetContext() {
    const context = useContext(AssetContext);
    if (context === undefined) {
        throw new Error('useAssetContext must be used within an AssetProvider');
    }
    return context;
}
