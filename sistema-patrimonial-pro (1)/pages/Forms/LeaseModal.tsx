import React, { useState, useRef } from 'react';
import { DatePicker } from '../../components/DatePicker';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
}

// Helper para formatar apenas o número (sem R$)
const formatNumber = (value: number) => {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export const LeaseModal: React.FC<ModalProps> = ({ isOpen, onClose, onSave }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    nomeInquilino: '',
    documentoInquilino: '',
    emailInquilino: '',
    valorAluguel: '',
    diaVencimento: 'Dia 5',
    tipoGarantia: 'Caução (3x)',
    inicioVigencia: '',
    fimContrato: '',
    indexador: 'IPCA'
  });

  // Função Simulada de Extração de Dados via IA
  const processContractFile = (file: File) => {
      setIsAnalyzing(true);
      setAttachedFile(file); // Define o arquivo imediatamente para UI
      
      // Simulando delay de processamento da IA
      setTimeout(() => {
          const fileName = file.name.toLowerCase();
          let extractedData = {};

          // Lógica de simulação baseada no nome do arquivo
          if (fileName.includes('clinica') || fileName.includes('reabilita')) {
              // DADOS DO CONTRATO DA CLÍNICA (Baseado no seu novo print)
              extractedData = {
                  nomeInquilino: 'Clínica de Reabilitação Vida Nova Ltda',
                  documentoInquilino: '45.123.987/0001-55',
                  emailInquilino: 'financeiro@vidanova.com.br',
                  valorAluguel: '12.500,00', // Valor comercial mais alto
                  diaVencimento: 'Dia 5',
                  tipoGarantia: 'Seguro Fiança',
                  inicioVigencia: '2023-06-01',
                  fimContrato: '2028-05-31', // Contratos comerciais costumam ser 5 anos
                  indexador: 'IGPM'
              };
          } else if (fileName.includes('eduardo') || fileName.includes('agua')) {
              // DADOS DO CONTRATO DO EDUARDO (Anterior)
              extractedData = {
                  nomeInquilino: 'Eduardo Nunes de Oliveira',
                  documentoInquilino: '086.984.647-03',
                  emailInquilino: 'edununoli@yahoo.com.br',
                  valorAluguel: '2.690,00',
                  diaVencimento: 'Dia 4',
                  tipoGarantia: 'Caução (1x)',
                  inicioVigencia: '2022-05-04',
                  fimContrato: '2023-05-05',
                  indexador: 'IGPM'
              };
          } else {
              // DADOS GENÉRICOS (Caso suba outro arquivo qualquer)
              extractedData = {
                  nomeInquilino: 'Locatário Identificado no PDF...',
                  documentoInquilino: '',
                  emailInquilino: '',
                  valorAluguel: '0,00',
                  diaVencimento: 'Dia 10',
                  tipoGarantia: 'Caução (3x)',
                  inicioVigencia: '',
                  fimContrato: '',
                  indexador: 'IPCA'
              };
          }

          setFormData(prev => ({ ...prev, ...extractedData }));
          setIsAnalyzing(false);
      }, 2500); // Um pouco mais de tempo para dar peso à "análise"
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          processContractFile(e.target.files[0]);
      }
  };

  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          processContractFile(e.dataTransfer.files[0]);
      }
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
      e.stopPropagation();
      setAttachedFile(null);
      // Limpa os dados ao remover o arquivo para evitar confusão
      setFormData({
        nomeInquilino: '',
        documentoInquilino: '',
        emailInquilino: '',
        valorAluguel: '',
        diaVencimento: 'Dia 5',
        tipoGarantia: 'Caução (3x)',
        inicioVigencia: '',
        fimContrato: '',
        indexador: 'IPCA'
      });
  };

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handler para inputs monetários
  const handleCurrencyInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Remove tudo que não é dígito
    const rawValue = value.replace(/\D/g, '');
    // Converte para float (ex: 1234 -> 12.34)
    const floatValue = Number(rawValue) / 100;
    // Formata para exibição
    const formatted = formatNumber(floatValue);
    setFormData(prev => ({ ...prev, [name]: formatted }));
  };

  const handleSave = () => {
    onSave({ ...formData, contractFile: attachedFile });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div 
        className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl overflow-hidden animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-700 border border-green-100">
                <span className="material-symbols-outlined text-2xl">real_estate_agent</span>
             </div>
             <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Novo Contrato de Locação</h2>
                <p className="text-sm text-gray-500 font-medium">Apto 402 - Ed. Horizon</p>
             </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
            <span className="material-symbols-outlined text-gray-500">close</span>
          </button>
        </div>

        <div className="p-8 overflow-y-auto max-h-[80vh] bg-[#f8f9fc]">
           
           {/* IMPORT SECTION */}
           <div className="mb-8">
               <div 
                   onDragOver={(e) => e.preventDefault()}
                   onDrop={handleDrop}
                   onClick={() => !attachedFile && fileInputRef.current?.click()}
                   className={`
                       relative rounded-[2rem] border-2 border-dashed transition-all duration-300 cursor-pointer overflow-hidden
                       ${isAnalyzing ? 'border-primary bg-blue-50/50' : ''}
                       ${attachedFile ? 'border-green-200 bg-green-50/30' : 'border-gray-300 hover:border-primary hover:bg-white'}
                   `}
               >
                   <input 
                       type="file" 
                       ref={fileInputRef} 
                       className="hidden" 
                       accept=".pdf,.doc,.docx"
                       onChange={handleFileSelect}
                   />
                   
                   <div className="p-8 flex flex-col items-center justify-center text-center">
                       {isAnalyzing ? (
                           <div className="flex flex-col items-center animate-pulse">
                               <div className="w-12 h-12 rounded-full border-4 border-blue-200 border-t-primary animate-spin mb-4"></div>
                               <h3 className="text-lg font-bold text-primary">Analisando Contrato com IA...</h3>
                               <p className="text-sm text-blue-400">Extraindo cláusulas, valores e datas do arquivo <span className="font-bold">{attachedFile?.name}</span></p>
                           </div>
                       ) : attachedFile ? (
                           <div className="flex items-center justify-between w-full max-w-lg">
                               <div className="flex items-center gap-4">
                                   <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600">
                                       <span className="material-symbols-outlined text-2xl">description</span>
                                   </div>
                                   <div className="text-left">
                                       <h3 className="text-sm font-bold text-gray-900">{attachedFile.name}</h3>
                                       <p className="text-xs text-green-600 font-bold flex items-center gap-1">
                                           <span className="material-symbols-outlined text-xs">check_circle</span>
                                           Dados Extraídos com Sucesso
                                       </p>
                                   </div>
                               </div>
                               <button 
                                   onClick={handleRemoveFile}
                                   className="px-4 py-2 bg-white border border-gray-200 text-gray-500 text-xs font-bold rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-colors"
                               >
                                   Remover
                               </button>
                           </div>
                       ) : (
                           <>
                               <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-4 group-hover:bg-blue-50 group-hover:text-primary transition-colors">
                                   <span className="material-symbols-outlined text-3xl">cloud_upload</span>
                               </div>
                               <h3 className="text-lg font-bold text-gray-900 mb-1">Importar Contrato (PDF/DOC)</h3>
                               <p className="text-sm text-gray-500 max-w-md">
                                   Arraste seu arquivo aqui ou clique para selecionar. 
                                   <span className="text-primary font-bold"> Nossa IA preencherá o formulário automaticamente.</span>
                               </p>
                           </>
                       )}
                   </div>
                   
                   {/* Background decoration */}
                   {!attachedFile && !isAnalyzing && (
                       <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                           <span className="material-symbols-outlined text-9xl text-gray-400">article</span>
                       </div>
                   )}
               </div>
           </div>

           {/* Inquilino Section */}
           <div className="mb-8">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-4">
                 <span className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-xs">1</span>
                 Dados do Inquilino
              </h3>
              <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="md:col-span-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Nome Completo / Razão Social</label>
                    <input 
                        name="nomeInquilino"
                        value={formData.nomeInquilino}
                        onChange={handleChange}
                        type="text" 
                        placeholder="Ex: João da Silva ou Empresa LTDA" 
                        className={`w-full bg-gray-50 border-none rounded-xl p-4 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-primary/20 transition-all ${isAnalyzing ? 'animate-pulse bg-gray-100' : ''}`}
                    />
                 </div>
                 <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2">CPF / CNPJ</label>
                    <input 
                        name="documentoInquilino"
                        value={formData.documentoInquilino}
                        onChange={handleChange}
                        type="text" 
                        placeholder="000.000.000-00" 
                        className={`w-full bg-gray-50 border-none rounded-xl p-4 text-sm font-bold text-gray-900 outline-none transition-all ${isAnalyzing ? 'animate-pulse bg-gray-100' : ''}`} 
                    />
                 </div>
                 <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Email de Contato</label>
                    <input 
                        name="emailInquilino"
                        value={formData.emailInquilino}
                        onChange={handleChange}
                        type="email" 
                        placeholder="email@exemplo.com" 
                        className={`w-full bg-gray-50 border-none rounded-xl p-4 text-sm font-bold text-gray-900 outline-none transition-all ${isAnalyzing ? 'animate-pulse bg-gray-100' : ''}`} 
                    />
                 </div>
              </div>
           </div>

           {/* Contrato Section */}
           <div className="mb-8">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-4">
                 <span className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-xs">2</span>
                 Termos do Contrato
              </h3>
              <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Valor do Aluguel</label>
                        <div className={`flex items-center gap-2 bg-gray-50 rounded-xl p-4 border border-transparent focus-within:border-primary/50 focus-within:bg-white transition-all ${isAnalyzing ? 'animate-pulse bg-gray-100' : ''}`}>
                            <span className="text-sm font-bold text-gray-400">R$</span>
                            <input 
                                name="valorAluguel"
                                value={formData.valorAluguel}
                                onChange={handleCurrencyInput}
                                type="text" 
                                placeholder="0,00" 
                                className="w-full bg-transparent border-none text-lg font-black text-gray-900 outline-none placeholder-gray-300" 
                            />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Dia Vencimento</label>
                        <select 
                            name="diaVencimento"
                            value={formData.diaVencimento}
                            onChange={handleChange}
                            className="w-full bg-gray-50 border-none rounded-xl p-4 text-sm font-bold text-gray-900 outline-none cursor-pointer"
                        >
                            <option>Dia 1</option>
                            <option>Dia 4</option>
                            <option>Dia 5</option>
                            <option>Dia 10</option>
                            <option>Dia 15</option>
                            <option>Dia 20</option>
                            <option>Dia 25</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Garantia</label>
                        <select 
                            name="tipoGarantia"
                            value={formData.tipoGarantia}
                            onChange={handleChange}
                            className={`w-full bg-gray-50 border-none rounded-xl p-4 text-sm font-bold text-gray-900 outline-none cursor-pointer ${isAnalyzing ? 'animate-pulse bg-gray-100' : ''}`}
                        >
                            <option>Caução (1x)</option>
                            <option>Caução (3x)</option>
                            <option>Fiador</option>
                            <option>Seguro Fiança</option>
                            <option>Capitalização</option>
                        </select>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                      <div>
                        <DatePicker 
                           label="Início da Vigência"
                           value={formData.inicioVigencia}
                           onChange={(val) => setFormData(prev => ({ ...prev, inicioVigencia: val }))}
                        />
                      </div>
                      <div>
                        <DatePicker 
                           label="Fim do Contrato (Previsão)"
                           value={formData.fimContrato}
                           onChange={(val) => setFormData(prev => ({ ...prev, fimContrato: val }))}
                        />
                      </div>
                  </div>
              </div>
           </div>

           {/* Indexador Section */}
           <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-4">
                 <span className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-xs">3</span>
                 Reajuste
              </h3>
              <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-6">
                 <div className="flex-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Índice de Reajuste Anual</label>
                    <div className="flex gap-4">
                        <label className={`flex items-center gap-2 cursor-pointer p-3 rounded-xl border transition-all ${formData.indexador === 'IPCA' ? 'border-primary bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                            <input 
                                type="radio" 
                                name="indexador" 
                                value="IPCA"
                                checked={formData.indexador === 'IPCA'}
                                onChange={handleChange}
                                className="accent-primary" 
                            />
                            <span className={`text-sm font-bold ${formData.indexador === 'IPCA' ? 'text-primary' : 'text-gray-600'}`}>IPCA (IBGE)</span>
                        </label>
                        <label className={`flex items-center gap-2 cursor-pointer p-3 rounded-xl border transition-all ${formData.indexador === 'IGPM' ? 'border-primary bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                            <input 
                                type="radio" 
                                name="indexador" 
                                value="IGPM"
                                checked={formData.indexador === 'IGPM'}
                                onChange={handleChange}
                                className="accent-primary" 
                            />
                            <span className={`text-sm font-bold ${formData.indexador === 'IGPM' ? 'text-primary' : 'text-gray-600'}`}>IGP-M (FGV)</span>
                        </label>
                    </div>
                 </div>
                 <div className="w-px h-16 bg-gray-100"></div>
                 <div className="flex-1">
                     <p className="text-xs text-gray-500 mb-1">Próximo Reajuste Estimado</p>
                     <p className="text-lg font-black text-gray-900">--/--</p>
                 </div>
              </div>
           </div>

        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-100 bg-white flex items-center justify-end gap-3 sticky bottom-0 z-10">
            <button onClick={onClose} className="px-6 py-3 rounded-full border border-gray-200 text-sm font-bold text-gray-500 hover:bg-gray-50 transition">Cancelar</button>
            <button 
                onClick={handleSave}
                disabled={isAnalyzing}
                className={`px-8 py-3 rounded-full text-white text-sm font-bold shadow-lg shadow-blue-200 transition flex items-center gap-2 ${isAnalyzing ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-blue-700'}`}
            >
                <span className="material-symbols-outlined text-sm">save</span>
                <span>Salvar Contrato</span>
            </button>
        </div>
      </div>
    </div>
  );
};