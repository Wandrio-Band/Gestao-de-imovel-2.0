import React, { useState } from 'react';
import { useAssetContext } from '@/context/AssetContext';
import { Asset } from '../types';

// Helper to format currency
const formatCurrency = (value: number) => {
    if (value >= 1000000) {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 1 }).format(value); // 1.2M format if needed, currently using full
    }
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const formatCurrencyCompact = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
};

// Colors matching the screenshot specifically for this view
const PARTNER_CONFIG: Record<string, { color: string, bg: string, text: string, barColor: string }> = {
    'Raquel': { color: 'bg-blue-100', bg: 'bg-blue-50', text: 'text-blue-700', barColor: 'bg-blue-500' },
    'Marília': { color: 'bg-teal-100', bg: 'bg-teal-50', text: 'text-teal-700', barColor: 'bg-teal-400' },
    'Wândrio': { color: 'bg-purple-100', bg: 'bg-purple-50', text: 'text-purple-700', barColor: 'bg-purple-500' },
    'Tilinha': { color: 'bg-orange-100', bg: 'bg-orange-50', text: 'text-orange-700', barColor: 'bg-orange-400' },
};

// Default fallback for unknown partners
const DEFAULT_STYLE = { color: 'bg-gray-100', bg: 'bg-gray-50', text: 'text-gray-700', barColor: 'bg-gray-400' };

