
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const all = await prisma.asset.findMany();
    console.log(`Total Assets: ${all.length}`);

    const byStatus = {};
    all.forEach(a => {
        const s = a.irpfStatus || 'NULL/UNDEFINED';
        byStatus[s] = (byStatus[s] || 0) + 1;
    });
    console.log('By irpfStatus:', byStatus);

    await prisma.$disconnect();
}

check();
