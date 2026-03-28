export interface Invoice {
    id: string;
    data?: string;
    cnpj_cpf_emissor?: string;
    nome_emissor?: string;
    endereco_emissor?: string;
    cidade?: string;
    estado?: string;
    valor_total?: string | number;
    categoria?: string;
    status?: string;
    source?: string;
    fileCopy?: string;
    auditReason?: string | null;
    createdAt?: number;
    items?: Array<{ descricao: string; quantidade: number; valor: number; categoria?: string }>;
    numero_nota?: string;
    nome_tomador?: string;
    cpf_cnpj_tomador?: string;
    endereco_tomador?: string;
    email_tomador?: string;
    telefone_emissor?: string;
    telefone_tomador?: string;
    serie_nota?: string;
    beneficiario?: string;

    // Structured Address - Emissor
    cep_emissor?: string;
    logradouro_emissor?: string;
    numero_emissor?: string;
    bairro_emissor?: string;
    complemento_emissor?: string;

    // Structured Address - Tomador
    cep_tomador?: string;
    logradouro_tomador?: string;
    numero_tomador?: string;
    bairro_tomador?: string;
    complemento_tomador?: string;
    cidade_tomador?: string;
    estado_tomador?: string;
}

export interface GmailMessage {
    id: string;
    subject: string;
    date?: string;
    extracted?: Record<string, unknown>;
    isDuplicate: boolean;
    rawEmail: Record<string, unknown>;
    aiInput?: string | File;
    fullBody?: string;
}

// Helper Constants
export const CATEGORY_ICONS: Record<string, string> = {
    "Saúde": "cardiology",
    "Educação": "school",
    "Reforma": "construction",
    "Eletrônicos": "devices",
    "Outros": "receipt_long"
};

export interface InvoiceStats {
    total: number;
    byCat: [string, number][];
    count: number;
}

export const BENEFICIARIES = [
    { value: 'Wandrio Bandeira dos Anjos', label: 'Wandrio' },
    { value: 'Lucas Massad Bandeira', label: 'Lucas' },
    { value: 'Raquel Dutra Massad', label: 'Raquel' },
    { value: 'Ana Julia Massad Bandeira', label: 'Ana Julia' },
];

export const CATEGORIES = ["Saude", "Educacao", "Reforma", "Eletronicos", "Outros"];
