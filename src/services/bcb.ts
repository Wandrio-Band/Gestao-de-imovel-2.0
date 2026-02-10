
export interface BCBIndex {
    data: string;
    valor: string; // BCB returns numbers as strings "0.56"
}

export type IndexType = 'IGPM' | 'IPCA';

const SERIES_CODES = {
    IGPM: 189, // IGP-M Mensal
    IPCA: 433  // IPCA Mensal
};

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
