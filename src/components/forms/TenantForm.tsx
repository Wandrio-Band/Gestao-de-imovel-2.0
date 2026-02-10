import React, { useState, useEffect } from 'react';

interface TenantData {
    id: string;
    name: string;
    document?: string;
    email?: string;
    phone?: string;
}

interface TenantFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: TenantData) => Promise<void>;
    tenant: TenantData;
}

export const TenantForm: React.FC<TenantFormProps> = ({ isOpen, onClose, onSave, tenant }) => {
    const [formData, setFormData] = useState<TenantData>(tenant);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setFormData(tenant);
    }, [tenant, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave(formData);
            onClose();
        } catch (e) {
            console.error(e);
            alert("Erro ao salvar inquilino.");
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up" onClick={e => e.stopPropagation()}>

                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 border border-purple-100">
                            <span className="material-symbols-outlined">person</span>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Editar Inquilino</h2>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
                        <span className="material-symbols-outlined text-gray-500">close</span>
                    </button>
                </div>

                <div className="p-6 bg-[#f8f9fc] space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Nome Completo</label>
                        <input name="name" value={formData.name} onChange={handleChange} className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm font-bold text-gray-900 outline-none" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Documento (CPF/CNPJ)</label>
                        <input name="document" value={formData.document || ''} onChange={handleChange} className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm font-bold text-gray-900 outline-none" disabled />
                        <p className="text-[10px] text-gray-400 mt-1">Documento não pode ser alterado.</p>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Email</label>
                        <input name="email" value={formData.email || ''} onChange={handleChange} className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm font-bold text-gray-900 outline-none" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Telefone</label>
                        <input name="phone" value={formData.phone || ''} onChange={handleChange} className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm font-bold text-gray-900 outline-none" placeholder="(00) 90000-0000" />
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 bg-white flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-2 rounded-full border border-gray-200 text-sm font-bold text-gray-500 hover:bg-gray-50 transition">Cancelar</button>
                    <button onClick={handleSave} disabled={isSaving} className="px-6 py-2 rounded-full bg-purple-600 text-white text-sm font-bold shadow-lg hover:bg-purple-700 transition">
                        {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </div>
            </div>
        </div>
    );
};
