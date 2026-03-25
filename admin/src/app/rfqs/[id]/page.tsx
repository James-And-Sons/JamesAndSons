import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
export const dynamic = 'force-dynamic';
import QuoteBuilderForm from './QuoteBuilderForm';

function formatPriceInline(n: number): string {
  if (n >= 100000) return `₹${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)}L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

export default async function RFQDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const rfq = await prisma.rFQ.findUnique({
    where: { id: params.id },
    include: {
      user: { include: { company: true } },
      items: { include: { product: true } }
    }
  });

  if (!rfq) return notFound();

  return (
    <div className="space-y-6">
      <Link href="/rfqs" className="inline-flex items-center text-accent hover:text-white transition-colors font-mono text-[10px] uppercase tracking-[0.1em]">
        ← Back to Inbox
      </Link>

      <div className="bg-surface border border-border p-8">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="font-serif text-[28px] font-light text-primary tracking-wide m-0 mb-2">Quote Request</h1>
            <div className="font-mono text-[12px] text-accent tracking-[0.1em]">{rfq.rfqNumber}</div>
          </div>
          <span className={`font-mono text-[10px] uppercase tracking-[0.15em] px-3 py-1.5 rounded-sm border ${
            rfq.status === 'SUBMITTED' ? 'bg-[#1c1c21] text-accent border-[rgba(196,160,90,0.2)]'
            : rfq.status === 'APPROVED' ? 'bg-[#1a2e22] text-[#4ade80] border-[#4ade80]/20'
            : rfq.status === 'REJECTED' ? 'bg-[#2a1616] text-[#f87171] border-[#f87171]/20'
            : 'bg-[#16161a] text-secondary border-border'
          }`}>
            {rfq.status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-12 mb-10 pb-10 border-b border-border">
          <div>
            <h3 className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted mb-4 border-b border-border pb-2">Customer Details</h3>
            <p className="font-serif text-[20px] text-primary mb-1">{rfq.user.company?.name || `${rfq.user.firstName} ${rfq.user.lastName}`}</p>
            <p className="font-body text-[14px] text-secondary">{rfq.user.email}</p>
            {rfq.user.phone && <p className="font-body text-[14px] text-secondary mt-1">{rfq.user.phone}</p>}
            {rfq.user.company?.gstin && <p className="font-mono text-[11px] text-muted tracking-wide mt-3">GSTIN: {rfq.user.company.gstin}</p>}
          </div>

          <div>
            <h3 className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted mb-4 border-b border-border pb-2">Internal Notes</h3>
            <div className="bg-[#111114] border border-border p-4 h-full min-h-[100px]">
              {rfq.notes ? (
                <p className="font-body text-[14px] text-secondary italic leading-relaxed">"{rfq.notes}"</p>
              ) : (
                <p className="font-body text-[14px] text-muted">No notes provided by customer.</p>
              )}
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted mb-4">Line Items & Pricing</h3>
          
          <QuoteBuilderForm rfq={rfq} />
        </div>
      </div>
    </div>
  );
}
