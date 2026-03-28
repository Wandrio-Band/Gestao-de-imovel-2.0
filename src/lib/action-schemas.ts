import { z } from 'zod';

/**
 * Esquemas de validação Zod para entrada de server actions
 * 
 * Este módulo contém todos os schemas de validação utilizados nas ações do servidor.
 * Cada schema define as regras de validação para os campos esperados nas requisições.
 */

/**
 * Schema para validação de imóvel (ativo)
 * 
 * Valida todos os campos de um imóvel incluindo localização, valores, detalhes financeiros
 * e informações de parceiros. Suporta parcelas de propriedade com percentuais.
 * 
 * @typedef {Object} SaveAssetSchema
 * @property {string} id - ID único do imóvel (obrigatório, mínimo 1 caractere)
 * @property {string} name - Nome do imóvel (obrigatório, máximo 200 caracteres)
 * @property {string} type - Tipo de imóvel (apartamento, casa, terreno, etc.)
 * @property {string} [address] - Endereço completo (máximo 500 caracteres)
 * @property {string} [zipCode] - CEP (máximo 10 caracteres)
 * @property {string} [street] - Rua/Avenida (máximo 200 caracteres)
 * @property {string} [number] - Número do imóvel (máximo 20 caracteres)
 * @property {string} [complement] - Complemento (apto, sala, etc.)
 * @property {string} [neighborhood] - Bairro (máximo 100 caracteres)
 * @property {string} [city] - Cidade (máximo 100 caracteres)
 * @property {string} [state] - UF (máximo 2 caracteres)
 * @property {string} [description] - Descrição detalhada (máximo 5000 caracteres)
 * @property {number} [areaTotal] - Área total do imóvel em m²
 * @property {string} [matricula] - Número da matrícula no cartório
 * @property {string} [iptu] - Número do IPTU (máximo 50 caracteres)
 * @property {string} [iptuRegistration] - Inscrição no IPTU
 * @property {number} [iptuValue] - Valor do IPTU em reais
 * @property {string} [iptuFrequency] - Frequência de pagamento do IPTU
 * @property {string} [registryOffice] - Cartório responsável
 * @property {string} [acquisitionDate] - Data de aquisição
 * @property {string} [irpfStatus] - Status para declaração IRPF
 * @property {string} [acquisitionOrigin] - Origem da aquisição
 * @property {number} [value] - Valor de aquisição (padrão: 0)
 * @property {number} [marketValue] - Valor de mercado atual (padrão: 0)
 * @property {number} [declaredValue] - Valor declarado
 * @property {string} [saleForecast] - Previsão de venda
 * @property {number} [suggestedRentalValue] - Valor sugerido de aluguel
 * @property {number} [rentalValue] - Valor de aluguel atual (padrão: 0)
 * @property {string} [status] - Status do imóvel: Vago, Locado, Em Reforma, Uso Próprio, À Venda (padrão: 'Vago')
 * @property {string} [image] - Imagem em base64 (máximo 50000 caracteres)
 * @property {Array<Object>} [partners] - Array de parceiros com propriedade
 * @property {number} [partners[].percentage] - Percentual de propriedade (0-100)
 * @property {any} [financingDetails] - Detalhes de financiamento
 * @property {any} [leaseDetails] - Detalhes de locação
 */
export const saveAssetSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1, 'Nome obrigatório').max(200),
    type: z.string().min(1),
    address: z.string().max(500).optional().default(''),
    zipCode: z.string().max(10).optional(),
    street: z.string().max(200).optional(),
    number: z.string().max(20).optional(),
    complement: z.string().max(100).optional(),
    neighborhood: z.string().max(100).optional(),
    city: z.string().max(100).optional(),
    state: z.string().max(2).optional(),
    description: z.string().max(5000).optional(),
    areaTotal: z.number().nonnegative().optional(),
    matricula: z.string().max(50).optional(),
    iptu: z.string().max(50).optional(),
    iptuRegistration: z.string().max(50).optional(),
    iptuValue: z.number().nonnegative().optional(),
    iptuFrequency: z.string().max(20).optional(),
    registryOffice: z.string().max(200).optional(),
    acquisitionDate: z.string().max(20).optional(),
    irpfStatus: z.string().max(30).optional(),
    acquisitionOrigin: z.string().max(100).optional(),
    value: z.number().nonnegative().default(0),
    marketValue: z.number().nonnegative().default(0),
    declaredValue: z.number().nonnegative().optional(),
    saleForecast: z.string().max(50).optional(),
    suggestedRentalValue: z.number().nonnegative().optional(),
    rentalValue: z.number().nonnegative().default(0),
    status: z.string().min(1).default('Vago'),
    image: z.string().max(50000).optional().default(''),
    partners: z.array(z.object({
        name: z.string().min(1),
        initials: z.string().min(1).max(5),
        color: z.string().min(1),
        percentage: z.number().min(0).max(100),
    })).optional().default([]),
    financingDetails: z.any().optional(),
    leaseDetails: z.any().optional(),
});

/**
 * Schema para validação de entrada PIX
 * 
 * Valida informações sobre uma transação PIX incluindo data, valor e descrição.
 * 
 * @typedef {Object} PixEntrySchema
 * @property {string} date - Data no formato ISO YYYY-MM-DD
 * @property {number} amount - Valor da transação em reais (deve ser positivo)
 * @property {string} description - Descrição da transação (máximo 500 caracteres)
 * @property {string} [id] - ID opcional da entrada
 */