export const PartnerAudit: React.FC = () => {
    const { assets } = useAssetContext();
    const [expandedAssetId, setExpandedAssetId] = useState<string | null>(null);
    const [selectedType, setSelectedType] = useState('Todos');
    const [selectedStatus, setSelectedStatus] = useState('Todos');
    const [selectedUF, setSelectedUF] = useState('Todas');
    const [valueBasis, setValueBasis] = useState<'market' | 'acquisition' | 'irpf'>('market');

    const toggleExpand = (id: string) => {
        setExpandedAssetId(expandedAssetId === id ? null : id);
    };

    // Derived lists for filters
    const uniqueTypes = Array.from(new Set(assets.map(a => a.type))).filter(Boolean);
    const uniqueStatus = Array.from(new Set(assets.map(a => a.status))).filter(Boolean);
    const uniqueUFs = Array.from(new Set(assets.map(a => a.state))).filter(Boolean);

    const filteredAssets = assets.filter(asset => {
        if (selectedType !== 'Todos' && asset.type !== selectedType) return false;
        if (selectedStatus !== 'Todos' && asset.status !== selectedStatus) return false;
        if (selectedUF !== 'Todas' && asset.state !== selectedUF) return false;
        return true;
    });

    // Helper to get the base value of the asset depending on selection
    const getAssetBaseValue = (asset: Asset) => {
        if (valueBasis === 'irpf') return asset.declaredValue || 0;
        return valueBasis === 'market' ? asset.marketValue : asset.value;
    };

    const totalFilteredValue = filteredAssets.reduce((acc, curr) => acc + getAssetBaseValue(curr), 0);

    // Helper to get partner percentage for a specific asset safely
    const getPartnerPercent = (asset: Asset, partnerName: string) => {
        const partner = asset.partners.find(p => p.name.includes(partnerName) || (partnerName === 'Tilinha' && p.name.includes('Tilinha')));
        return partner ? partner.percentage : 0;
    };

    const getPartnerValue = (asset: Asset, percentage: number) => {
        return getAssetBaseValue(asset) * (percentage / 100);
    };

    // Calculate Column Totals
    const calculatePartnerTotal = (partnerName: string) => {
        return filteredAssets.reduce((acc, asset) => {
            const pct = getPartnerPercent(asset, partnerName);
            return acc + getPartnerValue(asset, pct);
        }, 0);
    };

    const getAssetIcon = (type: string) => {
        switch (type) {
            case 'Residencial': return 'apartment';
            case 'Comercial': return 'domain';
            case 'Terreno': return 'landscape';
            case 'Industrial': return 'factory';
            default: return 'home';
        }
    };

    return (
        <div className="p-8 max-w-[1600px] mx-auto pb-24">

            {/* Header Breadcrumbs & Title */}
            <div className="mb-8">
                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                    <span>GESTÃO INTEGRADA</span>
                    <span className="material-symbols-outlined text-xs">chevron_right</span>
                    <span className="text-gray-900">VISÃO AUDITORIA</span>
                </div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Cotas e Ativos</h1>
                <p className="text-gray-500 mt-1">Gerencie a distribuição de participações e audite valores em tempo real.</p>
            </div>

            {/* Sócio Legend Tabs */}
            <div className="flex gap-2 mb-6">
                <span className="text-xs font-bold text-gray-400 self-center mr-2 uppercase">Sócios:</span>
                {Object.entries(PARTNER_CONFIG).map(([name, style]) => (
                    <div key={name} className={`px-3 py-1 rounded-md text-xs font-bold ${style.bg} ${style.text} flex items-center gap-2`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${style.text.replace('text', 'bg').replace('700', '500')}`}></span>
                        {name === 'Tilinha' ? 'Inventário Tilinha' : name}
                    </div>
                ))}
            </div>

            {/* Filters Bar */}
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
                <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 outline-none cursor-pointer hover:bg-gray-50 shadow-sm w-full lg:w-48"
                >
                    <option value="Todos">Todos os Tipos</option>
                    {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 outline-none cursor-pointer hover:bg-gray-50 shadow-sm w-full lg:w-48"
                >
                    <option value="Todos">Todos os Status</option>
                    {uniqueStatus.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select
                    value={selectedUF}
                    onChange={(e) => setSelectedUF(e.target.value)}
                    className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 outline-none cursor-pointer hover:bg-gray-50 shadow-sm w-full lg:w-32"
                >
                    <option value="Todas">UF: Todas</option>
                    {uniqueUFs.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                </select>

                <div className="flex-1"></div> {/* Spacer to push calc base to right */}

                <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl p-1 shadow-sm self-start lg:self-auto">
                    <span className="pl-3 text-[10px] font-bold text-gray-400 uppercase">BASE DE CÁLCULO:</span>
                    <div className="flex">
                        <button
                            onClick={() => setValueBasis('market')}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-colors ${valueBasis === 'market' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            MERCADO
                        </button>
                        <button
                            onClick={() => setValueBasis('acquisition')}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-colors ${valueBasis === 'acquisition' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            AQUISIÇÃO
                        </button>
                        <button
                            onClick={() => setValueBasis('irpf')}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-colors ${valueBasis === 'irpf' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            VALOR IRPF
                        </button>
                    </div>
                </div>
            </div>

            {/* Summary Blue Bar */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center justify-between mb-8">
                <div className="flex items-center gap-2 text-blue-800">
                    <span className="material-symbols-outlined">filter_list</span>
                    <span className="text-sm font-medium">
                        Total de <span className="font-bold">{filteredAssets.length}</span> imóveis filtrados, <span className="font-black">R$ {formatCurrency(totalFilteredValue)}</span> em cotas ({valueBasis === 'market' ? 'Mercado' : valueBasis === 'acquisition' ? 'Aquisição' : 'Valor IRPF'})
                    </span>
                </div>
                <button className="text-[10px] font-bold text-blue-600 hover:text-blue-800 uppercase tracking-wider">Limpar Filtros</button>
            </div>

            {/* Main Grid/Table */}
            <div className="bg-white border border-gray-200 rounded-[1.5rem] shadow-sm overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-gray-100 bg-white">
                    <div className="col-span-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Ativo Imobiliário</div>
                    <div className="col-span-2 text-[10px] font-black text-gray-500 uppercase tracking-widest">Localização</div>
                    <div className="col-span-1 text-center text-[10px] font-black text-blue-600 uppercase tracking-widest">Raquel</div>
                    <div className="col-span-1 text-center text-[10px] font-black text-teal-600 uppercase tracking-widest">Marilia</div>
                    <div className="col-span-1 text-center text-[10px] font-black text-purple-600 uppercase tracking-widest">Wândrio</div>
                    <div className="col-span-1 text-center text-[10px] font-black text-orange-600 uppercase tracking-widest text-nowrap">Inv. Tilinha</div>
                    <div className="col-span-2 text-right text-[10px] font-black text-gray-500 uppercase tracking-widest">Valor Total</div>
                </div>

                {/* Rows */}
                <div className="divide-y divide-gray-100">
                    {filteredAssets.map((asset) => {
                        const isExpanded = expandedAssetId === asset.id;
                        const baseValue = getAssetBaseValue(asset);
                        const totalPercentage = asset.partners.reduce((sum, p) => sum + p.percentage, 0);

                        return (
                            <div key={asset.id} className={`group transition-colors ${isExpanded ? 'bg-blue-50/10' : 'hover:bg-gray-50'}`}>
                                {/* Row */}
                                <div
                                    className="grid grid-cols-12 gap-4 px-6 py-5 items-center cursor-pointer"
                                    onClick={() => toggleExpand(asset.id)}
                                >
                                    {/* Asset Name & ID */}
                                    <div className="col-span-4 flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 group-hover:bg-white group-hover:shadow-sm transition-all">
                                            <span className="material-symbols-outlined">{getAssetIcon(asset.type)}</span>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-sm font-bold text-gray-900 leading-tight">{asset.name}</h3>
                                        </div>
                                    </div>

                                    {/* Location */}
                                    <div className="col-span-2">
                                        <p className="text-sm font-medium text-gray-900">{asset.city || 'N/A'}</p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">{asset.state || 'BR'}</p>
                                    </div>

                                    {/* Partner Percentages & Values Columns */}
                                    {['Raquel', 'Marília', 'Wândrio', 'Tilinha'].map((pName) => {
                                        const pct = getPartnerPercent(asset, pName);
                                        const style = PARTNER_CONFIG[pName] || DEFAULT_STYLE;
                                        const val = getPartnerValue(asset, pct);

                                        return (
                                            <div key={pName} className="col-span-1 flex flex-col items-center justify-center">
                                                {pct > 0 ? (
                                                    <>
                                                        <span className={`px-2 py-0.5 rounded text-[11px] font-black mb-1 ${style.bg} ${style.text}`}>
                                                            {pct}%
                                                        </span>
                                                        <span className="text-[11px] font-medium text-gray-600">
                                                            {formatCurrencyCompact(val)}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="text-[11px] font-bold text-gray-200 mb-1">0%</span>
                                                        <span className="text-[11px] text-gray-300">-</span>
                                                    </>
                                                )}
                                            </div>
                                        );
                                    })}

                                    {/* Total Value */}
                                    <div className="col-span-2 text-right">
                                        {totalPercentage > 0 ? (
                                            <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-[11px] font-black">
                                                {totalPercentage}%
                                            </span>
                                        ) : (
                                            <span className="text-[11px] font-bold text-gray-200">0%</span>
                                        )}
                                        <p className="text-sm font-black text-gray-900 mt-1">{formatCurrency(baseValue)}</p>
                                    </div>
                                </div>

                                {/* Expanded Details Panel */}
                                {isExpanded && (
                                    <div className="px-6 pb-6 pt-0 animate-fade-in-up">
                                        <div className="ml-14 bg-gray-50 border border-gray-200 rounded-xl p-6">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">DETALHES DE REGISTRO</h4>
                                                    <div className="flex gap-8">
                                                        <div>
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase">Endereço</p>
                                                            <p className="text-sm text-gray-800 font-medium">{asset.address}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase">Aquisição</p>
                                                            <p className="text-sm text-gray-800 font-medium">{asset.acquisitionDate || 'N/A'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase">Área</p>
                                                            <p className="text-sm text-gray-800 font-medium">{asset.areaTotal} m²</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-100">Ver Documentos</button>
                                                </div>
                                            </div>

                                            <div className="mt-4 pt-4 border-t border-gray-200">
                                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">BARRA DE DISTRIBUIÇÃO</h4>
                                                <div className="h-2 w-full rounded-full flex overflow-hidden bg-gray-200">
                                                    {asset.partners.map((partner, idx) => {
                                                        const pStyle = Object.entries(PARTNER_CONFIG).find(([key]) => partner.name.includes(key))?.[1] || DEFAULT_STYLE;
                                                        return (
                                                            <div
                                                                key={idx}
                                                                style={{ width: `${partner.percentage}%` }}
                                                                className={`h-full ${pStyle.barColor}`}
                                                                title={`${partner.name}: ${partner.percentage}%`}
                                                            ></div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Footer Total Row */}
                <div className="bg-white border-t-2 border-gray-100 p-6 grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-gray-400">functions</span>
                        <span className="text-xs font-black text-gray-700 uppercase tracking-widest">TOTAL DO PORTFÓLIO</span>
                    </div>

                    {['Raquel', 'Marília', 'Wândrio', 'Tilinha'].map((pName) => {
                        const total = calculatePartnerTotal(pName);
                        const style = PARTNER_CONFIG[pName];
                        return (
                            <div key={pName} className="col-span-1 text-center">
                                <span className={`text-xs font-bold ${style.text}`}>
                                    {formatCurrencyCompact(total)}
                                </span>
                            </div>
                        );
                    })}

                    <div className="col-span-2 text-right">
                        <span className="text-sm font-black text-red-600">
                            {formatCurrency(totalFilteredValue)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};