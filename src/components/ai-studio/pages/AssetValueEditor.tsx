import React, { useState } from 'react';
import { Asset, PartnerShare } from '../types';

interface Props {
    assets: Asset[];
    onUpdateAssets: (assets: Asset[]) => void;
    onUpdateAsset?: (asset: Asset) => void;
}

// Partner configuration for consistent colors and IDs
const PARTNERS = [
    { name: 'Raquel', color: 'text-blue-600', bg: 'bg-blue-50' },
    { name: 'Marília', color: 'text-teal-600', bg: 'bg-teal-50' },
    { name: 'Wândrio', color: 'text-orange-600', bg: 'bg-orange-50' },
    { name: 'Tilinha', color: 'text-purple-600', bg: 'bg-purple-50' },
];

const PERCENTAGE_OPTIONS = [0, 25, 50, 100];

export const AssetValueEditor: React.FC<Props> = ({ assets, onUpdateAssets, onUpdateAsset }) => {
    // Local state for immediate UI updates
    const [internalAssets, setInternalAssets] = useState<Asset[]>(assets);
    const [selectedPartners, setSelectedPartners] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState('Todos');
    const [selectedStatus, setSelectedStatus] = useState('Todos');

    // Derived lists for filters
    const uniqueTypes = Array.from(new Set(assets.map(a => a.type))).filter(Boolean);
    const uniqueStatus = Array.from(new Set(assets.map(a => a.status))).filter(Boolean);

    // Refs for debouncing
    const saveTimeouts = React.useRef<Record<string, NodeJS.Timeout>>({});

    // Sync internal state when props change
    React.useEffect(() => {
        setInternalAssets(assets);
    }, [assets]);

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

        // 1. Update local state immediately for UI responsiveness
        const updatedList = internalAssets.map(a => a.id === id ? { ...a, [field]: numValue } : a);
        setInternalAssets(updatedList);

        // 2. Queue Debounced Save
        const changedAsset = updatedList.find(a => a.id === id);
        if (changedAsset && onUpdateAsset) {
            // Clear existing timer for this asset
            if (saveTimeouts.current[id]) {
                clearTimeout(saveTimeouts.current[id]);
            }

            // Set new timer
            saveTimeouts.current[id] = setTimeout(() => {
                onUpdateAsset(changedAsset);
                delete saveTimeouts.current[id];
            }, 1000);
        } else {
            // Fallback to bulk update if singular not provided (legacy)
            onUpdateAssets(updatedList);
        }
    };

    const handlePartnerPercentageChange = (assetId: string, partnerName: string, newValueStr: string) => {
        const newValue = parseFloat(newValueStr) || 0;

        // 1. Update local logic
        const updatedList = internalAssets.map(asset => {
            if (asset.id === assetId) {
                let newPartners = [...asset.partners];
                const existingPartnerIndex = newPartners.findIndex(p => p.name.includes(partnerName));

                if (existingPartnerIndex >= 0) {
                    newPartners[existingPartnerIndex] = { ...newPartners[existingPartnerIndex], percentage: newValue };
                } else if (newValue > 0) {
                    const pStyle = PARTNERS.find(p => p.name === partnerName);
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

        setInternalAssets(updatedList);

        // 2. Queue Debounced Save for Partner Change
        const changedAsset = updatedList.find(a => a.id === assetId);
        if (changedAsset && onUpdateAsset) {
            if (saveTimeouts.current[assetId]) clearTimeout(saveTimeouts.current[assetId]);
            saveTimeouts.current[assetId] = setTimeout(() => {
                onUpdateAsset(changedAsset);
                delete saveTimeouts.current[assetId];
            }, 1000);
        } else {
            onUpdateAssets(updatedList);
        }
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
    const filteredAssets = internalAssets.filter(asset => {
        const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) || asset.id.toLowerCase().includes(searchTerm.toLowerCase());
        if (!matchesSearch) return false;

        if (selectedType !== 'Todos' && asset.type !== selectedType) return false;
        if (selectedStatus !== 'Todos' && asset.status !== selectedStatus) return false;

        if (selectedPartners.length > 0) {
            // Show asset if ANY of the selected partners has percentage > 0 in it
            const hasPartner = asset.partners.some(p => selectedPartners.includes(p.name) && p.percentage > 0);
            return hasPartner;
        }
        return true;
    });

    // Calculations for Totals
    const totalMarket = internalAssets.reduce((sum, a) => sum + a.marketValue, 0);
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

    // State for tracking active edit field to prevent formatting issues while typing
    const [editingState, setEditingState] = useState<{ id: string, field: string, value: string } | null>(null);

    const handleFocus = (id: string, field: keyof Asset, currentValue: number) => {
        // When focusing, show raw value (or comma separated) without dots
        // e.g. 1500.50 -> "1500,50"
        const rawString = currentValue ? currentValue.toFixed(2).replace('.', ',') : '';
        setEditingState({ id, field, value: rawString });
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!editingState) return;
        let newValue = e.target.value;

        // Allow ONLY numbers, comma, and optional negative sign at start
        // This unblocks users if the value somehow became negative (e.g. -4)
        if (!/^[-]?[0-9,]*$/.test(newValue)) return;

        setEditingState({ ...editingState, value: newValue });

        // Update underlying model debounced or immediate?
        // Immediate model update is better for "totals" calculation to be live.
        // We handle the negative sign in parsing
        const numValue = parseFloat(newValue.replace(/\./g, '').replace(',', '.')) || 0;

        // Update Internal Assets (Model)
        const updatedList = internalAssets.map(a => a.id === editingState.id ? { ...a, [editingState.field]: numValue } : a);
        setInternalAssets(updatedList);

        // Queue Debounced Save to Backend
        const changedAsset = updatedList.find(a => a.id === editingState.id);
        if (changedAsset && onUpdateAsset) {
            if (saveTimeouts.current[editingState.id]) {
                clearTimeout(saveTimeouts.current[editingState.id]);
            }
            saveTimeouts.current[editingState.id] = setTimeout(() => {
                onUpdateAsset(changedAsset);
                delete saveTimeouts.current[editingState.id];
            }, 1000);
        } else {
            onUpdateAssets(updatedList);
        }
    };

    const handleBlur = () => {
        setEditingState(null);
    };

    // Helper to get display value
    const getDisplayValue = (asset: Asset, field: keyof Asset & ('declaredValue' | 'marketValue' | 'rentalValue')) => {
        if (editingState && editingState.id === asset.id && editingState.field === field) {
            return editingState.value;
        }
        const val = asset[field] || 0;
        return val > 0 ? formatCurrency(val) : (editingState?.id === asset.id ? '' : '-');
    };

    // ... (rest of filtering active)

    return (
        <div className="p-8 max-w-[1600px] mx-auto pb-32">
            {/* ... Header and Controls ... */}

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
                                                {/* Status Removed as requested */}
                                            </div>
                                        </div>
                                    </td>

                                    {/* Inputs */}
                                    <td className="py-3 px-2">
                                        <input
                                            type="text"
                                            value={getDisplayValue(asset, 'declaredValue')}
                                            onFocus={() => handleFocus(asset.id, 'declaredValue', asset.declaredValue || 0)}
                                            onChange={handleInputChange}
                                            onBlur={handleBlur}
                                            className="w-full bg-gray-50 border border-transparent hover:border-gray-200 focus:border-blue-500 focus:bg-white rounded-lg py-2 px-3 text-center text-sm font-bold text-gray-900 outline-none transition-all"
                                        />
                                    </td>
                                    <td className="py-3 px-2">
                                        <input
                                            type="text"
                                            value={getDisplayValue(asset, 'marketValue')}
                                            onFocus={() => handleFocus(asset.id, 'marketValue', asset.marketValue)}
                                            onChange={handleInputChange}
                                            onBlur={handleBlur}
                                            className="w-full bg-gray-50 border border-transparent hover:border-gray-200 focus:border-blue-500 focus:bg-white rounded-lg py-2 px-3 text-center text-sm font-bold text-gray-900 outline-none transition-all"
                                        />
                                    </td>
                                    <td className="py-3 px-2">
                                        <input
                                            type="text"
                                            value={getDisplayValue(asset, 'rentalValue')}
                                            onFocus={() => handleFocus(asset.id, 'rentalValue', asset.rentalValue)}
                                            onChange={handleInputChange}
                                            onBlur={handleBlur}
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