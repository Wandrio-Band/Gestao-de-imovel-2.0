import { z } from 'zod';

export const invoiceCreateSchema = z.object({
    data: z.string().max(20).optional(),
    cnpj_cpf_emissor: z.string().max(20).optional(),
    nome_emissor: z.string().max(200).optional(),
    endereco_emissor: z.string().max(500).optional(),
    cidade: z.string().max(100).optional(),
    estado: z.string().max(2).optional(),
    valor_total: z.union([z.string(), z.number()]).optional(),
    categoria: z.string().max(50).optional(),
    status: z.enum(['PENDENTE', 'APROVADO']).default('PENDENTE'),
    source: z.string().max(50).optional(),
    fileCopy: z.string().max(50000).optional().nullable(),
    auditReason: z.string().max(500).optional().nullable(),
    items: z.union([z.string(), z.array(z.any())]).optional().nullable(),
    numero_nota: z.string().max(50).optional(),
    serie_nota: z.string().max(20).optional(),
    beneficiario: z.string().max(200).optional(),
    nome_tomador: z.string().max(200).optional(),
    cpf_cnpj_tomador: z.string().max(20).optional(),
    endereco_tomador: z.string().max(500).optional(),
    email_tomador: z.string().email().max(200).optional().or(z.literal('')),
    telefone_emissor: z.string().max(30).optional(),
    telefone_tomador: z.string().max(30).optional(),
});

export const invoiceUpdateSchema = invoiceCreateSchema.partial();

export const aiExtractSchema = z.object({
    content: z.string().min(1, 'Conteudo obrigatorio'),
    isFile: z.boolean().default(false),
    mimeType: z.string().max(100).optional(),
});

export const resetConfirmSchema = z.object({
    confirm: z.literal(true, { message: 'Confirmacao obrigatoria' }),
});
