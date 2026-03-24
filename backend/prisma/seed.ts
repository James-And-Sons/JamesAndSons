import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import "dotenv/config";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

const PRODUCTS = [
  {
    sku: 'JNS-HER-001',
    name: 'The Empress Crystal Falls',
    slug: 'empress-crystal-falls',
    description: 'A cascading waterfall of hand-cut Swarovski crystals. The centrepiece of any grand foyer.',
    collection: 'Heritage Collection',
    mrp: 180000,
    d2cPrice: 145000,
    b2bPrice: 110000,
    isLed: true,
    luminousEfficacy: 120,
    cri: 95,
    gstRate: 5,
    bisCertification: 'IS 10322',
    hsnCode: '9405',
    stockQuantity: 12,
    weight: 28,
  },
  {
    sku: 'JNS-MOD-042',
    name: 'Aether Linear Suspension',
    slug: 'aether-linear-suspension',
    description: 'Minimalist LED bar suspension for contemporary dining and commercial spaces.',
    collection: 'Modern Series',
    mrp: 95000,
    d2cPrice: 82500,
    b2bPrice: 62000,
    isLed: true,
    luminousEfficacy: 140,
    cri: 90,
    gstRate: 5,
    bisCertification: 'IS 10322',
    hsnCode: '9405',
    stockQuantity: 0,
    weight: 6,
  },
  {
    sku: 'JNS-HER-018',
    name: 'Royal Lantern',
    slug: 'royal-lantern',
    description: 'An heirloom lantern in brass and mouth-blown glass. Timeless craftsmanship.',
    collection: 'Heritage Collection',
    mrp: 135000,
    d2cPrice: 115000,
    b2bPrice: 88000,
    isLed: false,
    gstRate: 18,
    hsnCode: '9405',
    stockQuantity: 7,
    weight: 18,
  },
  {
    sku: 'JNS-COM-007',
    name: 'Grand Foyer Cascading Ring',
    slug: 'grand-foyer-cascading-ring',
    description: 'Stacked brass rings with trailing crystals. Purpose-built for monumental lobbies.',
    collection: 'Commercial Series',
    mrp: 320000,
    d2cPrice: 280000,
    b2bPrice: 210000,
    isLed: true,
    luminousEfficacy: 135,
    cri: 90,
    gstRate: 5,
    bisCertification: 'IS 10322',
    hsnCode: '9405',
    stockQuantity: 4,
    weight: 65,
  },
  {
    sku: 'JNS-MOD-055',
    name: 'Solstice Cluster',
    slug: 'solstice-cluster',
    description: 'Organic globe cluster in amber glass and aged brass. A conversation piece for modern homes.',
    collection: 'Modern Series',
    mrp: 68000,
    d2cPrice: 58000,
    b2bPrice: 44000,
    isLed: false,
    gstRate: 18,
    stockQuantity: 15,
    weight: 9,
  },
  {
    sku: 'JNS-HER-029',
    name: 'Maharaja Sputnik',
    slug: 'maharaja-sputnik',
    description: 'A bold sputnik chandelier fusing Rajasthani metalwork with space-age silhouette.',
    collection: 'Heritage Collection',
    mrp: 85000,
    d2cPrice: 72000,
    b2bPrice: 55000,
    isLed: false,
    gstRate: 18,
    stockQuantity: 8,
    weight: 14,
  },
  {
    sku: 'JNS-LED-003',
    name: 'Nimbus Ring LED',
    slug: 'nimbus-ring-led',
    description: 'Seamless illuminated ring in brushed brass. High-efficacy LED for dining and bedrooms.',
    collection: 'Modern Series',
    mrp: 42000,
    d2cPrice: 36000,
    b2bPrice: 27000,
    isLed: true,
    luminousEfficacy: 130,
    cri: 92,
    gstRate: 5,
    bisCertification: 'IS 10322',
    stockQuantity: 28,
    weight: 4,
  },
  {
    sku: 'JNS-COM-014',
    name: 'Palace Dome',
    slug: 'palace-dome',
    description: 'A full hemisphere of k9 crystal. Made for palatial ballrooms and five-star hotel lobbies.',
    collection: 'Commercial Series',
    mrp: 850000,
    d2cPrice: 720000,
    b2bPrice: 540000,
    isLed: true,
    luminousEfficacy: 115,
    cri: 95,
    gstRate: 5,
    stockQuantity: 2,
    weight: 120,
  },
];

async function main() {
  console.log('Starting seed...');

  // Create Categories
  const categories = [
    { name: 'Heritage Collection', slug: 'heritage-collection' },
    { name: 'Modern Series', slug: 'modern-series' },
    { name: 'Commercial Series', slug: 'commercial-series' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: {
        name: cat.name,
        slug: cat.slug,
      },
    });
  }

  const dbCategories = await prisma.category.findMany();
  const categoryMap = new Map(dbCategories.map((c) => [c.name, c.id]));

  // Create Products
  for (const prod of PRODUCTS) {
    const categoryId = categoryMap.get(prod.collection);
    if (!categoryId) continue;

    await prisma.product.upsert({
      where: { sku: prod.sku },
      update: {
        stockQuantity: prod.stockQuantity,
        d2cPrice: prod.d2cPrice,
        b2bPrice: prod.b2bPrice,
      },
      create: {
        sku: prod.sku,
        name: prod.name,
        slug: prod.slug,
        description: prod.description,
        mrp: prod.mrp,
        d2cPrice: prod.d2cPrice,
        b2bPrice: prod.b2bPrice,
        isLed: prod.isLed,
        luminousEfficacy: prod.luminousEfficacy,
        cri: prod.cri,
        gstRate: prod.gstRate,
        bisCertification: prod.bisCertification,
        hsnCode: prod.hsnCode,
        stockQuantity: prod.stockQuantity,
        weight: prod.weight,
        categoryId: categoryId,
      },
    });
  }

  // Create an Admin user
  await prisma.user.upsert({
    where: { email: 'admin@jamesandsons.com' },
    update: {},
    create: {
      email: 'admin@jamesandsons.com',
      password: 'password123', // In a real app, use hashed passwords
      firstName: 'Super',
      lastName: 'Admin',
      role: 'ADMIN',
    },
  });

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
