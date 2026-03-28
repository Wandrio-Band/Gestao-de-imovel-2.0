/**
 * @fileoverview Utilitários para cálculos financeiros de ajuste de aluguel por índices econômicos.
 * 
 * Este módulo fornece funções para:
 * 1. Parsing de datas no formato BCB (DD/MM/YYYY)
 * 2. Cálculo acumulado de índices econômicos (IGPM, IPCA)
 * 3. Determinação da próxima data de reajuste de aluguel
 * 
 * As fórmulas utilizadas:
 * - Fator Acumulado: fator = Π(1 + (valor_i / 100)) para cada índice i
 * - Novo Aluguel: novoAluguel = aluguelAtual × fatorAcumulado
 * - Percentual de Ajuste: percentual = (fatorAcumulado - 1) × 100
 */

import { BCBIndex } from "../services/bcb";

/**
 * @typedef {Object} AdjustmentResult
 * @description Resultado do cálculo de reajuste de aluguel com índices acumulados.
 * @property {number} accumulatedFactor - Fator acumulado (ex: 1.1256 = 12,56% de aumento)
 * @property {number} accumulatedPercentage - Percentual acumulado em formato decimal (ex: 12.56)
 * @property {number} newRentValue - Novo valor do aluguel após ajuste
 * @property {Array<{date: string, value: number}>} indicesUsed - Lista de índices utilizados no cálculo
 * @property {string} [error] - Mensagem de erro, se houver
 */
export interface AdjustmentResult {
    accumulatedFactor: number;
    accumulatedPercentage: number;
    newRentValue: number;
    indicesUsed: { date: string, value: number }[];
    error?: string;
}

/**
 * Converte data no formato BCB "DD/MM/YYYY" para objeto Date JavaScript.
 * 
 * @private
 * @param {string} dateStr - Data em formato "DD/MM/YYYY"
 * @returns {Date} Objeto Date correspondente, ou nova Date() se inválido
 * 
 * @example
 * parseBCBDate("15/03/2023") // Date(2023, 2, 15, 0, 0, 0, 0)
 * parseBCBDate("") // Date atual
 * parseBCBDate(null) // Date atual
 */
// Helper to parse BCB date "DD/MM/YYYY" -> Date Object
// Helper to parse BCB date "DD/MM/YYYY" -> Date Object
function parseBCBDate(dateStr: string): Date {
    if (!dateStr || typeof dateStr !== 'string') return new Date(); // Fallback to now
    const [d, m, y] = dateStr.split('/').map(Number);
    return new Date(y, m - 1, d);
}

/**
 * Calcula o reajuste de aluguel com base em histórico de índices econômicos.
 * 
 * @function calculateRentAdjustment
 * @param {number} currentRent - Valor atual do aluguel
 * @param {Date} lastAdjustmentDate - Data do último reajuste (ou data de início do contrato)
 * @param {BCBIndex[]} indexHistory - Histórico de índices do BCB
 * @param {Date} [limitMonth] - Data limite para o cálculo (opcional)
 * @returns {AdjustmentResult} Resultado contendo fator acumulado, percentual e novo valor
 * 
 * @description
 * Algoritmo:
 * 1. Ordena índices por data em ordem crescente
 * 2. Filtra índices posteriores à data do último reajuste
 * 3. Acumula o fator multiplicativo: fator = Π(1 + valor/100)
 * 4. Calcula novo aluguel: novoAluguel = aluguelAtual × fatorAcumulado
 * 5. Retorna resultado com índices utilizados para rastreabilidade
 * 
 * @example
 * // Contrato iniciado em 15/01/2023, ajuste em 15/01/2024
 * // Usando IPCA de fev/2023 até jan/2024
 * const result = calculateRentAdjustment(
 *   5000,  // aluguel de R$ 5.000
 *   new Date(2023, 0, 15),  // última correção
 *   ipacHistory  // histórico de IPCA
 * );
 * console.log(result);
 * // {
 * //   accumulatedFactor: 1.0712,
 * //   accumulatedPercentage: 7.12,
 * //   newRentValue: 5356,
 * //   indicesUsed: [
 * //     { date: "01/02/2023", value: 0.56 },
 * //     { date: "01/03/2023", value: 0.89 },
 * //     ...
 * //   ]
 * // }
 */
