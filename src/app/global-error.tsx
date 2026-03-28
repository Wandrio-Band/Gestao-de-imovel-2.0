'use client';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html>
            <body>
                <div style={{
                    display: 'flex',
                    minHeight: '100vh',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '16px',
                    padding: '32px',
                    fontFamily: 'system-ui, sans-serif',
                }}>
                    <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#1f2937' }}>
                        Erro critico na aplicacao
                    </h2>
                    <p style={{ fontSize: '14px', color: '#6b7280' }}>
                        A aplicacao encontrou um erro grave. Tente recarregar a pagina.
                    </p>
                    <button
                        onClick={reset}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#2563eb',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px',
                        }}
                    >
                        Recarregar
                    </button>
                </div>
            </body>
        </html>
    );
}
