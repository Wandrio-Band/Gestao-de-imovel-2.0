import React from 'react';
import { PartnerShare } from '@/components/ai-studio/types';

interface Step4PartnersProps {
    partners: PartnerShare[];
    setPartners: (partners: PartnerShare[]) => void;
    hasFinancing: boolean;
    onConfigureFinancing: () => void;
    hasLease: boolean;
    onConfigureLease: () => void;
}

export const Step4Partners: React.FC<Step4PartnersProps> = ({
    partners,
    setPartners,
    hasFinancing,
    onConfigureFinancing,
    hasLease,
    onConfigureLease,
}) => {
    const totalPercentage = partners.reduce((sum, p) => sum + (p.percentage || 0), 0);

    const handleAddPartner = () => {
        const newPartner: PartnerShare = {
            name: '',
            initials: '',
            percentage: 0,
            color: 'bg-gray-100 text-gray-700',
        };
        setPartners([...partners, newPartner]);
    };

    const handleRemovePartner = (index: number) => {
        setPartners(partners.filter((_, i) => i !== index));
    };

    const handlePartnerChange = (index: number, field: keyof PartnerShare, value: string | number) => {
        setPartners(partners.map((p, i) => i === index ? { ...p, [field]: value } : p));
    };

    return (
        <div className="space-y-6">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-purple-600">groups</span>
                Sócios e Estrutura
            </h2>

            <p className="text-sm text-gray-600">
                Configure os sócios, financiamento e locação do imóvel. Todos os campos são opcionais.
            </p>

            {/* Partners Section */}
            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-purple-900">Sócios do Ativo</h3>
                    <button
                        onClick={handleAddPartner}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                        <span className="material-symbols-outlined text-sm">add</span>
                        Adicionar Sócio
                    </button>
                </div>

                {partners.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">
                        Nenhum sócio adicionado. Clique em "Adicionar Sócio" para começar.
                    </p>
                ) : (
                    <div className="space-y-3">
                        {partners.map((partner, index) => (
                            <div key={index} className="flex gap-3 items-center bg-white rounded-xl p-3">
                                <input
                                    type="text"
                                    value={partner.name}
                                    onChange={(e) => handlePartnerChange(index, 'name', e.target.value)}
                                    placeholder="Nome do sócio"
                                    className="flex-1 bg-white border border-gray-200 rounded-lg p-2 text-sm font-medium outline-none focus:ring-2 focus:ring-purple-300"
                                />
                                <div className="flex items-center gap-1 w-24">
                                    <input
                                        type="number"
                                        value={partner.percentage || ''}
                                        onChange={(e) => handlePartnerChange(index, 'percentage', Number(e.target.value))}
                                        placeholder="0"
                                        min="0"
                                        max="100"
                                        className="w-full bg-white border border-gray-200 rounded-lg p-2 text-sm font-medium outline-none focus:ring-2 focus:ring-purple-300"
                                    />
                                    <span className="text-sm font-bold text-gray-600">%</span>
                                </div>
                                <button
                                    onClick={() => handleRemovePartner(index)}
                                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <span className="material-symbols-outlined text-red-500 text-lg">delete</span>
                                </button>
                            </div>
                        ))}

                        {/* Total Percentage Indicator */}
                        <div className="flex justify-end items-center gap-2 pt-2">
                            <span className="text-xs font-bold text-gray-600">Total:</span>
                            <span className={`text-sm font-black ${totalPercentage === 100 ? 'text-green-600' :
                                totalPercentage > 100 ? 'text-red-600' : 'text-orange-600'
                                }`}>
                                {totalPercentage}%
                            </span>
                            {totalPercentage === 100 && (
                                <span className="material-symbols-outlined text-green-600 text-sm">check_circle</span>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Financing Configuration */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-sm font-bold text-blue-900 mb-1">Financiamento</h3>
                        <p className="text-xs text-blue-700">
                            {hasFinancing ? '✓ Configurado' : 'Configure os detalhes do financiamento'}
                        </p>
                    </div>
                    <button
                        onClick={onConfigureFinancing}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                        <span className="material-symbols-outlined text-sm">
                            {hasFinancing ? 'edit' : 'add'}
                        </span>
                        {hasFinancing ? 'Editar' : 'Configurar'}
                    </button>
                </div>
            </div>

            {/* Lease Configuration */}
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-sm font-bold text-green-900 mb-1">Locação</h3>
                        <p className="text-xs text-green-700">
                            {hasLease ? '✓ Configurado' : 'Configure o contrato de locação'}
                        </p>
                    </div>
                    <button
                        onClick={onConfigureLease}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                        <span className="material-symbols-outlined text-sm">
                            {hasLease ? 'edit' : 'add'}
                        </span>
                        {hasLease ? 'Editar' : 'Configurar'}
                    </button>
                </div>
            </div>

            {totalPercentage !== 100 && partners.length > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
                    <span className="material-symbols-outlined text-orange-600">warning</span>
                    <p className="text-xs text-orange-900">
                        A soma dos percentuais dos sócios deve ser 100%. Atualmente está em {totalPercentage}%.
                    </p>
                </div>
            )}
        </div>
    );
};
