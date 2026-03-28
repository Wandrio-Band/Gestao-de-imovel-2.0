/**
 * @fileoverview Integração com API do Banco Central do Brasil para índices econômicos.
 * 
 * Este módulo fornece funções para buscar históricos de índices econômicos brasileiros
 * da API pública do BCB (Banco Central do Brasil), especificamente:
 * - IGP-M (Índice Geral de Preços - Mercado) - código série 189
 * - IPCA (Índice de Preços ao Consumidor Amplo) - código série 433
 * 
 * Os dados são cacheados por 24 horas para otimização de performance.
 * 
 * API: https://api.bcb.gov.br/dados/serie/bcdata.sgs.{codigo}/dados/ultimos/{meses}?formato=json
 */

/**
 * @typedef {Object} BCBIndex
 * @description Representa um ponto de dados de índice econômico retornado pela API do BCB.
 * @property {string} data - Data no formato "DD/MM/YYYY"
 * @property {string} valor - Valor percentual como string (ex: "0.56" para 0,56%)
 */
export interface BCBIndex {
    data: string;
    valor: string; // BCB returns numbers as strings "0.56"
}

/**
 * @typedef {('IGPM' | 'IPCA')} IndexType
 * @description Tipo de índice econômico suportado
 */
export type IndexType = 'IGPM' | 'IPCA';

/**
 * Mapa de códigos de série do BCB para cada tipo de índice.
 * @constant
 * @type {Object.<IndexType, number>}
 * @example
 * SERIES_CODES.IGPM === 189  // IGP-M Mensal
 * SERIES_CODES.IPCA === 433  // IPCA Mensal
 */
const SERIES_CODES = {
    IGPM: 189, // IGP-M Mensal
    IPCA: 433  // IPCA Mensal
};

/**
 * Busca histórico de índice econômico da API pública do Banco Central do Brasil.
 * 
 * @async
 * @function fetchIndexHistory
 * @param {IndexType} type - Tipo de índice a buscar (IGPM ou IPCA)
 * @param {number} [bufferMonths=24] - Número de meses no histórico (padrão: 24)
 * @returns {Promise<BCBIndex[]>} Array com histórico de índices ordenado por data
 * 
 * @description
 * Realiza requisição GET à API do BCB sem autenticação. A resposta é armazenada em cache
 * por 24 horas (3600 segundos * 24 = 86400 segundos) via Next.js revalidate.
 * 
 * Em caso de erro na API ou parsing inválido, retorna array vazio e registra erro no console.
 * 
 * @example
 * // Buscar últimos 24 meses de IPCA
 * const ipca = await fetchIndexHistory('IPCA', 24);
 * console.log(ipca);
 * // [
 * //   { data: "01/01/2023", valor: "0.56" },
 * //   { data: "01/02/2023", valor: "0.89" },
 * //   ...
 * // ]
 */
export async function fetchIndexHistory(type: IndexType, bufferMonths: number = 24): Promise<BCBIndex[]> {
    const code = SERIES_CODES[type];
    if (!code) throw new Error(`Invalid index type: ${type}`);

    // Fetch from BCB Public API
    // No auth required. JSON format.
    // For simplicity, we fetch the last N entries by date if possible, but BCB API arguments are by date range.
    // or we can fetch "ultimos/N".
    // Endpoint: https://api.bcb.gov.br/dados/serie/bcdata.sgs.189/dados/ultimos/12?formato=json

    try {
        const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${code}/dados/ultimos/${bufferMonths}?formato=json`;
        const res = await fetch(url, {
            next: { revalidate: 3600 * 24 } // Cache for 24 hours
        });

        if (!res.ok) {
            throw new Error(`BCB API Error: ${res.statusText}`);
        }

        const data: BCBIndex[] = await res.json();
        if (!Array.isArray(data)) throw new Error("Invalid BCB Response");
        return data;
    } catch (err) {
        console.error(`Failed to fetch ${type} from BCB`, err);
        return [];
    }
}
