import { prisma } from '../src/lib/prisma';
import { generateKeywords } from '../src/lib/sync/mapping';

async function main() {
  console.log('--- STARTING PRODUCT LISTINGS FIX & BACKFILL ---');

  const products = await prisma.product.findMany({
    include: {
      category: true,
      spaces: true
    }
  });

  console.log(`Found ${products.length} products to evaluate.`);

  for (const product of products) {
    const updates: any = {};

    // 1. Backfill category details if missing
    if (product.category) {
      if (!product.hsnCode && product.category.hsnCode) {
        updates.hsnCode = product.category.hsnCode;
      }
      if (product.gstRate === null && product.category.gstRate !== null) {
        updates.gstRate = product.category.gstRate;
      }
      if (!product.bisCertification && product.category.bisStandard) {
        updates.bisCertification = product.category.bisStandard;
      }
    }

    // 2. Generate and update amazonKeywords if empty
    if (!product.amazonKeywords || !product.amazonKeywords.trim()) {
      const keywords = generateKeywords(product);
      if (keywords) {
        updates.amazonKeywords = keywords;
      }
    }

    // 3. Scan description for space names, create in DB if missing, and connect/link
    const desc = product.description || '';
    const lowerDesc = desc.toLowerCase();
    const COMMON_SPACES = [
      'Living Room', 'Bedroom', 'Dining Room', 'Kitchen', 'Office', 'Study', 'Outdoor', 'Bathroom', 
      'Lounge', 'Foyer', 'Lobby', 'Balcony', 'Staircase', 'Corridor', 'Hallway', 'Library', 'Bar', 
      'Terrace', 'Pooja Room', 'Drawing Room', 'Gym', 'Home Theater', 'Home Office'
    ];

    const foundSpaces = COMMON_SPACES.filter(name => {
      const escapedName = name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedName}\\b`, 'i');
      return regex.test(lowerDesc);
    });

    if (foundSpaces.length > 0) {
      const connectSpaces: { id: string }[] = [];
      for (const spaceName of foundSpaces) {
        let space = await prisma.space.findFirst({
          where: { name: { equals: spaceName, mode: 'insensitive' } }
        });

        if (!space) {
          const slug = spaceName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
          space = await prisma.space.create({
            data: {
              name: spaceName,
              slug,
              description: `Curated collection for ${spaceName} layouts.`
            }
          });
          console.log(`Created new Space from existing product description: "${spaceName}"`);
        }

        const isLinked = product.spaces.some(s => s.id === space!.id);
        if (!isLinked) {
          connectSpaces.push({ id: space.id });
        }
      }

      if (connectSpaces.length > 0) {
        updates.spaces = {
          connect: connectSpaces
        };
      }
    }

    if (Object.keys(updates).length > 0) {
      await prisma.product.update({
        where: { id: product.id },
        data: updates
      });
      console.log(`Updated Product: ${product.name} (SKU: ${product.sku})`);
    }
  }

  console.log('--- PRODUCT LISTINGS BACKFILL COMPLETED ---');
}

main()
  .catch(e => {
    console.error('Error during backfill:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
