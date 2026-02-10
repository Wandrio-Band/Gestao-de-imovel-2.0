import React from 'react';
import { PixEntry, MatchSuggestion } from '@/app/actions/rental';

interface PaymentMatchCardProps {
    entry: PixEntry;
    suggestion: MatchSuggestion | null;
    onConfirm: (entry: PixEntry, suggestion: MatchSuggestion) => void;
}

export const PaymentMatchCard: React.FC<PaymentMatchCardProps> = ({ entry, suggestion, onConfirm }) => {
    // If no suggestion, show different state
    const hasSuggestion = !!suggestion;
    const confidence = suggestion?.confidence || 0;

    // Define color based on confidence
    const confidenceColor = confidence > 0.8 ? 'text-green-600' : 'text-orange-500';

    const [isSearching, setIsSearching] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [searchResults, setSearchResults] = React.useState<any[]>([]);
    const [isSearchingApi, setIsSearchingApi] = React.useState(false);

    // Dynamic import to avoid circular dep if needed, or pass search function as prop. 
    // For now we assume we can import server action directly in client component if it's marked 'use server'
    // But better to pass handleSearch from parent or import here.
    // Let's rely on standard nextjs import.
    // We need to import searchTenants at top of file, but I can't do that easily with replace_file_content in one go without replacing everything.
    // I will use a simple effect for search.

    // Mock search function trigger for this step, actual import needs to be added at top.

    return (
        <>
            <div className="bg-white border rounded-xl p-4 mb-4 shadow-sm flex items-center justify-between hover:border-blue-300 transition-all relative">
                {/* Extracted Data */}
                <div className="flex-1">
                    <span className="text-xs font-bold text-gray-400 uppercase">DADOS DO BANCO</span>
                    <h3 className="text-gray-800 font-semibold">{entry.description}</h3>
                    <p className="text-blue-600 font-bold">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(entry.amount)}
                    </p>
                    <p className="text-xs text-gray-500">{new Date(entry.date).toLocaleDateString('pt-BR')}</p>
                </div>

                {/* Intelligence Indicator */}
                <div className="flex flex-col items-center px-8 border-l border-r border-gray-100 mx-4">
                    {hasSuggestion ? (
                        <>
                            <div className={`text-xl font-bold ${confidenceColor}`}>
                                {(confidence * 100).toFixed(0)}%
                            </div>
                            <span className="text-[10px] text-gray-400 uppercase tracking-widest">Match</span>

                            <div className={`mt-2 text-[10px] px-2 py-0.5 rounded-full ${suggestion?.matchType === 'ALREADY_LEARNED' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                                }`}>
                                {suggestion?.matchType === 'ALREADY_LEARNED' ? 'Aprendido' : 'IA Sugeriu'}
                            </div>
                        </>
                    ) : (
                        <div className="text-gray-400 text-xs font-semibold">Sem Match</div>
                    )}
                </div>

                {/* Suggested Tenant */}
                <div className="flex-1 text-right">
                    <span className="text-xs font-bold text-gray-400 uppercase">INQUILINO SUGERIDO</span>
                    {hasSuggestion ? (
                        <>
                            <h3 className="text-gray-800 font-semibold">{suggestion?.tenantName}</h3>
                            <p className="text-xs text-gray-500">Imóvel: {suggestion?.assetName}</p>

                            <div className="mt-3 flex justify-end gap-2">
                                <button
                                    onClick={() => suggestion && onConfirm(entry, suggestion)}
                                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
                                >
                                    Confirmar Baixa
                                </button>
                                <button
                                    onClick={() => setIsSearching(true)}
                                    className="border border-gray-300 hover:bg-gray-50 text-gray-600 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Outro...
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="mt-2 text-right">
                            <button
                                onClick={() => setIsSearching(true)}
                                className="border border-blue-300 text-blue-600 hover:bg-blue-50 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                            >
                                🔍 Buscar Inquilino
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Manual Search Modal */}
            {isSearching && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-900">Vincular Manualmente</h3>
                            <button onClick={() => setIsSearching(false)} className="text-gray-400 hover:text-gray-600">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-4">
                            <input
                                autoFocus
                                type="text"
                                placeholder="Digite o nome do inquilino..."
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />

                            <div className="mt-4 max-h-60 overflow-y-auto">
                                <SearchList
                                    query={searchQuery}
                                    onSelect={(tenant: any) => {
                                        const manualSuggestion: MatchSuggestion = {
                                            tenantId: tenant.id,
                                            tenantName: tenant.name,
                                            contractId: tenant.activeContractId,
                                            assetName: tenant.assetName || 'Sem Contrato',
                                            confidence: 1.0,
                                            matchType: 'ALREADY_LEARNED' // Will become learned
                                        };
                                        onConfirm(entry, manualSuggestion);
                                        setIsSearching(false);
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

// Internal component to handle async search effect cleanly
function SearchList({ query, onSelect }: { query: string, onSelect: (t: any) => void }) {
    const [list, setList] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(false);

    React.useEffect(() => {
        // Debounce only if typing specific query
        const delay = query.length > 0 ? 300 : 0;

        const timeoutId = setTimeout(async () => {
            setLoading(true);
            try {
                // Dynamic import to avoid circular dep
                const { searchTenants } = await import('@/app/actions/tenant_search');
                // Pass empty or query
                const res = await searchTenants(query);
                setList(res);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }, delay);

        return () => clearTimeout(timeoutId);
    }, [query]);

    if (loading) return <div className="text-center py-4 text-gray-400 text-xs">Buscando...</div>;
    if (list.length === 0 && query.length >= 2) return <div className="text-center py-4 text-gray-400 text-xs">Nenhum inquilino encontrado.</div>;

    return (
        <div className="space-y-2">
            {list.map(t => (
                <button
                    key={t.id}
                    onClick={() => onSelect(t)}
                    className="w-full text-left p-3 rounded-lg hover:bg-blue-50 border border-transparent hover:border-blue-100 group transition-all"
                >
                    <div className="font-bold text-gray-800 group-hover:text-blue-700">{t.name}</div>
                    <div className="text-xs text-gray-500">{t.assetName || 'Sem Imóvel'}</div>
                </button>
            ))}
        </div>
    );
}
