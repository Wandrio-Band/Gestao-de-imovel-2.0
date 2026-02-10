import React from 'react';
import { Toaster } from 'react-hot-toast';

export function ToasterProvider() {
    return (
        <Toaster
            position="top-right"
            toastOptions={{
                duration: 3000,
                style: {
                    background: '#fff',
                    color: '#1f2937',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '16px',
                    fontSize: '14px',
                    fontWeight: '500',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
                },
                success: {
                    iconTheme: {
                        primary: '#10b981',
                        secondary: '#fff',
                    },
                },
                error: {
                    iconTheme: {
                        primary: '#ef4444',
                        secondary: '#fff',
                    },
                },
                loading: {
                    iconTheme: {
                        primary: '#1152d4',
                        secondary: '#fff',
                    },
                },
            }}
        />
    );
}
