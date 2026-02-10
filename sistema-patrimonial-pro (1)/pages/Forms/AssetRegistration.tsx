import React, { useState, useEffect } from 'react';
import { ViewState, Asset, PartnerShare } from '../../types';
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
  const [name, setName] = useState('');
  const [type, setType] = useState('Residencial');
  const [status, setStatus] = useState('Vago');
  
  // Address Details
  const [zipCode, setZipCode] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');

  // Documentation
  const [areaTotal, setAreaTotal] = useState('');
  const [matricula, setMatricula] = useState('');
  const [iptu, setIptu] = useState('');
  const [registryOffice, setRegistryOffice] = useState('');
  const [acquisitionDate, setAcquisitionDate] = useState('');
  const [irpfStatus, setIrpfStatus] = useState('Declarado');
  const [acquisitionOrigin, setAcquisitionOrigin] = useState('');

  // Financials
  const [marketValue, setMarketValue] = useState('');
  const [rentalValue, setRentalValue] = useState(''); // Suggested
  const [acquisitionValue, setAcquisitionValue] = useState('');
  const [declaredValue, setDeclaredValue] = useState('');
  const [saleForecast, setSaleForecast] = useState('');

  // Complex Objects
  const [partners, setPartners] = useState<PartnerShare[]>([]);
  const [financingData, setFinancingData] = useState<any>(null);
  const [leaseData, setLeaseData] = useState<any>(null);
  
  // UI Toggles
  const [enableFinancial, setEnableFinancial] = useState(false);

  useEffect(() => {
    if (asset) {
        setName(asset.name);
        setType(asset.type);
        setStatus(asset.status);
        
        // Address
        setZipCode(asset.zipCode || '');
        setStreet(asset.street || asset.address || ''); 
        setNumber(asset.number || '');
        setComplement(asset.complement || '');
        setNeighborhood(asset.neighborhood || '');
        setCity(asset.city || '');
        setState(asset.state || '');

        // Docs
        setAreaTotal(asset.areaTotal?.toString() || '');
        setMatricula(asset.matricula || '');
        setIptu(asset.iptu || '');
        setRegistryOffice(asset.registryOffice || '');
        setAcquisitionDate(asset.acquisitionDate || '');
        setIrpfStatus(asset.irpfStatus || 'Declarado');
        setAcquisitionOrigin(asset.acquisitionOrigin || '');

        // Financials
        setMarketValue(asset.marketValue ? (asset.marketValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '');
        setRentalValue(asset.suggestedRentalValue ? asset.suggestedRentalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '');
        setAcquisitionValue(asset.value ? asset.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '');
        setDeclaredValue(asset.declaredValue ? asset.declaredValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '');
        setSaleForecast(asset.saleForecast || '');

        setPartners(asset.partners);
        
        if (asset.financingDetails) {
            setFinancingData(asset.financingDetails);
            setEnableFinancial(true);
        } else {
            setFinancingData(null);
            setEnableFinancial(false);
        }
        
        if (asset.leaseDetails) {
            setLeaseData(asset.leaseDetails);
        } else {
            setLeaseData(null);
        }

    } else {
        // Defaults
        setName('');
        setStreet('');
        setPartners([]);
        setFinancingData(null);
        setLeaseData(null);
        setIrpfStatus('Declarado');
    }
  }, [asset]);

  // Helpers
  const parseCurrency = (val: string) => {
      if (!val) return 0;
      return parseFloat(val.replace(/\./g, '').replace(',', '.'));
  }

  const handleCurrencyInput = (setter: (val: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      const cleanValue = value.replace(/\D/g, '');
      const numberValue = Number(cleanValue) / 100;
      setter(numberValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
  };

  const getCurrentAsset = (): Asset => {
      const fullAddress = street ? `${street}, ${number} - ${neighborhood}` : asset?.address || '';

      // Determine rental value: from lease if active, otherwise suggested or existing
      let currentRentalValue = asset?.rentalValue || 0;
      if (leaseData && leaseData.valorAluguel) {
          currentRentalValue = parseCurrency(leaseData.valorAluguel);
      } else if (rentalValue) {
          // If no lease but suggested value exists, maybe use that or keep 0? 
          // Keeping 0 for 'rentalValue' (actual) is safer if status is 'Vago'.
      }

      return {
          id: asset?.id || Date.now().toString(),
          name,
          type: type as any,
          status: status as any,
          
          address: fullAddress,
          zipCode,
          street,
          number,
          complement,
          neighborhood,
          city,
          state,

          areaTotal: parseFloat(areaTotal) || 0,
          matricula,
          iptu,
          registryOffice,
          acquisitionDate,
          irpfStatus: irpfStatus as any,
          acquisitionOrigin,

          partners,
          value: parseCurrency(acquisitionValue),
          marketValue: parseCurrency(marketValue),
          declaredValue: parseCurrency(declaredValue),
          saleForecast,
          suggestedRentalValue: parseCurrency(rentalValue),
          
          rentalValue: currentRentalValue, 
          image: asset?.image || '',
          financingDetails: financingData,
          leaseDetails: leaseData
      };
  };

  const handleSave = () => {
    const updatedAsset = getCurrentAsset();
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

  const handleFinancingSave = (data: any) => {
    setFinancingData(data);
    setEnableFinancial(true);
  };

  const handleLeaseSave = (data: any) => {
    setLeaseData(data);
    if(data && data.nomeInquilino) {
        setStatus('Locado');
    }
  };

  const handlePartnersSave = (updatedPartners: PartnerShare[]) => {
      setPartners(updatedPartners);
  };

  const handleDetailedFinancingClick = () => {
      onNavigate('financial_overview', getCurrentAsset());
  };

  const containerClasses = isModal 
    ? "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    : "max-w-[1600px] mx-auto p-8 pb-32";
  const contentClasses = isModal
    ? "bg-[#f6f6f8] w-full max-w-7xl max-h-[95vh] overflow-y-auto rounded-[2.5rem] p-8 shadow-2xl animate-fade-in-up"
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
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-8 gap-6">
        <div className="flex-1 w-full">
          <input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            placeholder="NOME DO ATIVO" 
            className="text-4xl font-black text-gray-900 tracking-tight bg-transparent border-none placeholder-gray-300 focus:ring-0 w-full p-0 focus:outline-none" 
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Column (2/3) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* 1. Identificação e Localização */}
          <section className="bg-white rounded-[2rem] p-8 shadow-soft border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-[#1152d4]">
                <span className="material-symbols-outlined">location_on</span>
              </div>
              <h2 className="text-lg font-bold text-gray-900">Identificação e Localização</h2>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Descrição Completa</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none" placeholder="Ex: Apartamento residencial de alto padrão..." />
              </div>

              <div>
                 <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Endereço Completo</label>
                 <input type="text" value={street} onChange={(e) => setStreet(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none" placeholder="Ex: Av. Beira Mar, 4050" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                  <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Município</label>
                      <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none" placeholder="Cidade" />
                  </div>
                  <div className="md:col-span-1">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">UF</label>
                      <select value={state} onChange={(e) => setState(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none appearance-none cursor-pointer">
                        <option value="">--</option>
                        <option>CE</option>
                        <option>SP</option>
                        <option>RJ</option>
                        <option>MG</option>
                        <option>ES</option>
                        <option>RS</option>
                      </select>
                  </div>
                  <div className="md:col-span-1">
                     <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">CEP</label>
                     <input type="text" value={zipCode} onChange={(e) => setZipCode(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none" placeholder="00000-000" />
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Tipo de Ativo</label>
                  <div className="relative">
                    <select value={type} onChange={(e) => setType(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none appearance-none cursor-pointer">
                        <option value="Residencial">Residencial</option>
                        <option value="Comercial">Comercial</option>
                        <option value="Terreno">Terreno</option>
                        <option value="Industrial">Industrial</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">expand_more</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Status de Uso</label>
                  <div className="relative">
                    <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none appearance-none cursor-pointer">
                        <option value="Vago">Vago</option>
                        <option value="Locado">Locado</option>
                        <option value="Uso Próprio">Uso Próprio</option>
                        <option value="Em Reforma">Em Reforma</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">expand_more</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 2. Documentação e Registro */}
          <section className="bg-white rounded-[2rem] p-8 shadow-soft border border-gray-100">
             <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                  <span className="material-symbols-outlined">description</span>
                </div>
                <h2 className="text-lg font-bold text-gray-900">Documentação e Registro</h2>
             </div>
             
             <div className="space-y-5">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                     <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Matrícula</label>
                        <input type="text" value={matricula} onChange={(e) => setMatricula(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none" placeholder="00.000" />
                     </div>
                     <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Inscrição (IPTU)</label>
                        <input type="text" value={iptu} onChange={(e) => setIptu(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none" placeholder="000.000-0" />
                     </div>
                     <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Área Total (m²)</label>
                        <input type="text" value={areaTotal} onChange={(e) => setAreaTotal(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm font-medium text-gray-900 text-right focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none" placeholder="0,00" />
                     </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                     <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Cartório de Registro</label>
                        <input type="text" value={registryOffice} onChange={(e) => setRegistryOffice(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none" placeholder="Ex: 2º Ofício de Registro de Imóveis" />
                     </div>
                     <div>
                        <DatePicker 
                            label="Data de Aquisição"
                            value={acquisitionDate}
                            onChange={(val) => setAcquisitionDate(val)}
                        />
                     </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                     <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Status IRPF</label>
                        <div className="relative">
                            <select value={irpfStatus} onChange={(e) => setIrpfStatus(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none appearance-none cursor-pointer">
                                <option>Declarado</option>
                                <option>Pendente</option>
                                <option>Isento</option>
                            </select>
                            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">expand_more</span>
                        </div>
                     </div>
                     <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Origem / Forma de Aquisição</label>
                        <input type="text" value={acquisitionOrigin} onChange={(e) => setAcquisitionOrigin(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none" placeholder="Ex: Compra e Venda - Financiamento Bancário" />
                     </div>
                 </div>
             </div>
          </section>

          {/* 3. Situação Financeira (Expanded) */}
          <section className="bg-white rounded-[2rem] p-8 shadow-soft border border-gray-100">
             <div className="flex justify-between items-center mb-6">
                 <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                           <span className="material-symbols-outlined">payments</span>
                      </div>
                      <h2 className="text-lg font-bold text-gray-900">Situação Financeira</h2>
                 </div>
                 {financingData && (
                     <button onClick={handleDetailedFinancingClick} className="bg-black text-white px-4 py-2 rounded-full text-[10px] font-bold uppercase flex items-center gap-2 hover:bg-gray-800 transition-colors">
                        <span className="material-symbols-outlined text-sm">analytics</span> Detalhamento do Financiamento
                     </button>
                 )}
                 {!financingData && (
                     <button onClick={() => setIsFinancingModalOpen(true)} className="bg-black text-white px-4 py-2 rounded-full text-[10px] font-bold uppercase flex items-center gap-2 hover:bg-gray-800 transition-colors">
                        <span className="material-symbols-outlined text-sm">add</span> Cadastrar
                     </button>
                 )}
             </div>

             {financingData ? (
                 <div className="flex flex-col lg:flex-row gap-8">
                     {/* Left: Donut Summary */}
                     <div className="bg-gray-50 rounded-[2rem] p-6 flex flex-col items-center justify-center min-w-[240px]">
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
                     <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Construtora Card */}
                          <div className="border border-gray-100 rounded-[1.5rem] p-6 relative">
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
                          <div className="border border-gray-100 rounded-[1.5rem] p-6 relative">
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
                 <div className="text-center py-8">
                     <p className="text-sm text-gray-500 font-medium">Nenhum financiamento cadastrado.</p>
                 </div>
             )}
          </section>

          {/* 4. Gestão de Locação (New Section) */}
          <section className="bg-white rounded-[2rem] p-8 shadow-soft border border-gray-100">
             <div className="flex justify-between items-center mb-6">
                 <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                           <span className="material-symbols-outlined">real_estate_agent</span>
                      </div>
                      <h2 className="text-lg font-bold text-gray-900">Gestão de Locação</h2>
                 </div>
                 <button className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors">
                      <span className="material-symbols-outlined text-gray-600">expand_less</span>
                 </button>
             </div>
             
             {leaseData ? (
                 <div className="bg-[#f8f9fc] rounded-[2rem] p-6 border border-gray-100">
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
                         <button onClick={() => setIsLeaseModalOpen(true)} className="text-blue-600 hover:text-blue-800 transition-colors">
                             <span className="material-symbols-outlined">edit</span>
                         </button>
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

                     <div className="flex items-center gap-2 text-blue-600 cursor-pointer hover:underline">
                         <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
                         <span className="text-xs font-bold">Visualizar Contrato PDF {leaseData.contractFile ? `(${leaseData.contractFile.name})` : ''}</span>
                     </div>
                 </div>
             ) : (
                <div className="text-center py-8">
                     <p className="text-sm text-gray-500 font-medium mb-4">Nenhum contrato de locação ativo.</p>
                     <button onClick={() => setIsLeaseModalOpen(true)} className="bg-black text-white px-6 py-2 rounded-full text-xs font-bold uppercase hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 mx-auto">
                        <span className="material-symbols-outlined text-sm">add</span> Adicionar Contrato
                     </button>
                 </div>
             )}
          </section>

        </div>

        {/* Sidebar Column (1/3) */}
        <div className="lg:col-span-1 space-y-8">
           {/* Partners Card */}
           <section className="bg-white rounded-[2rem] p-8 shadow-soft border border-gray-100 flex flex-col items-center">
              <div className="w-full flex justify-between items-center mb-6">
                   <h3 className="text-lg font-bold text-gray-900">Quadro de Participações</h3>
                   <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-[10px] font-bold uppercase">Em Edição</span>
              </div>
              <div className="mb-8 relative">
                 <PartnerDonutChart partners={partners} />
              </div>

              {/* Partner List */}
              <div className="w-full space-y-3 mb-6">
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

              <button onClick={() => setIsPartnerModalOpen(true)} className="w-full py-4 bg-[#101622] text-white rounded-2xl text-xs font-bold hover:bg-black transition-colors flex items-center justify-center gap-2 uppercase tracking-wide shadow-lg">
                 <span className="material-symbols-outlined text-sm">group</span> Gerenciar Distribuição de Sócios
              </button>
           </section>

           {/* Financial Evaluation Card (New Sidebar Item) */}
           <section className="bg-white rounded-[2rem] p-8 shadow-soft border border-gray-100">
               <div className="flex items-center gap-2 mb-6">
                    <div className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                        <span className="material-symbols-outlined text-sm">attach_money</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Avaliação Financeira</h3>
               </div>

               <div className="bg-[#101622] rounded-2xl p-6 text-center mb-6 relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-2 opacity-10">
                       <span className="material-symbols-outlined text-6xl text-white">trending_up</span>
                   </div>
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 relative z-10">VALOR ESTIMADO DE MERCADO</p>
                   <div className="flex items-baseline justify-center gap-1 relative z-10">
                       <span className="text-gray-500 font-bold text-sm">R$</span>
                       <input 
                           value={marketValue}
                           onChange={handleCurrencyInput(setMarketValue)}
                           className="bg-transparent text-3xl font-black text-white outline-none w-48 text-center"
                           placeholder="0,00"
                       />
                   </div>
                   <p className="text-[9px] text-gray-500 mt-2 relative z-10">Atualizado via IA hoje, 14:00</p>
               </div>

               <div className="space-y-4">
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
                       <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">PREVISÃO DE VENDA</label>
                       <div className="border border-gray-200 rounded-2xl p-1">
                           <DatePicker 
                               label=""
                               value={saleForecast}
                               onChange={setSaleForecast}
                               placeholder="Selecione uma data"
                           />
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