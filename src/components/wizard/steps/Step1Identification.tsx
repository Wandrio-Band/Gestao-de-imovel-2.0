import React from 'react';

interface Step1IdentificationProps {
    // Form values
    name: string;
    setName: (value: string) => void;
    type: string;
    setType: (value: string) => void;
    status: string;
    setStatus: (value: string) => void;
    street: string;
    setStreet: (value: string) => void;
    number: string;
    setNumber: (value: string) => void;
    complement: string;
    setComplement: (value: string) => void;
    neighborhood: string;
    setNeighborhood: (value: string) => void;
    city: string;
    setCity: (value: string) => void;
    state: string;
    setState: (value: string) => void;
    zipCode: string;
    setZipCode: (value: string) => void;
}

export const Step1Identification: React.FC<Step1IdentificationProps> = ({
    name, setName,
    type, setType,
    status, setStatus,
    street, setStreet,
    number, setNumber,
    complement, setComplement,
    neighborhood, setNeighborhood,
    city, setCity,
    state, setState,
    zipCode, setZipCode,
}) => {
    return (
        <div className="space-y-6">
            {/* Nome do Ativo */}
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                    Nome do Ativo <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Apartamento Beira Mar 402"
                    className="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                />
            </div>

            {/* Tipo e Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                        Tipo de Ativo <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none appearance-none cursor-pointer"
                    >
                        <option value="">Selecione...</option>
                        <option value="Residencial">Residencial</option>
                        <option value="Comercial">Comercial</option>
                        <option value="Terreno">Terreno</option>
                        <option value="Industrial">Industrial</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                        Status de Uso <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none appearance-none cursor-pointer"
                    >
                        <option value="Vago">Vago</option>
                        <option value="Locado">Locado</option>
                        <option value="Uso Próprio">Uso Próprio</option>
                        <option value="Em Reforma">Em Reforma</option>
                    </select>
                </div>
            </div>

            {/* Endereço */}
            <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-600">location_on</span>
                    Localização
                </h3>

                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Endereço</label>
                    <input
                        type="text"
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        placeholder="Rua, Avenida..."
                        className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Número</label>
                        <input
                            type="text"
                            value={number}
                            onChange={(e) => setNumber(e.target.value)}
                            placeholder="123"
                            className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Complemento</label>
                        <input
                            type="text"
                            value={complement}
                            onChange={(e) => setComplement(e.target.value)}
                            placeholder="Apto 402"
                            className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Bairro</label>
                    <input
                        type="text"
                        value={neighborhood}
                        onChange={(e) => setNeighborhood(e.target.value)}
                        placeholder="Centro"
                        className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">
                            Cidade <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder="São Paulo"
                            className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">
                            UF <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={state}
                            onChange={(e) => setState(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-primary/20 outline-none appearance-none cursor-pointer"
                        >
                            <option value="">--</option>
                            <option>SP</option>
                            <option>RJ</option>
                            <option>MG</option>
                            <option>CE</option>
                            <option>ES</option>
                            <option>RS</option>
                        </select>
                    </div>
                </div>

                <div className="w-48">
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">CEP</label>
                    <input
                        type="text"
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                        placeholder="00000-000"
                        className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                </div>
            </div>
        </div>
    );
};
