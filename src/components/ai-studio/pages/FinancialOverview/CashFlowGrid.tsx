'use client';

import React, { useState } from 'react';
import { CashFlowProjection, CashFlowDetailItem } from '@/app/actions/financial';
import { formatMoney } from '@/lib/formatters';

interface CashFlowGridProps {
    data: CashFlowProjection[];
}

const originLabels: Record<CashFlowDetailItem['originType'], { label: string; icon: string; color: string }> = {
    contract: { label: 'Contrato', icon: 'description', color: 'blue' },
    financing: { label: 'Financiamento', icon: 'account_balance', color: 'orange' },
    iptu: { label: 'IPTU', icon: 'home', color: 'purple' },
};

function OriginBadge({ type }: { type: CashFlowDetailItem['originType'] }) {
    const config = originLabels[type];
    const colorMap: Record<string, string> = {
        blue: 'bg-blue-50 text-blue-700 border-blue-200',
        orange: 'bg-orange-50 text-orange-700 border-orange-200',
        purple: 'bg-purple-50 text-purple-700 border-purple-200',
    };
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${colorMap[config.color]}`}>
            <span className="material-symbols-outlined text-[11px]">{config.icon}</span>
            {config.label}
        </span>
    );
}

function DetailPopup({ item, onClose }: { item: CashFlowDetailItem; onClose: () => void }) {
    const config = originLabels[item.originType];
    const d = item.originDetails;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div
                className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md mx-4 overflow-hidden animate-fade-in-up"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            item.originType === 'contract' ? 'bg-blue-100 text-blue-600' :
                            item.originType === 'financing' ? 'bg-orange-100 text-orange-600' :
                            'bg-purple-100 text-purple-600'
                        }`}>
                            <span className="material-symbols-outlined text-xl">{config.icon}</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">Detalhes do Lançamento</h3>
                            <OriginBadge type={item.originType} />
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-4">
                    {/* Value */}
                    <div className="text-center py-3 bg-gray-50 rounded-xl">
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Valor</p>
                        <p className={`text-2xl font-black mt-1 ${
                            item.originType === 'contract' ? 'text-green-600' : 'text-red-500'
                        }`}>
                            {formatMoney(item.value)}
                        </p>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-3">
                        <DetailField label="Imóvel" value={d.assetName} />

                        {d.tenantName && (
                            <DetailField label="Inquilino" value={d.tenantName} />
                        )}

                        {d.contractNumber && (
                            <DetailField label="Contrato" value={d.contractNumber} />
                        )}

                        {d.dueDay && (
                            <DetailField label="Vencimento" value={`Dia ${d.dueDay}`} />
                        )}

                        {item.date && (
                            <DetailField label="Data" value={item.date} />
                        )}

                        {d.phase && (
                            <DetailField label="Fase" value={d.phase} />
                        )}

                        {d.description && (
                            <DetailField label="Descrição" value={d.description} />
                        )}

                        {d.frequency && (
                            <DetailField label="Frequência" value={d.frequency === 'annual' ? 'Anual' : 'Mensal'} />
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50">
                    <p className="text-[10px] text-gray-400 text-center">
                        ID: {item.originId}
                    </p>
                </div>
            </div>
        </div>
    );
}

function DetailField({ label, value }: { label: string; value: string }) {
    return (
        <div className="bg-gray-50 rounded-lg px-3 py-2">
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">{label}</p>
            <p className="text-sm font-medium text-gray-800 mt-0.5 truncate">{value}</p>
        </div>
    );
}

