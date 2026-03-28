import React, { useState } from 'react';
import { useAssetForm } from '@/hooks/useAssetForm';
import { ViewState, Asset, PartnerShare, FinancingDetails, LeaseDetails } from '../../types';
import { FinancingModal } from './FinancingModal';
import { LeaseModal } from './LeaseModal';
import { PartnerModal } from './PartnerModal';
import { DatePicker } from '../../components/DatePicker';

interface AssetRegistrationProps {
    onNavigate: (view: ViewState, asset?: Asset) => void;
    asset?: Asset;
    isModal?: boolean;
    onClose?: () => void;
    onUpdateAsset?: (asset: Asset) => void;
}

const PartnerDonutChart = ({ partners }: { partners: PartnerShare[] }) => {
    const displayPartners = partners.length > 0 ? partners : [];
    const totalPartners = partners.length;
    let cumulativePercent = 0;
    const radius = 45;
    const circumference = 2 * Math.PI * radius;

    return (
        <div className="w-40 h-40 relative flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r={radius} fill="none" stroke="#f3f4f6" strokeWidth="8" />
                {displayPartners.map((partner, index) => {
                    const strokeDasharray = `${(partner.percentage / 100) * circumference} ${circumference}`;
                    const strokeDashoffset = -((cumulativePercent / 100) * circumference);
                    cumulativePercent += partner.percentage;

                    let strokeColor = '#3b82f6';
                    const c = partner.color || '';
                    if (c.includes('orange')) strokeColor = '#f97316';
                    else if (c.includes('purple')) strokeColor = '#a855f7';
                    else if (c.includes('pink')) strokeColor = '#ec4899';
                    else if (c.includes('blue')) strokeColor = '#3b82f6';

                    return (
                        <circle
                            key={index} cx="50" cy="50" r={radius}
                            fill="none" stroke={strokeColor} strokeWidth="8"
                            strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                        />
                    );
                })}
            </svg>
            <div className="text-center relative z-10 flex flex-col items-center">
                <span className="block text-3xl font-black text-gray-900 leading-none">{totalPartners}</span>
                <span className="block text-[10px] font-bold text-gray-400 uppercase mt-1">Sócios</span>
            </div>
        </div>
    );
};

