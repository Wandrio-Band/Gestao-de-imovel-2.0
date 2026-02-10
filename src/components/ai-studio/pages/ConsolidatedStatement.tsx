import React from 'react';
import { Asset, ViewState } from '../types';

interface ConsolidatedStatementProps {
    asset: Asset | null;
    onNavigate: (view: ViewState, asset?: Asset) => void;
}

// Helper to format currency
const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

export const ConsolidatedStatement: React.FC<ConsolidatedStatementProps> = ({ asset, onNavigate }) => {
    if (!asset || !asset.financingDetails) {
        return (
            <div className="p-8 flex flex-col items-center justify-center h-full">
                <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">error</span>
                <h2 className="text-xl font-bold text-gray-900">Informações de financiamento não encontradas</h2>
                <button 
                    onClick={() => onNavigate('debt_management')} 
                    className="mt-4 px-6 py-2 bg-black text-white rounded-lg font-bold text-sm"
                >
                    Voltar
                </button>
            </div>
        );
    }

    // Mock Data Generator for the Statement
    const generateStatementData = () => {
        const data = [];
        let balance = 2000000; // Starting Balance (Mock)
        
        // Initial Loan
        data.push({
            id: 'init',
            date: '10/01/2023',
            type: 'CONTRATAÇÃO',
            description: 'Saldo Devedor Inicial',
            payment: 0,
            amortization: 0,
            interest: 0,
            insurance: 0,
            indexer: 0,
            balance: balance
        });

        // Generate 10 months of payments
        for (let i = 1; i <= 10; i++) {
            const currentDate = new Date(2023, i, 10);
            const dateStr = currentDate.toLocaleDateString('pt-BR');
            
            // Interest (approx 0.8% mo)
            const interest = balance * 0.008;
            const indexer = balance * 0.002; // Mock IPCA
            const insurance = 120;
            const payment = 15000;
            
            // Amortization = Payment - Interest - Insurance
            const amortization = payment - interest - insurance;
            
            // New Balance = Old Balance + Interest + Indexer - Payment (Simplified logic)
            // Or typically: New Balance = Old Balance + Correction - Amortization
            // Let's use: Balance = Balance + Interest + Indexer - Payment
            balance = balance + interest + indexer - payment;

            data.push({
                id: `pmt-${i}`,
                date: dateStr,
                type: 'MENSAL',
                description: `Parcela ${i}/360`,
                payment: payment,
                amortization: amortization,
                interest: interest,
                insurance: insurance,
                indexer: indexer,
                balance: balance
            });

            // Random Extra Amortization
            if (i === 6) {
                const extra = 50000;
                balance = balance - extra;
                data.push({
                    id: `extra-${i}`,
                    date: new Date(2023, i, 15).toLocaleDateString('pt-BR'),
                    type: 'AMORTIZAÇÃO',
                    description: 'Amortização Extraordinária (FGTS)',
                    payment: extra,
                    amortization: extra,
                    interest: 0,
                    insurance: 0,
                    indexer: 0,
                    balance: balance
                });
            }
        }
        return data.reverse(); // Newest first
    };

    const statementData = generateStatementData();

    // Calculate Totals
    const totals = statementData.reduce((acc, curr) => ({
        payment: acc.payment + curr.payment,
        amortization: acc.amortization + curr.amortization,
        interest: acc.interest + curr.interest + curr.indexer,
    }), { payment: 0, amortization: 0, interest: 0 });

    return (
        <div className="p-8 max-w-[1600px] mx-auto pb-24">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => onNavigate('debt_details', asset)}
                        className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-gray-600 transition-colors shadow-sm"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Extrato Consolidado</h1>
                        <p className="text-sm text-gray-500 font-medium mt-0.5">{asset.name} • Contrato {asset.financingDetails?.indexador}</p>
                    </div>
                </div>
                
                <div className="flex gap-3">
                    <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors">
                        <span className="material-symbols-outlined text-sm">filter_alt</span> Filtrar
                    </button>
                    <button className="px-4 py-2 bg-black text-white rounded-lg text-xs font-bold hover:bg-gray-800 flex items-center gap-2 shadow-lg transition-colors">
                        <span className="material-symbols-outlined text-sm">download</span> Exportar PDF
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">SALDO DEVEDOR ATUAL</p>
                    <p className="text-2xl font-black text-gray-900">{formatCurrency(statementData[0].balance)}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">TOTAL PAGO (PERÍODO)</p>
                    <p className="text-2xl font-black text-green-600">{formatCurrency(totals.payment)}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">TOTAL AMORTIZADO</p>
                    <p className="text-2xl font-black text-blue-600">{formatCurrency(totals.amortization)}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">JUROS + CORREÇÃO PAGA</p>
                    <p className="text-2xl font-black text-orange-600">{formatCurrency(totals.interest)}</p>
                </div>
            </div>

            {/* Statement Table */}
            <div className="bg-white rounded-[1.5rem] border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50/80 border-b border-gray-200 sticky top-0 z-10 backdrop-blur-sm">
                            <tr>
                                <th className="py-4 px-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Data</th>
                                <th className="py-4 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Descrição</th>
                                <th className="py-4 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Tipo</th>
                                <th className="py-4 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Valor Pago</th>
                                <th className="py-4 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right text-blue-600">Amortização</th>
                                <th className="py-4 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right text-orange-600">Juros/Encargos</th>
                                <th className="py-4 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right text-purple-600">Correção</th>
                                <th className="py-4 px-6 text-[10px] font-bold text-gray-900 uppercase tracking-widest text-right">Saldo Devedor</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {statementData.map((row) => (
                                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="py-4 px-6 text-xs font-bold text-gray-900 whitespace-nowrap">{row.date}</td>
                                    <td className="py-4 px-4 text-xs font-medium text-gray-700">{row.description}</td>
                                    <td className="py-4 px-4 text-center">
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                            row.type === 'CONTRATAÇÃO' ? 'bg-gray-100 text-gray-600' :
                                            row.type === 'AMORTIZAÇÃO' ? 'bg-green-100 text-green-700' :
                                            'bg-blue-50 text-blue-600'
                                        }`}>
                                            {row.type}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4 text-right text-xs font-bold text-gray-900">
                                        {row.payment > 0 ? formatCurrency(row.payment) : '-'}
                                    </td>
                                    <td className="py-4 px-4 text-right text-xs font-bold text-blue-600 bg-blue-50/30">
                                        {row.amortization > 0 ? formatCurrency(row.amortization) : '-'}
                                    </td>
                                    <td className="py-4 px-4 text-right text-xs font-medium text-orange-600">
                                        {row.interest + row.insurance > 0 ? formatCurrency(row.interest + row.insurance) : '-'}
                                    </td>
                                    <td className="py-4 px-4 text-right text-xs font-medium text-purple-600">
                                        {row.indexer > 0 ? formatCurrency(row.indexer) : '-'}
                                    </td>
                                    <td className="py-4 px-6 text-right text-xs font-black text-gray-900 bg-gray-50/50">
                                        {formatCurrency(row.balance)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div className="mt-6 text-center text-xs text-gray-400 font-medium">
                <p>Os valores de correção monetária são calculados *pro rata die* com base nos índices oficiais divulgados.</p>
                <p>Este extrato é para fins de conferência e não substitui documento fiscal oficial.</p>
            </div>
        </div>
    );
};