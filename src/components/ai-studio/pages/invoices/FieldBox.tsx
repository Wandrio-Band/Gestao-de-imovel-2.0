import React from 'react';

export const FieldBox = ({ label, value, fullWidth = false, className = '' }: { label: string, value: string | undefined | null, fullWidth?: boolean, className?: string }) => (
    <div className={`border border-slate-200 rounded-lg px-3 py-2 bg-white ${fullWidth ? 'col-span-full' : ''} ${className}`}>
        <label className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5 tracking-wider">{label}</label>
        <p className="font-bold text-sm text-slate-700 dark:text-slate-200 truncate" title={value || ''}>{value || '-'}</p>
    </div>
);
