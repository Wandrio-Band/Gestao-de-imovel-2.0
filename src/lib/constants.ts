/**
 * Constantes do Sistema de Controle de Imóveis
 * 
 * Este módulo centraliza todas as constantes utilizadas em toda a aplicação,
 * incluindo tipos de imóvel, status, configurações de backup, e regras de negócio.
 */

// Asset Types
export const ASSET_TYPES = [
    'Apartamento',
    'Casa',
    'Terreno',
    'Sala Comercial',
    'Loja',
    'Galpão',
    'Cobertura',
    'Kitnet'
] as const;

export type AssetType = typeof ASSET_TYPES[number];

// Asset Status
export const ASSET_STATUS = [
    'Vago',
    'Locado',
    'Em Reforma',
    'Uso Próprio',
    'À Venda'
] as const;

export type AssetStatus = typeof ASSET_STATUS[number];

// IRPF Status
export const IRPF_STATUS = [
    'Declarado',
    'Não Declarado',
    'Pendente',
    'Isento'
] as const;

export type IRPFStatus = typeof IRPF_STATUS[number];

// Partners (can be extended to database later)
export const DEFAULT_PARTNERS = [
    'Raquel',
    'Marília',
    'Wândrio',
    'Tilinha'
] as const;

/**
 * Configuração de backup do sistema
 * 
 * @constant
 * @type {Object}
 * @property {string} VERSION - Versão do formato de backup (1.0)
 * @property {number} MAX_FILE_SIZE_MB - Tamanho máximo de arquivo para backup (50 MB)
 * @property {number} RATE_LIMIT_MS - Intervalo mínimo entre backups (5 minutos = 300000 ms)
 *                                     Evita múltiplos backups em sequência
 */
export const BACKUP_CONFIG = {
    VERSION: '1.0',
    MAX_FILE_SIZE_MB: 50,
    RATE_LIMIT_MS: 5 * 60 * 1000, // 5 minutes
} as const;

/**
 * Configuração de moeda e locale
 * 
 * @constant
 * @type {Object}
 * @property {string} locale - Locale do Brasil (pt-BR) para formatação
 * @property {string} currency - Código da moeda: BRL (Real Brasileiro)
 */
export const CURRENCY_CONFIG = {
    locale: 'pt-BR',
    currency: 'BRL',
} as const;

/**
 * Formato de datas utilizado na aplicação
 * 
 * @constant
 * @type {Object}
 * @property {string} display - Formato para exibição ao usuário: DD/MM/YYYY
 * @property {string} storage - Formato para armazenamento no banco: YYYY-MM-DD (ISO 8601)
 */
export const DATE_FORMAT = {
    display: 'DD/MM/YYYY',
    storage: 'YYYY-MM-DD',
} as const;

/**
 * Cores para badges de parceiros
 * 
 * Array com combinações de cores (background, texto, borda) usando Tailwind CSS
 * para identificar visualmente diferentes parceiros no sistema.
 * 
 * @constant
 * @type {Array<Object>}
 */
export const PARTNER_COLORS = [
    { name: 'blue', bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
    { name: 'green', bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
    { name: 'orange', bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
    { name: 'purple', bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
    { name: 'pink', bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-300' },
    { name: 'yellow', bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' },
] as const;

/**
 * Regras de validação
 * 
 * @constant
 * @type {Object}
 * @property {RegExp} CEP_PATTERN - Padrão para validação de CEP (formato: 12345-678 ou 12345678)
 * @property {RegExp} IPTU_PATTERN - Padrão para validação de IPTU (formato: 123.456.789-0)
 * @property {number} MIN_ASSET_VALUE - Valor mínimo permitido para um imóvel (0)
 * @property {number} MAX_ASSET_VALUE - Valor máximo permitido para um imóvel (999.999.999)
 */
export const VALIDATION = {
    CEP_PATTERN: /^\d{5}-?\d{3}$/,
    IPTU_PATTERN: /^\d{3}\.\d{3}\.\d{3}-\d$/,
    MIN_ASSET_VALUE: 0,
    MAX_ASSET_VALUE: 999_999_999,
} as const;

/**
 * Configuração de interface de usuário
 * 
 * @constant
 * @type {Object}
 * @property {number} TABLE_PAGE_SIZE - Registros por página em tabelas (padrão: 20)
 * @property {number} MODAL_ANIMATION_MS - Duração de animação ao abrir/fechar modais (ms)
 * @property {number} TOAST_DURATION_MS - Duração padrão de notificações toast (ms)
 */
export const UI_CONFIG = {
    TABLE_PAGE_SIZE: 20,
    MODAL_ANIMATION_MS: 300,
    TOAST_DURATION_MS: 3000,
} as const;

/**
 * Limiar de similaridade para busca de imóveis duplicados
 * 
 * Valor entre 0 e 1 usado pelo algoritmo de comparação de strings.
 * 0.3 = 30% de similaridade mínima para considerar duplicados.
 * 
 * Reduzir aumenta falsos positivos, aumentar reduz detecção de duplicados.
 * 
 * @constant
 * @type {number}
 */
export const SIMILARITY_THRESHOLD = 0.65;

/**
 * Taxa de reajuste IPCA padrão para contratos de aluguel
 * 
 * Valor utilizado quando nenhum índice específico é fornecido.
 * 0.045 = 4.5% de reajuste anual
 * 
 * Este valor é aplicado em contratos com indexador 'IPCA' para cálculo
 * automático do novo valor de aluguel em renovações.
 * 
 * @constant
 * @type {number}
 */
export const DEFAULT_IPCA_RATE = 0.045;

/**
 * Percentual padrão de multa por atraso em aluguel
 * 
 * Valor aplicado quando não especificado no contrato.
 * 10 = 10% sobre o valor do aluguel
 * 
 * @constant
 * @type {number}
 */
export const DEFAULT_PENALTY_PERCENT = 10;

/**
 * Dia padrão de vencimento de aluguel
 * 
 * 5 = dia 5 de cada mês
 * Utilizado como padrão quando não definido no contrato.
 * 
 * @constant
 * @type {number}
 */
export const DEFAULT_DUE_DAY = 5;

/**
 * Máximo de tentativas de requisição à API de IA
 * 
 * Se a primeira requisição falhar, o sistema tentará novamente
 * até 3 vezes antes de desistir (3 tentativas = 1 original + 2 retentativas).
 * 
 * @constant
 * @type {number}
 */
export const MAX_AI_RETRIES = 3;

/**
 * Intervalo entre tentativas de requisição à IA
 * 
 * 2000ms = 2 segundos entre cada tentativa.
 * Evita sobrecarregar a API em caso de falhas transitórias.
 * 
 * @constant
 * @type {number}
 */
export const AI_RETRY_DELAY_MS = 2000;

/**
 * Máximo de resultados retornados pela API Gmail
 * 
 * Limita a quantidade de emails recuperados em uma única requisição.
 * Reduzir melhora performance, aumentar obtém mais histórico.
 * 
 * @constant
 * @type {number}
 */
export const MAX_GMAIL_RESULTS = 50;
