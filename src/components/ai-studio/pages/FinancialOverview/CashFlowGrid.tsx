import React from 'react';
import { CashFlowProjection } from '@/app/actions/financial';

interface CashFlowGridProps {
    data: CashFlowProjection[];
}

export const CashFlowGrid: React.FC<CashFlowGridProps> = ({ data }) => {
    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden animate-fade-in-up">
            <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-gray-400">table_chart</span>
                    Detalhamento do Fluxo
                </h2>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4">Mês/Ref.</th>
                            <th className="px-6 py-4 text-green-600">Entradas (Recebíveis)</th>
                            <th className="px-6 py-4 text-red-500">Saídas (A Pagar)</th>
                            <th className="px-6 py-4 text-blue-600">Saldo</th>
                            <th className="px-6 py-4">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {data.map((row, idx) => {
                            const isPositive = row.balance >= 0;
                            return (
                                <tr key={idx} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-6 py-4 font-bold text-gray-900">
                                        {row.month}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-700">
                                        {row.receivables > 0 ? (
                                            <div className="flex flex-col">
                                                <span>{formatCurrency(row.receivables)}</span>
                                                <span className="text-[10px] text-gray-400">{row.details.incomes.length} lançamentos</span>
                                            </div>
                                        ) : (
                                            <span className="text-gray-300">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-700">
                                        {row.payables > 0 ? (
                                            <div className="flex flex-col">
                                                <span>{formatCurrency(row.payables)}</span>
                                                <span className="text-[10px] text-gray-400">{row.details.expenses.length} contas</span>
                                            </div>
                                        ) : (
                                            <span className="text-gray-300">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 font-black">
                                        <span className={isPositive ? 'text-blue-600' : 'text-red-500'}>
                                            {formatCurrency(row.balance)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {row.balance < 0 ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-50 text-red-600 text-[10px] font-bold uppercase border border-red-100">
                                                <span className="material-symbols-outlined text-[10px]">warning</span> Atenção
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-50 text-green-600 text-[10px] font-bold uppercase border border-green-100">
                                                <span className="material-symbols-outlined text-[10px]">trending_up</span> Positivo
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