export const AssetRegistration: React.FC<AssetRegistrationProps> = ({ onNavigate, asset, isModal, onClose, onUpdateAsset }) => {
    const [isFinancingModalOpen, setIsFinancingModalOpen] = useState(false);
    const [isLeaseModalOpen, setIsLeaseModalOpen] = useState(false);
    const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);

    // Core Identifiers
    const { formState, helpers } = useAssetForm(asset);
    const {
        name, setName,
        description, setDescription,
        type, setType,
        status, setStatus,
        zipCode, setZipCode,
        street, setStreet,
        number, setNumber,
        complement, setComplement,
        neighborhood, setNeighborhood,
        city, setCity,
        state, setState,
        areaTotal, setAreaTotal,
        matricula, setMatricula,
        iptu, setIptu,
        iptuValue, setIptuValue,
        iptuFrequency, setIptuFrequency,
        condominio, setCondominio,
        registryOffice, setRegistryOffice,
        acquisitionDate, setAcquisitionDate,
        irpfStatus, setIrpfStatus,
        acquisitionOrigin, setAcquisitionOrigin,
        marketValue, setMarketValue,
        rentalValue, setRentalValue,
        acquisitionValue, setAcquisitionValue,
        declaredValue, setDeclaredValue,
        saleForecast, setSaleForecast,
        partners, setPartners,
        financingData, setFinancingData,
        leaseData, setLeaseData,
        enableFinancial, setEnableFinancial,
        enableLease, setEnableLease,
        enableSaleForecast, setEnableSaleForecast
    } = formState;

    const { handleCurrencyInput, getFormattedAsset } = helpers;

    const handleSave = () => {
        const updatedAsset = getFormattedAsset();
        if (onUpdateAsset) {
            onUpdateAsset(updatedAsset);
        }
        alert("Cadastro atualizado com sucesso!");
        if (isModal && onClose) {
            onClose();
        } else {
            onNavigate('assets_list');
        }
    };

    const handleFinancingSave = (data: FinancingDetails) => {
        setFinancingData(data);
        setEnableFinancial(true);
    };

    const handleLeaseSave = (data: LeaseDetails) => {
        setLeaseData(data);
        if (data && data.nomeInquilino) {
            setStatus('Locado');
        }
    };

    const handlePartnersSave = (updatedPartners: PartnerShare[]) => {
        setPartners(updatedPartners);
    };

    const handleDetailedFinancingClick = () => {
        onNavigate('financing_details', getFormattedAsset());
    };

    const containerClasses = isModal
        ? "fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm"
        : "max-w-full mx-auto p-3 pb-20";
    const contentClasses = isModal
        ? "bg-[#f6f6f8] w-full max-w-5xl max-h-[95vh] overflow-y-auto rounded-xl p-3 shadow-2xl animate-fade-in-up"
        : "";

    return (
        <div className={containerClasses} onClick={isModal ? onClose : undefined}>
            <div className={contentClasses} onClick={e => e.stopPropagation()}>
                {!isModal && (
                    <div className="flex items-center gap-2 mb-6">
                        <span className="text-gray-400 text-sm font-bold cursor-pointer hover:text-primary" onClick={() => onNavigate('assets_list')}>Cadastro</span>
                        <span className="material-symbols-outlined text-xs text-gray-400">chevron_right</span>
                        <span className="text-black text-sm font-bold">Novo Ativo</span>
                    </div>
                )}
                {isModal && (
                    <div className="flex justify-end mb-4">
                        <button onClick={onClose} className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-gray-100 shadow-sm transition-colors">
                            <span className="material-symbols-outlined text-gray-600">close</span>
                        </button>
                    </div>
                )}

                {/* Header Section */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-8 gap-3">
                    <div className="flex-1 w-full">
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="NOME DO ATIVO"
                            className="text-3xl font-black text-gray-900 tracking-tight bg-transparent border-none placeholder-gray-300 focus:ring-0 w-full p-0 focus:outline-none"
                        />
                        <div className="flex items-center gap-3 mt-3">
                            <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide flex items-center gap-1.5 border border-blue-100">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span> {asset ? 'Em Cadastro' : 'Novo'}
                            </span>
                            <span className="text-gray-400 text-xs font-medium">Criado em: Hoje, 14:30</span>
                        </div>
                    </div>
                    <div className="flex gap-3 w-full lg:w-auto">
                        <button onClick={() => isModal && onClose ? onClose() : onNavigate('assets_list')} className="flex-1 lg:flex-none px-6 py-3 rounded-full bg-white border border-gray-200 font-bold text-sm hover:bg-gray-50 text-gray-600 transition-colors">Cancelar</button>
                        <button onClick={handleSave} className="flex-1 lg:flex-none px-6 py-3 rounded-full bg-[#1152d4] hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-200 transition-colors flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined text-lg">save</span> Salvar Cadastro
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                    {/* Main Column (2/3) */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* 1. Identificação e Localização */}
                        <section className="bg-white rounded-xl p-4 shadow-soft border border-gray-100">
                            <div className="flex items-center gap-3 mb-4 border-b-4 border-blue-600 pb-3">
                                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-[#1152d4]">
                                    <span className="material-symbols-outlined text-lg">location_on</span>
                                </div>
                                <h2 className="text-base font-bold text-gray-900">Identificação e Localização</h2>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-[10px] font-bold text-blue-900 uppercase tracking-wider mb-1 ml-1">Descrição Completa</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs font-medium text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none min-h-[80px] placeholder-gray-300"
                                        placeholder="Texto integral extraído do documento..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-blue-900 uppercase tracking-wider mb-1 ml-1">Descrição Resumida (Título)</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs font-medium text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none placeholder-gray-300"
                                        placeholder="Ex: Prédio Comercial - Patos de Minas/MG"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-blue-900 uppercase tracking-wider mb-1 ml-1">Endereço Completo</label>
                                    <input type="text" value={street} onChange={(e) => setStreet(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs font-medium text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none placeholder-gray-300" placeholder="Ex: Av. Beira Mar, 4050" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                    <div className="md:col-span-2">
                                        <label className="block text-[10px] font-bold text-blue-900 uppercase tracking-wider mb-1 ml-1">Município</label>
                                        <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs font-medium text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none placeholder-gray-300" placeholder="Cidade" />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="block text-[10px] font-bold text-blue-900 uppercase tracking-wider mb-1 ml-1">UF</label>
                                        <select value={state} onChange={(e) => setState(e.target.value)} className={`w-full bg-white border border-gray-200 rounded-lg p-2 text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none appearance-none cursor-pointer ${!state ? 'text-gray-400' : 'text-gray-900'}`}>
                                            <option value="" disabled>--</option>
                                            <option value="AC">AC</option>
                                            <option value="AL">AL</option>
                                            <option value="AP">AP</option>
                                            <option value="AM">AM</option>
                                            <option value="BA">BA</option>
                                            <option value="CE">CE</option>
                                            <option value="DF">DF</option>
                                            <option value="ES">ES</option>
                                            <option value="GO">GO</option>
                                            <option value="MA">MA</option>
                                            <option value="MT">MT</option>
                                            <option value="MS">MS</option>
                                            <option value="MG">MG</option>
                                            <option value="PA">PA</option>
                                            <option value="PB">PB</option>
                                            <option value="PR">PR</option>
                                            <option value="PE">PE</option>
                                            <option value="PI">PI</option>
                                            <option value="RJ">RJ</option>
                                            <option value="RN">RN</option>
                                            <option value="RS">RS</option>
                                            <option value="RO">RO</option>
                                            <option value="RR">RR</option>
                                            <option value="SC">SC</option>
                                            <option value="SP">SP</option>
                                            <option value="SE">SE</option>
                                            <option value="TO">TO</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="block text-[10px] font-bold text-blue-900 uppercase tracking-wider mb-1 ml-1">CEP</label>
                                        <input type="text" value={zipCode} onChange={(e) => setZipCode(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs font-medium text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none placeholder-gray-300" placeholder="00000-000" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[10px] font-bold text-blue-900 uppercase tracking-wider mb-1 ml-1">Tipo de Ativo</label>
                                        <div className="relative">
                                            <select value={type || ''} onChange={(e) => setType(e.target.value as Asset['type'])} className={`w-full bg-white border border-gray-200 rounded-lg p-2 text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none appearance-none cursor-pointer ${!type ? 'text-gray-400' : 'text-gray-900'}`}>
                                                <option value="" disabled>Selecione um tipo...</option>
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
                                            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-base">expand_more</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-blue-900 uppercase tracking-wider mb-1 ml-1">Status de Uso</label>
                                        <div className="relative">
                                            <select value={status || ''} onChange={(e) => setStatus(e.target.value as Asset['status'])} className={`w-full bg-white border border-gray-200 rounded-lg p-2 text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none appearance-none cursor-pointer ${!status ? 'text-gray-400' : 'text-gray-900'}`}>
                                                <option value="" disabled>Selecione um status...</option>
                                                <option value="Vago">Vago</option>
                                                <option value="Locado">Locado</option>
                                                <option value="Uso Próprio">Uso Próprio</option>
                                                <option value="Em Reforma">Em Reforma</option>
                                            </select>
                                            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-base">expand_more</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* 2. Documentação e Registro */}
                        <section className="bg-white rounded-xl p-4 shadow-soft border border-gray-100">
                            <div className="flex items-center gap-3 mb-4 border-b-4 border-purple-600 pb-3">
                                <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                                    <span className="material-symbols-outlined text-lg">description</span>
                                </div>
                                <h2 className="text-base font-bold text-gray-900">Documentação e Registro</h2>
                            </div>

                            <div className="space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-[10px] font-bold text-blue-900 uppercase tracking-wider mb-1 ml-1">Matrícula</label>
                                        <input type="text" value={matricula} onChange={(e) => setMatricula(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs font-medium text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none placeholder-gray-300" placeholder="00.000" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-blue-900 uppercase tracking-wider mb-1 ml-1">Inscrição (IPTU)</label>
                                        <input type="text" value={iptu} onChange={(e) => setIptu(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs font-medium text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none placeholder-gray-300" placeholder="000.000-0" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-blue-900 uppercase tracking-wider mb-1 ml-1">Valor IPTU (R$)</label>
                                        <input type="text" value={iptuValue} onChange={handleCurrencyInput(setIptuValue)} className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs font-medium text-gray-900 text-right focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none placeholder-gray-300" placeholder="0,00" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-blue-900 uppercase tracking-wider mb-1 ml-1">Frequência IPTU</label>
                                        <select value={iptuFrequency} onChange={(e) => setIptuFrequency(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs font-medium text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none">
                                            <option value="monthly">Mensal</option>
                                            <option value="annual">Anual</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-blue-900 uppercase tracking-wider mb-1 ml-1">Condomínio (R$)</label>
                                        <input type="text" value={condominio} onChange={(e) => setCondominio(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs font-medium text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none placeholder-gray-300" placeholder="0,00" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-blue-900 uppercase tracking-wider mb-1 ml-1">Área Total (m²)</label>
                                        <input type="text" value={areaTotal} onChange={(e) => setAreaTotal(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs font-medium text-gray-900 text-right focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none placeholder-gray-300" placeholder="0,00" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div className="md:col-span-2">
                                        <label className="block text-[10px] font-bold text-blue-900 uppercase tracking-wider mb-1 ml-1">Cartório de Registro</label>
                                        <input type="text" value={registryOffice} onChange={(e) => setRegistryOffice(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs font-medium text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none placeholder-gray-300" placeholder="Ex: 2º Ofício de Registro de Imóveis" />
                                    </div>
                                    <div>
                                        <DatePicker
                                            label="Data de Aquisição"
                                            value={acquisitionDate}
                                            onChange={(val) => setAcquisitionDate(val)}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-[10px] font-bold text-blue-900 uppercase tracking-wider mb-1 ml-1">Status IRPF</label>
                                        <div className="relative">
                                            <select value={irpfStatus || ''} onChange={(e) => setIrpfStatus(e.target.value as Asset['irpfStatus'])} className={`w-full bg-white border border-gray-200 rounded-lg p-2 text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none appearance-none cursor-pointer ${!irpfStatus ? 'text-gray-400' : 'text-gray-900'}`}>
                                                <option value="" disabled>Selecione...</option>
                                                <option>Declarado</option>
                                                <option>Pendente</option>
                                                <option>Isento</option>
                                            </select>
                                            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-base">expand_more</span>
                                        </div>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-[10px] font-bold text-blue-900 uppercase tracking-wider mb-1 ml-1">Origem / Forma de Aquisição</label>
                                        <input type="text" value={acquisitionOrigin} onChange={(e) => setAcquisitionOrigin(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs font-medium text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none placeholder-gray-300" placeholder="Ex: Compra e Venda - Financiamento Bancário" />
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* 3. Situação Financeira (Expanded) */}
                        <section className="bg-white rounded-xl p-4 shadow-soft border border-gray-100">
                            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 border-b-4 border-green-500 pb-3 gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-lg">payments</span>
                                    </div>
                                    <h2 className="text-base font-bold text-gray-900">Situação Financeira</h2>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="bg-gray-100 p-1 rounded-full flex relative">
                                        <button
                                            onClick={() => {
                                                setEnableFinancial(false);
                                                setFinancingData(null);
                                            }}
                                            className={`px-4 py-1.5 text-[10px] uppercase font-bold rounded-full transition-all ${!enableFinancial ? 'bg-green-500 text-white shadow-md' : 'text-gray-400 hover:text-black'}`}
                                        >
                                            Quitado
                                        </button>
                                        <button
                                            onClick={() => setEnableFinancial(true)}
                                            className={`px-4 py-1.5 text-[10px] uppercase font-bold rounded-full transition-all ${enableFinancial ? 'bg-green-500 text-white shadow-md' : 'text-gray-400 hover:text-black'}`}
                                        >
                                            Financiado
                                        </button>
                                    </div>

                                    {financingData && (
                                        <button onClick={handleDetailedFinancingClick} className="bg-black text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors" title="Ver Detalhes">
                                            <span className="material-symbols-outlined text-sm">analytics</span>
                                        </button>
                                    )}
                                </div>
                            </div>



                            {!enableFinancial ? (
                                <div className="text-center py-4 bg-green-50/50 rounded-xl border border-green-100 border-dashed">
                                    <div className="flex items-center justify-center gap-2 mb-1">
                                        <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-sm">check_circle</span>
                                        </div>
                                        <p className="text-xs font-bold text-gray-900">Imóvel Quitado</p>
                                    </div>
                                    <p className="text-[10px] text-gray-500">Sem pendências financeiras.</p>
                                </div>
                            ) : (
                                financingData ? (
                                    <div className="flex flex-col lg:flex-row gap-8">
                                        {/* Left: Donut Summary */}
                                        <div className="bg-gray-50 rounded-[2rem] p-4 flex flex-col items-center justify-center min-w-[240px]">
                                            <div className="w-32 h-32 rounded-full border-8 border-green-400 flex items-center justify-center mb-4 relative">
                                                <div className="text-center">
                                                    <span className="block text-xl font-black text-gray-900">10.6%</span>
                                                </div>
                                            </div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Valor Total</p>
                                            <p className="text-2xl font-black text-gray-900">R$ 4.240k</p>
                                            <span className="mt-2 bg-blue-50 text-blue-700 text-[9px] font-bold px-2 py-1 rounded-full uppercase">Percentual Amortizado</span>
                                        </div>

                                        {/* Right: Details */}
                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Construtora Card */}
                                            <div className="border border-gray-100 rounded-[1.5rem] p-4 relative">
                                                <div className="flex justify-between items-start mb-6">
                                                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">01 Construtora</span>
                                                    <span className="material-symbols-outlined text-green-500">domain</span>
                                                </div>
                                                <div className="mb-4">
                                                    <div className="flex justify-between text-xs mb-1">
                                                        <span className="font-bold text-blue-600">Pago</span>
                                                        <span className="font-black text-gray-900">R$ 450k</span>
                                                    </div>
                                                    <div className="w-full bg-gray-100 rounded-full h-1.5"><div className="bg-green-500 h-1.5 rounded-full w-full"></div></div>
                                                </div>
                                                <div className="flex justify-between text-[10px] text-gray-400 font-medium">
                                                    <span>Projetado</span>
                                                    <span>R$ 450k</span>
                                                </div>
                                            </div>

                                            {/* Bancario Card */}
                                            <div className="border border-gray-100 rounded-[1.5rem] p-4 relative">
                                                <div className="flex justify-between items-start mb-6">
                                                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">02 Financ. Bancário</span>
                                                    <span className="material-symbols-outlined text-blue-800">account_balance</span>
                                                </div>
                                                <div className="mb-4">
                                                    <div className="flex justify-between text-xs mb-1">
                                                        <span className="font-bold text-blue-600">Realizado</span>
                                                        <span className="font-black text-gray-900">R$ 472.5k</span>
                                                    </div>
                                                    <div className="w-full bg-gray-100 rounded-full h-1.5"><div className="bg-blue-600 h-1.5 rounded-full w-[35%]"></div></div>
                                                </div>
                                                <div className="flex justify-between text-[10px] text-gray-400 font-medium">
                                                    <span>Saldo Devedor</span>
                                                    <span className="text-blue-600 font-bold">R$ 877.5k</span>
                                                </div>
                                            </div>

                                            {/* Footer Info Strip */}
                                            <div className="md:col-span-2 bg-gray-50 rounded-xl p-4 flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-gray-400 text-sm">calendar_month</span>
                                                    <div>
                                                        <p className="text-[9px] font-bold text-gray-400 uppercase">Sistema</p>
                                                        <p className="text-xs font-black text-gray-900">SAC</p>
                                                    </div>
                                                </div>
                                                <div className="w-px h-6 bg-gray-200"></div>
                                                <div className="flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-gray-400 text-sm">percent</span>
                                                    <div>
                                                        <p className="text-[9px] font-bold text-gray-400 uppercase">Taxa</p>
                                                        <p className="text-xs font-black text-gray-900">9.5% a.a.</p>
                                                    </div>
                                                </div>
                                                <div className="w-px h-6 bg-gray-200"></div>
                                                <div className="flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-gray-400 text-sm">trending_up</span>
                                                    <div>
                                                        <p className="text-[9px] font-bold text-gray-400 uppercase">Correção</p>
                                                        <p className="text-xs font-black text-gray-900">IPCA</p>
                                                    </div>
                                                </div>
                                                <button className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center hover:bg-blue-200 transition-colors ml-auto">
                                                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-10 bg-gray-50 rounded-2xl border border-gray-100 border-dashed hover:bg-gray-100 transition-colors cursor-pointer group" onClick={() => setIsFinancingModalOpen(true)}>
                                        <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                            <span className="material-symbols-outlined text-3xl">add_card</span>
                                        </div>
                                        <p className="text-base font-bold text-gray-900 mb-1">Cadastrar Financiamento</p>
                                        <p className="text-xs text-gray-500 max-w-xs mx-auto">Adicione os detalhes do financiamento bancário ou direto com a construtora.</p>
                                    </div>
                                )
                            )}
                        </section>

                        {/* 4. Gestão de Locação (New Section) */}
                        <section className="bg-white rounded-xl p-4 shadow-soft border border-gray-100">
                            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 border-b-4 border-blue-600 pb-3 gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-lg">real_estate_agent</span>
                                    </div>
                                    <h2 className="text-base font-bold text-gray-900">Gestão de Locação</h2>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="bg-gray-100 p-1 rounded-full flex relative">
                                        <button
                                            onClick={() => {
                                                setEnableLease(false);
                                                setLeaseData(null);
                                                setStatus('Vago');
                                            }}
                                            className={`px-4 py-1.5 text-[10px] uppercase font-bold rounded-full transition-all ${!enableLease ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-black'}`}
                                        >
                                            Não Locado
                                        </button>
                                        <button
                                            onClick={() => setEnableLease(true)}
                                            className={`px-4 py-1.5 text-[10px] uppercase font-bold rounded-full transition-all ${enableLease ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-black'}`}
                                        >
                                            Locado
                                        </button>
                                    </div>

                                    {leaseData && (
                                        <button onClick={() => setIsLeaseModalOpen(true)} className="bg-black text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors" title="Editar Contrto">
                                            <span className="material-symbols-outlined text-sm">edit</span>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {!enableLease ? (
                                <div className="text-center py-4 bg-blue-50/50 rounded-xl border border-blue-100 border-dashed">
                                    <div className="flex items-center justify-center gap-2 mb-1">
                                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-sm">home_work</span>
                                        </div>
                                        <p className="text-xs font-bold text-gray-900">Disponível para Locação</p>
                                    </div>
                                    <p className="text-[10px] text-gray-500">Imóvel vago, pronto para novos inquilinos.</p>
                                </div>
                            ) : (
                                leaseData ? (
                                    <div className="bg-[#f8f9fc] rounded-[2rem] p-4 border border-gray-100">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full bg-[#1152d4] flex items-center justify-center text-white">
                                                    <span className="material-symbols-outlined text-2xl">person</span>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">LOCATÁRIO ATUAL</p>
                                                    <h3 className="text-xl font-black text-gray-900">{leaseData.nomeInquilino}</h3>
                                                </div>
                                            </div>
                                            {/* Edit button moved to header */}
                                        </div>

                                        <div className="grid grid-cols-2 gap-8 mb-6">
                                            <div>
                                                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Valor do Aluguel</p>
                                                <p className="text-2xl font-black text-[#1152d4]">R$ {leaseData.valorAluguel}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Vencimento</p>
                                                <p className="text-base font-bold text-gray-900">{leaseData.diaVencimento} / mês</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Vigência do Contrato</p>
                                                <p className="text-sm font-bold text-gray-900">
                                                    {leaseData.inicioVigencia ? leaseData.inicioVigencia.split('-').reverse().join('/') : ''} <span className="text-gray-400 mx-1">→</span> {leaseData.fimContrato ? leaseData.fimContrato.split('-').reverse().join('/') : ''}
                                                </p>
                                            </div>
                                        </div>

                                        <div
                                            className="flex items-center gap-2 text-blue-600 cursor-pointer hover:underline"
                                            onClick={() => {
                                                if (leaseData.contractFile) {
                                                    if (leaseData.contractFile instanceof File) {
                                                        const url = URL.createObjectURL(leaseData.contractFile);
                                                        window.open(url, '_blank');
                                                    } else if (typeof leaseData.contractFile === 'string') {
                                                        window.open(leaseData.contractFile, '_blank');
                                                    } else {
                                                        alert("Arquivo não disponível");
                                                    }
                                                }
                                            }}
                                        >
                                            <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
                                            <span className="text-xs font-bold">Visualizar Contrato PDF {leaseData.contractFile ? `(${leaseData.contractFile.name || 'Contrato'})` : ''}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-10 bg-gray-50 rounded-2xl border border-gray-100 border-dashed hover:bg-gray-100 transition-colors cursor-pointer group" onClick={() => setIsLeaseModalOpen(true)}>
                                        <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                            <span className="material-symbols-outlined text-3xl">add_home_work</span>
                                        </div>
                                        <p className="text-base font-bold text-gray-900 mb-1">Cadastrar Contrato</p>
                                        <p className="text-xs text-gray-500 max-w-xs mx-auto">Adicione os dados do inquilino, valores e anexe o contrato.</p>
                                    </div>
                                )
                            )}
                        </section>

                    </div>

                    {/* Sidebar Column (1/3) */}
                    <div className="lg:col-span-1 space-y-8">
                        {/* Partners Card */}
                        <section className="bg-white rounded-xl p-4 shadow-soft border border-gray-100 flex flex-col items-center">
                            <div className="w-full flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-gray-900">Quadro de Participações</h3>
                                <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-[10px] font-bold uppercase">Em Edição</span>
                            </div>
                            <div className="mb-4 relative">
                                <PartnerDonutChart partners={partners} />
                            </div>

                            {/* Partner List */}
                            <div className="w-full space-y-3 mb-4">
                                {partners.map((p, idx) => (
                                    <div key={idx} className="flex items-center justify-between w-full">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${p.color}`}>
                                                {p.initials}
                                            </div>
                                            <span className="text-sm font-bold text-gray-700">{p.name}</span>
                                        </div>
                                        <div className="bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
                                            <span className="text-xs font-black text-gray-900">{p.percentage}</span>
                                            <span className="text-[10px] text-gray-400 ml-0.5">%</span>
                                        </div>
                                    </div>
                                ))}
                                <div className="w-full h-1.5 bg-gray-100 rounded-full mt-4 overflow-hidden flex">
                                    {partners.map((p, idx) => {
                                        let bg = 'bg-gray-300';
                                        if (p.color.includes('orange')) bg = 'bg-orange-400';
                                        else if (p.color.includes('purple')) bg = 'bg-purple-400';
                                        else if (p.color.includes('pink')) bg = 'bg-pink-400';
                                        else if (p.color.includes('blue')) bg = 'bg-blue-400';
                                        return <div key={idx} style={{ width: `${p.percentage}%` }} className={`h-full ${bg}`}></div>
                                    })}
                                </div>
                            </div>

                            <button onClick={() => setIsPartnerModalOpen(true)} className="w-full py-3 bg-gray-50 text-gray-600 border border-gray-200 rounded-xl text-[10px] font-bold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 uppercase tracking-wide">
                                <span className="material-symbols-outlined text-base">group</span> Gerenciar Distribuição de Sócios
                            </button>
                        </section>

                        {/* Financial Evaluation Card (New Sidebar Item) */}
                        <section className="bg-white rounded-xl p-4 shadow-soft border border-gray-100">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-sm">attach_money</span>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">Avaliação Financeira</h3>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">VALOR ESTIMADO DE MERCADO</label>
                                <div className="bg-[#101622] rounded-2xl p-4 text-center mb-6 relative overflow-visible group">
                                    <div className="absolute top-0 right-0 p-2 opacity-10 pointer-events-none">
                                        <span className="material-symbols-outlined text-6xl text-white">trending_up</span>
                                    </div>
                                    <div className="flex items-center justify-center gap-1 relative z-10">
                                        <span className="text-gray-500 font-bold text-xs">R$</span>
                                        <input
                                            value={marketValue}
                                            onChange={handleCurrencyInput(setMarketValue)}
                                            className="bg-transparent text-2xl font-black text-white outline-none w-40 text-center"
                                            placeholder="0,00"
                                        />
                                    </div>

                                    {(() => {
                                        const parseCurrency = (val: string) => {
                                            if (!val) return 0;
                                            return parseFloat(val.replace(/\./g, '').replace(',', '.'));
                                        };

                                        const market = parseCurrency(marketValue);
                                        const acquisition = parseCurrency(acquisitionValue);
                                        if (market > 0 && acquisition > 0) {
                                            const appreciation = ((market - acquisition) / acquisition) * 100;
                                            if (appreciation > 0) {
                                                return (
                                                    <div className="flex justify-center mt-2 relative z-20 animate-fade-in-up">
                                                        <div className="bg-[#22c55e] text-white px-2 py-0.5 rounded-full flex items-center gap-1 shadow-lg">
                                                            <span className="material-symbols-outlined text-[10px] font-bold">trending_up</span>
                                                            <span className="text-[10px] font-black whitespace-nowrap">+{appreciation.toFixed(1).replace('.', ',')}% Valorização</span>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                        }
                                        return null;
                                    })()}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block mb-1">ALUGUEL MENSAL SUGERIDO</label>
                                    <div className="border border-gray-200 rounded-2xl p-3 flex items-center gap-2">
                                        <span className="text-sm font-bold text-gray-400">R$</span>
                                        <input
                                            value={rentalValue}
                                            onChange={handleCurrencyInput(setRentalValue)}
                                            className="w-full font-black text-gray-900 outline-none"
                                            placeholder="0,00"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block mb-1">VALOR DE AQUISIÇÃO</label>
                                    <div className="border border-gray-200 rounded-2xl p-3 flex items-center gap-2">
                                        <span className="text-sm font-bold text-gray-400">R$</span>
                                        <input
                                            value={acquisitionValue}
                                            onChange={handleCurrencyInput(setAcquisitionValue)}
                                            className="w-full font-medium text-gray-600 outline-none"
                                            placeholder="0,00"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block mb-1">VALOR DECLARADO (IRPF)</label>
                                    <div className="border border-gray-200 rounded-2xl p-3 flex items-center gap-2">
                                        <span className="text-sm font-bold text-gray-400">R$</span>
                                        <input
                                            value={declaredValue}
                                            onChange={handleCurrencyInput(setDeclaredValue)}
                                            className="w-full font-medium text-gray-600 outline-none"
                                            placeholder="0,00"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="text-xs font-black text-green-700 uppercase tracking-widest block">PREVISÃO DE VENDA</label>
                                            <div className="bg-gray-100 p-0.5 rounded-full flex relative">
                                                <button
                                                    onClick={() => {
                                                        setEnableSaleForecast(false);
                                                        setSaleForecast('');
                                                    }}
                                                    className={`px-3 py-1 text-[9px] uppercase font-bold rounded-full transition-all ${!enableSaleForecast ? 'bg-red-500 text-white shadow-sm' : 'text-gray-400 hover:text-black'}`}
                                                >
                                                    Não
                                                </button>
                                                <button
                                                    onClick={() => setEnableSaleForecast(true)}
                                                    className={`px-3 py-1 text-[9px] uppercase font-bold rounded-full transition-all ${enableSaleForecast ? 'bg-green-500 text-white shadow-sm' : 'text-gray-400 hover:text-black'}`}
                                                >
                                                    Sim
                                                </button>
                                            </div>
                                        </div>
                                        {enableSaleForecast && (
                                            <div className="border border-gray-200 rounded-2xl p-1 animate-fade-in-up">
                                                <DatePicker
                                                    label=""
                                                    value={saleForecast}
                                                    onChange={setSaleForecast}
                                                    placeholder="Selecione uma data"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>

            <FinancingModal isOpen={isFinancingModalOpen} onClose={() => setIsFinancingModalOpen(false)} onSave={handleFinancingSave} assetName={name} />
            <LeaseModal isOpen={isLeaseModalOpen} onClose={() => setIsLeaseModalOpen(false)} onSave={handleLeaseSave} />
            <PartnerModal isOpen={isPartnerModalOpen} onClose={() => setIsPartnerModalOpen(false)} currentPartners={partners} onSave={handlePartnersSave} />
        </div>
    );
};