function MonthDetailPopup({ month, incomes, expenses, onClose }: {
    month: string;
    incomes: CashFlowDetailItem[];
    expenses: CashFlowDetailItem[];
    onClose: () => void;
}) {
    const [selectedItem, setSelectedItem] = useState<CashFlowDetailItem | null>(null);

    if (selectedItem) {
        return <DetailPopup item={selectedItem} onClose={() => setSelectedItem(null)} />;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div
                className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-lg mx-4 max-h-[80vh] flex flex-col overflow-hidden animate-fade-in-up"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
                    <div>
                        <h3 className="font-bold text-gray-900 text-lg">Lançamentos — {month}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {incomes.length + expenses.length} lançamento(s) no período
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">
                    {/* Incomes */}
                    {incomes.length > 0 && (
                        <div>
                            <h4 className="text-xs font-bold text-green-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-sm">trending_up</span>
                                Entradas ({incomes.length})
                            </h4>
                            <div className="space-y-2">
                                {incomes.map((item, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedItem(item)}
                                        className="w-full text-left flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-green-200 hover:bg-green-50/50 transition-all group cursor-pointer"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <OriginBadge type={item.originType} />
                                                {item.day && <span className="text-[10px] text-gray-400">Dia {item.day}</span>}
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="font-bold text-green-600">{formatMoney(item.value)}</p>
                                        </div>
                                        <span className="material-symbols-outlined text-gray-300 group-hover:text-green-500 text-sm transition-colors">chevron_right</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Expenses */}
                    {expenses.length > 0 && (
                        <div>
                            <h4 className="text-xs font-bold text-red-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-sm">trending_down</span>
                                Saídas ({expenses.length})
                            </h4>
                            <div className="space-y-2">
                                {expenses.map((item, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedItem(item)}
                                        className="w-full text-left flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-red-200 hover:bg-red-50/50 transition-all group cursor-pointer"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <OriginBadge type={item.originType} />
                                                {item.date && <span className="text-[10px] text-gray-400">{item.date}</span>}
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="font-bold text-red-500">{formatMoney(item.value)}</p>
                                        </div>
                                        <span className="material-symbols-outlined text-gray-300 group-hover:text-red-500 text-sm transition-colors">chevron_right</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {incomes.length === 0 && expenses.length === 0 && (
                        <p className="text-center text-gray-400 py-8">Nenhum lançamento neste mês</p>
                    )}
                </div>
            </div>
        </div>
    );
}

function summarizeOrigins(items: CashFlowDetailItem[]): string {
    const counts: Record<string, number> = {};
    for (const item of items) {
        const label = originLabels[item.originType].label;
        counts[label] = (counts[label] || 0) + 1;
    }
    return Object.entries(counts).map(([k, v]) => `${v} ${k}${v > 1 ? 's' : ''}`).join(', ');
}

export const CashFlowGrid: React.FC<CashFlowGridProps> = ({ data }) => {
    const [openMonth, setOpenMonth] = useState<CashFlowProjection | null>(null);

    return (
        <>
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
                                <th className="px-6 py-4">Origem</th>
                                <th className="px-6 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {data.map((row, idx) => {
                                const isPositive = row.balance >= 0;
                                const allItems = [...row.details.incomes, ...row.details.expenses];
                                const hasItems = allItems.length > 0;
                                return (
                                    <tr key={idx} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-6 py-4 font-bold text-gray-900">
                                            {row.month}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-700">
                                            {row.receivables > 0 ? (
                                                <div className="flex flex-col">
                                                    <span>{formatMoney(row.receivables)}</span>
                                                    <span className="text-[10px] text-gray-400">{row.details.incomes.length} lançamentos</span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-300">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-700">
                                            {row.payables > 0 ? (
                                                <div className="flex flex-col">
                                                    <span>{formatMoney(row.payables)}</span>
                                                    <span className="text-[10px] text-gray-400">{row.details.expenses.length} contas</span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-300">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 font-black">
                                            <span className={isPositive ? 'text-blue-600' : 'text-red-500'}>
                                                {formatMoney(row.balance)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {hasItems ? (
                                                <button
                                                    onClick={() => setOpenMonth(row)}
                                                    className="flex flex-col gap-1 text-left cursor-pointer group/btn hover:bg-blue-50 rounded-lg px-2 py-1 -mx-2 -my-1 transition-colors"
                                                >
                                                    <span className="text-xs text-gray-600 group-hover/btn:text-blue-700 transition-colors">
                                                        {summarizeOrigins(allItems)}
                                                    </span>
                                                    <span className="text-[10px] text-blue-500 font-medium flex items-center gap-0.5">
                                                        <span className="material-symbols-outlined text-[11px]">visibility</span>
                                                        Ver detalhes
                                                    </span>
                                                </button>
                                            ) : (
                                                <span className="text-gray-300">-</span>
                                            )}
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

            {/* Month Detail Popup */}
            {openMonth && (
                <MonthDetailPopup
                    month={openMonth.month}
                    incomes={openMonth.details.incomes}
                    expenses={openMonth.details.expenses}
                    onClose={() => setOpenMonth(null)}
                />
            )}
        </>
    );
};
