/**
 * @fileoverview Hook customizado para gerenciar formulários de cadastro/edição de ativos imobiliários.
 * 
 * Fornece gerenciamento completo de estado de formulário para propriedades com:
 * - Identificação e localização
 * - Documentação fiscal (IPTU, matrícula, etc)
 * - Dados financeiros (valores, aluguéis)
 * - Relacionamentos complexos (sócios, financiamentos, aluguéis)
 * 
 * Padrão: Hook com estado granular + helpers para parsing/formatação
 * Reutilizável: Tanto para criar novo ativo quanto editar existente
 */

import { useState, useEffect } from 'react';
import { Asset, PartnerShare, FinancingDetails, LeaseDetails } from '../components/ai-studio/types';

/**
 * Hook para gerenciar estado de formulário de ativo imobiliário.
 * 
 * @hook
 * @param {Asset} [initialAsset] - Ativo para edição (opcional). Se não fornecido, cria novo.
 * @returns {Object} Objeto contendo formState e helpers
 * 
 * @description
 * Estrutura de retorno:
 * ```javascript
 * {
 *   formState: {
 *     // Identificação
 *     name, setName,
 *     type, setType,  // 'Residencial' | 'Comercial' | ...
 *     status, setStatus,  // 'Vago' | 'Ocupado' | ...
 *     
 *     // Localização
 *     zipCode, setZipCode,
 *     street, setStreet,
 *     number, setNumber,
 *     complement, setComplement,
 *     neighborhood, setNeighborhood,
 *     city, setCity,
 *     state, setState,
 *     description, setDescription,
 *     
 *     // Documentação
 *     areaTotal, setAreaTotal,  // Área em m²
 *     matricula, setMatricula,  // Número de matrícula no cartório
 *     iptu, setIptu,  // Inscrição IPTU
 *     iptuValue, setIptuValue,  // Valor anual em R$
 *     iptuFrequency, setIptuFrequency,  // 'monthly' | 'annual'
 *     condominio, setCondominio,  // Taxa de condomínio
 *     registryOffice, setRegistryOffice,  // Cartório responsável
 *     acquisitionDate, setAcquisitionDate,  // Data de aquisição
 *     irpfStatus, setIrpfStatus,  // 'Declarado' | 'Não Declarado'
 *     acquisitionOrigin, setAcquisitionOrigin,  // Origem da aquisição
 *     
 *     // Financeiros
 *     marketValue, setMarketValue,  // Valor de mercado atual
 *     rentalValue, setRentalValue,  // Aluguel sugerido
 *     acquisitionValue, setAcquisitionValue,  // Preço de compra
 *     declaredValue, setDeclaredValue,  // Valor declarado
 *     saleForecast, setSaleForecast,  // Previsão de venda
 *     
 *     // Relacionamentos
 *     partners, setPartners,  // Sócios e participações
 *     financingData, setFinancingData,  // Dados de financiamento
 *     leaseData, setLeaseData,  // Dados de aluguel
 *     
 *     // Toggles UI
 *     enableFinancial, setEnableFinancial,
 *     enableLease, setEnableLease,
 *     enableSaleForecast, setEnableSaleForecast
 *   },
 *   helpers: {
 *     handleCurrencyInput: (setter) => (e) => void,  // Parser para input de moeda
 *     getFormattedAsset: () => Asset  // Serializa estado para objeto Asset
 *   }
 * }
 * ```
 * 
 * @example
 * // Novo ativo
 * function NewAssetForm() {
 *   const { formState, helpers } = useAssetForm();
 *   const { name, setName } = formState;
 *   const { getFormattedAsset } = helpers;
 * 
 *   const handleSubmit = () => {
 *     const newAsset = getFormattedAsset();
 *     saveAsset(newAsset);
 *   };
 *   
 *   return (
 *     <input 
 *       value={name}
 *       onChange={(e) => setName(e.target.value)}
 *     />
 *   );
 * }
 * 
 * // Editar ativo existente
 * function EditAssetForm({ asset }) {
 *   const { formState, helpers } = useAssetForm(asset);
 *   const { getFormattedAsset } = helpers;
 *   
 *   return (
 *     // Form fields já carregados do asset
 *   );
 * }
 */
