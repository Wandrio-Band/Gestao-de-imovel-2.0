import React from 'react';

export const AIAssistant: React.FC = () => {
  return (
    <div className="h-[calc(100vh-80px)] p-6 max-w-5xl mx-auto flex flex-col">
       <div className="flex-1 bg-white rounded-[2.5rem] shadow-soft border border-gray-100 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-100 bg-white z-10 flex items-center justify-between">
             <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                     <span className="material-symbols-outlined text-2xl">smart_toy</span>
                 </div>
                 <div>
                     <h1 className="text-xl font-black text-gray-900">Asset Advisor AI</h1>
                     <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        <span className="text-xs font-bold text-gray-400 uppercase">Online • Gemini 2.5 Flash</span>
                     </div>
                 </div>
             </div>
             <button className="text-gray-400 hover:text-gray-600">
                 <span className="material-symbols-outlined">more_vert</span>
             </button>
          </div>

          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-[#f8f9fc]">
             {/* Bot Message */}
             <div className="flex gap-4 max-w-3xl">
                 <div className="w-8 h-8 rounded-full bg-primary flex-shrink-0 flex items-center justify-center text-white">
                     <span className="material-symbols-outlined text-sm">smart_toy</span>
                 </div>
                 <div className="space-y-2">
                     <div className="bg-white p-6 rounded-2xl rounded-tl-none shadow-sm border border-gray-100 text-gray-700 text-sm leading-relaxed">
                         <p>Olá, Ricardo! Analisei seus contratos de locação comercial.</p>
                         <p className="mt-2">Notei que o contrato da <strong>Loja Shopping Metrópole</strong> está indexado pelo IGP-M, que teve alta volatilidade. Recomendo simular uma troca para o IPCA na próxima renovação para reduzir o risco de vacância.</p>
                         <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100 flex gap-3">
                             <span className="material-symbols-outlined text-blue-600">analytics</span>
                             <div>
                                 <p className="font-bold text-blue-900 text-xs uppercase">Simulação Rápida</p>
                                 <p className="text-xs text-blue-700">A troca indexador manteria o inquilino por +36 meses com 92% de probabilidade.</p>
                             </div>
                         </div>
                     </div>
                     <span className="text-[10px] font-bold text-gray-400 ml-2">Hoje, 09:41</span>
                 </div>
             </div>

             {/* User Message */}
             <div className="flex flex-row-reverse gap-4 max-w-3xl ml-auto">
                 <img src="https://picsum.photos/id/64/100/100" className="w-8 h-8 rounded-full border border-gray-200" alt="User" />
                 <div className="space-y-2">
                     <div className="bg-[#1152d4] p-4 rounded-2xl rounded-tr-none shadow-md text-white text-sm">
                         Qual seria o impacto no fluxo de caixa do Edifício Horizon se eu antecipar 12 parcelas do financiamento?
                     </div>
                     <span className="text-[10px] font-bold text-gray-400 text-right block mr-2">Hoje, 10:15</span>
                 </div>
             </div>

             {/* Bot Thinking */}
             <div className="flex gap-4 max-w-3xl animate-pulse">
                 <div className="w-8 h-8 rounded-full bg-primary flex-shrink-0 flex items-center justify-center text-white opacity-50">
                     <span className="material-symbols-outlined text-sm">smart_toy</span>
                 </div>
                 <div className="bg-gray-200 h-12 w-48 rounded-2xl rounded-tl-none"></div>
             </div>
          </div>

          {/* Input Area */}
          <div className="p-6 bg-white border-t border-gray-100">
             <div className="relative">
                 <input 
                    type="text" 
                    placeholder="Faça uma pergunta sobre seus ativos..." 
                    className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-6 pr-14 font-medium text-gray-700 focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all shadow-inner"
                 />
                 <button className="absolute right-2 top-2 p-2 bg-primary text-white rounded-xl shadow-md hover:bg-blue-600 transition-colors">
                     <span className="material-symbols-outlined text-sm">send</span>
                 </button>
             </div>
             <p className="text-center mt-3 text-[10px] text-gray-400">A IA pode cometer erros. Verifique informações críticas.</p>
          </div>
       </div>
    </div>
  );
};
