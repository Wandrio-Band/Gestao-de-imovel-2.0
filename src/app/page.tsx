'use client';

import React from 'react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f8f9fc] flex items-center justify-center p-8">
      <div className="max-w-6xl w-full">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-black text-[#0d121b] mb-4 tracking-tight">
            ASSET MANAGER <span className="text-blue-600">STUDIO</span>
          </h1>
          <p className="text-gray-500 text-lg">Selecione o módulo que deseja acessar</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Module 1: Gestão de Imóveis */}
          <Link href="/dashboard" className="group">
            <div className="bg-white rounded-[2rem] p-8 border border-gray-200 shadow-xl hover:shadow-2xl hover:border-blue-200 transition-all duration-300 h-full flex flex-col items-center text-center transform hover:-translate-y-2">
              <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors duration-300">
                <span className="material-symbols-outlined text-5xl text-blue-600 group-hover:text-white transition-colors duration-300">domain</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Gestão de Imóveis</h2>
              <p className="text-gray-500 leading-relaxed text-sm">
                Controle patrimonial completo, visão geral de ativos, taxas de ocupação e distribuição societária.
              </p>
              <div className="mt-auto pt-8">
                <span className="text-blue-600 font-bold text-sm flex items-center justify-center gap-2 group-hover:gap-3 transition-all">
                  Acessar Módulo <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </span>
              </div>
            </div>
          </Link>

          {/* Module 2: Gestão de Inquilinos */}
          {/* Linking to Properties List for now as 'Tenant Management' is closely tied to assets */}
          <Link href="/properties?view=list" className="group">
            <div className="bg-white rounded-[2rem] p-8 border border-gray-200 shadow-xl hover:shadow-2xl hover:border-emerald-200 transition-all duration-300 h-full flex flex-col items-center text-center transform hover:-translate-y-2">
              <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-6 group-hover:bg-emerald-600 transition-colors duration-300">
                <span className="material-symbols-outlined text-5xl text-emerald-600 group-hover:text-white transition-colors duration-300">group</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Gestão de Inquilinos</h2>
              <p className="text-gray-500 leading-relaxed text-sm">
                Administração de locatários, contratos de aluguel, prazos e controle de inadimplência.
              </p>
              <div className="mt-auto pt-8">
                <span className="text-emerald-600 font-bold text-sm flex items-center justify-center gap-2 group-hover:gap-3 transition-all">
                  Acessar Módulo <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </span>
              </div>
            </div>
          </Link>

          {/* Module 3: Notas Fiscais */}
          <Link href="/invoices" className="group">
            <div className="bg-white rounded-[2rem] p-8 border border-gray-200 shadow-xl hover:shadow-2xl hover:border-orange-200 transition-all duration-300 h-full flex flex-col items-center text-center transform hover:-translate-y-2">
              <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mb-6 group-hover:bg-orange-600 transition-colors duration-300">
                <span className="material-symbols-outlined text-5xl text-orange-600 group-hover:text-white transition-colors duration-300">receipt_long</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Controle de Notas</h2>
              <p className="text-gray-500 leading-relaxed text-sm">
                Gestão centralizada de notas fiscais, recibos, despesas dedutíveis e organização contábil.
              </p>
              <div className="mt-auto pt-8">
                <span className="text-orange-600 font-bold text-sm flex items-center justify-center gap-2 group-hover:gap-3 transition-all">
                  Acessar Módulo <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </span>
              </div>
            </div>
          </Link>
        </div>

        <div className="text-center mt-16 pb-8">
          <p className="text-xs text-gray-400 font-medium">AssetManager v0.1.0 • Desenvolvido com Antigravity</p>
        </div>
      </div>
    </div>
  );
}
