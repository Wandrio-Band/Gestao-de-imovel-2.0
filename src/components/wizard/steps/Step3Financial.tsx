import React from 'react';

interface Step3FinancialProps {
    value: string;
    setValue: (value: string) => void;
    marketValue: string;
    setMarketValue: (value: string) => void;
    irpfValue: string;
    setIrpfValue: (value: string) => void;
    saleExpectation: string;
    setSaleExpectation: (value: string) => void;
    suggestedRent: string;
    setSuggestedRent: (value: string) => void;
}

export const Step3Financial: React.FC<Step3FinancialProps> = ({
    value, setValue,
    marketValue, setMarketValue,
    irpfValue, setIrpfValue,
    saleExpectation, setSaleExpectation,
    suggestedRent, setSuggestedRent,
}) => {
    const formatCurrency = (val: string) => {
        const num = val.replace(/\D/g, '');
        if (!num) return '';
        const formatted = (Number(num) / 100).toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
        return `R$ ${formatted}`;
    };

    const handleCurrencyChange = (value: string, setter: (v: string) => void) => {
        const formatted = formatCurrency(value);
        setter(formatted);
    };

    return (
        <div className="space-y-6">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-green-600">payments</span>
                Valores Financeiros
            </h2>

            {/* Valor de Aquisição */}
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                    Valor de Aquisição
                </label>
                <input
                    type="text"
                    value={value}
                    onChange={(e) => handleCurrencyChange(e.target.value, setValue)}
                    placeholder="R$ 0,00"
                    className="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Valor pago ou declarado na aquisição do imóvel</p>
            </div>

            {/* Valor de Mercado */}
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                    Valor de Mercado Atual
                </label>
                <input
                    type="text"
                    value={marketValue}
                    onChange={(e) => handleCurrencyChange(e.target.value, setMarketValue)}
                    placeholder="R$ 0,00"
                    className="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-primary/20 outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Valor estimado de venda no mercado atual</p>
            </div>

            {/* Valor Declarado IRPF */}
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                    Valor Declarado no IRPF
                </label>
                <input
                    type="text"
                    value={irpfValue}
                    onChange={(e) => handleCurrencyChange(e.target.value, setIrpfValue)}
                    placeholder="R$ 0,00"
                    className="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-primary/20 outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Valor informado na declaração de Imposto de Renda</p>
            </div>

            {/* Previsão de Venda e Aluguel */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                        Previsão de Venda
                    </label>
                    <input
                        type="text"
                        value={saleExpectation}
                        onChange={(e) => handleCurrencyChange(e.target.value, setSaleExpectation)}
                        placeholder="R$ 0,00"
                        className="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                        Aluguel Sugerido
                    </label>
                    <input
                        type="text"
                        value={suggestedRent}
                        onChange={(e) => handleCurrencyChange(e.target.value, setSuggestedRent)}
                        placeholder="R$ 0,00"
                        className="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                </div>
            </div>

            {/* Summary Card */}
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-green-900 mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined">analytics</span>
                    Resumo Financeiro
                </h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs text-green-600 font-bold uppercase mb-1">Valor Total</p>
                        <p className="text-lg font-black text-green-900">{marketValue || 'R$ 0,00'}</p>
                    </div>
                    <div>
                        <p className="text-xs text-green-600 font-bold uppercase mb-1">Aluguel Mensal</p>
                        <p className="text-lg font-black text-green-900">{suggestedRent || 'R$ 0,00'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