export const useAssetForm = (initialAsset?: Asset) => {
    // Core Identifiers
    const [name, setName] = useState('');
    const [type, setType] = useState<Asset['type']>('Residencial');
    const [status, setStatus] = useState<Asset['status']>('Vago');

    // Address Details
    const [zipCode, setZipCode] = useState('');
    const [street, setStreet] = useState('');
    const [number, setNumber] = useState('');
    const [complement, setComplement] = useState('');
    const [neighborhood, setNeighborhood] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [description, setDescription] = useState('');

    // Documentation
    const [areaTotal, setAreaTotal] = useState('');
    const [matricula, setMatricula] = useState('');
    const [iptu, setIptu] = useState('');
    const [iptuValue, setIptuValue] = useState('');
    const [iptuFrequency, setIptuFrequency] = useState('monthly');
    const [condominio, setCondominio] = useState('');
    const [registryOffice, setRegistryOffice] = useState('');
    const [acquisitionDate, setAcquisitionDate] = useState('');
    const [irpfStatus, setIrpfStatus] = useState<Asset['irpfStatus']>('Declarado');
    const [acquisitionOrigin, setAcquisitionOrigin] = useState('');

    // Financials
    const [marketValue, setMarketValue] = useState('');
    const [rentalValue, setRentalValue] = useState(''); // Suggested
    const [acquisitionValue, setAcquisitionValue] = useState('');
    const [declaredValue, setDeclaredValue] = useState('');
    const [saleForecast, setSaleForecast] = useState('');

    // Complex Objects
    const [partners, setPartners] = useState<PartnerShare[]>([]);
    const [financingData, setFinancingData] = useState<FinancingDetails | null>(null);
    const [leaseData, setLeaseData] = useState<LeaseDetails | null>(null);

    // UI Toggles
    const [enableFinancial, setEnableFinancial] = useState(false);
    const [enableLease, setEnableLease] = useState(false);
    const [enableSaleForecast, setEnableSaleForecast] = useState(false);

    /**
     * Carrega dados iniciais do ativo ao montar o hook ou quando initialAsset muda.
     * 
     * @private
     * @description
     * Se initialAsset fornecido:
     * - Mapeia todos os campos do ativo para estado do formulário
     * - Formata valores monetários com locale pt-BR
     * - Habilita toggles baseado em dados relacionados
     * 
     * Se initialAsset não fornecido:
     * - Reseta formulário para novo ativo
     */
    useEffect(() => {
        if (initialAsset) {
            setName(initialAsset.name);
            setType(initialAsset.type);
            setStatus(initialAsset.status);

            // Parse address
            // Assuming address string parsing logic if needed, or simple mapping if fields exist
            // For now, implementing simple mapping if individual fields were stored, 
            // otherwise relying on user to re-enter split address or implementing a parser later.
            // The previous component code didn't explicitly parse 'initialAsset.address' back into fields 
            // unless they were stored separately. The props interface matches Asset.

            setZipCode(initialAsset.zipCode || '');
            setStreet(initialAsset.street || '');
            setNumber(initialAsset.number || '');
            setComplement(initialAsset.complement || '');
            setNeighborhood(initialAsset.neighborhood || '');
            setCity(initialAsset.city || '');
            setState(initialAsset.state || '');
            setDescription(initialAsset.description || '');

            setAreaTotal(initialAsset.areaTotal?.toString() || '');
            setMatricula(initialAsset.matricula || '');
            setIptu(initialAsset.iptuRegistration || initialAsset.iptu || '');
            setIptuValue(initialAsset.iptuValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '');
            setIptuFrequency(initialAsset.iptuFrequency || 'monthly');
            setCondominio(initialAsset.condominio || '');
            setRegistryOffice(initialAsset.registryOffice || '');
            setAcquisitionDate(initialAsset.acquisitionDate || '');
            setIrpfStatus(initialAsset.irpfStatus || 'Declarado');
            setAcquisitionOrigin(initialAsset.acquisitionOrigin || '');

            setMarketValue(initialAsset.marketValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '');
            setRentalValue(initialAsset.suggestedRentalValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '');
            setAcquisitionValue(initialAsset.value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '');
            setDeclaredValue(initialAsset.declaredValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '');
            setSaleForecast(initialAsset.saleForecast || '');

            setPartners(initialAsset.partners || []);
            setFinancingData(initialAsset.financingDetails || null);
            setLeaseData(initialAsset.leaseDetails || null);
            setEnableFinancial(!!initialAsset.financingDetails);
            setEnableLease(!!initialAsset.leaseDetails);
            setEnableSaleForecast(!!initialAsset.saleForecast);
        } else {
            // Reset logic for new asset?
            // Usually form unmounts, but if reused:
            setName('');
            setType('Residencial');
            setStatus('Vago');
            // ... reset others if needed
        }
    }, [initialAsset]);

    /**
     * Converte string de moeda (ex: "1.234,56") para número.
     * 
     * @private
     * @param {string} val - Valor em formato localizado (pt-BR)
     * @returns {number} Número decimal
     * 
     * @example
     * parseCurrency("1.234,56") // 1234.56
     * parseCurrency("") // 0
     */
    const parseCurrency = (val: string) => {
        if (!val) return 0;
        return parseFloat(val.replace(/\./g, '').replace(',', '.'));
    }

    /**
     * Factory para criar handler de input de moeda com formatação automática.
     * 
     * @function handleCurrencyInput
     * @param {Function} setter - Setter de estado (ex: setIptuValue)
     * @returns {Function} Handler para onChange de input
     * 
     * @description
     * Algoritmo:
     * 1. Remove caracteres não-numéricos
     * 2. Converte para centavos (divide por 100)
     * 3. Formata com locale pt-BR (separadores . e ,)
     * 4. Chama setter com valor formatado
     * 
     * @example
     * <input 
     *   onChange={handleCurrencyInput(setIptuValue)}
     *   placeholder="R$ 0,00"
     * />
     */
    const handleCurrencyInput = (setter: (val: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const cleanValue = value.replace(/\D/g, '');
        const numberValue = Number(cleanValue) / 100;
        setter(numberValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
    };

    /**
     * Serializa estado do formulário para objeto Asset completo.
     * 
     * @function getFormattedAsset
     * @returns {Asset} Objeto Asset formatado e pronto para persistência
     * 
     * @description
     * Processa:
     * 1. Combina campos de endereço em string de address
     * 2. Aplica parseCurrency em valores monetários
     * 3. Utiliza ID existente ou gera novo baseado em timestamp
     * 4. Preserva dados relacionados (sócios, financiamentos, aluguéis)
     * 5. Define rentalValue a partir de leaseData ou do campo anterior
     * 
     * Validação mínima: apenas parsing, não valida presença de campos obrigatórios
     * 
     * @example
     * const asset = getFormattedAsset();
     * await saveAsset(asset);
     */
    const getFormattedAsset = (): Asset => {
        const fullAddress = street ? `${street}, ${number} - ${neighborhood}` : initialAsset?.address || '';

        // Rental logic
        let currentRentalValue = initialAsset?.rentalValue || 0;
        if (leaseData && leaseData.valorAluguel) {
            currentRentalValue = parseCurrency(leaseData.valorAluguel);
        }

        return {
            id: initialAsset?.id || Date.now().toString(),
            name,
            type,
            status,

            address: fullAddress,
            zipCode,
            street,
            number,
            complement,
            neighborhood,
            city,
            state,
            description,

            areaTotal: parseFloat(areaTotal) || 0,
            matricula,
            iptu,
            iptuRegistration: iptu,
            iptuValue: parseCurrency(iptuValue),
            iptuFrequency,
            condominio,
            registryOffice,
            acquisitionDate,
            irpfStatus,
            acquisitionOrigin,

            partners,
            value: parseCurrency(acquisitionValue),
            marketValue: parseCurrency(marketValue),
            declaredValue: parseCurrency(declaredValue),
            saleForecast,
            suggestedRentalValue: parseCurrency(rentalValue),

            rentalValue: currentRentalValue,
            image: initialAsset?.image || '',
            financingDetails: financingData || undefined,
            leaseDetails: leaseData || undefined
        };
    };

    return {
        formState: {
            name, setName,
            type, setType,
            status, setStatus,
            zipCode, setZipCode,
            street, setStreet,
            number, setNumber,
            complement, setComplement,
            neighborhood, setNeighborhood,
            city, setCity,
            state, setState,
            description, setDescription,
            areaTotal, setAreaTotal,
            matricula, setMatricula,
            iptu, setIptu,
            iptuValue, setIptuValue,
            iptuFrequency, setIptuFrequency,
            condominio, setCondominio,
            registryOffice, setRegistryOffice,
            acquisitionDate, setAcquisitionDate,
            irpfStatus, setIrpfStatus,
            acquisitionOrigin, setAcquisitionOrigin,
            marketValue, setMarketValue,
            rentalValue, setRentalValue,
            acquisitionValue, setAcquisitionValue,
            declaredValue, setDeclaredValue,
            saleForecast, setSaleForecast,
            partners, setPartners,
            financingData, setFinancingData,
            leaseData, setLeaseData,
            enableFinancial, setEnableFinancial,
            enableLease, setEnableLease,
            enableSaleForecast, setEnableSaleForecast
        },
        helpers: {
            handleCurrencyInput,
            getFormattedAsset
        }
    };
};
