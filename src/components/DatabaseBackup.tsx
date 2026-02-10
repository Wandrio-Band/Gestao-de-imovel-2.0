'use client';

import React, { useState, useRef } from 'react';
import { Asset } from '@/components/ai-studio/types';
import { bulkImportAssets } from '@/app/actions/assets';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

interface DatabaseBackupProps {
    currentAssets: Asset[];
    onImportComplete: () => void;
}

export const DatabaseBackup: React.FC<DatabaseBackupProps> = ({ currentAssets, onImportComplete }) => {
    const [showImportModal, setShowImportModal] = useState(false);
    const [showExportDropdown, setShowExportDropdown] = useState(false);
    const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Export database to JSON
    const handleExportJSON = () => {
        const backup = {
            exportDate: new Date().toISOString(),
            version: '1.0',
            totalAssets: currentAssets.length,
            assets: currentAssets
        };

        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `patrimonio-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.success(`Backup JSON criado! ${currentAssets.length} ativos exportados.`);
        setShowExportDropdown(false);
    };

    // Export database to Excel (structured 4-sheet format)
    const handleExportExcel = () => {
        try {
            // Sheet 1: Assets (main data)
            const assetsData = currentAssets.map(asset => ({
                'ID': asset.id,
                'Nome': asset.name,
                'Tipo': asset.type,
                'Endereço': asset.address || '',
                'CEP': asset.zipCode || '',
                'Rua': asset.street || '',
                'Número': asset.number || '',
                'Complemento': asset.complement || '',
                'Bairro': asset.neighborhood || '',
                'Cidade': asset.city || '',
                'UF': asset.state || '',
                'Área Total (m²)': asset.areaTotal || '',
                'Matrícula': asset.matricula || '',
                'IPTU': asset.iptu || '',
                'Cartório': asset.registryOffice || '',
                'Data Aquisição': asset.acquisitionDate || '',
                'Status IRPF': asset.irpfStatus || '',
                'Origem Aquisição': asset.acquisitionOrigin || '',
                'Valor Aquisição': asset.value,
                'Valor Mercado': asset.marketValue,
                'Valor Declarado': asset.declaredValue || '',
                'Previsão Venda': asset.saleForecast || '',
                'Valor Sugerido Aluguel': asset.suggestedRentalValue || '',
                'Valor Aluguel': asset.rentalValue || 0,
                'Status': asset.status,
                'Imagem URL': asset.image || ''
            }));

            // Sheet 2: Partners (ownership percentages)
            const partnersData: any[] = [];
            currentAssets.forEach(asset => {
                if (asset.partners && asset.partners.length > 0) {
                    asset.partners.forEach(partner => {
                        partnersData.push({
                            'Asset ID': asset.id,
                            'Asset Nome': asset.name,
                            'Partner Nome': partner.name,
                            'Iniciais': partner.initials,
                            'Percentual (%)': partner.percentage,
                            'Cor': partner.color
                        });
                    });
                }
            });

            // Sheet 3: Financing (financial details)
            const financingData: any[] = [];
            currentAssets.forEach(asset => {
                if (asset.financingDetails) {
                    const f = asset.financingDetails;
                    financingData.push({
                        'Asset ID': asset.id,
                        'Asset Nome': asset.name,
                        'Valor Total': f.valorTotal,
                        'Subtotal Construtora': f.subtotalConstrutora || '',
                        'Valor a Financiar': f.valorFinanciar,
                        'Valor Quitado': f.valorQuitado || '',
                        'Saldo Devedor': f.saldoDevedor || '',
                        'Data Assinatura': f.dataAssinatura || '',
                        'Vencimento Construtora': f.vencimentoConstrutora || '',
                        'Vencimento Primeira': f.vencimentoPrimeira || '',
                        'Prazo (Meses)': f.prazoMeses || '',
                        'Juros Anuais (%)': f.jurosAnuais || '',
                        'Indexador': f.indexador || '',
                        'Sistema Amortização': f.sistemaAmortizacao || '',
                        'Taxa Adm': f.taxaAdm || '',
                        'Seguros': f.seguros || '',
                        'Phases (JSON)': f.phases ? JSON.stringify(f.phases) : '',
                        'Cash Flow (JSON)': f.cashFlow ? JSON.stringify(f.cashFlow) : ''
                    });
                }
            });

            // Sheet 4: Leases (rental details)
            const leasesData: any[] = [];
            currentAssets.forEach(asset => {
                if (asset.leaseDetails) {
                    const l = asset.leaseDetails;
                    leasesData.push({
                        'Asset ID': asset.id,
                        'Asset Nome': asset.name,
                        'Nome Inquilino': l.nomeInquilino,
                        'Documento Inquilino': l.documentoInquilino || '',
                        'Email Inquilino': l.emailInquilino || '',
                        'Valor Aluguel': l.valorAluguel,
                        'Dia Vencimento': l.diaVencimento,
                        'Tipo Garantia': l.tipoGarantia || '',
                        'Início Vigência': l.inicioVigencia || '',
                        'Fim Contrato': l.fimContrato || '',
                        'Indexador': l.indexador || '',
                        'Contract File (JSON)': l.contractFile ? JSON.stringify(l.contractFile) : ''
                    });
                }
            });

            // Create workbook with 4 sheets
            const wb = XLSX.utils.book_new();
            const wsAssets = XLSX.utils.json_to_sheet(assetsData);
            const wsPartners = XLSX.utils.json_to_sheet(partnersData.length > 0 ? partnersData : [{ 'Mensagem': 'Nenhum dado de proprietários' }]);
            const wsFinancing = XLSX.utils.json_to_sheet(financingData.length > 0 ? financingData : [{ 'Mensagem': 'Nenhum financiamento' }]);
            const wsLeases = XLSX.utils.json_to_sheet(leasesData.length > 0 ? leasesData : [{ 'Mensagem': 'Nenhuma locação' }]);

            XLSX.utils.book_append_sheet(wb, wsAssets, 'Assets');
            XLSX.utils.book_append_sheet(wb, wsPartners, 'Partners');
            XLSX.utils.book_append_sheet(wb, wsFinancing, 'Financing');
            XLSX.utils.book_append_sheet(wb, wsLeases, 'Leases');

            // Generate filename with date
            const filename = `patrimonio-backup-${new Date().toISOString().split('T')[0]}.xlsx`;

            // Write to binary string and create Blob for download
            // This ensures compatibility with Next.js/Turbopack where writeFile may fail silently
            const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast.success(`Backup Excel criado! ${currentAssets.length} ativos exportados em 4 planilhas.`);
            setShowExportDropdown(false);
        } catch (error: any) {
            toast.error(`Erro ao gerar Excel: ${error.message}`);
            console.error('Excel export error:', error);
        }
    };

    // Import database from JSON or Excel
    const handleImport = async () => {
        if (!selectedFile) {
            toast.error('Selecione um arquivo de backup primeiro!');
            return;
        }

        setImporting(true);
        const toastId = toast.loading('Importando dados...');

        try {
            const isExcel = selectedFile.name.endsWith('.xlsx');
            let assetsToImport: Asset[] = [];

            if (isExcel) {
                // Parse Excel file
                const arrayBuffer = await selectedFile.arrayBuffer();
                const workbook = XLSX.read(arrayBuffer, { type: 'array' });

                // Read Assets sheet
                const assetsSheet = workbook.Sheets['Assets'];
                if (!assetsSheet) {
                    throw new Error('Sheet "Assets" não encontrada no arquivo Excel');
                }
                const assetsData: any[] = XLSX.utils.sheet_to_json(assetsSheet);

                // Read Partners sheet
                const partnersSheet = workbook.Sheets['Partners'];
                const partnersData: any[] = partnersSheet ? XLSX.utils.sheet_to_json(partnersSheet) : [];

                // Read Financing sheet
                const financingSheet = workbook.Sheets['Financing'];
                const financingData: any[] = financingSheet ? XLSX.utils.sheet_to_json(financingSheet) : [];

                // Read Leases sheet
                const leasesSheet = workbook.Sheets['Leases'];
                const leasesData: any[] = leasesSheet ? XLSX.utils.sheet_to_json(leasesSheet) : [];

                // Reconstruct Asset objects
                assetsToImport = assetsData.map(row => {
                    const assetId = row['ID'];

                    // Find partners for this asset
                    const assetPartners = partnersData
                        .filter(p => p['Asset ID'] === assetId)
                        .map(p => ({
                            name: p['Partner Nome'],
                            initials: p['Iniciais'],
                            percentage: p['Percentual (%)'],
                            color: p['Cor']
                        }));

                    // Find financing for this asset
                    const financing = financingData.find(f => f['Asset ID'] === assetId);
                    const financingDetails = financing ? {
                        valorTotal: financing['Valor Total']?.toString() || '0',
                        subtotalConstrutora: financing['Subtotal Construtora'] || undefined,
                        valorFinanciar: financing['Valor a Financiar']?.toString() || '0',
                        valorQuitado: financing['Valor Quitado'] || undefined,
                        saldoDevedor: financing['Saldo Devedor'] || undefined,
                        dataAssinatura: financing['Data Assinatura'] || undefined,
                        vencimentoConstrutora: financing['Vencimento Construtora'] || undefined,
                        vencimentoPrimeira: financing['Vencimento Primeira'] || undefined,
                        prazoMeses: financing['Prazo (Meses)'] || undefined,
                        jurosAnuais: financing['Juros Anuais (%)'] || undefined,
                        indexador: financing['Indexador'] || undefined,
                        sistemaAmortizacao: financing['Sistema Amortização'] || undefined,
                        taxaAdm: financing['Taxa Adm'] || undefined,
                        seguros: financing['Seguros'] || undefined,
                        phases: financing['Phases (JSON)'] ? JSON.parse(financing['Phases (JSON)']) : undefined,
                        cashFlow: financing['Cash Flow (JSON)'] ? JSON.parse(financing['Cash Flow (JSON)']) : undefined
                    } : undefined;

                    // Find lease for this asset
                    const lease = leasesData.find(l => l['Asset ID'] === assetId);
                    const leaseDetails = lease ? {
                        nomeInquilino: lease['Nome Inquilino'],
                        documentoInquilino: lease['Documento Inquilino'] || '',
                        emailInquilino: lease['Email Inquilino'] || '',
                        valorAluguel: lease['Valor Aluguel']?.toString() || '0',
                        diaVencimento: lease['Dia Vencimento']?.toString() || '5',
                        tipoGarantia: lease['Tipo Garantia'] || '',
                        inicioVigencia: lease['Início Vigência'] || '',
                        fimContrato: lease['Fim Contrato'] || '',
                        indexador: lease['Indexador'] || 'IGPM',
                        contractFile: lease['Contract File (JSON)'] ? JSON.parse(lease['Contract File (JSON)']) : undefined
                    } : undefined;

                    // Construct Asset object
                    const asset: Asset = {
                        id: assetId,
                        name: row['Nome'],
                        type: row['Tipo'],
                        address: row['Endereço'] || '',
                        zipCode: row['CEP'] || undefined,
                        street: row['Rua'] || undefined,
                        number: row['Número'] || undefined,
                        complement: row['Complemento'] || undefined,
                        neighborhood: row['Bairro'] || undefined,
                        city: row['Cidade'] || undefined,
                        state: row['UF'] || undefined,
                        areaTotal: row['Área Total (m²)'] || undefined,
                        matricula: row['Matrícula'] || undefined,
                        iptu: row['IPTU'] || undefined,
                        registryOffice: row['Cartório'] || undefined,
                        acquisitionDate: row['Data Aquisição'] || undefined,
                        irpfStatus: row['Status IRPF'] || 'Declarado',
                        acquisitionOrigin: row['Origem Aquisição'] || undefined,
                        value: Number(row['Valor Aquisição']) || 0,
                        marketValue: Number(row['Valor Mercado']) || 0,
                        declaredValue: row['Valor Declarado'] ? Number(row['Valor Declarado']) : undefined,
                        saleForecast: row['Previsão Venda'] || undefined,
                        suggestedRentalValue: row['Valor Sugerido Aluguel'] ? Number(row['Valor Sugerido Aluguel']) : undefined,
                        rentalValue: Number(row['Valor Aluguel']) || 0,
                        status: row['Status'] || 'Vago',
                        image: row['Imagem URL'] || '',
                        partners: assetPartners,
                        financingDetails,
                        leaseDetails
                    };

                    return asset;
                });

                toast.success(`Excel parseado! ${assetsToImport.length} ativos encontrados.`, { id: toastId, duration: 2000 });
            } else {
                // Parse JSON file
                const fileContent = await selectedFile.text();
                const backup = JSON.parse(fileContent);

                if (!backup.assets || !Array.isArray(backup.assets)) {
                    throw new Error('Formato de backup inválido');
                }

                assetsToImport = backup.assets;
            }

            // Bulk import
            const result = await bulkImportAssets(assetsToImport, importMode === 'replace');

            if (result.success) {
                toast.success(
                    `Importação completa! ${result.imported} importados, ${result.skipped} ignorados.`,
                    { id: toastId }
                );
                onImportComplete();
                setShowImportModal(false);
                setSelectedFile(null);
            } else {
                throw new Error('Falha na importação');
            }
        } catch (error: any) {
            toast.error(`Erro: ${error.message}`, { id: toastId });
            console.error('Import error:', error);
        } finally {
            setImporting(false);
        }
    };


    return (
        <>
            {/* Buttons - ULTRA MINIMAL */}
            <div className="flex items-center gap-1">
                {/* Export Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setShowExportDropdown(!showExportDropdown)}
                        className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded transition-colors"
                        title="Exportar dados"
                    >
                        <span className="material-symbols-outlined text-sm">download</span>
                        Exportar
                    </button>

                    {showExportDropdown && (
                        <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 py-1 w-48">
                            <button
                                onClick={handleExportJSON}
                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-left text-xs text-gray-700 transition-colors"
                            >
                                <span className="material-symbols-outlined text-sm text-blue-600">code</span>
                                <div>
                                    <div className="font-bold">JSON</div>
                                    <div className="text-[10px] text-gray-500">Formato estruturado</div>
                                </div>
                            </button>
                            <button
                                onClick={handleExportExcel}
                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-left text-xs text-gray-700 transition-colors"
                            >
                                <span className="material-symbols-outlined text-sm text-green-600">table_chart</span>
                                <div>
                                    <div className="font-bold">Excel (.xlsx)</div>
                                    <div className="text-[10px] text-gray-500">4 planilhas completas</div>
                                </div>
                            </button>
                            <div className="border-t border-gray-200 my-1"></div>
                            <button
                                onClick={() => setShowExportDropdown(false)}
                                className="w-full px-3 py-1 text-center text-[10px] text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                Fechar
                            </button>
                        </div>
                    )}
                </div>

                <button
                    onClick={() => setShowImportModal(true)}
                    className="flex items-center gap-1 px-2 py-1 bg-orange-600 hover:bg-orange-700 text-white text-[10px] font-bold rounded transition-colors"
                    title="Importar dados"
                >
                    <span className="material-symbols-outlined text-sm">upload</span>
                    Importar
                </button>
            </div>

            {/* Import Modal */}
            {showImportModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900">
                                    Importar Backup
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    Restaure seus dados de um arquivo JSON ou Excel
                                </p>
                            </div>
                            <button
                                onClick={() => setShowImportModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                disabled={importing}
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        {/* File Selection */}
                        <div className="mb-6">
                            <label className="block text-sm font-bold text-gray-700 mb-3">
                                Selecione o arquivo de backup
                            </label>
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".json,.xlsx"
                                    className="hidden"
                                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                    disabled={importing}
                                />
                                {selectedFile ? (
                                    <div className="flex items-center justify-center gap-3">
                                        <span className="material-symbols-outlined text-green-600 text-3xl">
                                            check_circle
                                        </span>
                                        <div className="text-left">
                                            <p className="font-bold text-gray-900">{selectedFile.name}</p>
                                            <p className="text-sm text-gray-500">
                                                {(selectedFile.size / 1024).toFixed(2)} KB
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-gray-400 text-5xl mb-3">
                                            upload_file
                                        </span>
                                        <p className="text-gray-700 font-medium">Clique para selecionar</p>
                                        <p className="text-sm text-gray-500 mt-1">Arquivo .json ou .xlsx</p>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Import Mode */}
                        <div className="mb-6">
                            <label className="block text-sm font-bold text-gray-700 mb-3">
                                Modo de Importação
                            </label>
                            <div className="space-y-3">
                                <label className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border-2 border-gray-200 cursor-pointer hover:border-blue-500 transition-all">
                                    <input
                                        type="radio"
                                        name="importMode"
                                        checked={importMode === 'merge'}
                                        onChange={() => setImportMode('merge')}
                                        className="mt-1"
                                        disabled={importing}
                                    />
                                    <div>
                                        <p className="font-bold text-gray-900">Mesclar (Merge)</p>
                                        <p className="text-sm text-gray-600">
                                            Adiciona novos ativos sem remover os existentes. Ativos duplicados (mesmo ID) serão ignorados.
                                        </p>
                                    </div>
                                </label>

                                <label className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border-2 border-red-200 cursor-pointer hover:border-red-500 transition-all">
                                    <input
                                        type="radio"
                                        name="importMode"
                                        checked={importMode === 'replace'}
                                        onChange={() => setImportMode('replace')}
                                        className="mt-1"
                                        disabled={importing}
                                    />
                                    <div>
                                        <p className="font-bold text-red-900 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-sm">warning</span>
                                            Substituir Tudo (Replace)
                                        </p>
                                        <p className="text-sm text-red-700">
                                            <strong>ATENÇÃO:</strong> Remove TODOS os ativos existentes e importa apenas os do backup. Esta ação é irreversível!
                                        </p>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Warning for Replace Mode */}
                        {importMode === 'replace' && (
                            <div className="bg-red-100 border-l-4 border-red-500 p-4 mb-6 rounded">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-red-600">
                                        error
                                    </span>
                                    <div>
                                        <p className="font-bold text-red-900">Você está prestes a DELETAR TUDO!</p>
                                        <p className="text-sm text-red-700">
                                            Todos os {currentAssets.length} ativos atuais serão permanentemente removidos.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowImportModal(false)}
                                className="px-6 py-3 text-gray-700 hover:text-gray-900 font-bold rounded-xl transition-colors"
                                disabled={importing}
                            >
                                CANCELAR
                            </button>
                            <button
                                onClick={handleImport}
                                disabled={!selectedFile || importing}
                                className="px-8 py-3 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center gap-2"
                            >
                                {importing ? (
                                    <>
                                        <span className="material-symbols-outlined animate-spin text-sm">
                                            progress_activity
                                        </span>
                                        IMPORTANDO...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-sm">upload</span>
                                        {importMode === 'replace' ? 'SUBSTITUIR TUDO' : 'IMPORTAR'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
