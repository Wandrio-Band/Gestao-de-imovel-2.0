import React from 'react';

export const TopBar: React.FC = () => {
  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-10">
      <div className="flex items-center gap-4 text-gray-400 text-sm font-medium">
        <span className="hover:text-black cursor-pointer transition-colors">Home</span>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <span className="text-black font-bold">Visão Geral</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">search</span>
          <input 
            type="text" 
            placeholder="Buscar ativos, contratos..." 
            className="pl-10 pr-4 py-2 bg-gray-50 border-none rounded-full text-sm w-64 focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all placeholder-gray-400 font-medium text-gray-700"
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
