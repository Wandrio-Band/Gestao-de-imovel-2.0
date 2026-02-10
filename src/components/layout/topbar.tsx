"use client"

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const TopBar: React.FC = () => {
    const pathname = usePathname();

    // Helper to determine breadcrumb title based on path
    const getPageTitle = (path: string) => {
        switch (path) {
            case '/': return 'Visão Geral';
            case '/properties': return 'Gestão de Ativos';
            case '/properties/new': return 'Novo Ativo';
            case '/holdings': return 'Visão Auditoria';
            case '/financing': return 'Gestão Financeira';
            case '/reports': return 'Relatórios';
            case '/irpf-import': return 'Importação IRPF';
            default: return 'Visão Geral';
        }
    };

    return (
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-10 w-full transition-all duration-200">
            <div className="flex items-center gap-4 text-gray-400 text-sm font-medium">
                <Link href="/" className="hover:text-black cursor-pointer transition-colors">Home</Link>
                <span className="material-symbols-outlined text-xs">chevron_right</span>
                <span className="text-black font-bold">{getPageTitle(pathname)}</span>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative group">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">search</span>
                    <input
                        type="text"
                        placeholder="Buscar ativos, contratos..."
                        className="pl-10 pr-4 py-2 bg-gray-50 border-none rounded-full text-sm w-64 focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all placeholder-gray-400 font-medium text-gray-700 outline-none"
                    />
                </div>

                <button className="w-9 h-9 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-500 hover:text-primary hover:border-primary/20 transition-all shadow-sm">
                    <span className="material-symbols-outlined text-[20px]">notifications</span>
                </button>

                <button className="w-9 h-9 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-500 hover:text-primary hover:border-primary/20 transition-all shadow-sm">
                    <span className="material-symbols-outlined text-[20px]">settings</span>
                </button>
            </div>
        </header>
    );
};
