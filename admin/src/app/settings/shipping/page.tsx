import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import ShippingRulesClient from './ShippingRulesClient';

export const dynamic = 'force-dynamic';

export default async function ShippingSettingsPage() {
  // Fetch global shipping rules, creating it if it doesn't exist
  let rule = await prisma.shippingRule.findUnique({
    where: { id: 'GLOBAL' }
  });

  if (!rule) {
    rule = await prisma.shippingRule.create({
      data: {
        id: 'GLOBAL',
        baseShippingLimit: 280.0,
        freeShippingThreshold: 380.0
      }
    });
  }

  // Server Action to update rules
  async function updateRulesAction(baseLimit: number, freeThreshold: number) {
    'use server';
    await prisma.shippingRule.upsert({
      where: { id: 'GLOBAL' },
      update: {
        baseShippingLimit: baseLimit,
        freeShippingThreshold: freeThreshold
      },
      create: {
        id: 'GLOBAL',
        baseShippingLimit: baseLimit,
        freeShippingThreshold: freeThreshold
      }
    });
    revalidatePath('/settings/shipping');
    return { success: true };
  }

  return (
    <div className="space-y-6">
      <div className="bg-surface p-6 border border-border flex justify-between items-center">
        <div>
          <h1 className="font-serif text-[28px] font-light text-primary tracking-wide m-0">Shipping & Pricing Strategy</h1>
          <p className="font-mono text-[10px] text-muted uppercase tracking-wider mt-1.5">Configure baked-in shipping rates and free shipping surcharges globally</p>
        </div>
      </div>

      <ShippingRulesClient 
        initialBaseLimit={rule.baseShippingLimit} 
        initialFreeThreshold={rule.freeShippingThreshold}
        updateRulesAction={updateRulesAction}
      />
    </div>
  );
}
