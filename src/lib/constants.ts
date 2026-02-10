/**
 * System-wide constants for the Real Estate Control System
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

// Backup
export const BACKUP_CONFIG = {
    VERSION: '1.0',
    MAX_FILE_SIZE_MB: 50,
    RATE_LIMIT_MS: 5 * 60 * 1000, // 5 minutes
} as const;

// Currency
export const CURRENCY_CONFIG = {
    locale: 'pt-BR',
    currency: 'BRL',
} as const;

// Date Format
export const DATE_FORMAT = {
    display: 'DD/MM/YYYY',
    storage: 'YYYY-MM-DD',
} as const;

// Colors for partner badges
export const PARTNER_COLORS = [
    { name: 'blue', bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
    { name: 'green', bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
    { name: 'orange', bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
    { name: 'purple', bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
    { name: 'pink', bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-300' },
    { name: 'yellow', bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' },
] as const;

// Validation
export const VALIDATION = {
    CEP_PATTERN: /^\d{5}-?\d{3}$/,
    IPTU_PATTERN: /^\d{3}\.\d{3}\.\d{3}-\d$/,
    MIN_ASSET_VALUE: 0,
    MAX_ASSET_VALUE: 999_999_999,
} as const;

// UI
export const UI_CONFIG = {
    TABLE_PAGE_SIZE: 20,
    MODAL_ANIMATION_MS: 300,
    TOAST_DURATION_MS: 3000,
} as const;
