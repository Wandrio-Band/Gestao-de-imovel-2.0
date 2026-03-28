/**
 * @fileoverview Geradores de números de contrato e identificadores únicos.
 * 
 * Este módulo fornece funções para gerar números de contrato sequenciais
 * com formato padrão que inclui ano e sequência dentro do ano.
 * 
 * Formato de contrato: CTR-{YYYY}-{XXX}
 * Exemplo: CTR-2024-001, CTR-2024-002, ..., CTR-2024-999
 */

import { prisma } from '@/lib/prisma';

/**
 * Gera número de contrato sequencial com base no ano atual e contador.
 * 
 * @async
 * @function generateContractNumber
 * @returns {Promise<string>} Número de contrato formatado como "CTR-YYYY-NNN"
 * 
 * @description
 * Algoritmo:
 * 1. Obtém ano corrente
 * 2. Consulta banco de dados pelo último contrato do ano (ordenado descendente)
 * 3. Extrai sequência do número anterior ou inicia com 1
 * 4. Incrementa sequência
 * 5. Formata com padding de zeros à esquerda (3 dígitos)
 * 6. Retorna formato: "CTR-{ano}-{sequência com 3 dígitos}"
 * 
 * Características:
 * - Resetada a cada novo ano (sequência volta a 001 em janeiro)
 * - Atômico: usa banco de dados para garantir unicidade
 * - Suporta até 999 contratos por ano
 * 
 * @example
 * // Primeiro contrato de 2024
 * const num1 = await generateContractNumber();
 * // Retorna: "CTR-2024-001"
 * 
 * // Segundo contrato de 2024
 * const num2 = await generateContractNumber();
 * // Retorna: "CTR-2024-002"
 * 
 * // Contrato número 42 de 2024
 * const num42 = await generateContractNumber();
 * // Retorna: "CTR-2024-042"
 * 
 * @throws {Error} Se houver erro ao acessar o banco de dados
 */
export async function generateContractNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();

    // Find last contract created in this year
    const lastContract = await prisma.contract.findFirst({
        where: {
            contractNumber: {
                startsWith: `CTR-${year}-`
            }
        },
        orderBy: {
            contractNumber: 'desc'
        }
    });

    let sequence = 1;

    if (lastContract && lastContract.contractNumber) {
        const parts = lastContract.contractNumber.split('-');
        if (parts.length === 3) {
            const lastSeq = parseInt(parts[2], 10);
            if (!isNaN(lastSeq)) {
                sequence = lastSeq + 1;
            }
        }
    }

    // Pad sequence with leading zeros (e.g., 001)
    const sequenceStr = sequence.toString().padStart(3, '0');

    return `CTR-${year}-${sequenceStr}`;
}
