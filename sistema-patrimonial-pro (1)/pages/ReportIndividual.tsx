import React from 'react';
import { Asset, ViewState } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from 'recharts';

interface ReportIndividualProps {
    asset: Asset | null;
    onNavigate: (view: ViewState) => void;
}

export const ReportIndividual: React.FC<ReportIndividualProps> = ({ asset, onNavigate }) => {
    if (!asset) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-10 text-center animate-fade-in-up">
                <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">folder_off</span>
                <h2 className="text-xl font-bold text-gray-900">Selecione um Ativo</h2>
                <p className="text-gray-500 mb-6 max-w-md">Para gerar o dossiê executivo, você precisa selecionar um imóvel na lista de relatórios.</p>
                <button 
                    onClick={() => onNavigate('report_executive')}
                    className="px-6 py-2 bg-black text-white rounded-lg font-bold text-sm shadow-md hover:bg-gray-800 transition-all"
                >
                    Ir para Lista de Relatórios
                </button>
            </div>
        );
    }

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    const currentDate = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

    // Financial Calcs (Safe Checks)
    const debt = asset.financingDetails?.saldoDevedor || 0;
    const equity = (asset.marketValue || 0) - debt;
    const ltv = asset.marketValue > 0 ? (debt / asset.marketValue) * 100 : 0;
    const appreciation = asset.value > 0 ? ((asset.marketValue - asset.value) / asset.value) * 100 : 0;
    
    // Partner Data for Chart
    const partnerData = (asset.partners || []).map(p => ({
        name: p.name,
        value: p.percentage,
        color: p.color.includes('orange') ? '#f97316' : 
               p.color.includes('purple') ? '#a855f7' : 
               p.color.includes('pink') ? '#ec4899' : '#3b82f6'
    }));

    // Mock Valuation History
    const valuationHistory = [
        { year: '2021', value: asset.value || 0 },
        { year: '2022', value: (asset.value || 0) * 1.08 },
        { year: '2023', value: (asset.value || 0) * 1.15 },
        { year: '2024', value: asset.marketValue || 0 },
    ];

    return (
        <div className="p-8 max-w-[1100px] mx-auto pb-24 bg-white min-h-screen shadow-2xl my-8 print:shadow-none print:m-0 print:p-8 animate-fade-in-up">
            {/* Action Bar (Non-printable) */}
            <div className="flex justify-between items-center mb-8 print:hidden">
                <button 
                    onClick={() => onNavigate('report_executive')}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors bg-gray-100 px-4 py-2 rounded-lg text-sm font-bold"
                >
                    <span className="material-symbols-outlined text-sm">arrow_back</span> Voltar
                </button>
                <div className="flex gap-3">
                    <button 
                        onClick={() => window.print()}
                        className="px-6 py-2 bg-black text-white rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg hover:bg-gray-800 transition-all"
                    >
                        <span className="material-symbols-outlined text-sm">print</span> Imprimir / PDF
                    </button>
                </div>
            </div>

            {/* Document Header */}
            <div className="border-b-4 border-black pb-6 mb-8 flex justify-between items-end">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-10 h-10 bg-black text-white flex items-center justify-center rounded-lg">
                            <span className="material-symbols-outlined text-2xl">domain</span>
                        </div>
                        <span className="font-black text-2xl tracking-tight">ASSET<span className="text-blue-600">MANAGER</span></span>
                    </div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">DOSSIÊ EXECUTIVO DE ATIVO</p>
                </div>
                <div className="text-right">
                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">Data de Emissão</p>
                    <p className="text-sm font-bold text-gray-900">{currentDate}</p>
                    <p className="text-[10px] text-gray-400 mt-1">ID DOC: {asset.id}</p>
                </div>
            </div>

            {/* Asset Highlights */}
            <div className="flex flex-col md:flex-row gap-8 mb-10">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                        <span className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-wider border ${
                            asset.type === 'Residencial' ? 'bg-blue-50 text-blue-700 border-blue-100' : 
                            asset.type === 'Comercial' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-gray-50 text-gray-700 border-gray-200'
                        }`}>
                            {asset.type}
                        </span>
                        <span className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-wider border ${
                            asset.status === 'Locado' ? 'bg-green-50 text-green-700 border-green-100' : 
                            asset.status === 'Vago' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-yellow-50 text-yellow-700 border-yellow-100'
                        }`}>
                            {asset.status}
                        </span>
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 mb-3 leading-tight">{asset.name}</h1>
                    <div className="flex items-center gap-2 text-gray-600 font-medium text-sm mb-6">
                        <span className="material-symbols-outlined text-lg">location_on</span>
                        {asset.address}, {asset.number} • {asset.neighborhood}, {asset.city}/{asset.state}
                    </div>
                    
                    {/* Imagem do Ativo */}
                    <div className="w-full h-64 bg-gray-100 rounded-2xl mb-6 overflow-hidden relative shadow-sm border border-gray-200">
                         {asset.image ? (
                             <img src={asset.image} className="w-full h-full object-cover" alt={asset.name} />
                         ) : (
                             <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 bg-gray-50">
                                 <span className="material-symbols-outlined text-5xl mb-2">image</span>
                                 <span className="text-xs font-bold uppercase">Sem imagem cadastrada</span>
                             </div>
                         )}
                         <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-md text-white px-3 py-1 rounded-lg text-xs font-bold">
                             Foto Principal
                         </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
                             <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">ÁREA TOTAL</p>
                             <p className="text-lg font-black text-gray-900">{asset.areaTotal || 0} m²</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
                             <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">QUARTOS/SALAS</p>
                             <p className="text-lg font-black text-gray-900">{asset.bedrooms || 1}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
                             <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">VAGAS</p>
                             <p className="text-lg font-black text-gray-900">{asset.parkingSpaces || 0}</p>
                        </div>
                    </div>
                </div>
                
                {/* Right Side Stats */}
                <div className="w-full md:w-80 flex flex-col gap-4">
                    <div className="bg-black text-white p-6 rounded-2xl shadow-xl relative overflow-hidden print:border print:border-gray-300 print:text-black print:bg-white">
                        <div className="absolute top-0 right-0 p-4 opacity-20 print:opacity-10">
                            <span className="material-symbols-outlined text-6xl">account_balance_wallet</span>
                        </div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 relative z-10">EQUITY (PATRIMÔNIO LÍQUIDO)</p>
                        <p className="text-3xl font-black text-white print:text-black relative z-10">{formatCurrency(equity)}</p>
                        <div className="mt-4 flex items-center gap-2 relative z-10">
                            <span className="text-xs font-bold text-green-400 print:text-green-700 bg-green-900/30 print:bg-green-100 px-2 py-1 rounded">+{appreciation.toFixed(1)}%</span>
                            <span className="text-[10px] text-gray-400 print:text-gray-500">vs. Aquisição</span>
                        </div>
                    </div>
                    <div className="bg-white border border-gray-200 p-6 rounded-2xl flex flex-col justify-center shadow-sm">
                         <div className="flex justify-between items-center mb-1">
                             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">VALOR DE MERCADO</p>
                             <span className="material-symbols-outlined text-gray-300">currency_exchange</span>
                         </div>
                         <p className="text-2xl font-black text-gray-900">{formatCurrency(asset.marketValue)}</p>
                    </div>
                    <div className="bg-white border border-gray-200 p-6 rounded-2xl flex flex-col justify-center shadow-sm">
                         <div className="flex justify-between items-center mb-1">
                             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">VALOR DE AQUISIÇÃO</p>
                             <span className="material-symbols-outlined text-gray-300">history</span>
                         </div>
                         <p className="text-xl font-bold text-gray-600">{formatCurrency(asset.value)}</p>
                         <p className="text-[10px] text-gray-400 mt-1">Data: {asset.acquisitionDate ? asset.acquisitionDate.split('-').reverse().join('/') : 'N/A'}</p>
                    </div>
                </div>
            </div>

            <div className="w-full h-px bg-gray-200 my-8"></div>

            {/* Two Column Layout: Financials & Structure */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                
                {/* Column 1: Financial & Debt */}
                <div>
                    <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight mb-6 flex items-center gap-2">
                        <span className="w-2 h-6 bg-blue-600 rounded-full"></span> Saúde Financeira
                    </h3>

                    <div className="space-y-6">
                        {/* Debt Status */}
                        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                             <div className="flex justify-between items-start mb-4">
                                 <div>
                                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">SALDO DEVEDOR</p>
                                     <p className="text-xl font-black text-gray-900">{formatCurrency(debt)}</p>
                                 </div>
                                 <div className="text-right">
                                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">LTV (ALAVANCAGEM)</p>
                                     <p className={`text-xl font-black ${ltv > 50 ? 'text-orange-500' : 'text-green-600'}`}>{ltv.toFixed(1)}%</p>
                                 </div>
                             </div>
                             <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                                 <div className={`h-full rounded-full ${ltv > 50 ? 'bg-orange-500' : 'bg-green-500'}`} style={{ width: `${ltv}%` }}></div>
                             </div>
                        </div>

                        {/* Income */}
                        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                             <div className="flex justify-between items-start">
                                 <div>
                                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">RECEITA MENSAL (ALUGUEL)</p>
                                     <p className="text-xl font-black text-gray-900">{asset.rentalValue > 0 ? formatCurrency(asset.rentalValue) : 'R$ 0,00'}</p>
                                 </div>
                                 <div className="text-right">
                                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">YIELD MENSAL</p>
                                     <p className="text-xl font-black text-blue-600">
                                         {asset.marketValue > 0 ? ((asset.rentalValue / asset.marketValue) * 100).toFixed(2) : 0}%
                                     </p>
                                 </div>
                             </div>
                        </div>

                        {/* Historical Chart */}
                         <div className="h-48 pt-4">
                             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">HISTÓRICO DE VALORIZAÇÃO</p>
                             <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={valuationHistory}>
                                    <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                                    <Tooltip 
                                        formatter={(value: number) => formatCurrency(value)}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                    <Bar dataKey="value" fill="#111827" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                         </div>
                    </div>
                </div>

                {/* Column 2: Corporate Structure & Details */}
                <div>
                     <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight mb-6 flex items-center gap-2">
                        <span className="w-2 h-6 bg-purple-600 rounded-full"></span> Estrutura Societária
                    </h3>

                    <div className="flex items-center justify-center mb-6">
                        <div className="w-48 h-48 relative">
                             <ResponsiveContainer>
                                <PieChart>
                                    <Pie data={partnerData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                        {partnerData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-2xl font-black text-gray-900">{partnerData.length}</span>
                                <span className="text-[10px] font-bold text-gray-400 uppercase">Sócios</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 mb-8">
                        {asset.partners && asset.partners.length > 0 ? asset.partners.map((partner, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${partner.color}`}>
                                        {partner.initials}
                                    </div>
                                    <span className="text-sm font-bold text-gray-900">{partner.name}</span>
                                </div>
                                <div className="text-right">
                                    <span className="block text-xs font-black text-gray-900">{partner.percentage}%</span>
                                    <span className="text-[10px] text-gray-500">{formatCurrency(asset.marketValue * (partner.percentage/100))}</span>
                                </div>
                            </div>
                        )) : (
                            <div className="p-4 text-center text-xs text-gray-400 bg-gray-50 rounded-xl">Sem sócios cadastrados</div>
                        )}
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">DADOS REGISTRAIS</p>
                        <div className="space-y-2 text-xs">
                            <div className="flex justify-between border-b border-gray-200 pb-2">
                                <span className="text-gray-500">Matrícula</span>
                                <span className="font-bold text-gray-900">{asset.matricula || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-200 pb-2">
                                <span className="text-gray-500">Cartório</span>
                                <span className="font-bold text-gray-900">{asset.registryOffice || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-200 pb-2">
                                <span className="text-gray-500">Inscrição IPTU</span>
                                <span className="font-bold text-gray-900">{asset.iptu || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between pt-1">
                                <span className="text-gray-500">Status IRPF</span>
                                <span className="font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded uppercase">{asset.irpfStatus || 'Pendente'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Footer / Disclaimer */}
            <div className="mt-16 pt-8 border-t border-gray-200 text-center">
                <p className="text-[10px] text-gray-400 max-w-2xl mx-auto leading-relaxed">
                    Este documento é confidencial e contém informações privilegiadas sobre a gestão patrimonial do ativo. 
                    Os valores de mercado são estimativas baseadas em índices de correção e não substituem laudos oficiais de avaliação.
                    Gerado automaticamente pelo Sistema AssetManager Pro em {currentDate}.
                </p>
            </div>
        </div>
    );
};