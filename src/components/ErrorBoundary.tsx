'use client';

import React, { Component, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 * and displays a fallback UI instead of crashing the entire app
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        // Update state so next render shows fallback UI
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Log error to console in development
        if (process.env.NODE_ENV === 'development') {
            console.error('ErrorBoundary caught an error:', error, errorInfo);
        }

        // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
        // sendErrorToService(error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            // Custom fallback UI
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default fallback UI
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                    <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="material-symbols-outlined text-red-600 text-3xl">error</span>
                        </div>

                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            Ops! Algo deu errado
                        </h2>

                        <p className="text-gray-600 mb-6">
                            Ocorreu um erro inesperado. Por favor, tente recarregar a página.
                        </p>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details className="text-left bg-gray-50 rounded-lg p-4 mb-4">
                                <summary className="text-sm font-medium text-gray-700 cursor-pointer">
                                    Detalhes do Erro (Dev)
                                </summary>
                                <pre className="text-xs text-red-600 mt-2 overflow-auto">
                                    {this.state.error.toString()}
                                </pre>
                            </details>
                        )}

                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                        >
                            Recarregar Página
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
