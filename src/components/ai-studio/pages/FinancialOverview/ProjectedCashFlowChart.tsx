import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { CashFlowProjection } from '@/app/actions/financial';
import { Loader2 } from 'lucide-react';

interface ProjectedCashFlowChartProps {
    data: CashFlowProjection[];
    isLoading: boolean;
}

export function ProjectedCashFlowChart({ data, isLoading }: ProjectedCashFlowChartProps) {
    /* 
       Internal state removed. 
       We now rely on props passed from the parent. 
    */

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <span className="ml-2 text-sm text-gray-500">Calculando projeções...</span>
            </div>
        );
    }

    if (data.length === 0) return null;

    // Calculate totals for summary
    const totalIn = data.reduce((sum, item) => sum + item.receivables, 0);
    const totalOut = data.reduce((sum, item) => sum + item.payables, 0);
    const balance = totalIn - totalOut;

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <span className="material-symbols-outlined text-blue-600">query_stats</span>
                        Fluxo de Caixa Projetado
                    </h2>
                    <p className="text-sm text-gray-400 mt-1">Previsão financeira para os próximos 12 meses (Regime de Caixa).</p>
                </div>

                <div className="flex gap-4 mt-4 md:mt-0">
                    <div className="text-right">
                        <span className="text-xs text-green-600 font-bold uppercase block">Entradas</span>
                        <span className="text-lg font-bold text-gray-900">{formatCurrency(totalIn)}</span>
                    </div>
                    <div className="text-right">
                        <span className="text-xs text-red-500 font-bold uppercase block">Saídas</span>
                        <span className="text-lg font-bold text-gray-900">{formatCurrency(totalOut)}</span>
                    </div>
                    <div className="text-right px-4 py-1 bg-gray-50 rounded-lg border border-gray-100">
                        <span className="text-xs text-blue-600 font-bold uppercase block">Saldo Projetado</span>
                        <span className={`text-lg font-bold ${balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                            {formatCurrency(balance)}
                        </span>
                    </div>
                </div>
            </div>

            <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9ca3af', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9ca3af', fontSize: 12 }}
                            tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
                        />
                        <Tooltip
                            cursor={{ fill: '#f9fafb' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            formatter={(value: any) => formatCurrency(Number(value || 0))}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <ReferenceLine y={0} stroke="#e5e7eb" />

                        <Bar
                            dataKey="receivables"
                            name="Recebíveis (Aluguel)"
                            fill="#10b981"
                            radius={[4, 4, 0, 0]}
                            barSize={20}
                            stackId="a"
                        />
                        <Bar
                            dataKey="payables"
                            name="A Pagar (Obras/Financ.)"
                            fill="#ef4444"
                            radius={[4, 4, 0, 0]}
                            barSize={20}
                            stackId="b"
                        />
                        {/* We could use a composed chart line for balance, but simple bars are clearer for now */}
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
