import { describe, it, expect } from 'vitest';
import { calculateRentAdjustment, getNextAdjustmentDate } from '@/utils/financial';

describe('calculateRentAdjustment', () => {
    const mockIndices = [
        { data: '01/02/2024', valor: '0.83' },
        { data: '01/03/2024', valor: '0.16' },
        { data: '01/04/2024', valor: '0.38' },
        { data: '01/05/2024', valor: '0.44' },
        { data: '01/06/2024', valor: '0.29' },
        { data: '01/07/2024', valor: '0.38' },
        { data: '01/08/2024', valor: '-0.02' },
        { data: '01/09/2024', valor: '0.44' },
        { data: '01/10/2024', valor: '0.56' },
        { data: '01/11/2024', valor: '0.39' },
        { data: '01/12/2024', valor: '0.52' },
        { data: '01/01/2025', valor: '0.16' },
    ];

    it('calculates accumulated factor from indices after start date', () => {
        const startDate = new Date(2024, 0, 15); // Jan 15, 2024
        const result = calculateRentAdjustment(2000, startDate, mockIndices);

        expect(result.accumulatedFactor).toBeGreaterThan(1);
        expect(result.accumulatedPercentage).toBeGreaterThan(0);
        expect(result.newRentValue).toBeGreaterThan(2000);
        expect(result.indicesUsed.length).toBeGreaterThan(0);
    });

    it('returns factor 1.0 when no indices after start date', () => {
        const startDate = new Date(2025, 5, 1); // Jun 2025 - after all indices
        const result = calculateRentAdjustment(2000, startDate, mockIndices);

        expect(result.accumulatedFactor).toBe(1.0);
        expect(result.accumulatedPercentage).toBe(0);
        expect(result.newRentValue).toBe(2000);
        expect(result.indicesUsed).toHaveLength(0);
    });

    it('handles empty index history', () => {
        const result = calculateRentAdjustment(2000, new Date(2024, 0, 1), []);

        expect(result.accumulatedFactor).toBe(1.0);
        expect(result.newRentValue).toBe(2000);
    });

    it('handles null/undefined index history gracefully', () => {
        const result = calculateRentAdjustment(2000, new Date(2024, 0, 1), null as any);

        expect(result.accumulatedFactor).toBe(1.0);
        expect(result.newRentValue).toBe(2000);
    });

    it('correctly applies multiple indices cumulatively', () => {
        const simpleIndices = [
            { data: '01/02/2024', valor: '1.00' }, // +1%
            { data: '01/03/2024', valor: '2.00' }, // +2%
        ];
        const startDate = new Date(2024, 0, 1); // Jan 1, 2024
        const result = calculateRentAdjustment(1000, startDate, simpleIndices);

        // Factor: 1.01 * 1.02 = 1.0302
        expect(result.accumulatedFactor).toBeCloseTo(1.0302, 4);
        expect(result.newRentValue).toBeCloseTo(1030.20, 2);
        expect(result.indicesUsed).toHaveLength(2);
    });

    it('handles negative index values (deflation)', () => {
        const deflationIndices = [
            { data: '01/02/2024', valor: '-0.50' },
        ];
        const startDate = new Date(2024, 0, 1);
        const result = calculateRentAdjustment(1000, startDate, deflationIndices);

        expect(result.accumulatedFactor).toBeLessThan(1);
        expect(result.newRentValue).toBeLessThan(1000);
    });

    it('skips entries with invalid valor', () => {
        const badIndices = [
            { data: '01/02/2024', valor: 'abc' },
            { data: '01/03/2024', valor: '1.00' },
        ];
        const startDate = new Date(2024, 0, 1);
        const result = calculateRentAdjustment(1000, startDate, badIndices);

        expect(result.indicesUsed).toHaveLength(1);
        expect(result.accumulatedFactor).toBeCloseTo(1.01, 4);
    });
});

describe('getNextAdjustmentDate', () => {
    it('returns next anniversary from a past date', () => {
        // If contract started 2020-06-15, next adjustment should be in the future
        const result = getNextAdjustmentDate('2020-06-15');
        const now = new Date();
        expect(result.getTime()).toBeGreaterThanOrEqual(now.getTime());
        expect(result.getMonth()).toBe(5); // June (0-indexed)
        expect(result.getDate()).toBe(15);
    });

    it('returns next year for a recent start date', () => {
        const now = new Date();
        const pastMonth = now.getMonth() - 2; // 2 months ago
        const startStr = `${now.getFullYear()}-${String(pastMonth + 1).padStart(2, '0')}-10`;
        const result = getNextAdjustmentDate(startStr);

        // Should be next year since this month already passed
        expect(result.getFullYear()).toBe(now.getFullYear() + 1);
    });

    it('preserves the day of month', () => {
        const result = getNextAdjustmentDate('2022-03-25');
        expect(result.getDate()).toBe(25);
    });
});
