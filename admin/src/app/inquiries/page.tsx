import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import InquiriesDashboard from './InquiriesDashboard';

export const dynamic = 'force-dynamic';

export default async function InquiriesPage() {
  await requireAdmin();

  const inquiries = await prisma.inquiry.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center premium-card p-6">
        <div>
          <h1 className="font-serif text-[28px] font-light text-primary tracking-wide m-0">Inquiries & Leads</h1>
          <p className="font-mono text-[9px] uppercase tracking-widest text-muted mt-2">
            Inbound business, sales & partnership requests from connect@ and sales@
          </p>
        </div>
      </div>
      <InquiriesDashboard initialInquiries={inquiries as any} />
    </div>
  );
}
