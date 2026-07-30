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
  if (!p.systemConfig) {
    console.error('SystemConfig Prisma model is not initialized');
    return DEFAULT_CONFIGS[key] || {};
  }

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
}

/**
 * Saves and validates configuration payloads.
 */
export async function adminSaveSystemConfig(key: string, data: any) {
  const p = prisma as any;
  if (!p.systemConfig) {
    throw new Error('SystemConfig Prisma model is not initialized');
  }

  await p.systemConfig.upsert({
    where: { key },
    update: { value: data },
    create: { key, value: data },
  });

  revalidatePath('/account');
  return { success: true };
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
