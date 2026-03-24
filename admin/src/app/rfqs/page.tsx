import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

function formatPriceInline(n: number): string {
  if (n >= 100000) return `₹${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)}L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-surface p-6 border border-border">
        <div>
          <h1 className="font-serif text-[28px] font-light text-primary tracking-wide m-0">RFQ Inbox</h1>
          <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted mt-2">
            {rfqs.length} quotation requests
          </p>
        </div>
      </div>

      <div className="bg-surface border border-border overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-[#16161a]">
              <th className="py-4 px-6 font-mono text-[10px] uppercase tracking-[0.15em] text-muted font-normal">RFQ ID / Date</th>
              <th className="py-4 px-6 font-mono text-[10px] uppercase tracking-[0.15em] text-muted font-normal">Customer</th>
              <th className="py-4 px-6 font-mono text-[10px] uppercase tracking-[0.15em] text-muted font-normal">Items</th>
              <th className="py-4 px-6 font-mono text-[10px] uppercase tracking-[0.15em] text-muted font-normal">Status</th>
              <th className="py-4 px-6 font-mono text-[10px] uppercase tracking-[0.15em] text-muted font-normal text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {rfqs.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center">
                  <p className="font-serif text-[18px] text-secondary">No quotation requests found</p>
                </td>
              </tr>
            ) : (
              rfqs.map(rfq => (
                <tr key={rfq.id} className="border-b border-border hover:bg-[#1a1a1f] transition-colors">
                  <td className="py-4 px-6">
                    <div className="font-mono text-[12px] text-primary mb-1">{rfq.rfqNumber}</div>
                    <div className="font-body text-[12px] text-muted">{new Date(rfq.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="font-serif text-[16px] text-primary">{rfq.user.company?.name || `${rfq.user.firstName} ${rfq.user.lastName}`}</div>
                    <div className="font-body text-[12px] text-muted mt-1">{rfq.user.email}</div>
                  </td>
                  <td className="py-4 px-6 font-mono text-[12px] text-primary">
                    {rfq.items.reduce((acc, curr) => acc + curr.quantity, 0)} units
                  </td>
                  <td className="py-4 px-6">
                    <span className={`font-mono text-[9px] uppercase tracking-[0.15em] px-2 py-1 rounded-sm border ${
                      rfq.status === 'SUBMITTED' ? 'bg-[#1c1c21] text-accent border-[rgba(196,160,90,0.2)]'
                      : rfq.status === 'APPROVED' ? 'bg-[#1a2e22] text-[#4ade80] border-[#4ade80]/20'
                      : rfq.status === 'REJECTED' ? 'bg-[#2a1616] text-[#f87171] border-[#f87171]/20'
                      : 'bg-[#16161a] text-secondary border-border'
                    }`}>
                      {rfq.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <Link href={`/rfqs/${rfq.id}`} className="font-mono text-[10px] uppercase tracking-[0.1em] text-accent hover:text-white transition-colors">
                      View Request →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
