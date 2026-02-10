import React from 'react';

interface Step2DocumentationProps {
    areaTotal: string;
    setAreaTotal: (value: string) => void;
    matricula: string;
    setMatricula: (value: string) => void;
    iptu: string;
    setIptu: (value: string) => void;
    cartorio: string;
    setCartorio: (value: string) => void;
    acquisitionDate: string;
    setAcquisitionDate: (value: string) => void;
    irpfStatus: string;
    setIrpfStatus: (value: string) => void;
    origin: string;
    setOrigin: (value: string) => void;
}

export const Step2Documentation: React.FC<Step2DocumentationProps> = ({
    areaTotal, setAreaTotal,
    matricula, setMatricula,
    iptu, setIptu,
    cartorio, setCartorio,
    acquisitionDate, setAcquisitionDate,
    irpfStatus, setIrpfStatus,
    origin, setOrigin,
}) => {
    return (
        <div className="space-y-6">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600">description</span>
                Características e Documentação
            </h2>

            {/* Área Total */}
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                    Área Total (m²)
                </label>
                <input
                    type="number"
                    value={areaTotal}
                    onChange={(e) => setAreaTotal(e.target.value)}
                    placeholder="150"
                    className="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                />
            </div>

            {/* Matrícula e IPTU */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Matrícula</label>
                    <input
                        type="text"
                        value={matricula}
                        onChange={(e) => setMatricula(e.target.value)}
                        placeholder="12345"
                        className="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">IPTU</label>
                    <input
                        type="text"
                        value={iptu}
                        onChange={(e) => setIptu(e.target.value)}
                        placeholder="000.000.0000-0"
                        className="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                </div>
            </div>

            {/* Cartório */}
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                    Cartório de Registro
                </label>
                <input
                    type="text"
                    value={cartorio}
                    onChange={(e) => setCartorio(e.target.value)}
                    placeholder="Cartório de Registro de Imóveis"
                    className="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-primary/20 outline-none"
                />
            </div>

            {/* Data de Aquisição e Status IRPF */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                        Data de Aquisição
                    </label>
                    <input
                        type="date"
                        value={acquisitionDate}
                        onChange={(e) => setAcquisitionDate(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                        Status IRPF
                    </label>
                    <select
                        value={irpfStatus}
                        onChange={(e) => setIrpfStatus(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-primary/20 outline-none appearance-none cursor-pointer"
                    >
                        <option value="Declarado">Declarado</option>
                        <option value="Não Declarado">Não Declarado</option>
                        <option value="Isento">Isento</option>
                    </select>
                </div>
            </div>

            {/* Origem da Aquisição */}
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                    Origem da Aquisição
                </label>
                <select
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-primary/20 outline-none appearance-none cursor-pointer"
                >
                    <option value="Compra">Compra</option>
                    <option value="Herança">Herança</option>
                    <option value="Doação">Doação</option>
                    <option value="Permuta">Permuta</option>
                    <option value="Outro">Outro</option>
                </select>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                <span className="material-symbols-outlined text-blue-600">info</span>
                <p className="text-xs text-blue-900">
                    Estes dados são importantes para fins fiscais e de registro. Caso não tenha todas as informações agora, você pode preencher posteriormente.
                </p>
            </div>
        </div>
    );
};
