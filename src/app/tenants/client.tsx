'use client';

import React, { useState } from 'react';
import { TenantData, getTenants } from '@/app/actions/tenants';
import { saveStandaloneTenant } from '@/app/actions/contract-management';
import { TenantForm } from '@/components/forms/TenantForm';

interface TenantsClientProps {
    initialTenants: TenantData[];
}

export default function TenantsClient({ initialTenants }: TenantsClientProps) {
    const [tenants, setTenants] = useState<TenantData[]>(initialTenants);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTenant, setSelectedTenant] = useState<any>(null);

    const refreshList = async () => {
        const data = await getTenants();
        setTenants(data);
    };

    const handleEdit = (tenant: TenantData) => {
        setSelectedTenant({
            id: tenant.id,
            name: tenant.name,
            document: tenant.document,
            email: tenant.email,
            phone: tenant.phone
        });
        setIsModalOpen(true);
    };

    const handleSaveTenant = async (data: any) => {
        await saveStandaloneTenant(data);
        await refreshList();
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <header className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestão de Inquilinos</h1>
                    <p className="text-gray-500">
                        Base centralizada de todos os locatários e seus contratos ativos.
                    </p>
                </div>
            </header>

            <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase text-xs">Nome / Documento</th>
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase text-xs">Contato</th>
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase text-xs">Imóvel Atual</th>
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase text-xs">Contrato</th>
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase text-xs">Status</th>
                                <th className="px-6 py-4 text-right font-bold text-gray-500 uppercase text-xs">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {tenants.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                                        Nenhum inquilino encontrado.
                                    </td>
                                </tr>
                            ) : (
                                tenants.map((tenant) => (
                                    <tr key={tenant.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-900">{tenant.name}</div>
                                            <div className="text-xs text-gray-400 font-mono mt-0.5">{tenant.document || 'Sem documento'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-gray-600 space-y-1">
                                                {tenant.email && (
                                                    <div className="flex items-center gap-1.5" title={tenant.email}>
                                                        <span className="material-symbols-outlined text-[14px] text-gray-400">mail</span>
                                                        <span className="truncate max-w-[150px]">{tenant.email}</span>
                                                    </div>
                                                )}
                                                {tenant.phone && (
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="material-symbols-outlined text-[14px] text-gray-400">call</span>
                                                        <span>{tenant.phone}</span>
                                                    </div>
                                                )}
                                                {!tenant.email && !tenant.phone && <span className="text-gray-400 italic">Sem contato</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {tenant.currentAsset ? (
                                                <div className="flex items-center gap-2 text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded w-fit">
                                                    <span className="material-symbols-outlined text-[16px]">apartment</span>
                                                    {tenant.currentAsset}
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 text-xs">Sem vínculo ativo</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {tenant.contractValue ? (
                                                <div>
                                                    <div className="font-bold text-gray-900">
                                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(tenant.contractValue)}
                                                    </div>
                                                    {tenant.contractStart && (
                                                        <div className="text-xs text-gray-400 mt-0.5">
                                                            Início: {new Date(tenant.contractStart).toLocaleDateString('pt-BR')}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-gray-300">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${tenant.status === 'Ativo'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                {tenant.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleEdit(tenant)}
                                                className="text-gray-400 hover:text-blue-600 transition-colors p-1 inline-block"
                                            >
                                                <span className="material-symbols-outlined">edit</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedTenant && (
                <TenantForm
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveTenant}
                    tenant={selectedTenant}
                />
            )}
        </div>
    );
}
