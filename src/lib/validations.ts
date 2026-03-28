import { z } from 'zod';

/**
 * Esquemas de Validação com Zod
 * 
 * Este módulo centraliza todos os schemas de validação para entrada de dados,
 * garantindo consistência e segurança em toda a aplicação.
 * 
 * Cada schema define regras estritas sobre formato, tipo e tamanho dos dados.
 */

/**
 * Schema para criação de fatura/nota fiscal
 * 
 * Valida informações de notas fiscais e faturas, incluindo dados do emitente,
 * tomador (cliente), valores e itens.
 * 
 * @typedef {Object} InvoiceCreateSchema
 * @property {string} [data] - Data da nota fiscal (máximo 20 caracteres)
 * @property {string} [cnpj_cpf_emissor] - CNPJ/CPF do emitente (máximo 20)
 * @property {string} [nome_emissor] - Nome da empresa emitente (máximo 200)
 * @property {string} [endereco_emissor] - Endereço do emitente (máximo 500)
 * @property {string} [cidade] - Cidade do emitente (máximo 100)
 * @property {string} [estado] - UF do emitente (máximo 2)
 * @property {string|number} [valor_total] - Valor total da nota
 * @property {string} [categoria] - Categoria/tipo da nota (máximo 50)
 * @property {enum} [status] - Status da nota: 'PENDENTE' ou 'APROVADO' (padrão: PENDENTE)
 * @property {string} [source] - Fonte de origem (máximo 50)
 * @property {string} [fileCopy] - Cópia do arquivo em base64 (máximo 50000)
 * @property {string} [auditReason] - Motivo de auditoria (máximo 500)
 * @property {string|Array} [items] - Itens da nota
 * @property {string} [numero_nota] - Número da nota fiscal (máximo 50)
 * @property {string} [serie_nota] - Série da nota (máximo 20)
 * @property {string} [beneficiario] - Beneficiário (máximo 200)
 * @property {string} [nome_tomador] - Nome da empresa tomadora/cliente (máximo 200)
 * @property {string} [cpf_cnpj_tomador] - CNPJ/CPF do tomador (máximo 20)
 * @property {string} [endereco_tomador] - Endereço do tomador (máximo 500)
 * @property {string} [email_tomador] - Email do tomador (máximo 200)
 * @property {string} [telefone_emissor] - Telefone do emitente (máximo 30)
 * @property {string} [telefone_tomador] - Telefone do tomador (máximo 30)
 */
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

/**
 * Schema para atualização parcial de fatura
 * 
 * Versão parcial de invoiceCreateSchema - todos os campos são opcionais.
 * Útil para requisições PATCH onde apenas alguns campos são atualizados.
 * 
 * @type {ZodSchema}
 * 
 * @example
 * // Atualizar apenas status
 * const data = await invoiceUpdateSchema.parseAsync({ status: 'APROVADO' });
 */
export const invoiceUpdateSchema = invoiceCreateSchema.partial();

/**
 * Schema para requisição de extração de dados por IA
 * 
 * Valida o conteúdo a ser enviado para processamento pela API Gemini.
 * Suporta tanto texto direto quanto referência a arquivo.
 * 
 * @typedef {Object} AiExtractSchema
 * @property {string} content - Conteúdo a processar (obrigatório, mínimo 1 caractere)
 *                              Pode ser texto ou base64 se isFile=true
 * @property {boolean} [isFile] - Se true, content é dados de arquivo (padrão: false)
 * @property {string} [mimeType] - Tipo MIME do arquivo (ex: 'image/png')
 */
export const aiExtractSchema = z.object({
    content: z.string().min(1, 'Conteudo obrigatorio'),
    isFile: z.boolean().default(false),
    mimeType: z.string().max(100).optional(),
});

/**
 * Schema para confirmação de reset/limpeza de dados
 * 
 * Força confirmação explícita do usuário para operações destrutivas.
 * O valor deve ser literalmente `true` (booleano), nada mais.
 * 
 * @typedef {Object} ResetConfirmSchema
 * @property {boolean} confirm - Confirmação (deve ser exatamente true)
 * 
 * @example
 * // Válido
 * resetConfirmSchema.parse({ confirm: true }) // OK
 * 
 * // Inválido
 * resetConfirmSchema.parse({ confirm: false }) // Erro
 * resetConfirmSchema.parse({ confirm: 'true' }) // Erro
 */
export const resetConfirmSchema = z.object({
    confirm: z.literal(true, { message: 'Confirmacao obrigatoria' }),
});
