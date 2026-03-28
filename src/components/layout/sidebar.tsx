"use client"

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const Sidebar: React.FC = () => {
    const pathname = usePathname();

    // Helper to check if a main section should be active based on current view
    const isSectionActive = (path: string, subPaths: string[] = []) => {
        if (pathname === path) return true;
        if (subPaths.some(p => pathname.startsWith(p))) return true;
        return false;
    };

    const NavItem = ({ href, icon, label, subItems }: { href: string; icon: string; label: string; subItems?: { href: string, label: string }[] }) => {
        const isActive = isSectionActive(href, subItems?.map(i => i.href));

        return (
            <div className="mb-2">
                <Link href={href}>
                    <button
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                            ? 'bg-black text-white shadow-lg shadow-gray-200'
                            : 'text-gray-500 hover:bg-gray-100 scale-100'
                            }`}
                    >
                        <span className={`material-symbols-outlined ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}`} aria-hidden="true">{icon}</span>
                        <span className="font-bold text-sm">{label}</span>
                    </button>
                </Link>
                {isActive && subItems && (
                    <div className="ml-12 mt-2 flex flex-col gap-1 border-l-2 border-gray-100 pl-3">
                        {subItems.map(item => {
                            const isSubItemActive = pathname === item.href;

                            return (
                                <Link key={item.href} href={item.href}>
                                    <button
                                        className={`text-left text-xs font-semibold py-1.5 transition-colors w-full ${isSubItemActive ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        {item.label}
                                    </button>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    return (
        <aside className="w-64 h-full bg-white border-r border-gray-100 flex flex-col flex-shrink-0 animate-fade-in text-[#0d121b]" aria-label="Menu principal">
            <div className="p-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white">
                    <span className="material-symbols-outlined text-lg" aria-hidden="true">domain</span>
                </div>
                <div className="flex flex-col">
                    <span className="font-extrabold text-sm tracking-tight text-gray-900">ASSET<span className="text-primary">MANAGER</span></span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Premium Estate</span>
                </div>
            </div>

            <nav className="flex-1 px-4 py-6 overflow-y-auto no-scrollbar" aria-label="Navegação do sistema">
                <div className="mb-6" role="group" aria-label="Principal">
                    <p className="px-4 text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2" aria-hidden="true">Principal</p>
                    <NavItem href="/" icon="dashboard" label="Dashboard" />
                    <NavItem
                        href="/properties"
                        icon="apartment"
                        label="Ativos"
                        subItems={[
                            { href: '/properties', label: 'Galeria de Cards' },
                            { href: '/properties?view=list', label: 'Lista Tabela' },
                            { href: '/properties/values', label: 'Edição de Valores' },
                            { href: '/properties/new', label: 'Novo Cadastro' }
                        ]}
                    />
                    <NavItem href="/holdings" icon="pie_chart" label="Sócios & Cotas" />
                </div>

                <div className="mb-6" role="group" aria-label="Financeiro">
                    <p className="px-4 text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2" aria-hidden="true">Financeiro</p>
                    <NavItem
                        href="/financing"
                        icon="payments"
                        label="Gestão Financeira"
                        subItems={[
                            { href: '/financing', label: 'Visão Geral' },
                            { href: '/financing/schedule', label: 'Cronograma Consolidado' },
                            { href: '/financing/debt', label: 'Gestão de Dívida' }
                        ]}
                    />
                    <NavItem href="/adjustments" icon="trending_up" label="Reajustes de Aluguel" />
                    <NavItem href="/invoices" icon="receipt_long" label="Notas Fiscais" />
                    <NavItem href="/ai-assistant" icon="smart_toy" label="Assistente IA" />
                </div>

                <div role="group" aria-label="Documentos">
                    <p className="px-4 text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2" aria-hidden="true">Documentos</p>
                    <NavItem href="/reports" icon="description" label="Relatórios"
                        subItems={[
                            { href: '/reports', label: 'Relatório Executivo' },
                            { href: '/reports/config', label: 'Exportar Dados' }
                        ]}
                    />
                </div>
            </nav>

            <div className="p-4 border-t border-gray-100">
                <button className="flex items-center gap-3 px-4 py-2 w-full rounded-lg hover:bg-gray-50 transition-colors group" aria-label="Menu do usuário Ricardo Silva">
                    <img src="https://picsum.photos/id/64/100/100" className="w-8 h-8 rounded-full border-2 border-white shadow-sm" alt="Foto do perfil de Ricardo Silva" />
                    <div className="flex flex-col items-start">
                        <span className="text-xs font-bold text-gray-800">Ricardo Silva</span>
                        <span className="text-[10px] text-gray-400 font-medium">Administrador</span>
                    </div>
                    <span className="material-symbols-outlined ml-auto text-gray-300 text-sm" aria-hidden="true">expand_more</span>
                </button>
            </div>
        </aside>
    );
};
