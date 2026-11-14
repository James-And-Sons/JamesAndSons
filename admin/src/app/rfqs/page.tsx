import { prisma } from '@/lib/prisma';
import RfqsTableClient from './RfqsTableClient';

export const dynamic = 'force-dynamic';

export default async function RFQsPage() {
  const rfqs = await prisma.rFQ.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        include: { company: true }
      },
      items: true
    }
  });

  return <RfqsTableClient rfqs={rfqs} />;
}
