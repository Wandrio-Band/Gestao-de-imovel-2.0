import React, { useState, useEffect } from 'react';
import { DatePicker } from '../../components/DatePicker';
import { CashFlowItem } from '../../types';

interface CashFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<CashFlowItem>) => void;
  initialData?: CashFlowItem | null;
}

// Helper para formatar moeda
const formatNumber = (value: number) => {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export const CashFlowModal: React.FC<CashFlowModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState({
    vencimento: '',
    descricao: '',
    fase: 'Fase 1',
    valorTotal: '',
    status: 'Pendente',
    observacao: ''
  });

  useEffect(() => {
    if (isOpen) {
        if (initialData) {
            // Calculate total from partners if not explicit (mock logic)
            const total = (Object.values(initialData.valoresPorSocio) as number[]).reduce((a: number, b: number) => a + b, 0);
            
            setFormData({
                vencimento: initialData.vencimento ? initialData.vencimento.split('/').reverse().join('-') : '',
                descricao: initialData.descricao,
                fase: initialData.fase,
                valorTotal: formatNumber(total),
                status: initialData.status,
                observacao: initialData.correcao || ''
            });
        } else {
            setFormData({
                vencimento: '',
                descricao: '',
                fase: 'Fase 1',
                valorTotal: '',
                status: 'Pendente',
                observacao: ''
            });
        }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCurrencyInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const rawValue = value.replace(/\D/g, '');
    const floatValue = Number(rawValue) / 100;
    const formatted = formatNumber(floatValue);
    setFormData(prev => ({ ...prev, [name]: formatted }));
  };

  const handleSave = () => {
      // Basic validation
      if (!formData.descricao || !formData.valorTotal) {
          alert('Preencha a descrição e o valor.');
          return;
      }

      // Convert back to simple date string DD/MM/YYYY for mock compatibility
      const dateParts = formData.vencimento.split('-');
      const formattedDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : formData.vencimento;

      const valorFloat = parseFloat(formData.valorTotal.replace(/\./g, '').replace(',', '.'));
      
      // Split 50/50 for mock partners
      const splitValue = valorFloat / 2;

      const newItem: Partial<CashFlowItem> = {
          id: initialData?.id,
          vencimento: formattedDate,
          descricao: formData.descricao,
          fase: formData.fase,
          status: formData.status as any,
          correcao: formData.observacao,
          valoresPorSocio: {
              'Raquel': splitValue,
              'Marília': splitValue
          }
      };

      onSave(newItem);
      onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div 
        className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <h2 className="text-xl font-black text-gray-900 tracking-tight">
              {initialData ? 'Editar Lançamento' : 'Novo Lançamento'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
            <span className="material-symbols-outlined text-gray-500">close</span>
          </button>
        </div>

        <div className="p-6 space-y-5 bg-[#f8f9fc]">
            <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Descrição do Lançamento</label>
                <input 
                    name="descricao"
                    value={formData.descricao}
                    onChange={handleChange}
                    type="text"
                    placeholder="Ex: Parcela Mensal 05/24"
                    className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm font-bold text-gray-900 outline-none focus:border-blue-500 transition-all"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Valor Total (R$)</label>
                    <input 
                        name="valorTotal"
                        value={formData.valorTotal}
                        onChange={handleCurrencyInput}
                        type="text"
                        placeholder="0,00"
                        className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm font-bold text-gray-900 outline-none focus:border-blue-500 transition-all"
                    />
                </div>
                <div>
                    <DatePicker 
                        label="Data de Vencimento"
                        value={formData.vencimento}
                        onChange={(val) => setFormData(prev => ({ ...prev, vencimento: val }))}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Fase do Projeto</label>
                    <div className="relative">
                        <select 
                            name="fase"
                            value={formData.fase}
                            onChange={handleChange}
                            className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm font-bold text-gray-900 outline-none appearance-none cursor-pointer"
                        >
                            <option value="Fase 1">Fase 1 (Obra)</option>
                            <option value="Fase 2">Fase 2 (Banco)</option>
                            <option value="Extra">Extra</option>
                        </select>
                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-sm">expand_more</span>
                    </div>
                </div>
                <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Status</label>
                    <div className="relative">
                        <select 
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm font-bold text-gray-900 outline-none appearance-none cursor-pointer"
                        >
                            <option value="Pendente">Pendente</option>
                            <option value="Pago">Pago</option>
                            <option value="Atrasado">Atrasado</option>
                            <option value="Futuro">Futuro</option>
                        </select>
                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-sm">expand_more</span>
                    </div>
                </div>
            </div>

            <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Observações / Correção</label>
                <input 
                    name="observacao"
                    value={formData.observacao}
                    onChange={handleChange}
                    type="text"
                    placeholder="Ex: + R$ 42,00 (INCC)"
                    className="w-full bg-white border border-gray-200 rounded-xl p-3 text-xs font-medium text-gray-900 outline-none focus:border-blue-500 transition-all"
                />
            </div>
        </div>

        <div className="p-6 border-t border-gray-100 bg-white flex justify-end gap-3">
            <button onClick={onClose} className="px-6 py-3 rounded-full border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50">Cancelar</button>
            <button onClick={handleSave} className="px-8 py-3 rounded-full bg-black text-white text-xs font-bold hover:bg-gray-800 shadow-xl flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">check</span>
                Salvar
            </button>
        </div>
      </div>
    </div>
  );
};