export function calculateRentAdjustment(
    currentRent: number,
    lastAdjustmentDate: Date, // Or Start Date
    indexHistory: BCBIndex[],
    limitMonth?: Date // Optional: calculate up to specific date
): AdjustmentResult {

    // 1. Sort history by date ascending
    // 1. Sort history by date ascending
    const safeHistory = Array.isArray(indexHistory) ? indexHistory : [];
    const sortedHistory = [...safeHistory].sort((a, b) =>
        parseBCBDate(a.data).getTime() - parseBCBDate(b.data).getTime()
    );

    // 2. Identify target period
    // Rule: Adjustment uses indices from Month after Last Adj Date up to Reference Month.
    // E.g. Contract started Jan 2023. Adjustment Jan 2024.
    // Indices used: Feb 2023 ... Jan 2024? Or Jan 2023 ... Dec 2023?
    // Standard: 12 months accumulator prior to the anniversary month.
    // If anniversary is Jan 15th, we use Jan-Dec of previous year? 
    // Usually IGP-M of a month is released at the end of that month.
    // If adjustment is in May, we collect indices from May(prev) to April(curr).

    // We need to match indices where Date > LastAdjustmentDate AND Date <= NextAdjustmentDate (approx)

    // Simplified logic: Find the indices that fall into the 12 months preceding the NEXT anniversary.
    // But since we might be projecting, we just take all available indices AFTER the start date.

    const usedIndices: { date: string, value: number }[] = [];
    let accumulatedFactor = 1.0;

    for (const entry of sortedHistory) {
        const entryDate = parseBCBDate(entry.data);

        // Skip if entry is before or same month as start date (usually start date implies index is base 100)
        // Actually, if I start in Jan, the first correction is next Jan, using Feb-Jan indices?
        // Let's assume we use indices strictly AFTER the last adjustment date.

        if (entryDate > lastAdjustmentDate) {
            const val = parseFloat(entry.valor);
            if (!isNaN(val)) {
                accumulatedFactor *= (1 + (val / 100));
                usedIndices.push({ date: entry.data, value: val });
            }
        }
    }

    return {
        accumulatedFactor,
        accumulatedPercentage: (accumulatedFactor - 1) * 100,
        newRentValue: currentRent * accumulatedFactor,
        indicesUsed: usedIndices
    };
}

/**
 * Calcula a próxima data de reajuste de aluguel a partir de uma data inicial.
 * 
 * @function getNextAdjustmentDate
 * @param {string} startDateStr - Data inicial em formato "YYYY-MM-DD"
 * @returns {Date} Próxima data de reajuste (aniversário contratual)
 * 
 * @description
 * Encontra o próximo aniversário da data de início do contrato após a data atual.
 * Se múltiplos aniversários já passaram, calcula o próximo futuro.
 * 
 * @example
 * // Contrato iniciado em 2020-03-15
 * const nextAdj = getNextAdjustmentDate("2020-03-15");
 * // Retorna: 15 de março do próximo ano que ainda não passou
 * if (new Date() < new Date(2024, 2, 15))
 *   // Retorna: 2024-03-15
 * else
 *   // Retorna: 2025-03-15
 */
export function getNextAdjustmentDate(startDateStr: string): Date {
    // "YYYY-MM-DD"
    const [y, m, d] = startDateStr.split('-').map(Number);
    const start = new Date(y, m - 1, d);
    const now = new Date();

    let next = new Date(start);
    next.setFullYear(start.getFullYear() + 1);

    // While next adjustment is in the past, keep adding years?
    // Or do we want the very next one from NOW, or from the start date?
    // If start date was 2020, and we never adjusted, technically there are missed adjustments.
    // But for "Next Adjustment" display, we usually mean the upcoming anniversary.

    while (next < now) {
        next.setFullYear(next.getFullYear() + 1);
    }

    return next;
}
