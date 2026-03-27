import React, { useState, useEffect } from 'react';
import { useAssetContext } from '@/context/AssetContext';
import ImportIRPFHybrid from './ImportIRPF';
import { EmptyState } from '@/components/EmptyState';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const data = [
  { name: 'Locado', value: 75, color: '#10B981' },
  { name: 'Uso Próprio', value: 15, color: '#1152d4' },
  { name: 'Vazio', value: 10, color: '#F59E0B' },
];

const getPartnerStyle = (name: string) => {
  switch (name) {
    case 'Wândrio': return { initials: 'W', color: 'bg-orange-100 text-orange-700' };
    case 'Raquel': return { initials: 'R', color: 'bg-purple-100 text-purple-700' };
    case 'Marília': return { initials: 'M', color: 'bg-pink-100 text-pink-700' };
    case 'Tilinha': return { initials: 'T', color: 'bg-blue-100 text-blue-700' };
    default: return { initials: name.charAt(0), color: 'bg-gray-100 text-gray-700' };
  }
};

export const Dashboard: React.FC<{ onNavigate?: (view: any) => void }> = ({ onNavigate = () => { } }) => {
  const { assets } = useAssetContext();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initial load
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const totalValue = assets.reduce((acc, curr) => acc + curr.marketValue, 0);
  const formattedTotal = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(totalValue);

  // Calculate partner shares dynamically
  const partnerValues: Record<string, number> = {};
  assets.forEach(asset => {
    asset.partners.forEach(p => {
      const val = asset.marketValue * (p.percentage / 100);
      partnerValues[p.name] = (partnerValues[p.name] || 0) + val;
    });
  });

  const topPartners = Object.entries(partnerValues)
    .map(([name, value]) => ({
      name,
      value,
      percent: (value / totalValue) * 100
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 3); // Top 3 partners

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Visão Geral</h1>
        <p className="text-gray-500 mt-1">Bem-vindo ao hub de gestão patrimonial.</p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <LoadingSkeleton count={6} variant="card" />
      )}

      {/* Empty State */}
      {!isLoading && assets.length === 0 && (
        <EmptyState
          icon="home_work"
          title="Nenhum Ativo Cadastrado"
          description="Comece adicionando seu primeiro imóvel ao portfólio para visualizar o dashboard completo com estatísticas e insights."
          action={{
            label: "Cadastrar Primeiro Ativo",
            onClick: () => onNavigate('asset_new')
          }}
        />
      )}

      {/* Dashboard Content */}
      {!isLoading && assets.length > 0 && (
        <>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="col-span-1 lg:col-span-2 bg-white rounded-[2.5rem] p-8 shadow-soft border border-gray-100 relative overflow-hidden group">
              <div className="absolute right-0 top-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <span className="material-symbols-outlined text-9xl">account_balance</span>
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <span className="p-2 bg-gray-50 rounded-lg text-gray-600"><span className="material-symbols-outlined">payments</span></span>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Valor Total de Mercado</span>
                </div>
                <h2 className="text-5xl font-black text-gray-900 tracking-tighter mb-2">
                  {formattedTotal}
                </h2>
                <div className="flex items-center gap-2">
                  <span className="bg-green-50 text-green-700 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">trending_up</span> +12.5%
                  </span>
                  <span className="text-xs text-gray-400 font-medium">vs 2023</span>
                </div>
                <div className="mt-6 w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-black h-full w-[70%]"></div>
                </div>
              </div>
            </div>

            <div className="col-span-1 bg-white rounded-[2.5rem] p-8 shadow-soft border border-gray-100 flex flex-col items-center justify-center relative">
              <h3 className="absolute top-6 left-6 text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span> Ocupação
              </h3>
              <div className="h-40 w-full relative mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black text-gray-900">90%</span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Ocupado</span>
                </div>
              </div>
              <div className="flex justify-between w-full mt-2 px-2">
                <div className="text-center">
                  <span className="block text-lg font-bold text-gray-900">32</span>
                  <span className="block text-[10px] font-bold text-gray-400 uppercase">Ativos</span>
                </div>
                <div className="text-center">
                  <span className="block text-lg font-bold text-gray-900">1.8%</span>
                  <span className="block text-[10px] font-bold text-gray-400 uppercase">Vacância</span>
                </div>
              </div>
            </div>

            <div className="col-span-1 bg-white rounded-[2.5rem] p-8 shadow-soft border border-gray-100 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">groups</span> Sócios
                </h3>
                <button className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors">
                  <span className="material-symbols-outlined text-sm text-gray-600">arrow_forward</span>
                </button>
              </div>
              <div className="space-y-4">
                {topPartners.map((partner) => {
                  const style = getPartnerStyle(partner.name);
                  return (
                    <div key={partner.name} className="flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${style.color}`}>
                          {style.initials}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{partner.name}</p>
                          <p className="text-[10px] text-gray-400 font-medium">Sócio</p>
                        </div>
                      </div>
                      <span className="font-black text-sm bg-gray-50 px-2 py-1 rounded-lg">{partner.percent.toFixed(0)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* IA Insights Section */}
          <div className="bg-[#101622] rounded-[2.5rem] p-8 lg:p-10 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-600/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4"></div>
            <div className="relative z-10 flex flex-col lg:flex-row gap-8 lg:items-center">
              <div className="flex-shrink-0 max-w-sm">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 shadow-inner backdrop-blur-md mb-4">
                  <span className="material-symbols-outlined text-white text-2xl">auto_awesome</span>
                </div>
                <h3 className="text-2xl font-black text-white tracking-tight mb-2">IA Insights</h3>
                <p className="text-sm text-gray-400 font-medium leading-relaxed mb-6">
                  Nossa inteligência artificial analisou 2.4TB de dados do mercado hoje para encontrar oportunidades de otimização no seu portfólio.
                </p>
                <button className="px-6 py-3 rounded-full bg-primary hover:bg-blue-600 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-primary/25">
                  Ver Relatório Completo
                </button>
              </div>
              <div className="hidden lg:block w-px h-32 bg-white/10 mx-4"></div>
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-3xl p-5 hover:bg-white/10 transition-colors cursor-pointer group/card">
                  <div className="flex justify-between items-start mb-3">
                    <span className="px-2 py-1 rounded bg-green-500/20 text-green-400 text-[10px] font-bold uppercase border border-green-500/20">Oportunidade</span>
                    <span className="material-symbols-outlined text-gray-500 text-sm group-hover/card:text-white transition-colors">arrow_outward</span>
                  </div>
                  <p className="text-sm font-bold text-gray-200 mb-1">Antecipação de Parcelas (Ed. Horizon)</p>
                  <p className="text-xs text-gray-400">Economia projetada de <span className="text-white font-bold">R$ 45.000</span> com amortização via IPCA neste trimestre.</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-3xl p-5 hover:bg-white/10 transition-colors cursor-pointer group/card">
                  <div className="flex justify-between items-start mb-3">
                    <span className="px-2 py-1 rounded bg-orange-500/20 text-orange-400 text-[10px] font-bold uppercase border border-orange-500/20">Atenção</span>
                    <span className="material-symbols-outlined text-gray-500 text-sm group-hover/card:text-white transition-colors">arrow_outward</span>
                  </div>
                  <p className="text-sm font-bold text-gray-200 mb-1">Renovação Contratual (Torre Alpha)</p>
                  <p className="text-xs text-gray-400">Contrato do 12º andar vence em 60 dias. Valor de mercado subiu <span className="text-white font-bold">8.5%</span> na região.</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};