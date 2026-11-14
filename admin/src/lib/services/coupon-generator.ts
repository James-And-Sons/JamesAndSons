import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

/**
 * Generates an 8-character uppercase alphanumeric unique coupon code.
 * Format: 8 characters, e.g., 'DWL9X2K7'
 */
export function generateUniqueCode(prefix: string = ''): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Omit easily confused characters: 0, 1, I, O
  let code = prefix.toUpperCase().substring(0, 3);
  const neededLength = 8 - code.length;
  
  const randomBytes = crypto.randomBytes(neededLength);
  for (let i = 0; i < neededLength; i++) {
    code += chars[randomBytes[i] % chars.length];
  }
  
  return code;
}

/**
 * Batch generates unique 8-character single-use dynamic coupons for a list of customer IDs.
 */
export async function batchGenerateDynamicCoupons({
  campaignId,
  customerIds,
  discountValue = 15,
  expiresAt,
  codePrefix = ''
}: {
  campaignId: string;
  customerIds: string[];
  discountValue?: number;
  expiresAt: Date;
  codePrefix?: string;
}) {
  const couponsToCreate: {
    campaignId: string;
    customerId: string | null;
    uniqueCode: string;
    discountValue: number;
    expiresAt: Date;
  }[] = [];

  const generatedCodes = new Set<string>();

  // Ensure unique code generation without collision
  for (const customerId of customerIds) {
    let attempts = 0;
    let code = '';
    while (attempts < 10) {
      code = generateUniqueCode(codePrefix);
      if (!generatedCodes.has(code)) {
        // Check database uniqueness if needed
        generatedCodes.add(code);
        break;
      }
      attempts++;
    }

    couponsToCreate.push({
      campaignId,
      customerId,
      uniqueCode: code,
      discountValue,
      expiresAt
    });
  }

  // Create coupons in database
  const created = await prisma.dynamicCoupon.createMany({
    data: couponsToCreate,
    skipDuplicates: true
  });

  return {
    count: created.count,
    sampleCodes: Array.from(generatedCodes).slice(0, 5)
  };
}
