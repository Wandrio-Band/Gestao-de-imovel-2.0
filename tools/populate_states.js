const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function populateStates() {
    console.log('🚀 Starting state auto-population...');

    const assets = await prisma.asset.findMany({
        where: {
            OR: [
                { state: null },
                { state: '' },
            ]
        }
    });

    console.log(`📋 Found ${assets.length} assets without state`);

    let updated = 0;

    for (const asset of assets) {
        // Pattern: "City/UF" or "City - UF" 
        const cityStateMatch = asset.name.match(/([A-Za-zÀ-ÿ\s]+)[\/-]\s*([A-Z]{2})\b/i);

        if (cityStateMatch) {
            const city = cityStateMatch[1].trim();
            const state = cityStateMatch[2].toUpperCase();

            console.log(`✅ Update "${asset.name}": city="${city}" state="${state}"`);

            await prisma.asset.update({
                where: { id: asset.id },
                data: {
                    city: asset.city || city,
                    state: state
                }
            });

            updated++;
        } else {
            console.log(`⏭️ Skipped "${asset.name}": no city/state pattern found`);
        }
    }

    console.log(`\n✅ Updated ${updated} assets!`);
    await prisma.$disconnect();
}

populateStates().catch(console.error);
