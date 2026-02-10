'use client';

import React, { useState } from 'react';
import { ContractData, getContracts } from '@/app/actions/contracts';
import { Asset } from '@/components/ai-studio/types';
import { saveStandaloneContract } from '@/app/actions/contract-management';
import { ContractForm } from '@/components/forms/ContractForm';

interface ContractsClientProps {
    initialContracts: ContractData[];
    initialAssets: Asset[];
}

export default function ContractsClient({ initialContracts, initialAssets }: ContractsClientProps) {
    const [contracts, setContracts] = useState<ContractData[]>(initialContracts);
    const [assets, setAssets] = useState<Asset[]>(initialAssets);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedContract, setSelectedContract] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const refreshList = async () => {
        setLoading(true);
        try {
            const data = await getContracts();
            setContracts(data);
        } finally {
            setLoading(false);
        }
    };

    const handleNewContract = () => {
        setSelectedContract(null);
        setIsModalOpen(true);
    };

    const handleEdit = (contract: ContractData) => {
        setIsModalOpen(true);
        // Safely handle potential undefined values
        setSelectedContract({
            id: contract.id,
            assetId: contract.assetId,
            contractNumber: contract.contractNumber,
            nomeInquilino: contract.tenantName,
            documentoInquilino: '',
            emailInquilino: '',
            valorAluguel: contract.currentValue ? contract.currentValue.toString() : '0', // Fix: use currentValue
            diaVencimento: 'Dia 5', // Default or need to fetch
            tipoGarantia: '',
            inicioVigencia: contract.startDate instanceof Date ? contract.startDate.toISOString().split('T')[0] : (typeof contract.startDate === 'string' ? contract.startDate.split('T')[0] : ''),
            fimContrato: '',
            indexador: 'IPCA'
        });
    };

    const handleSaveContract = async (data: any) => {
        await saveStandaloneContract(data);
        await refreshList();
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <header className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestão de Contratos</h1>
                    <p className="text-gray-500">
                        Visão geral de todos os contratos de locação cadastrados.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={refreshList}
                        className={`p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors ${loading ? 'animate-spin' : ''}`}
                        title="Atualizar lista"
                    >
                        <span className="material-symbols-outlined">refresh</span>
                    </button>
                    <button
                        onClick={handleNewContract}
                        className="bg-black text-white px-6 py-2 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200"
                    >
                        <span className="material-symbols-outlined text-[20px]">add</span>
                        Novo Contrato
                    </button>
                </div>
            </header>

            <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase text-xs">ID</th>
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase text-xs">Imóvel e Inquilino</th>
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase text-xs">Vigência</th>
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase text-xs">Valor Atual</th>
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase text-xs">Status</th>
                                <th className="px-6 py-4 text-right font-bold text-gray-500 uppercase text-xs">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {contracts.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                                        Nenhum contrato encontrado.
                                    </td>
                                </tr>
                            ) : (
                                contracts.map((contract) => (
                                    <tr key={contract.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-mono text-xs text-gray-500">
                                            {contract.contractNumber || '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-900">{contract.assetName}</div>
                                            <div className="text-xs text-blue-600 font-medium mt-0.5">{contract.tenantName}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-gray-600">
                                                Início: {new Date(contract.startDate).toLocaleDateString('pt-BR')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-gray-900">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(contract.currentValue)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${contract.status === 'active'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                {contract.status === 'active' ? 'ATIVO' : 'INATIVO'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleEdit(contract)}
                                                className="text-gray-400 hover:text-blue-600 transition-colors p-1 inline-block"
                                                title="Editar Contrato"
                                            >
                                                <span className="material-symbols-outlined">edit_document</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ContractForm
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveContract}
                initialData={selectedContract}
                assets={assets}
            />
        </div>
    );
}
