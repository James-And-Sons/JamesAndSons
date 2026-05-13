import { prisma } from '../src/lib/prisma';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function seed() {
  try {
    const coupon = await prisma.coupon.create({
      data: {
        code: 'WELCOME20',
        description: '20% off for new customers',
        type: 'PERCENTAGE',
        value: 20,
        minOrderAmount: 10000,
        maxDiscountCap: 5000,
        status: 'ACTIVE',
        usageLimit: 100,
        usageLimitPerUser: 1,
        source: 'internal'
      }
    });
    console.log('✅ Test coupon created:', coupon.code);
  } catch (e) {
    console.error('❌ Error creating coupon (it might already exist):', e.message);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

seed();
