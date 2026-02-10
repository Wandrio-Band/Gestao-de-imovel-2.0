import { BCBIndex } from "../services/bcb";

// Helper to parse BCB date "DD/MM/YYYY" -> Date Object
// Helper to parse BCB date "DD/MM/YYYY" -> Date Object
function parseBCBDate(dateStr: string): Date {
    if (!dateStr || typeof dateStr !== 'string') return new Date(); // Fallback to now
    const [d, m, y] = dateStr.split('/').map(Number);
    return new Date(y, m - 1, d);
}

export interface AdjustmentResult {
    accumulatedFactor: number;
    accumulatedPercentage: number;
    newRentValue: number;
    indicesUsed: { date: string, value: number }[];
    error?: string;
}

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
