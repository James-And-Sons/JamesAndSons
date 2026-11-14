import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import AffiliatesManagerClient from './AffiliatesManagerClient';

export const dynamic = 'force-dynamic';

async function getAffiliates() {
  const p = prisma as any;
  if (!p.affiliate) {
    console.error('Prisma Affiliate model is not initialized');
    return [];
  }
  return p.affiliate.findMany({
    orderBy: { totalRevenue: 'desc' },
  });
}

export default async function AffiliatesPage() {
  await requireAdmin();
  const affiliates = await getAffiliates();

  // Serialize dates to make the data pass clean to the Client component
  const serializedAffiliates = affiliates.map((a: any) => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  }));

  return (
    <AffiliatesManagerClient
      initialAffiliates={serializedAffiliates as any}
    />
  );
}
