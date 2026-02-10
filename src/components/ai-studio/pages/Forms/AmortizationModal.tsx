import React, { useState, useEffect } from 'react';
import { DatePicker } from '../../components/DatePicker';
import { AmortizationResult } from '../../types';

interface AmortizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDebt: number;
  currentTerm: number; // months
  interestRateYear: number; // percentage
  assetName?: string;
  onConfirm: (result: AmortizationResult) => void;
}

// Helper formatting
const formatCurrency = (val: number) => 
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

const formatNumber = (val: number) => 
  new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);

export const AmortizationModal: React.FC<AmortizationModalProps> = ({ 
  isOpen, onClose, currentDebt, currentTerm, interestRateYear, assetName = 'Contrato Genérico', onConfirm
}) => {
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [strategy, setStrategy] = useState<'term' | 'installment'>('term');
  
  // Results Preview State
  const [preview, setPreview] = useState({
      newTerm: currentTerm,
      newPayment: 0,
      currentPayment: 0,
      totalSavings: 0,
      newBalance: currentDebt
  });

  // Interest Rate Month
  const rateMonth = Math.pow(1 + (interestRateYear / 100), 1 / 12) - 1;

  // Calculate PMT
  const calculatePMT = (principal: number, months: number, rate: number) => {
    if (rate === 0 || months === 0) return 0;
    return principal * (rate * Math.pow(1 + rate, months)) / (Math.pow(1 + rate, months) - 1);
  };

  useEffect(() => {
    // Calculate current scenario base
    const currentPMT = calculatePMT(currentDebt, currentTerm, rateMonth);
    
    const amortizeVal = parseFloat(amount.replace(/\./g, '').replace(',', '.')) || 0;
    const newPrincipal = Math.max(0, currentDebt - amortizeVal);

    if (newPrincipal === 0) {
        setPreview({
            newTerm: 0,
            newPayment: 0,
            currentPayment: currentPMT,
            totalSavings: (currentPMT * currentTerm) - amortizeVal,
            newBalance: 0
        });
        return;
    }

    if (strategy === 'term') {
      // Keeping same payment, calculate new N
      const termLog = Math.log(1 - (newPrincipal * rateMonth / currentPMT));
      const rateLog = Math.log(1 + rateMonth);
      let calcTerm = -(termLog / rateLog);
      
      if (isNaN(calcTerm) || !isFinite(calcTerm)) calcTerm = 0;
      
      const newTermCalc = Math.ceil(calcTerm);
      
      const oldTotal = currentPMT * currentTerm;
      const newTotal = currentPMT * newTermCalc; // + amortizeVal (already paid)
      // Savings = (Old Total) - (New Total + Amortization Amount)
      const savings = Math.max(0, oldTotal - (newTotal + amortizeVal));

      setPreview({
          newTerm: newTermCalc,
          newPayment: currentPMT,
          currentPayment: currentPMT,
          totalSavings: savings,
          newBalance: newPrincipal
      });

    } else {
      // Keeping same term, calculate new PMT
      const newPMT = calculatePMT(newPrincipal, currentTerm, rateMonth);
      
      const oldTotal = currentPMT * currentTerm;
      const newTotal = newPMT * currentTerm;
      const savings = Math.max(0, oldTotal - (newTotal + amortizeVal));

      setPreview({
          newTerm: currentTerm,
          newPayment: newPMT,
          currentPayment: currentPMT,
          totalSavings: savings,
          newBalance: newPrincipal
      });
    }

  }, [amount, strategy, currentDebt, currentTerm, rateMonth]);

  if (!isOpen) return null;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    const val = Number(raw) / 100;
    setAmount(formatNumber(val));
  };

  const handleConfirm = () => {
      // Helper date calculator
      const addMonths = (dateStr: string, months: number) => {
          const d = new Date(dateStr);
          d.setMonth(d.getMonth() + months);
          return d.toISOString().split('T')[0];
      };

      const originalTotalPaid = preview.currentPayment * currentTerm;
      const simulatedTotalPaid = preview.newPayment * preview.newTerm + (parseFloat(amount.replace(/\./g, '').replace(',', '.')) || 0);

      const result: AmortizationResult = {
          assetName,
          simulationDate: date,
          strategy,
          extraPayment: parseFloat(amount.replace(/\./g, '').replace(',', '.')) || 0,
          original: {
              balance: currentDebt,
              term: currentTerm,
              totalPaid: originalTotalPaid,
              totalInterest: originalTotalPaid - currentDebt,
              lastPaymentDate: addMonths(date, currentTerm),
              monthlyPayment: preview.currentPayment
          },
          simulated: {
              balance: preview.newBalance,
              term: preview.newTerm,
              totalPaid: simulatedTotalPaid,
              totalInterest: simulatedTotalPaid - preview.newBalance - (parseFloat(amount.replace(/\./g, '').replace(',', '.')) || 0), // rough estimate
              lastPaymentDate: addMonths(date, preview.newTerm),
              monthlyPayment: preview.newPayment
          },
          savings: preview.totalSavings,
          monthsReduced: currentTerm - preview.newTerm
      };

      onConfirm(result);
      onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in-up">
        
        {/* Header */}
        <div className="bg-[#101622] p-8 text-white relative overflow-hidden">
            <div className="relative z-10 flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-black tracking-tight mb-1">Simulador de Amortização</h2>
                    <p className="text-gray-400 text-sm">Antecipe pagamentos e visualize a economia de juros.</p>
                </div>
                <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                    <span className="material-symbols-outlined text-sm">close</span>
                </button>
            </div>
            {/* Decor */}
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <span className="material-symbols-outlined text-9xl">calculate</span>
            </div>
        </div>

        <div className="p-8 bg-[#f8f9fc]">
            {/* Inputs */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
                <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-3">VALOR A AMORTIZAR</label>
                        <div className="flex items-center gap-4">
                            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-2 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                                <span className="text-gray-500 font-bold">R$</span>
                                <input 
                                    type="text" 
                                    value={amount}
                                    onChange={handleAmountChange}
                                    placeholder="0,00"
                                    className="bg-transparent text-xl font-black text-gray-900 w-full outline-none"
                                    autoFocus
                                />
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-3">DATA DO APORTE</label>
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-1">
                            <DatePicker 
                                label="" 
                                value={date} 
                                onChange={setDate} 
                                placeholder="dd/mm/aaaa"
                            />
                        </div>
                    </div>
                </div>

                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-3">ESTRATÉGIA</label>
                <div className="flex gap-4">
                    <button 
                        onClick={() => setStrategy('term')}
                        className={`flex-1 p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${strategy === 'term' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-100 bg-white text-gray-500 hover:border-gray-300'}`}
                    >
                        <span className="material-symbols-outlined">update</span>
                        <span className="text-xs font-bold uppercase">Reduzir Prazo</span>
                    </button>
                    <button 
                        onClick={() => setStrategy('installment')}
                        className={`flex-1 p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${strategy === 'installment' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-100 bg-white text-gray-500 hover:border-gray-300'}`}
                    >
                        <span className="material-symbols-outlined">payments</span>
                        <span className="text-xs font-bold uppercase">Reduzir Parcela</span>
                    </button>
                </div>
            </div>

            {/* Comparison */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Current */}
                <div className="p-4 rounded-2xl border border-gray-200 bg-gray-50 opacity-70">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-4">CENÁRIO ATUAL</h4>
                    <div className="space-y-3">
                        <div>
                            <p className="text-[10px] text-gray-500">Saldo Devedor</p>
                            <p className="text-sm font-bold text-gray-900">{formatCurrency(currentDebt)}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-500">Prazo Restante</p>
                            <p className="text-sm font-bold text-gray-900">{currentTerm} meses</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-500">Parcela Estimada</p>
                            <p className="text-sm font-bold text-gray-900">{formatCurrency(preview.currentPayment)}</p>
                        </div>
                    </div>
                </div>

                {/* New */}
                <div className="p-4 rounded-2xl border border-blue-200 bg-white shadow-lg shadow-blue-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500 rotate-45 translate-x-8 -translate-y-8"></div>
                    <h4 className="text-[10px] font-bold text-blue-600 uppercase mb-4">NOVO CENÁRIO</h4>
                    <div className="space-y-3">
                        <div>
                            <p className="text-[10px] text-gray-500">Novo Saldo</p>
                            <p className="text-sm font-black text-gray-900">{formatCurrency(preview.newBalance)}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-500">Novo Prazo</p>
                            <p className={`text-sm font-bold ${strategy === 'term' ? 'text-green-600' : 'text-gray-900'}`}>
                                {preview.newTerm} meses 
                                {strategy === 'term' && preview.newTerm < currentTerm && <span className="text-[9px] bg-green-100 px-1 rounded ml-1">-{currentTerm - preview.newTerm}</span>}
                            </p>
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-500">Nova Parcela</p>
                            <p className={`text-sm font-bold ${strategy === 'installment' ? 'text-green-600' : 'text-gray-900'}`}>
                                {formatCurrency(preview.newPayment)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Savings Highlight */}
            <div className="bg-green-500 text-white p-5 rounded-2xl shadow-lg shadow-green-200 flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-bold text-green-100 uppercase tracking-wide">ECONOMIA PROJETADA DE JUROS</p>
                    <p className="text-2xl font-black">{formatCurrency(preview.totalSavings)}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <span className="material-symbols-outlined">savings</span>
                </div>
            </div>
        </div>

        <div className="p-6 bg-white border-t border-gray-100 flex justify-end gap-3">
            <button onClick={onClose} className="px-6 py-3 rounded-full border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50">Cancelar</button>
            <button 
                onClick={handleConfirm}
                className="px-8 py-3 rounded-full bg-black text-white text-xs font-bold hover:bg-gray-800 shadow-xl flex items-center gap-2"
            >
                <span>Confirmar Amortização</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
        </div>
      </div>
    </div>
  );
};