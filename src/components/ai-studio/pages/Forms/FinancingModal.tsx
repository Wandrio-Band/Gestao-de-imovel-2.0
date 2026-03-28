import React, { useState, useEffect } from 'react';
import { DatePicker } from '../../components/DatePicker';
import { FinancingDetails } from '../../types';
import { formatDecimal as formatCurrency } from '@/lib/formatters';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Record<string, unknown>) => void;
  assetName?: string;
  initialData?: FinancingDetails;
}

// Helper para formatar apenas o número (sem R$) para inputs
const formatNumber = (value: number) => {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Helper para converter string formatada (1.000,00) em numero (1000.00)
const parseCurrency = (value: string) => {
    if (!value) return 0;
    // Remove pontos de milhar e substitui virgula decimal por ponto
    return parseFloat(value.replace(/\./g, '').replace(',', '.'));
}

export const FinancingModal: React.FC<ModalProps> = ({ isOpen, onClose, onSave, assetName, initialData }) => {
  // Estado do formulário geral - Inicializado vazio
  const [formData, setFormData] = useState({
    valorTotal: '',
    valorFinanciar: '', 
    dataAssinatura: '',
    vencimentoConstrutora: '',
    vencimentoPrimeira: '',
    prazoMeses: '',
    jurosAnuais: '',
    indexador: 'IPCA',
    sistemaAmortizacao: 'SAC',
    taxaAdm: '',
    seguros: ''
  });

  // Estado de Erros
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Estado específico para as fases da construtora - Inicializado zerado
  const [phases, setPhases] = useState({
    sinal: { qtd: 1, unitario: 0 },
    mensais: { qtd: 0, unitario: 0 },
    baloes: { qtd: 0, unitario: 0 }
  });

  const [subtotalConstrutora, setSubtotalConstrutora] = useState(0);

  // Helper para formatar valor carregado do banco (pode vir como número ou string não formatada)
  const ensureFormatted = (val: string | number | undefined | null): string => {
      if (!val) return '';
      if (typeof val === 'string' && val.includes(',')) return val; // já formatado
      const num = typeof val === 'number' ? val : parseCurrency(String(val));
      return num > 0 ? formatNumber(num) : '';
  };

  // Preencher dados se initialData for fornecido
  useEffect(() => {
      if (isOpen && initialData) {
          setFormData({
              valorTotal: ensureFormatted(initialData.valorTotal),
              valorFinanciar: ensureFormatted(initialData.valorFinanciar),
              dataAssinatura: initialData.dataAssinatura || '',
              vencimentoConstrutora: initialData.vencimentoConstrutora || '',
              vencimentoPrimeira: initialData.vencimentoPrimeira || '',
              prazoMeses: initialData.prazoMeses || '',
              jurosAnuais: initialData.jurosAnuais || '',
              indexador: initialData.indexador || 'IPCA',
              sistemaAmortizacao: initialData.sistemaAmortizacao || 'SAC',
              taxaAdm: initialData.taxaAdm || '',
              seguros: initialData.seguros || ''
          });
          if (initialData.phases) {
              setPhases(initialData.phases);
          } else {
              setPhases({
                sinal: { qtd: 1, unitario: 0 },
                mensais: { qtd: 0, unitario: 0 },
                baloes: { qtd: 0, unitario: 0 }
              });
          }
      } else if (isOpen && !initialData) {
          // Reset form on open if no data (new registration)
          setFormData({
            valorTotal: '',
            valorFinanciar: '', 
            dataAssinatura: '',
            vencimentoConstrutora: '',
            vencimentoPrimeira: '',
            prazoMeses: '',
            jurosAnuais: '',
            indexador: 'IPCA',
            sistemaAmortizacao: 'SAC',
            taxaAdm: '',
            seguros: ''
          });
          setPhases({
            sinal: { qtd: 1, unitario: 0 },
            mensais: { qtd: 0, unitario: 0 },
            baloes: { qtd: 0, unitario: 0 }
          });
      }
  }, [isOpen, initialData]);

  // 1. Recalcular subtotal da construtora sempre que as fases mudarem
  useEffect(() => {
    const total = 
        (phases.sinal.qtd * phases.sinal.unitario) +
        (phases.mensais.qtd * phases.mensais.unitario) +
        (phases.baloes.qtd * phases.baloes.unitario);
    setSubtotalConstrutora(total);
  }, [phases]);

  // 2. Recalcular Valor a Financiar automaticamente (Valor Total - Subtotal Construtora)
  // Nota: Se estiver editando, respeitar o valor que veio do banco, a menos que o usuário mexa nos valores
  useEffect(() => {
      // Logic: If user changes total or phases, re-calc financiable. 
      // But initially, we want to respect loaded data.
      // Simple approach: Always calc based on current form state inputs
      const valorTotalNum = parseCurrency(formData.valorTotal);
      const valorFinanciarNum = Math.max(0, valorTotalNum - subtotalConstrutora);
      
      setFormData(prev => ({
          ...prev,
          valorFinanciar: formatNumber(valorFinanciarNum)
      }));
  }, [formData.valorTotal, subtotalConstrutora]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Limpar erro ao digitar
    if (errors[name]) {
        setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handler para inputs monetários gerais
  const handleCurrencyInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      // Remove tudo que não é dígito
      const rawValue = value.replace(/\D/g, '');
      // Converte para float (ex: 1234 -> 12.34)
      const floatValue = Number(rawValue) / 100;
      // Formata para exibição
      const formatted = formatNumber(floatValue);
      setFormData(prev => ({ ...prev, [name]: formatted }));
      
      // Limpar erro
      if (errors[name]) {
        setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handler para alterações nas fases (Qtd ou Unitário)
  const handlePhaseChange = (phaseKey: 'sinal' | 'mensais' | 'baloes', field: 'qtd' | 'unitario', value: string) => {
      if (field === 'qtd') {
          // Apenas números inteiros
          const intValue = parseInt(value.replace(/\D/g, '')) || 0;
          setPhases(prev => ({
              ...prev,
              [phaseKey]: { ...prev[phaseKey], qtd: intValue }
          }));
      } else {
          // Valor monetário
          const rawValue = value.replace(/\D/g, '');
          const floatValue = Number(rawValue) / 100;
          setPhases(prev => ({
              ...prev,
              [phaseKey]: { ...prev[phaseKey], unitario: floatValue }
          }));
      }
  };

  const validate = () => {
      const newErrors: { [key: string]: string } = {};
      const valorTotalNum = parseCurrency(formData.valorTotal);

      if (valorTotalNum <= 0) {
          newErrors.valorTotal = "Valor total obrigatório";
      }

      if (!formData.dataAssinatura) {
          newErrors.dataAssinatura = "Data obrigatória";
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validate()) {
        onSave({ ...formData, phases, subtotalConstrutora });
        onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div 
        className="relative bg-white rounded-[1rem] shadow-2xl w-full max-w-6xl overflow-hidden animate-fade-in-up flex flex-col max-h-[95vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-200 bg-white sticky top-0 z-20">
            <div className="flex justify-between items-center mb-6">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-900 border border-gray-200">
                        <span className="material-symbols-outlined text-xl">apartment</span>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">{initialData ? 'Editar Financiamento' : 'Cadastro de Financiamento'}</h2>
                 </div>
                 <button onClick={onClose} className="text-gray-400 hover:text-gray-900 transition-colors">
                    <span className="material-symbols-outlined">close</span>
                 </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-6">
                <div className="pr-8 border-r border-gray-200">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">UNIDADE</span>
                    <span className="text-sm font-bold text-gray-900">{assetName || 'Novo Financiamento'}</span>
                </div>
                
                <div className="pr-8 border-r border-gray-200">
                     <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">VALOR TOTAL CONTRATO</span>
                     <div className="relative group">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500">R$</span>
                        <input 
                            name="valorTotal"
                            value={formData.valorTotal}
                            onChange={handleCurrencyInput}
                            type="text"
                            placeholder="0,00"
                            className="pl-8 pr-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-bold text-gray-900 outline-none focus:border-black w-48 shadow-sm transition-all"
                        />
                     </div>
                </div>

                <div>
                     <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">VALOR A FINANCIAR</span>
                     <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-blue-600">R$</span>
                        <input 
                            name="valorFinanciar"
                            value={formData.valorFinanciar}
                            readOnly
                            type="text"
                            placeholder="0,00"
                            className="pl-8 pr-4 py-2 rounded-lg border border-blue-200 bg-blue-50 text-sm font-bold text-blue-700 outline-none w-48 shadow-sm"
                        />
                     </div>
                </div>

                <div className="ml-auto">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm ${initialData ? 'border-blue-200 bg-blue-50' : 'border-green-200 bg-green-50'}`}>
                        <span className={`w-2 h-2 rounded-full ${initialData ? 'bg-blue-500' : 'bg-green-500'}`}></span>
                        <span className={`text-xs font-bold ${initialData ? 'text-blue-700' : 'text-green-700'}`}>Status: {initialData ? 'Editando' : 'Novo'}</span>
                    </div>
                </div>
            </div>
        </div>

        <div className="p-8 overflow-y-auto bg-gray-50 flex-1">
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              
              {/* --- LEFT COLUMN: CONSTRUTORA --- */}
              <div className="lg:col-span-7 space-y-8">
                 <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center text-sm font-bold">1</div>
                    <h3 className="text-lg font-bold text-gray-900">Cronograma Construtora</h3>
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white p-1 rounded-xl">
                        <DatePicker 
                           label="DATA DA ASSINATURA"
                           value={formData.dataAssinatura}
                           onChange={(val) => setFormData(prev => ({ ...prev, dataAssinatura: val }))}
                           placeholder="dd/mm/aaaa"
                           error={errors.dataAssinatura}
                        />
                    </div>
                    <div className="bg-white p-1 rounded-xl">
                        <DatePicker 
                           label="VENC. 1ª PARCELA"
                           value={formData.vencimentoConstrutora}
                           onChange={(val) => setFormData(prev => ({ ...prev, vencimentoConstrutora: val }))}
                           placeholder="dd/mm/aaaa"
                        />
                    </div>
                 </div>

                 {/* Table Phase */}
                 <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full">
                       <thead>
                          <tr className="bg-gray-50 border-b border-gray-200">
                             <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase text-left pl-6">Fase</th>
                             <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase text-center">Qtd</th>
                             <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase text-right">Unitário (R$)</th>
                             <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase text-right pr-6">Total (R$)</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-100 bg-white">
                          <tr>
                             <td className="px-6 py-4 text-xs font-bold text-gray-900">Sinal</td>
                             <td className="px-4 py-4 text-center">
                                <div className="flex justify-center">
                                    <input 
                                        type="text" 
                                        value={phases.sinal.qtd}
                                        onChange={(e) => handlePhaseChange('sinal', 'qtd', e.target.value)}
                                        className="w-12 text-center bg-gray-100 border border-gray-200 rounded-md text-xs font-bold text-gray-900 py-1.5 outline-none focus:border-black focus:bg-white transition-all"
                                    />
                                </div>
                             </td>
                             <td className="px-4 py-4 text-right">
                                <input 
                                    type="text" 
                                    value={formatNumber(phases.sinal.unitario)}
                                    onChange={(e) => handlePhaseChange('sinal', 'unitario', e.target.value)}
                                    className="w-28 text-right bg-white border border-gray-200 rounded-md px-2 py-1.5 text-xs font-bold text-gray-900 outline-none focus:border-black transition-all"
                                />
                             </td>
                             <td className="px-6 py-4 text-right text-xs font-bold text-blue-600">
                                {formatNumber(phases.sinal.qtd * phases.sinal.unitario)}
                             </td>
                          </tr>
                          <tr>
                             <td className="px-6 py-4 text-xs font-bold text-gray-900">Mensais</td>
                             <td className="px-4 py-4 text-center">
                                <div className="flex justify-center">
                                    <input 
                                        type="text" 
                                        value={phases.mensais.qtd}
                                        onChange={(e) => handlePhaseChange('mensais', 'qtd', e.target.value)}
                                        className="w-12 text-center bg-gray-100 border border-gray-200 rounded-md text-xs font-bold text-gray-900 py-1.5 outline-none focus:border-black focus:bg-white transition-all"
                                    />
                                </div>
                             </td>
                             <td className="px-4 py-4 text-right">
                                <input 
                                    type="text" 
                                    value={formatNumber(phases.mensais.unitario)}
                                    onChange={(e) => handlePhaseChange('mensais', 'unitario', e.target.value)}
                                    className="w-28 text-right bg-white border border-gray-200 rounded-md px-2 py-1.5 text-xs font-bold text-gray-900 outline-none focus:border-black transition-all"
                                />
                             </td>
                             <td className="px-6 py-4 text-right text-xs font-bold text-blue-600">
                                {formatNumber(phases.mensais.qtd * phases.mensais.unitario)}
                             </td>
                          </tr>
                          <tr>
                             <td className="px-6 py-4 text-xs font-bold text-gray-900">Balões <span className="block text-[9px] text-gray-400 font-medium mt-0.5">Semestrais</span></td>
                             <td className="px-4 py-4 text-center">
                                <div className="flex justify-center">
                                    <input 
                                        type="text" 
                                        value={phases.baloes.qtd}
                                        onChange={(e) => handlePhaseChange('baloes', 'qtd', e.target.value)}
                                        className="w-12 text-center bg-gray-100 border border-gray-200 rounded-md text-xs font-bold text-gray-900 py-1.5 outline-none focus:border-black focus:bg-white transition-all"
                                    />
                                </div>
                             </td>
                             <td className="px-4 py-4 text-right">
                                <input 
                                    type="text" 
                                    value={formatNumber(phases.baloes.unitario)}
                                    onChange={(e) => handlePhaseChange('baloes', 'unitario', e.target.value)}
                                    className="w-28 text-right bg-white border border-gray-200 rounded-md px-2 py-1.5 text-xs font-bold text-gray-900 outline-none focus:border-black transition-all"
                                />
                             </td>
                             <td className="px-6 py-4 text-right text-xs font-bold text-blue-600">
                                {formatNumber(phases.baloes.qtd * phases.baloes.unitario)}
                             </td>
                          </tr>
                       </tbody>
                       <tfoot>
                          <tr className="bg-gray-50 border-t border-gray-200">
                             <td colSpan={3} className="px-6 py-4 text-right text-[10px] font-bold text-gray-500 uppercase">Subtotal Construtora</td>
                             <td className="px-6 py-4 text-right text-sm font-black text-gray-900">
                                R$ {formatNumber(subtotalConstrutora)}
                             </td>
                          </tr>
                       </tfoot>
                    </table>
                 </div>

                 <div className="bg-white border border-gray-200 rounded-xl p-6 flex items-center justify-between shadow-sm">
                    <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-2">Índice de Correção</label>
                        <div className="relative">
                            <select className="bg-white border border-gray-300 rounded-lg py-2.5 px-3 text-xs font-bold text-gray-900 outline-none w-48 cursor-pointer appearance-none shadow-sm focus:border-black transition-colors">
                                <option>INCC-M</option>
                            </select>
                            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">expand_more</span>
                        </div>
                    </div>
                    <div className="text-right flex-1 ml-8">
                         <div className="flex justify-between items-end mb-2">
                             <span className="text-[10px] font-bold text-gray-500 uppercase">Tendência (12 meses)</span>
                             <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-100">+0.45% <span className="material-symbols-outlined text-[10px] align-middle">trending_up</span></span>
                         </div>
                         {/* Simple Chart Visualization */}
                         <div className="h-10 flex items-end gap-1.5">
                             {[30, 40, 35, 50, 45, 60, 55, 70, 65, 80, 75, 90].map((h, i) => (
                                 <div key={i} className="flex-1 bg-blue-100 rounded-t-sm hover:bg-blue-600 transition-colors cursor-pointer" style={{ height: `${h}%` }}></div>
                             ))}
                         </div>
                    </div>
                 </div>
              </div>

              {/* --- RIGHT COLUMN: BANCÁRIO --- */}
              <div className="lg:col-span-5 space-y-8">
                 <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center text-sm font-bold">2</div>
                    <h3 className="text-lg font-bold text-gray-900">Parâmetros Bancários</h3>
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white p-1 rounded-xl">
                        <DatePicker
                           label="VENC. 1ª PARC. (BANCO)"
                           value={formData.vencimentoPrimeira}
                           onChange={(val) => setFormData(prev => ({ ...prev, vencimentoPrimeira: val }))}
                           placeholder="dd/mm/aaaa"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-2">PRAZO TOTAL (MESES)</label>
                        <input 
                            name="prazoMeses"
                            value={formData.prazoMeses}
                            onChange={handleChange}
                            type="number"
                            placeholder="0"
                            className="w-full bg-white border border-gray-300 hover:border-gray-400 rounded-xl p-3 text-sm font-bold text-gray-900 outline-none transition-all shadow-sm"
                        />
                    </div>
                 </div>

                 <div className="bg-white p-1.5 rounded-full flex relative border border-gray-200 shadow-sm">
                    <button 
                        onClick={() => setFormData(prev => ({...prev, sistemaAmortizacao: 'SAC'}))}
                        className={`flex-1 py-2.5 rounded-full text-xs font-bold transition-all relative z-10 ${formData.sistemaAmortizacao === 'SAC' ? 'bg-black text-white shadow-md' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
                    >
                        Tabela SAC
                    </button>
                    <button 
                        onClick={() => setFormData(prev => ({...prev, sistemaAmortizacao: 'PRICE'}))}
                        className={`flex-1 py-2.5 rounded-full text-xs font-bold transition-all relative z-10 ${formData.sistemaAmortizacao === 'PRICE' ? 'bg-black text-white shadow-md' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
                    >
                        Tabela PRICE
                    </button>
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div>
                       <label className="text-[10px] font-bold text-gray-500 uppercase block mb-2">JUROS ANUAIS (%)</label>
                       <div className="relative">
                          <input 
                            name="jurosAnuais"
                            value={formData.jurosAnuais}
                            onChange={handleChange}
                            type="text" 
                            placeholder="0,0"
                            className="w-full bg-white border border-gray-300 hover:border-gray-400 rounded-xl p-3 text-sm font-bold text-gray-900 outline-none transition-all shadow-sm" 
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">%</span>
                       </div>
                    </div>
                    <div>
                       <label className="text-[10px] font-bold text-gray-500 uppercase block mb-2">INDEXADOR</label>
                       <div className="relative">
                           <select 
                                name="indexador"
                                value={formData.indexador}
                                onChange={handleChange}
                                className="w-full bg-white border border-gray-300 hover:border-gray-400 rounded-xl p-3 text-sm font-bold text-gray-900 outline-none appearance-none cursor-pointer transition-all shadow-sm"
                           >
                              <option>IPCA</option>
                              <option>TR</option>
                           </select>
                           <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">expand_more</span>
                       </div>
                    </div>
                 </div>

                 {/* Encargos Mensais Card */}
                 <div className="bg-gray-100 rounded-[1.5rem] p-6 relative overflow-hidden border border-gray-200">
                    <div className="absolute top-0 right-0 p-4 opacity-[0.03]">
                         <span className="material-symbols-outlined text-8xl">savings</span>
                    </div>
                    
                    <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-6 relative z-10">
                       <span className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-blue-600 shadow-sm">
                           <span className="material-symbols-outlined text-lg">payments</span>
                       </span>
                       Encargos Mensais
                    </h4>
                    
                    <div className="space-y-4 relative z-10">
                       <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-500 uppercase">Taxa Administrativa</span>
                          <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-gray-300 shadow-sm focus-within:border-black transition-all">
                             <span className="text-xs font-bold text-gray-400">R$</span>
                             <input 
                                name="taxaAdm"
                                value={formData.taxaAdm}
                                onChange={handleChange}
                                type="text" 
                                placeholder="0,00"
                                className="w-16 text-right text-sm font-black text-gray-900 outline-none bg-transparent" 
                             />
                          </div>
                       </div>
                       <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-500 uppercase">Seguros (DFI/MIP)</span>
                          <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-gray-300 shadow-sm focus-within:border-black transition-all">
                             <input 
                                name="seguros"
                                value={formData.seguros}
                                onChange={handleChange}
                                type="text" 
                                placeholder="0.00"
                                className="w-16 text-right text-sm font-black text-gray-900 outline-none bg-transparent" 
                             />
                             <span className="text-xs font-bold text-gray-400">%</span>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-gray-200 bg-white flex items-center justify-between sticky bottom-0 z-20">
           <div className="flex items-center gap-2 text-blue-700">
              <span className="material-symbols-outlined text-xl">verified_user</span>
              <span className="text-[10px] font-bold uppercase tracking-wide">CÁLCULOS AUDITADOS CONFORME NORMAS BACEN</span>
           </div>
           <div className="flex gap-4">
              <button 
                onClick={onClose} 
                className="px-6 py-3 rounded-full border border-gray-300 text-xs font-bold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition uppercase tracking-wide"
              >
                Descartar
              </button>
              <button 
                onClick={handleSave}
                className="px-8 py-3 rounded-full bg-black text-white text-xs font-bold hover:bg-gray-800 shadow-xl transition flex items-center gap-2 uppercase tracking-wide"
              >
                 {initialData ? 'Salvar Alterações' : 'Confirmar Cadastro'}
                 <span className="material-symbols-outlined text-sm">check</span>
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};