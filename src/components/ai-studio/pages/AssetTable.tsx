import React, { useState, useRef, useCallback } from 'react';
import { ViewState, Asset, PartnerShare } from '../types';
import { AssetRegistration } from './Forms/AssetRegistration';
import { useAssetContext } from '@/context/AssetContext';
import toast from 'react-hot-toast';
import { DatabaseBackup } from '@/components/DatabaseBackup';

interface AssetTableProps {
    assets: Asset[];
    onUpdateAssets: (assets: Asset[]) => void;
    onSaveAsset?: (asset: Asset) => void;
    onNavigate: (view: ViewState, asset?: Asset) => void;
    viewMode?: ViewState;
    initialEditAssetId?: string | null;
}

const getPartnerStyle = (name: string) => {
    switch (name) {
        case 'Wândrio': return { initials: 'W', color: 'bg-orange-500 text-white' };
        case 'Raquel': return { initials: 'R', color: 'bg-purple-600 text-white' };
        case 'Marília': return { initials: 'M', color: 'bg-pink-500 text-white' };
        case 'Tilinha': return { initials: 'T', color: 'bg-blue-600 text-white' };
        default: return { initials: name.charAt(0), color: 'bg-gray-500 text-white' };
    }
};

export const AssetTable: React.FC<AssetTableProps> = ({ assets, onUpdateAssets, onSaveAsset, onNavigate, viewMode = 'assets_list', initialEditAssetId }) => {
    const [isQuickEditMode, setIsQuickEditMode] = useState(false);
    const [selectedAssetForModal, setSelectedAssetForModal] = useState<Asset | null>(null);

    // Effect to handle deep linking for edit
    React.useEffect(() => {
        if (initialEditAssetId && assets.length > 0) {
            const assetToEdit = assets.find(a => a.id === initialEditAssetId);
            if (assetToEdit) {
                setSelectedAssetForModal(assetToEdit);
                // Clear the URL param to avoid reopening if they close it? 
                // Ideally yes, but for now let's just open it.
                // Actually, if we leave it, refreshing reopens it which is good.
            }
        }
    }, [initialEditAssetId, assets]);


    // Column Resizing State
    const [colWidths, setColWidths] = useState({
        index: 60,
        name: 320,
        type: 140,
        location: 180,
        status: 120,
        partners: 220,
        marketValue: 160,
        rentalValue: 140,
        actions: 100,
        // Newly added columns - MUCH larger widths for comfortable editing
        street: 300,           // increased from 200 -> 300 (50% wider)
        zipCode: 140,          // increased from 100 -> 140 (40% wider)
        neighborhood: 220,     // increased from 150 -> 220 (47% wider)
        areaTotal: 150,        // increased from 120 -> 150 (25% wider)
        matricula: 220,        // increased from 150 -> 220 (47% wider)
        iptu: 220,             // increased from 150 -> 220 (47% wider)
        registryOffice: 260,   // increased from 180 -> 260 (44% wider)
        acquisitionDate: 160,  // increased from 120 -> 160 (33% wider)
        irpfStatus: 180,       // increased from 120 -> 180 (50% wider)
        acquisitionOrigin: 260, // increased from 180 -> 260 (44% wider)
        value: 200,            // increased from 150 -> 200 (33% wider)
        declaredValue: 200,    // increased from 150 -> 200 (33% wider)
        saleForecast: 160,     // increased from 120 -> 160 (33% wider)
        yield: 120             // New Yield column
    });

    // Filter State
    const [filters, setFilters] = useState({
        search: '',
        type: 'all', // all | Residencial | Comercial | Terreno | Industrial
        status: 'all', // all | Vago | Alugado | Próprio Uso
        state: 'all', // all | MG | RO | RJ | SP | etc
        owners: [] as string[] // ['Wândrio', 'Raquel', 'Marília']
    });

    // FIXED Owner Badges (always shown)
    const FIXED_OWNERS = ['Raquel', 'Marília', 'Wândrio', 'Tilinha'];

    // Get unique states from assets (still needed for State filter)
    const uniqueStates = Array.from(new Set(assets.map(a => a.state).filter(Boolean)));

    // Column Selector State with localStorage persistence
    const AVAILABLE_COLUMNS = [
        { id: 'imovel', label: 'IMÓVEL', locked: true },
        { id: 'tipo', label: 'TIPO' },
        { id: 'municipio', label: 'MUNICÍPIO/UF' },
        { id: 'status', label: 'STATUS' },
        { id: 'endereco', label: 'ENDEREÇO' },
        { id: 'cep', label: 'CEP' },
        { id: 'bairro', label: 'BAIRRO' },
        { id: 'areaTotal', label: 'ÁREA TOTAL (m²)' },
        { id: 'matricula', label: 'MATRÍCULA' },
        { id: 'iptu', label: 'IPTU' },
        { id: 'cartorio', label: 'CARTÓRIO' },
        { id: 'dataAquisicao', label: 'DATA AQUISIÇÃO' },
        { id: 'statusIrpf', label: 'STATUS IRPF' },
        { id: 'origemAquisicao', label: 'ORIGEM AQUISIÇÃO' },
        { id: 'proprietarios', label: 'PROPRIETÁRIOS' },
        { id: 'valorMercado', label: 'VALOR MERCADO' },
        { id: 'valorAquisicao', label: 'VALOR AQUISIÇÃO' },
        { id: 'valorDeclarado', label: 'VALOR DECLARADO (IRPF)' },
        { id: 'locacao', label: 'LOCAÇÃO' },
        { id: 'yield', label: 'YIELD (a.a.)' },
        { id: 'previsaoVenda', label: 'PREVISÃO VENDA' },
        { id: 'acoes', label: 'AÇÕES', locked: true }
    ];

    const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('assetTableVisibleColumns');
            if (saved) return JSON.parse(saved);
        }
        return ['imovel', 'areaTotal', 'tipo', 'municipio', 'status', 'proprietarios', 'valorMercado', 'locacao', 'acoes'];
    });

    // Column order for drag & drop reordering
    const [columnOrder, setColumnOrder] = useState<string[]>([
        'index', 'imovel', 'tipo', 'municipio', 'status', 'proprietarios',
        'valorMercado', 'endereco', 'cep', 'bairro', 'areaTotal', 'matricula',
        'iptu', 'cartorio', 'dataAquisicao', 'statusIrpf', 'origemAquisicao',
        'valorAquisicao', 'valorDeclarado', 'previsaoVenda', 'locacao', 'acoes'
    ]);
    const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
    const [dropIndicatorColumn, setDropIndicatorColumn] = useState<string | null>(null);

    const [showColumnSelector, setShowColumnSelector] = useState(false);

    // Persist visible columns to localStorage
    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('assetTableVisibleColumns', JSON.stringify(visibleColumns));
        }
    }, [visibleColumns]);

    // Load and persist column widths
    React.useEffect(() => {
        const savedWidths = localStorage.getItem('assetTableColWidths');
        if (savedWidths) {
            try {
                const parsed = JSON.parse(savedWidths);
                console.log('📥 Loaded saved column widths from localStorage');
                setColWidths(parsed);
            } catch (e) {
                console.error('Failed to parse saved widths:', e);
            }
        } else {
            console.log('🆕 No saved widths, using defaults');
        }
    }, []);

    // Save column widths whenever they change
    React.useEffect(() => {
        localStorage.setItem('assetTableColWidths', JSON.stringify(colWidths));
    }, [colWidths]);

    // Load column order from localStorage
    React.useEffect(() => {
        const savedOrder = localStorage.getItem('assetTableColumnOrder');
        if (savedOrder) {
            try {
                const parsed = JSON.parse(savedOrder);
                console.log('📥 Loaded saved column order from localStorage');
                setColumnOrder(parsed);
            } catch (e) {
                console.error('Failed to parse saved order:', e);
            }
        }
    }, []);

    // Save column order whenever it changes
    React.useEffect(() => {
        localStorage.setItem('assetTableColumnOrder', JSON.stringify(columnOrder));
    }, [columnOrder]);

    // Filter assets based on current filters
    const filteredAssets = assets.filter(asset => {
        // Search filter
        if (filters.search && !asset.name.toLowerCase().includes(filters.search.toLowerCase())) {
            return false;
        }

        // Type filter
        if (filters.type !== 'all' && asset.type !== filters.type) {
            return false;
        }

        // Status filter
        if (filters.status !== 'all' && asset.status !== filters.status) {
            return false;
        }

        // State filter
        if (filters.state !== 'all' && asset.state !== filters.state) {
            return false;
        }

        // Owners filter (if any owner selected, asset must have at least one matching owner)
        if (filters.owners.length > 0) {
            const assetOwners = asset.partners?.map(p => p.name) || [];
            const hasMatchingOwner = filters.owners.some(owner => assetOwners.includes(owner));
            if (!hasMatchingOwner) {
                return false;
            }
        }

        return true;
    });

    // Calculate Totals from FILTERED assets
    const totalValue = filteredAssets.reduce((acc, asset) => acc + (Number(asset.value) || 0), 0);
    const totalMarketValue = filteredAssets.reduce((acc, asset) => acc + (Number(asset.marketValue) || 0), 0);
    const marketGrowth = totalValue > 0 ? ((totalMarketValue - totalValue) / totalValue) * 100 : 0;

    // Toggle owner filter
    const toggleOwnerFilter = (ownerName: string) => {
        setFilters(prev => ({
            ...prev,
            owners: prev.owners.includes(ownerName)
                ? prev.owners.filter(o => o !== ownerName)
                : [...prev.owners, ownerName]
        }));
    };

    // Clear all filters
    const clearFilters = () => {
        setFilters({
            search: '',
            type: 'all',
            status: 'all',
            state: 'all',
            owners: []
        });
    };

    const resizingRef = useRef<{ col: keyof typeof colWidths | null, startX: number, startWidth: number }>({ col: null, startX: 0, startWidth: 0 });

    // Helper to format currency
    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    // Helper to handle general field changes
    const handleInputChange = (id: string, field: keyof Asset, value: any) => {
        const assetToUpdate = assets.find(a => a.id === id);

        if (assetToUpdate && onSaveAsset) {
            const updatedOne = { ...assetToUpdate, [field]: value };
            onSaveAsset(updatedOne);
        } else {
            const updated = assets.map(asset => {
                if (asset.id === id) {
                    return { ...asset, [field]: value };
                }
                return asset;
            });
            onUpdateAssets(updated);
        }
    };

    const handleRowClick = (asset: Asset) => {
        if (!isQuickEditMode) {
            setSelectedAssetForModal(asset);
        }
    };

    const handleModalSave = (updatedAsset: Asset) => {
        if (onSaveAsset) {
            onSaveAsset(updatedAsset);
        } else {
            const updated = assets.map(a => a.id === updatedAsset.id ? updatedAsset : a);
            if (!assets.find(a => a.id === updatedAsset.id)) {
                updated.push(updatedAsset);
            }
            onUpdateAssets(updated);
        }
    }

    // Delete Functions - Use context function for proper persistence
    const { handleDeleteAsset: deleteAssetFromContext } = useAssetContext();

    const handleDeleteAsset = async (assetId: string) => {
        console.log('🗑️ handleDeleteAsset called for ID:', assetId);

        // Find asset name for better feedback
        const asset = assets.find(a => a.id === assetId);
        const assetName = asset?.name || 'imóvel';

        const toastId = toast.loading(`Deletando ${assetName}...`);

        try {
            console.log('💾 Calling deleteAssetFromContext...');
            await deleteAssetFromContext(assetId);
            console.log('✅ Asset deleted successfully');
            toast.success(`${assetName} deletado com sucesso!`, { id: toastId });
        } catch (error) {
            console.error('❌ Error deleting asset:', error);
            toast.error(`Erro ao deletar ${assetName}`, { id: toastId });
        }
    };

    // Debug: Log component state
    React.useEffect(() => {
        console.log('🔍 AssetTable state:', {
            isQuickEditMode,
            visibleColumns,
            hasAcoesColumn: visibleColumns.includes('acoes'),
            shouldShowDeleteButtons: visibleColumns.includes('acoes') && isQuickEditMode,
            totalAssets: assets.length
        });
    }, [isQuickEditMode, visibleColumns, assets.length]);



    const handleDeleteAll = async () => {
        console.log('🧹 handleDeleteAll called - total assets:', assets.length);

        const toastId = toast.loading(`Deletando ${assets.length} imóveis...`);

        try {
            // Delete each asset from database
            let deleted = 0;
            for (const asset of assets) {
                await deleteAssetFromContext(asset.id);
                deleted++;
                console.log(`✅ Deleted ${deleted}/${assets.length}: ${asset.name}`);
            }

            toast.success(`${deleted} imóveis deletados com sucesso!`, { id: toastId });
            console.log('✅ All assets deleted successfully');
        } catch (error) {
            console.error('❌ Error deleting assets:', error);
            toast.error('Erro ao deletar imóveis', { id: toastId });
        }
    };


    // --- Resizing Logic ---


    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!resizingRef.current.col) return;

        const { col, startX, startWidth } = resizingRef.current;
        const diff = e.clientX - startX;
        const newWidth = Math.max(50, startWidth + diff);

        console.log('↔️ Resizing:', col, 'from', startWidth, 'to', newWidth, 'diff:', diff);

        setColWidths(prev => ({
            ...prev,
            [col]: newWidth
        }));
    }, []);

    const handleMouseUp = useCallback(() => {
        console.log('🛑 handleMouseUp called, cleaning up...');
        resizingRef.current = { col: null, startX: 0, startWidth: 0 };
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        console.log('✅ Event listeners removed, ready for next resize');
    }, [handleMouseMove]);

    const startResize = (e: React.MouseEvent, col: keyof typeof colWidths) => {
        console.log('🔧 startResize called for column:', col, 'startWidth:', colWidths[col]);
        e.preventDefault();
        e.stopPropagation();
        resizingRef.current = {
            col,
            startX: e.clientX,
            startWidth: colWidths[col]
        };
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none'; // Disable selection during drag
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        console.log('✅ Resize started, listeners attached');
    };


    // --- Column Reordering (Drag & Drop) ---

    const handleDragStart = (e: React.DragEvent, columnId: string) => {
        console.log('🎯 Column drag started:', columnId);
        setDraggedColumn(columnId);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', columnId);

        // Add visual feedback to dragged element
        if (e.currentTarget instanceof HTMLElement) {
            e.currentTarget.style.opacity = '0.4';
        }
    };

    const handleDragOver = (e: React.DragEvent, targetColumnId: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        if (draggedColumn && draggedColumn !== targetColumnId) {
            setDropIndicatorColumn(targetColumnId);
        }
    };

    const handleDrop = (e: React.DragEvent, targetColumnId: string) => {
        e.preventDefault();
        console.log('📍 Drop on column:', targetColumnId);

        if (!draggedColumn || draggedColumn === targetColumnId) {
            setDraggedColumn(null);
            setDropIndicatorColumn(null);
            return;
        }

        const newOrder = [...columnOrder];
        const draggedIdx = newOrder.indexOf(draggedColumn);
        const targetIdx = newOrder.indexOf(targetColumnId);

        // Remove dragged column and insert at target position
        newOrder.splice(draggedIdx, 1);
        newOrder.splice(targetIdx, 0, draggedColumn);

        console.log('✅ New column order:', newOrder);
        setColumnOrder(newOrder);
        setDraggedColumn(null);
        setDropIndicatorColumn(null);
    };

    const handleDragEnd = (e: React.DragEvent) => {
        // Reset visual feedback
        if (e.currentTarget instanceof HTMLElement) {
            e.currentTarget.style.opacity = '1';
        }
        setDraggedColumn(null);
        setDropIndicatorColumn(null);
    };


    const Resizer = ({ col }: { col: keyof typeof colWidths }) => (
        <div
            className="absolute -right-3 top-0 bottom-0 w-8 cursor-col-resize z-[60] flex justify-center items-center group touch-none select-none hover:bg-blue-50/30"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => startResize(e, col)}
            title="Arrastar para redimensionar"
        >
            <div className="w-[2px] h-full bg-gray-300 group-hover:bg-blue-500 group-hover:w-[3px] transition-all"></div>
        </div>
    );

    // Map column IDs to their width keys in colWidths state
    const colWidthKeys: Record<string, keyof typeof colWidths> = {
        index: 'index', imovel: 'name', tipo: 'type', municipio: 'location', status: 'status',
        proprietarios: 'partners', valorMercado: 'marketValue', endereco: 'street', cep: 'zipCode',
        bairro: 'neighborhood', areaTotal: 'areaTotal', matricula: 'matricula', iptu: 'iptu',
        cartorio: 'registryOffice', dataAquisicao: 'acquisitionDate', statusIrpf: 'irpfStatus',
        origemAquisicao: 'acquisitionOrigin', valorAquisicao: 'value', valorDeclarado: 'declaredValue',
        previsaoVenda: 'saleForecast', locacao: 'rentalValue', yield: 'yield', acoes: 'actions'
    };

    const renderColumnHeader = (colId: string, isSticky = false) => {
        const widthKey = colWidthKeys[colId];
        const width = colWidths[widthKey];
        const label = AVAILABLE_COLUMNS.find(c => c.id === colId)?.label || (colId === 'index' ? '#' : colId.toUpperCase());

        // Custom header content for Actions column
        if (colId === 'acoes') {
            if (!isQuickEditMode) return null; // Don't show header if not in quick edit? Original logic: {visibleColumns.includes('acoes') && isQuickEditMode && ...}

            return (
                <th key={colId} style={{ minWidth: width }} className="relative py-3 px-4 text-[9px] font-black text-gray-600 uppercase tracking-widest text-center select-none">
                    <div className="flex items-center justify-between gap-2">
                        <span>{label}</span>
                        {assets.length > 0 && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteAll();
                                }}
                                className="px-2 py-1 text-[9px] font-bold text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Deletar todos os imóveis"
                            >
                                🗑️ TODOS
                            </button>
                        )}
                    </div>
                    <Resizer col={widthKey} />
                </th>
            );
        }

        if (colId === 'index') {
            return (
                <th key={colId} style={{ minWidth: width }} className="relative py-3 px-2 text-[9px] font-black text-gray-600 uppercase tracking-widest text-center select-none">
                    {label} <Resizer col={widthKey} />
                </th>
            );
        }

        return (
            <th
                key={colId}
                draggable
                onDragStart={(e) => handleDragStart(e, colId)}
                onDragOver={(e) => handleDragOver(e, colId)}
                onDrop={(e) => handleDrop(e, colId)}
                onDragEnd={handleDragEnd}
                style={{
                    minWidth: width,
                    opacity: draggedColumn === colId ? 0.4 : 1
                }}
                className={`
                    relative py-3 px-4 text-[9px] font-black text-gray-600 uppercase tracking-widest select-none group
                    ${dropIndicatorColumn === colId ? 'border-l-2 border-blue-500 bg-blue-50' : ''}
                    ${colId === 'imovel' ? 'sticky left-0 z-20 bg-gray-100 border-r border-gray-300' : ''}
                    ${['valorMercado', 'areaTotal', 'valorAquisicao', 'valorDeclarado', 'locacao'].includes(colId) ? 'text-right' : ''}
                    ${['status', 'cep', 'dataAquisicao', 'statusIrpf', 'previsaoVenda'].includes(colId) ? 'text-center' : ''}
                    hover:bg-gray-200/50 transition-colors cursor-grab active:cursor-grabbing
                `}
            >
                {label} <Resizer col={widthKey} />
            </th>
        );
    };

    const renderColumnCell = (colId: string, asset: Asset, index: number) => {
        switch (colId) {
            case 'index':
                return <td key={colId} className="py-1 px-2 text-center text-xs text-gray-400 font-medium overflow-hidden text-ellipsis whitespace-nowrap">{index + 1}</td>;

            case 'imovel':
                return (
                    <td key={colId} className="sticky left-0 z-10 bg-white py-1 px-4 align-middle border-r border-gray-200">
                        <div className="flex flex-col gap-1 overflow-hidden">
                            {isQuickEditMode ? (
                                <input
                                    type="text"
                                    value={asset.name}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) => handleInputChange(asset.id, 'name', e.target.value)}
                                    className="text-[11px] font-medium text-gray-900 border border-gray-300 rounded px-2 py-1 w-full focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                />
                            ) : (
                                <span className="text-[11px] font-medium text-gray-900 truncate" title={asset.name}>{asset.name}</span>
                            )}
                        </div>
                    </td>
                );
            case 'tipo':
                return (
                    <td key={colId} className="py-1 px-4 align-middle">
                        {isQuickEditMode ? (
                            <select
                                value={asset.type}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => handleInputChange(asset.id, 'type', e.target.value)}
                                className="text-xs font-medium text-gray-600 uppercase border border-gray-300 rounded px-2 py-1 w-full"
                            >
                                <option value="Apartamento">Apartamento</option>
                                <option value="Casa">Casa</option>
                                <option value="Flat">Flat</option>
                                <option value="Residencial">Residencial</option>
                                <option value="Comercial">Comercial</option>
                                <option value="Terreno">Terreno</option>
                                <option value="Industrial">Industrial</option>
                                <option value="Sala">Sala</option>
                                <option value="Loja">Loja</option>
                                <option value="Galpão">Galpão</option>
                                <option value="Prédio">Prédio</option>
                                <option value="Rural">Rural</option>
                                <option value="Outro">Outro</option>
                            </select>
                        ) : (
                            <span className="text-[10px] font-medium text-gray-600 uppercase truncate block">{asset.type}</span>
                        )}
                    </td>
                );
            case 'municipio':
                return (
                    <td key={colId} className="py-1 px-4 align-middle">
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-[10px] font-semibold text-gray-900 truncate">{asset.city || '---'}</span>
                            <span className="text-[9px] text-gray-400 truncate">{asset.state || '---'}</span>
                        </div>
                    </td>
                );
            case 'status':
                return (
                    <td key={colId} className="py-1 px-4 text-center align-middle">
                        {isQuickEditMode ? (
                            <select
                                value={asset.status}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => handleInputChange(asset.id, 'status', e.target.value)}
                                className="text-[10px] font-medium uppercase border border-gray-300 rounded px-2 py-1 w-full"
                            >
                                <option value="Locado">Locado</option>
                                <option value="Vago">Vago</option>
                                <option value="Em Reforma">Em Reforma</option>
                                <option value="Uso Próprio">Uso Próprio</option>
                            </select>
                        ) : (
                            <span className={`inline-block px-3 py-1 rounded-md text-[10px] font-medium uppercase truncate max-w-full ${asset.status === 'Locado' ? 'bg-blue-100 text-blue-700' :
                                asset.status === 'Vago' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-gray-100 text-gray-600'
                                }`}>
                                {asset.status === 'Locado' ? 'ALUGADO' : asset.status.toUpperCase()}
                            </span>
                        )}
                    </td>
                );
            case 'proprietarios':
                return (
                    <td key={colId} className="py-1 px-4 align-middle">
                        {isQuickEditMode ? (
                            <div className="flex flex-col gap-2 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                                {asset.partners.map((p, i) => (
                                    <div key={i} className="flex items-center gap-1 bg-gray-50 p-1.5 rounded-lg border border-gray-200">
                                        <span className="text-[10px] font-medium">{p.name}</span>
                                        <span className="text-[10px] text-gray-500 ml-auto">{p.percentage}%</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2 overflow-hidden">
                                {asset.partners.map((p, i) => {
                                    const partnerStyle = getPartnerStyle(p.name);
                                    return (
                                        <div key={i} className="flex items-center gap-2 overflow-hidden">
                                            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold uppercase ${partnerStyle.color}`}>
                                                {partnerStyle.initials}
                                            </div>
                                            <div className="flex flex-col truncate">
                                                <span className="text-[10px] font-medium text-gray-500 truncate" title={`${p.percentage}% ${p.name}`}>{p.percentage}% {p.name}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </td>
                );
            case 'valorMercado':
                return (
                    <td key={colId} className="py-1 px-4 text-right align-middle">
                        <span className="text-[11px] font-medium text-gray-900 truncate block">{formatCurrency(asset.marketValue)}</span>
                    </td>
                );
            case 'endereco':
                return (
                    <td key={colId} className="py-1 px-4 align-middle">
                        {isQuickEditMode ? (
                            <input
                                type="text"
                                value={asset.street || ''}
                                onChange={(e) => handleInputChange(asset.id, 'street', e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full text-[10px] border border-gray-300 rounded px-2 py-1"
                            />
                        ) : (
                            <span className="text-[10px] text-gray-900 truncate">{asset.street || '---'}</span>
                        )}
                    </td>
                );
            case 'cep':
                return (
                    <td key={colId} className="py-1 px-4 text-center align-middle">
                        {isQuickEditMode ? (
                            <input
                                type="text"
                                value={asset.zipCode || ''}
                                onChange={(e) => handleInputChange(asset.id, 'zipCode', e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full text-[10px] text-center border border-gray-300 rounded px-2 py-1"
                                placeholder="00000-000"
                            />
                        ) : (
                            <span className="text-[10px] text-gray-900">{asset.zipCode || '---'}</span>
                        )}
                    </td>
                );
            case 'bairro':
                return (
                    <td key={colId} className="py-1 px-4 align-middle">
                        {isQuickEditMode ? (
                            <input
                                type="text"
                                value={asset.neighborhood || ''}
                                onChange={(e) => handleInputChange(asset.id, 'neighborhood', e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full text-[10px] border border-gray-300 rounded px-2 py-1"
                            />
                        ) : (
                            <span className="text-[10px] text-gray-900 truncate">{asset.neighborhood || '---'}</span>
                        )}
                    </td>
                );
            case 'areaTotal':
                return (
                    <td key={colId} className="py-1 px-4 text-right align-middle">
                        {isQuickEditMode ? (
                            <input
                                type="number"
                                value={asset.areaTotal || ''}
                                onChange={(e) => handleInputChange(asset.id, 'areaTotal', parseFloat(e.target.value) || 0)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full text-[10px] text-right border border-gray-300 rounded px-2 py-1"
                            />
                        ) : (
                            <span className="text-[10px] text-gray-900">{asset.areaTotal ? `${asset.areaTotal} m²` : '---'}</span>
                        )}
                    </td>
                );
            case 'matricula':
                return (
                    <td key={colId} className="py-1 px-4 align-middle">
                        {isQuickEditMode ? (
                            <input
                                type="text"
                                value={asset.matricula || ''}
                                onChange={(e) => handleInputChange(asset.id, 'matricula', e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full text-[10px] border border-gray-300 rounded px-2 py-1"
                            />
                        ) : (
                            <span className="text-[10px] text-gray-900 truncate">{asset.matricula || '---'}</span>
                        )}
                    </td>
                );
            case 'iptu':
                return (
                    <td key={colId} className="py-1 px-4 align-middle">
                        {isQuickEditMode ? (
                            <input
                                type="text"
                                value={asset.iptu || ''}
                                onChange={(e) => handleInputChange(asset.id, 'iptu', e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full text-[10px] border border-gray-300 rounded px-2 py-1"
                            />
                        ) : (
                            <span className="text-[10px] text-gray-900 truncate">{asset.iptu || '---'}</span>
                        )}
                    </td>
                );
            case 'cartorio':
                return (
                    <td key={colId} className="py-1 px-4 align-middle">
                        {isQuickEditMode ? (
                            <input
                                type="text"
                                value={asset.registryOffice || ''}
                                onChange={(e) => handleInputChange(asset.id, 'registryOffice', e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full text-[10px] border border-gray-300 rounded px-2 py-1"
                            />
                        ) : (
                            <span className="text-[10px] text-gray-900 truncate">{asset.registryOffice || '---'}</span>
                        )}
                    </td>
                );
            case 'dataAquisicao':
                return (
                    <td key={colId} className="py-1 px-4 text-center align-middle">
                        {isQuickEditMode ? (
                            <input
                                type="date"
                                value={asset.acquisitionDate || ''}
                                onChange={(e) => handleInputChange(asset.id, 'acquisitionDate', e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full text-[10px] text-center border border-gray-300 rounded px-2 py-1"
                            />
                        ) : (
                            <span className="text-[10px] text-gray-900">{asset.acquisitionDate || '---'}</span>
                        )}
                    </td>
                );
            case 'statusIrpf':
                return (
                    <td key={colId} className="py-1 px-4 text-center align-middle">
                        {isQuickEditMode ? (
                            <select
                                value={asset.irpfStatus || 'Isento'}
                                onChange={(e) => handleInputChange(asset.id, 'irpfStatus', e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                className="text-[10px] font-medium border border-gray-300 rounded px-2 py-1 w-full"
                            >
                                <option value="Declarado">Declarado</option>
                                <option value="Pendente">Pendente</option>
                                <option value="Isento">Isento</option>
                            </select>
                        ) : (
                            <span className={`inline-block px-2 py-1 rounded-md text-[10px] font-medium ${asset.irpfStatus === 'Declarado' ? 'bg-green-100 text-green-700' :
                                asset.irpfStatus === 'Pendente' ? 'bg-orange-100 text-orange-700' :
                                    'bg-gray-100 text-gray-600'
                                }`}>
                                {asset.irpfStatus || 'Isento'}
                            </span>
                        )}
                    </td>
                );
            case 'origemAquisicao':
                return (
                    <td key={colId} className="py-1 px-4 align-middle">
                        {isQuickEditMode ? (
                            <input
                                type="text"
                                value={asset.acquisitionOrigin || ''}
                                onChange={(e) => handleInputChange(asset.id, 'acquisitionOrigin', e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full text-[10px] border border-gray-300 rounded px-2 py-1"
                            />
                        ) : (
                            <span className="text-[10px] text-gray-900 truncate">{asset.acquisitionOrigin || '---'}</span>
                        )}
                    </td>
                );
            case 'yield':
                const annualRent = (Number(asset.rentalValue) || 0) * 12;
                const aquisition = Number(asset.value) || 0;
                const yieldVal = aquisition > 0 ? (annualRent / aquisition) * 100 : 0;

                return (
                    <td key={colId} className="py-1 px-4 text-right align-middle">
                        <span className={`text-[11px] font-bold ${yieldVal > 6 ? 'text-green-600' : 'text-gray-600'}`}>
                            {yieldVal > 0 ? `${yieldVal.toFixed(2)}%` : '---'}
                        </span>
                    </td>
                );
            case 'valorAquisicao':
                return (
                    <td key={colId} className="py-1 px-4 text-right align-middle">
                        {isQuickEditMode ? (
                            <input
                                type="number"
                                step="0.01"
                                value={asset.value || ''}
                                onChange={(e) => handleInputChange(asset.id, 'value', parseFloat(e.target.value) || 0)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full text-[10px] text-right border border-gray-300 rounded px-2 py-1"
                            />
                        ) : (
                            <span className="text-[11px] font-medium text-gray-900 truncate block">
                                {formatCurrency(asset.value)}
                            </span>
                        )}
                    </td>
                );
            case 'valorDeclarado':
                return (
                    <td key={colId} className="py-1 px-4 text-right align-middle">
                        {isQuickEditMode ? (
                            <input
                                type="number"
                                step="0.01"
                                value={asset.declaredValue || ''}
                                onChange={(e) => handleInputChange(asset.id, 'declaredValue', parseFloat(e.target.value) || 0)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full text-[10px] text-right border border-gray-300 rounded px-2 py-1"
                            />
                        ) : (
                            <span className="text-[11px] font-medium text-gray-900 truncate block">
                                {formatCurrency(asset.declaredValue || 0)}
                            </span>
                        )}
                    </td>
                );
            case 'previsaoVenda':
                return (
                    <td key={colId} className="py-1 px-4 text-center align-middle">
                        {isQuickEditMode ? (
                            <input
                                type="date"
                                value={asset.saleForecast || ''}
                                onChange={(e) => handleInputChange(asset.id, 'saleForecast', e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full text-[10px] text-center border border-gray-300 rounded px-2 py-1"
                            />
                        ) : (
                            <span className="text-[10px] text-gray-900">{asset.saleForecast || '---'}</span>
                        )}
                    </td>
                );
            case 'locacao':
                return (
                    <td key={colId} className="py-1 px-4 text-right align-middle">
                        {asset.rentalValue > 0 ? (
                            <span className="text-[11px] font-medium text-green-600 bg-green-50 px-2 py-1 rounded truncate block">{formatCurrency(asset.rentalValue)}</span>
                        ) : (
                            <span className="text-gray-300">-</span>
                        )}
                    </td>
                );
            case 'acoes':
                if (!isQuickEditMode) return null;
                return (
                    <td key={colId} className="py-1 px-4 text-center align-middle">
                        <div className="flex items-center justify-center gap-2">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteAsset(asset.id);
                                }}
                                className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                                title="Deletar imóvel"
                            >
                                <span className="material-symbols-outlined text-[11px]">delete</span>
                            </button>
                        </div>
                    </td>
                );
            default:
                return null;
        }
    };

    return (
        <>
            <div className="p-2 max-w-full mx-auto flex flex-col h-full space-y-1.5">

                {/* Search and Top Actions */}
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-1">
                            <select
                                value={filters.type}
                                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                                className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 outline-none cursor-pointer hover:bg-gray-50"
                            >
                                <option value="all">Todos os Tipos</option>
                                <option value="Residencial">Residencial</option>
                                <option value="Comercial">Comercial</option>
                                <option value="Terreno">Terreno</option>
                                <option value="Industrial">Industrial</option>
                            </select>
                            <select
                                value={filters.status}
                                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                                className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 outline-none cursor-pointer hover:bg-gray-50"
                            >
                                <option value="all">Todos os Status</option>
                                <option value="Vago">Vago</option>
                                <option value="Alugado">Alugado</option>
                                <option value="Próprio Uso">Próprio Uso</option>
                            </select>

                            <select
                                value={filters.state}
                                onChange={(e) => setFilters(prev => ({ ...prev, state: e.target.value }))}
                                className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 outline-none cursor-pointer hover:bg-gray-50"
                            >
                                <option value="all">Todos os Estados</option>
                                {uniqueStates.map(state => (
                                    <option key={state} value={state}>{state}</option>
                                ))}
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

                            {/* Column Selector */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowColumnSelector(!showColumnSelector)}
                                    className="flex items-center gap-1 px-2 py-1 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
                                    title="Configurar Colunas Visíveis"
                                >
                                    <span className="material-symbols-outlined text-sm">view_column</span>
                                    <span className="text-[10px] font-bold">Colunas</span>
                                </button>

                                {showColumnSelector && (
                                    <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-3 w-56">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-[10px] font-bold text-gray-500 uppercase">Colunas Visíveis</p>
                                            <button onClick={() => setShowColumnSelector(false)}>
                                                <span className="material-symbols-outlined text-sm text-gray-400 hover:text-gray-600">close</span>
                                            </button>
                                        </div>

                                        <div className="space-y-1">
                                            {AVAILABLE_COLUMNS.map(col => (
                                                <label
                                                    key={col.id}
                                                    className={`flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-50 ${col.locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={visibleColumns.includes(col.id)}
                                                        onChange={(e) => {
                                                            if (!col.locked) {
                                                                setVisibleColumns(prev =>
                                                                    e.target.checked
                                                                        ? [...prev, col.id]
                                                                        : prev.filter(id => id !== col.id)
                                                                );
                                                            }
                                                        }}
                                                        disabled={col.locked}
                                                        className="rounded border-gray-300"
                                                    />
                                                    <span className="text-xs font-medium">{col.label}</span>
                                                    {col.locked && <span className="ml-auto material-symbols-outlined text-[12px] text-gray-300">lock</span>}
                                                </label>
                                            ))}
                                        </div>

                                        <button
                                            onClick={() => setVisibleColumns(['imovel', 'tipo', 'municipio', 'status', 'proprietarios', 'valorMercado', 'locacao', 'acoes'])}
                                            className="mt-2 w-full px-2 py-1 text-[10px] font-bold text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                        >
                                            RESTAURAR PADRÃO
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-3">
                                {/* Backup Buttons */}
                                <DatabaseBackup
                                    currentAssets={assets}
                                    onImportComplete={() => {
                                        // Reload assets from context
                                        const { assets: freshAssets } = useAssetContext();
                                        onUpdateAssets(freshAssets);
                                    }}
                                />

                                {/* New Asset Button - COMPACT */}
                                <button
                                    onClick={() => onNavigate('asset_new')}
                                    className="flex items-center gap-1 px-2 py-1 bg-[#111827] hover:bg-black text-white text-[10px] font-bold rounded transition-colors"
                                >
                                    <span className="material-symbols-outlined text-sm">add</span> Novo
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex items-center gap-1 border-b border-gray-200 pb-1 overflow-x-auto">
                        <button onClick={() => onNavigate('dashboard')} className="px-3 py-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide hover:text-gray-900">Dashboard</button>
                        <button className="px-4 py-1.5 bg-[#111827] text-white rounded-lg text-[10px] font-bold uppercase tracking-wide shadow-sm">Imóveis</button>
                        <button onClick={() => onNavigate('import_irpf')} className="px-3 py-1.5 text-[10px] font-bold text-purple-600 uppercase tracking-wide hover:bg-purple-50 rounded-lg flex items-center gap-1 transition-colors">
                            <span className="material-symbols-outlined text-xs">upload_file</span> Importar IRPF
                        </button>
                        <button onClick={() => onNavigate('audit')} className="px-3 py-1.5 text-[10px] font-bold text-green-600 uppercase tracking-wide hover:bg-green-50 rounded-lg flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">pie_chart</span> Participações
                        </button>
                        <button onClick={() => onNavigate('financial_overview')} className="px-3 py-1.5 text-[10px] font-bold text-orange-600 uppercase tracking-wide hover:bg-orange-50 rounded-lg flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">account_balance</span> Financiamentos
                        </button>
                        <button onClick={() => onNavigate('report_executive')} className="px-3 py-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide hover:text-gray-900">Relatórios</button>
                        <button className="px-3 py-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide hover:text-gray-900">Documentação</button>
                    </div>
                </div>


                {/* Owner Filter Badges - FIXED 4 OWNERS */}
                <div className="flex items-center gap-2 pb-1">
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">FILTRAR:</span>
                    {FIXED_OWNERS.map(owner => {
                        const style = getPartnerStyle(owner);
                        const isSelected = filters.owners.includes(owner);
                        return (
                            <button
                                key={owner}
                                onClick={() => toggleOwnerFilter(owner)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all ${isSelected
                                    ? style.color + ' ring-2 ring-offset-1 ring-current shadow-md'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {owner}
                            </button>
                        );
                    })}
                    {/* Clear Filters Button */}
                    {(filters.owners.length > 0 || filters.search || filters.type !== 'all' || filters.status !== 'all' || filters.state !== 'all') && (
                        <button
                            onClick={clearFilters}
                            className="ml-auto px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 text-[10px] font-bold rounded-lg border border-red-200 transition-all uppercase tracking-wide"
                        >
                            ✕ LIMPAR
                        </button>
                    )}
                </div>

                {/* KPIs - ULTRA COMPACT SINGLE LINE */}
                <div className="flex items-stretch gap-1">
                    <div className="flex-1 bg-white px-2 py-1 rounded border border-gray-200">
                        <p className="text-[6px] font-bold text-gray-400 uppercase tracking-widest">Total Aquisição</p>
                        <p className="text-xs font-black text-gray-900 leading-tight">{formatCurrency(totalValue)}</p>
                    </div>
                    <div className="flex-1 bg-white px-2 py-1 rounded border border-gray-200">
                        <div className="flex items-center justify-between">
                            <p className="text-[6px] font-bold text-gray-400 uppercase tracking-widest">Total Mercado</p>
                            <span className={`px-0.5 py-0 rounded text-[6px] font-bold ${marketGrowth >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {marketGrowth >= 0 ? '+' : ''}{marketGrowth.toFixed(1)}%
                            </span>
                        </div>
                        <p className="text-xs font-black text-gray-900 leading-tight">{formatCurrency(totalMarketValue)}</p>
                    </div>
                    <div className="flex-1 bg-white px-2 py-1 rounded border border-gray-200">
                        <p className="text-[6px] font-bold text-gray-400 uppercase tracking-widest">Ativos Cadastrados</p>
                        <div className="flex items-baseline gap-0.5">
                            <p className="text-xs font-black text-[#3b82f6] leading-tight">{filteredAssets.length}</p>
                            <span className="text-[8px] font-medium text-gray-500">{filteredAssets.length !== assets.length ? `de ${assets.length} ` : ''}Imóveis</span>
                        </div>
                    </div>
                    <div className="md:col-span-2 flex flex-col justify-center gap-1.5">
                        <div className="bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm flex justify-between items-center cursor-pointer hover:bg-gray-50">
                            <span className="text-[10px] font-medium text-gray-600">Colunas: <span className="font-bold text-gray-900">Visíveis (8)</span></span>
                        </div>
                        {viewMode === 'assets_list' && (
                            <div
                                onClick={() => setIsQuickEditMode(!isQuickEditMode)}
                                className={`bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm flex justify-between items-center cursor-pointer transition-colors ${isQuickEditMode ? 'ring-2 ring-primary border-primary' : 'hover:bg-gray-50'}`}
                            >
                                <span className="text-[10px] font-medium text-gray-600">Edição Rápida</span>
                                <div className={`w-6 h-3 rounded-full relative transition-colors ${isQuickEditMode ? 'bg-primary' : 'bg-gray-200'}`}>
                                    <div className={`absolute top-0.5 w-2 h-2 bg-white rounded-full transition-all ${isQuickEditMode ? 'right-0.5' : 'left-0.5'}`}></div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {viewMode === 'assets_list' ? (
                    /* --- Table View --- */
                    <div className="flex flex-col gap-8 animate-fade-in-up">
                        {/* Declared Assets Table */}
                        <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col">
                            <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-green-500 text-lg">check_circle</span>
                                    <span className="text-xs font-bold text-green-700 uppercase tracking-widest">Ativos Declarados (IRPF)</span>
                                </div>
                                <span className="bg-[#3b82f6] text-white text-xs font-bold px-2 py-0.5 rounded">{assets.filter(a => !a.irpfStatus || a.irpfStatus === 'Declarado').length}</span>
                            </div>

                            <div className="overflow-x-auto w-full">
                                <table className="min-w-full text-left border-collapse text-[10px]">
                                    <thead className="bg-gray-100 border-b border-gray-200 sticky top-0 z-10">
                                        <tr>
                                            {columnOrder
                                                .filter(colId => visibleColumns.includes(colId) || colId === 'index')
                                                .map(colId => renderColumnHeader(colId))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filteredAssets.filter(a => a.irpfStatus !== 'Pendente').map((asset, index) => (
                                            <tr
                                                key={asset.id}
                                                className={`
                                                    ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} 
                                                    hover:bg-blue-50 transition-colors group 
                                                    ${!isQuickEditMode ? 'cursor-pointer' : ''}
                                                `}
                                                onClick={() => handleRowClick(asset)}
                                            >
                                                {columnOrder
                                                    .filter(colId => visibleColumns.includes(colId) || colId === 'index')
                                                    .map(colId => renderColumnCell(colId, asset, index))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Pending Assets Table */}
                        {assets.some(a => a.irpfStatus === 'Pendente') && (
                            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col">
                                <div className="px-6 py-3 border-b border-gray-100 flex items-center justify-between bg-orange-50/50">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-orange-500 text-lg">pending</span>
                                        <span className="text-xs font-medium text-orange-700 uppercase tracking-widest">Ativos Pendentes (IRPF)</span>
                                    </div>
                                    <span className="bg-orange-500 text-white text-xs font-medium px-2 py-0.5 rounded">{assets.filter(a => a.irpfStatus === 'Pendente').length}</span>
                                </div>

                                <div className="overflow-x-auto w-full">
                                    <table className="min-w-full text-left border-collapse">
                                        <thead className="bg-gray-100 border-b border-gray-200 sticky top-0 z-10">
                                            <tr>
                                                {columnOrder
                                                    .filter(colId => visibleColumns.includes(colId) || colId === 'index')
                                                    .map(colId => renderColumnHeader(colId))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {filteredAssets.filter(a => a.irpfStatus === 'Pendente').map((asset, index) => (
                                                <tr
                                                    key={asset.id}
                                                    className={`
                                                        ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} 
                                                        hover:bg-blue-50 transition-colors group 
                                                        ${!isQuickEditMode ? 'cursor-pointer' : ''}
                                                    `}
                                                    onClick={() => handleRowClick(asset)}
                                                >
                                                    {columnOrder
                                                        .filter(colId => visibleColumns.includes(colId) || colId === 'index')
                                                        .map(colId => renderColumnCell(colId, asset, index))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    /* --- Grid View (Cards) --- */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20 animate-fade-in-up">
                        {filteredAssets.map(asset => (
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
                                        <span className={`px-2 py-1 rounded text-[10px] font-medium uppercase backdrop-blur-md shadow-sm ${asset.status === 'Locado' ? 'bg-green-500/90 text-white' :
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
                                            {asset.partners.slice(0, 3).map((p, i) => (
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
            </div >

            {/* Edit/View Asset Modal */}
            {
                selectedAssetForModal && (
                    <AssetRegistration
                        onNavigate={onNavigate}
                        asset={selectedAssetForModal}
                        isModal={true}
                        onClose={() => setSelectedAssetForModal(null)}
                        onUpdateAsset={(updated) => handleModalSave(updated)}
                    />
                )
            }
        </>
    );
};