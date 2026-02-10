import React, { useState, useEffect } from 'react';
import { PartnerShare } from '../../types';

interface PartnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPartners: PartnerShare[];
  onSave: (partners: PartnerShare[]) => void;
}

const AVAILABLE_PARTNERS = [
    { name: 'Wândrio', initials: 'W', color: 'bg-orange-100 text-orange-700' },
    { name: 'Raquel', initials: 'R', color: 'bg-purple-100 text-purple-700' },
    { name: 'Marília', initials: 'M', color: 'bg-pink-100 text-pink-700' },
    { name: 'Tilinha', initials: 'T', color: 'bg-blue-100 text-blue-700' },
];

const ALLOWED_PERCENTAGES = [0, 25, 50, 100];

export const PartnerModal: React.FC<PartnerModalProps> = ({ isOpen, onClose, currentPartners, onSave }) => {
    const [partners, setPartners] = useState<PartnerShare[]>([]);

    useEffect(() => {
        if (isOpen) {
            // Deep copy to avoid mutating props directly
            setPartners(JSON.parse(JSON.stringify(currentPartners)));
        }
    }, [isOpen, currentPartners]);

    if (!isOpen) return null;

    const totalPercentage = partners.reduce((sum, p) => sum + p.percentage, 0);

    const handleAddPartner = () => {
        const available = AVAILABLE_PARTNERS.find(p => !partners.some(cp => cp.name === p.name));
        if (available) {
            setPartners([...partners, { ...available, percentage: 0 }]);
        } else {
             // Caso todos já estejam adicionados, permite duplicar ou adiciona um genérico se necessário, 
             // mas aqui focamos nos disponíveis.
             setPartners([...partners, { name: 'Novo Sócio', initials: 'NS', percentage: 0, color: 'bg-gray-100 text-gray-600' }]);
        }
    };

    const handleRemovePartner = (index: number) => {
        const newPartners = [...partners];
        newPartners.splice(index, 1);
        setPartners(newPartners);
    };

    const handleUpdatePartner = (index: number, field: keyof PartnerShare, value: any) => {
        const newPartners = [...partners];
        const partner = { ...newPartners[index], [field]: value };
        
        if (field === 'name') {
             const style = AVAILABLE_PARTNERS.find(p => p.name === value);
             if (style) {
                 partner.initials = style.initials;
                 partner.color = style.color;
             }
        }
        
        newPartners[index] = partner;
        setPartners(newPartners);
    };

    const handleSave = () => {
        if (totalPercentage === 100) {
            onSave(partners);
            onClose();
        } else {
            alert('A soma das participações deve ser exatamente 100%');
        }
    };

    // Adicionado onClick={e => e.stopPropagation()} no container externo e interno 
    // para garantir que cliques no modal não fechem modais pais ou acionem listeners globais.
    return (
        <div 
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            <div 
                className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up"
                onClick={(e) => e.stopPropagation()} 
            >
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-lg font-black text-gray-900">Editar Composição Societária</h3>
                    <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                
                <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                    {partners.map((partner, index) => (
                        <div key={index} className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${partner.color}`}>
                                {partner.initials}
                            </div>
                            <select 
                                value={partner.name}
                                onChange={(e) => handleUpdatePartner(index, 'name', e.target.value)}
                                className="bg-transparent font-bold text-sm text-gray-900 outline-none flex-1 cursor-pointer"
                            >
                                {AVAILABLE_PARTNERS.map(ap => (
                                    <option key={ap.name} value={ap.name}>{ap.name}</option>
                                ))}
                            </select>
                            
                            <div className="flex items-center gap-1 bg-white px-3 py-2 rounded-lg border border-gray-200 focus-within:border-primary/50 transition-colors">
                                <select
                                    value={partner.percentage}
                                    onChange={(e) => handleUpdatePartner(index, 'percentage', parseInt(e.target.value))}
                                    className="text-right font-bold text-gray-900 outline-none appearance-none pr-1 bg-transparent cursor-pointer"
                                >
                                    {ALLOWED_PERCENTAGES.map(p => (
                                        <option key={p} value={p}>{p}</option>
                                    ))}
                                </select>
                                <span className="text-xs font-bold text-gray-400 pointer-events-none">%</span>
                            </div>

                            <button onClick={() => handleRemovePartner(index)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                <span className="material-symbols-outlined text-lg">delete</span>
                            </button>
                        </div>
                    ))}

                    <button 
                        onClick={handleAddPartner}
                        className="w-full py-4 border border-dashed border-gray-300 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50 hover:text-primary hover:border-primary transition-all flex items-center justify-center gap-2 group"
                    >
                        <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                            <span className="material-symbols-outlined text-sm">add</span>
                        </span>
                        Adicionar Novo Sócio
                    </button>
                </div>

                <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Total Distribuído</p>
                        <p className={`text-xl font-black ${totalPercentage === 100 ? 'text-green-600' : 'text-red-500'}`}>
                            {totalPercentage}%
                        </p>
                        {totalPercentage !== 100 && (
                            <p className="text-[9px] text-red-400 font-bold mt-1">Deve somar 100%</p>
                        )}
                    </div>
                    <button 
                        onClick={handleSave}
                        disabled={totalPercentage !== 100}
                        className={`px-8 py-3 rounded-full font-bold text-sm text-white shadow-lg transition-all flex items-center gap-2 ${totalPercentage === 100 ? 'bg-black hover:bg-gray-800' : 'bg-gray-300 cursor-not-allowed shadow-none'}`}
                    >
                        <span className="material-symbols-outlined text-sm">check</span>
                        Salvar
                    </button>
                </div>
            </div>
        </div>
    );
};