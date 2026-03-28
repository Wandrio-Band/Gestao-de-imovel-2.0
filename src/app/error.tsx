'use client';

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Page error:', error);
    }, [error]);

    return (
        <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 p-8">
            <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-800">
                    Algo deu errado
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                    Ocorreu um erro inesperado. Tente novamente.
                </p>
            </div>
            <button
                onClick={reset}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
                Tentar novamente
            </button>
        </div>
    );
}
