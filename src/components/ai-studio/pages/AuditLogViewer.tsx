import React, { useState, useEffect } from 'react';
import { AuditLogEntry, getAuditLogs } from '@/app/actions/audit';

interface AuditLogViewerProps {
    onNavigate: (view: any) => void;
}

export const AuditLogViewer: React.FC<AuditLogViewerProps> = () => {
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDetail, setSelectedDetail] = useState<AuditLogEntry | null>(null);

    useEffect(() => {
        const fetchLogs = async () => {
            setLoading(true);
            const data = await getAuditLogs(100);
            setLogs(data);
            setLoading(false);
        };
        fetchLogs();
    }, []);

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleString('pt-BR');
    };

    const formatDetails = (details: string) => {
        try {
            const parsed = JSON.parse(details);
            return JSON.stringify(parsed, null, 2);
        } catch {
            return details;
        }
    };

    return (
        <div className="p-8 max-w-[1600px] mx-auto pb-24 animate-fade-in-up">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                    <span className="material-symbols-outlined text-3xl text-gray-400">shield_person</span>
                    Logs de Auditoria
                </h1>
                <p className="text-gray-500 mt-1">Histórico completo de alterações e atividades no sistema.</p>
            </div>

            {/* Content Card */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-soft overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-gray-400">
                        <span className="material-symbols-outlined text-4xl animate-spin mb-4">sync</span>
                        <p>Carregando logs...</p>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        <span className="material-symbols-outlined text-4xl mb-4">history_off</span>
                        <p>Nenhum registro de auditoria encontrado.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Data</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Usuário</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ação</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Entidade</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Detalhes</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-blue-50/50 transition-colors group">
                                        <td className="px-6 py-4 text-sm font-medium text-gray-600 whitespace-nowrap">
                                            {formatDate(log.createdAt)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-black">
                                                    {log.actorName.charAt(0)}
                                                </div>
                                                <span className="text-sm font-bold text-gray-700">{log.actorName}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 rounded-lg bg-gray-100 text-gray-600 text-[10px] font-bold border border-gray-200 uppercase">
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm">
                                                <span className="font-bold text-gray-800">{log.entity}</span>
                                                <span className="text-gray-400 text-xs ml-1">#{log.entityId.slice(0, 5)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => setSelectedDetail(log)}
                                                className="text-blue-600 text-xs font-bold hover:underline flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                Ver Detalhes <span className="material-symbols-outlined text-[10px]">open_in_new</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Details Modal */}
            {selectedDetail && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedDetail(null)}>
                    <div className="bg-white rounded-[2rem] p-8 max-w-2xl w-full shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-xl font-black text-gray-900">Detalhes do Log</h3>
                                <p className="text-sm text-gray-500">{formatDate(selectedDetail.createdAt)}</p>
                            </div>
                            <button onClick={() => setSelectedDetail(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="bg-gray-900 rounded-xl p-6 overflow-x-auto">
                            <pre className="text-xs font-mono text-green-400 whitespace-pre-wrap">
                                {formatDetails(selectedDetail.details || '')}
                            </pre>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setSelectedDetail(null)}
                                className="px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
