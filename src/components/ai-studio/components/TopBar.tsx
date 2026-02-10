import React from 'react';

export const TopBar: React.FC = () => {
  return (
    <header className="h-12 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-4 sticky top-0 z-10">
      <div className="flex items-center gap-4 text-gray-400 text-sm font-medium">
        <span className="hover:text-black cursor-pointer transition-colors">Home</span>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <span className="text-black font-bold">Visão Geral</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors text-sm">search</span>
          <input
            type="text"
            placeholder="Buscar..."
            className="pl-8 pr-3 py-1 bg-gray-50 border-none rounded-full text-[11px] w-40 focus:ring-1 focus:ring-primary/20 focus:bg-white transition-all placeholder-gray-400 font-medium text-gray-700"
          />
        </div>

        <button className="w-7 h-7 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-500 hover:text-primary hover:border-primary/20 transition-all shadow-sm">
          <span className="material-symbols-outlined text-[16px]">notifications</span>
        </button>

        <button className="w-7 h-7 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-500 hover:text-primary hover:border-primary/20 transition-all shadow-sm">
          <span className="material-symbols-outlined text-[16px]">settings</span>
        </button>
      </div>
    </header>
  );
};
