'use client';

import React, { useEffect, useState } from 'react';
import { getTenantAliases, deleteAlias } from '@/app/actions/rental';
import toast from 'react-hot-toast';

interface Alias {
    id: string;
    aliasName: string;
    tenantId: string;
    tenant: {
        name: string;
    };
    confidence: number;
    lastUsed: Date;
}

export default function AliasConfigPage() {
    const [aliases, setAliases] = useState<Alias[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadAliases = async () => {
        setIsLoading(true);
        const data = await getTenantAliases();
        // Cast or map if types mismatch, but action returns simple object
        setAliases(data as any);
        setIsLoading(false);
    };

    useEffect(() => {
        loadAliases();
    }, []);

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Tem certeza que deseja esquecer o vínculo "${name}"?`)) return;

        const toastId = toast.loading('Removendo...');
        const res = await deleteAlias(id);

        if (res.success) {
            toast.success('Vínculo removido', { id: toastId });
            setAliases(prev => prev.filter(a => a.id !== id));
        } else {
            toast.error('Erro ao remover', { id: toastId });
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <header className="mb-8 flex items-center gap-4">
                <a href="/conciliacao" className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
                    <span className="material-symbols-outlined text-gray-500">arrow_back</span>
                </a>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Configuração de Vínculos</h1>
                    <p className="text-gray-500">Gerencie os apelidos que a IA aprendeu para identificar inquilinos.</p>
                </div>
            </header>

            <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 font-bold text-gray-500 uppercase text-xs">Texto no Extrato (PIX)</th>
                            <th className="px-6 py-4 font-bold text-gray-500 uppercase text-xs">Inquilino Vinculado</th>
                            <th className="px-6 py-4 font-bold text-gray-500 uppercase text-xs text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {isLoading ? (
                            <tr>
                                <td colSpan={3} className="px-6 py-10 text-center text-gray-400">
                                    Carregando vínculos...
                                </td>
                            </tr>
                        ) : aliases.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-6 py-10 text-center text-gray-400">
                                    Nenhum vínculo aprendido ainda.
                                </td>
                            </tr>
                        ) : (
                            aliases.map((alias) => (
                                <tr key={alias.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900">
                                        {alias.aliasName}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-gray-400 text-sm">person</span>
                                            <span className="text-gray-700">{alias.tenant.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            onClick={() => handleDelete(alias.id, alias.aliasName)}
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                            title="Esquecer Vínculo"
                                        >
                                            <span className="material-symbols-outlined text-lg">delete</span>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