export const pixEntrySchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
    amount: z.number().positive('Valor deve ser positivo'),
    description: z.string().min(1, 'Descrição obrigatória').max(500),
    id: z.string().optional(),
});

/**
 * Schema para validação de conciliação PIX
 * 
 * Array com pelo menos uma entrada PIX para conciliação.
 * 
 * @type {Array<PixEntrySchema>}
 */
export const conciliationSchema = z.array(pixEntrySchema).min(1, 'Pelo menos uma entrada PIX');

/**
 * Schema para validação de confirmação de pagamento
 * 
 * Valida os dados necessários para confirmar um pagamento PIX de um inquilino.
 * 
 * @typedef {Object} ConfirmPaymentSchema
 * @property {string} tenantId - ID do inquilino (obrigatório)
 * @property {string} [contractId] - ID do contrato (opcional)
 * @property {PixEntrySchema} pixEntry - Detalhes da entrada PIX
 */
export const confirmPaymentSchema = z.object({
    tenantId: z.string().min(1),
    contractId: z.string().optional(),
    pixEntry: pixEntrySchema,
});

/**
 * Schema para validação de contrato de locação
 * 
 * Valida todos os dados de um contrato de aluguel incluindo dados do inquilino,
 * valores, datas e termos de reajuste automático.
 * 
 * @typedef {Object} ContractSchema
 * @property {string} [id] - ID do contrato (opcional)
 * @property {string} assetId - ID do imóvel (obrigatório)
 * @property {string} [contractNumber] - Número do contrato
 * @property {string} nomeInquilino - Nome do inquilino (obrigatório, máximo 200)
 * @property {string} [documentoInquilino] - CPF/CNPJ do inquilino (máximo 20)
 * @property {string} [emailInquilino] - Email do inquilino (máximo 200)
 * @property {string} valorAluguel - Valor do aluguel (obrigatório)
 * @property {string} diaVencimento - Dia de vencimento do aluguel (obrigatório)
 * @property {string} [tipoGarantia] - Tipo de garantia (depósito, fiança, etc.)
 * @property {string} [inicioVigencia] - Data de início do contrato
 * @property {string} [fimContrato] - Data final do contrato
 * @property {string} [indexador] - Índice de reajuste (padrão: IPCA)
 * @property {Object} [contractFile] - Arquivo do contrato
 * @property {string} [contractFile.name] - Nome do arquivo
 * @property {string} [contractFile.data] - Dados do arquivo
 */
export const contractSchema = z.object({
    id: z.string().optional(),
    assetId: z.string().min(1, 'ID do imóvel obrigatório'),
    contractNumber: z.string().optional(),
    nomeInquilino: z.string().min(1, 'Nome do inquilino obrigatório').max(200),
    documentoInquilino: z.string().max(20).default(''),
    emailInquilino: z.string().max(200).default(''),
    valorAluguel: z.string().min(1, 'Valor do aluguel obrigatório'),
    diaVencimento: z.string().min(1),
    tipoGarantia: z.string().max(100).default(''),
    inicioVigencia: z.string().default(''),
    fimContrato: z.string().default(''),
    indexador: z.string().default('IPCA'),
    contractFile: z.object({
        name: z.string(),
        data: z.string(),
    }).nullable().optional(),
});

/**
 * Schema para validação de atualização de inquilino
 * 
 * Valida informações de um inquilino existente para atualização.
 * 
 * @typedef {Object} TenantUpdateSchema
 * @property {string} id - ID do inquilino (obrigatório)
 * @property {string} name - Nome do inquilino (obrigatório, máximo 200)
 * @property {string} [email] - Email do inquilino (máximo 200)
 * @property {string} [phone] - Telefone do inquilino (máximo 20)
 */
export const tenantUpdateSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1, 'Nome obrigatório').max(200),
    email: z.string().email().max(200).optional().or(z.literal('')),
    phone: z.string().max(20).optional(),
});

/**
 * Schema para validação de importação de contrato
 * 
 * Valida dados para importação em massa de contratos.
 * 
 * @typedef {Object} ImportContractSchema
 * @property {string} tenantName - Nome do inquilino (obrigatório)
 * @property {string} [tenantDocument] - CPF/CNPJ do inquilino
 * @property {string} [tenantEmail] - Email do inquilino
 * @property {string} [tenantPhone] - Telefone do inquilino
 * @property {number} rentValue - Valor do aluguel (obrigatório, deve ser positivo)
 * @property {string} startDate - Data de início (obrigatório)
 * @property {string} assetId - ID do imóvel (obrigatório)
 * @property {number} [dueDay] - Dia de vencimento (1-31)
 * @property {number} [penaltyPercent] - Percentual de multa por atraso (0-100)
 */
export const importContractSchema = z.object({
    tenantName: z.string().min(1),
    tenantDocument: z.string().optional(),
    tenantEmail: z.string().optional(),
    tenantPhone: z.string().optional(),
    rentValue: z.number().positive(),
    startDate: z.string().min(1),
    assetId: z.string().min(1),
    dueDay: z.number().int().min(1).max(31).optional(),
    penaltyPercent: z.number().min(0).max(100).optional(),
});
