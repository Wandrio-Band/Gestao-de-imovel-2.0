import { prisma } from '@/lib/prisma';

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
