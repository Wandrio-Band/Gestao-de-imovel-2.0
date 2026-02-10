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
    items?: any[];
    numero_nota?: string;
    nome_tomador?: string;
    cpf_cnpj_tomador?: string;
    endereco_tomador?: string;
    email_tomador?: string;
    telefone_emissor?: string;
    telefone_tomador?: string;
    serie_nota?: string;
    beneficiario?: string;
}

export interface GmailMessage {
    id: string;
    subject: string;
    date?: string;
    extracted?: any;
    isDuplicate: boolean;
    rawEmail: any;
    aiInput?: any;
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
