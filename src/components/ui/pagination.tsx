"use client"

import React from 'react';
import { cn } from '@/lib/utils';

interface PaginationProps {
    page: number;
    totalPages: number;
    total: number;
    limit: number;
    onPageChange: (page: number) => void;
    onLimitChange?: (limit: number) => void;
    className?: string;
}

const LIMIT_OPTIONS = [10, 25, 50];

export function Pagination({
    page,
    totalPages,
    total,
    limit,
    onPageChange,
    onLimitChange,
    className,
}: PaginationProps) {
    const start = (page - 1) * limit + 1;
    const end = Math.min(page * limit, total);

    const getPageNumbers = (): (number | '...')[] => {
        const pages: (number | '...')[] = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
            return pages;
        }
        pages.push(1);
        if (page > 3) pages.push('...');
        for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
            pages.push(i);
        }
        if (page < totalPages - 2) pages.push('...');
        pages.push(totalPages);
        return pages;
    };

    if (total === 0) return null;

    return (
        <div className={cn('flex items-center justify-between gap-4 px-2 py-3', className)}>
            <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>Mostrando {start}-{end} de {total}</span>
                {onLimitChange && (
                    <select
                        value={limit}
                        onChange={(e) => onLimitChange(Number(e.target.value))}
                        className="ml-2 rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 outline-none focus:border-gray-400"
                        aria-label="Itens por página"
                    >
                        {LIMIT_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                                {opt} por página
                            </option>
                        ))}
                    </select>
                )}
            </div>

            <nav className="flex items-center gap-1" aria-label="Paginação">
                <button
                    onClick={() => onPageChange(page - 1)}
                    disabled={page <= 1}
                    className="rounded-md px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    aria-label="Página anterior"
                >
                    Anterior
                </button>

                {getPageNumbers().map((p, i) =>
                    p === '...' ? (
                        <span key={`dots-${i}`} className="px-1 text-xs text-gray-400">...</span>
                    ) : (
                        <button
                            key={p}
                            onClick={() => onPageChange(p)}
                            className={cn(
                                'min-w-[28px] rounded-md px-2 py-1 text-xs font-medium transition-colors',
                                p === page
                                    ? 'bg-black text-white'
                                    : 'text-gray-600 hover:bg-gray-100'
                            )}
                            aria-label={`Página ${p}`}
                            aria-current={p === page ? 'page' : undefined}
                        >
                            {p}
                        </button>
                    )
                )}

                <button
                    onClick={() => onPageChange(page + 1)}
                    disabled={page >= totalPages}
                    className="rounded-md px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    aria-label="Próxima página"
                >
                    Próximo
                </button>
            </nav>
        </div>
    );
}
