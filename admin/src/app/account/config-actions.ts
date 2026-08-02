'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Fallback configuration default templates
const DEFAULT_CONFIGS: Record<string, any> = {
  BRAND: {
    name: 'James & Sons',
    legalName: 'James and Sons Bespoke Interiors',
    tagline: 'Luxury Artisanal Lighting & Home Accessories',
    domain: 'jamesandsons.in',
    storefrontUrl: 'https://jamesandsons.in',
    supportEmail: 'support@jamesandsons.in',
    ordersEmail: 'orders@jamesandsons.in',
    currencySymbol: '₹',
    currencyCode: 'INR',
    defaultGstRate: 18.0,
    phone: '+91 9045 808115',
    address: 'Mohalla Peer Mattha, Dhobi Wali Gali, Parav Dubey, Aligarh, Uttar Pradesh, 202001',
    gstin: '09AABCJ8243A1ZX',
  },
};

/**
 * Loads system configurations by key. Upserts defaults if not created.
 */
export async function adminGetSystemConfig(key: string) {
  const p = prisma as any;

  // Try standard Prisma client model loader
  if (p.systemConfig) {
    try {
      let config = await p.systemConfig.findUnique({
        where: { key },
      });
      if (!config) {
        const defaultVal = DEFAULT_CONFIGS[key] || {};
        config = await p.systemConfig.create({
          data: {
            key,
            value: defaultVal,
          },
        });
      }
      return config.value as any;
    } catch (err) {
      console.warn('Prisma model load failed, falling back to raw query:', err);
    }
  }

  // Fallback to raw SQL queries to bypass stale in-memory Prisma client schemas
  try {
    const rawResult: any[] = await prisma.$queryRawUnsafe(
      `SELECT value FROM system_configs WHERE key = $1 LIMIT 1`,
      key
    );
    if (rawResult && rawResult.length > 0) {
      return rawResult[0].value;
    }

    // Upsert default values using raw SQL if empty
    const defaultVal = DEFAULT_CONFIGS[key] || {};
    const defaultValJson = JSON.stringify(defaultVal);
    await prisma.$executeRawUnsafe(
      `INSERT INTO system_configs (key, value, "createdAt", "updatedAt")
       VALUES ($1, $2::json, NOW(), NOW())
       ON CONFLICT (key) DO NOTHING`,
      key,
      defaultValJson
    );
    return defaultVal;
  } catch (err) {
    console.error('Raw queries read failed:', err);
    return DEFAULT_CONFIGS[key] || {};
  }
}

/**
 * Saves and validates configuration payloads.
 */
export async function adminSaveSystemConfig(key: string, data: any) {
  const p = prisma as any;

  // Try standard Prisma client model upsert
  if (p.systemConfig) {
    try {
      await p.systemConfig.upsert({
        where: { key },
        update: { value: data },
        create: { key, value: data },
      });
      revalidatePath('/account');
      return { success: true };
    } catch (err) {
      console.warn('Prisma model upsert failed, falling back to raw query:', err);
    }
  }

  // Fallback to raw SQL queries to bypass stale in-memory Prisma client schemas
  try {
    const valueJson = JSON.stringify(data);
    await prisma.$executeRawUnsafe(
      `INSERT INTO system_configs (key, value, "createdAt", "updatedAt")
       VALUES ($1, $2::json, NOW(), NOW())
       ON CONFLICT (key) 
       DO UPDATE SET value = $2::json, "updatedAt" = NOW()`,
      key,
      valueJson
    );
    revalidatePath('/account');
    return { success: true };
  } catch (err: any) {
    console.error('Raw query upsert failed:', err);
    throw new Error(err.message || 'Failed to save configuration');
  }
}

export async function adminTogglePagePublishStatus(id: string, currentStatus: boolean) {
  const p = prisma as any;
  await p.page.update({
    where: { id },
    data: { isPublished: !currentStatus }
  });
  revalidatePath('/account');
  return { success: true };
}
