import { prisma } from '../../lib/prisma';
import Link from 'next/link';
import OrderActionsClient from './OrderActionsClient';
import ClickableRow from '@/components/ClickableRow';

export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
  const [orders, rfqs] = await Promise.all([
    prisma.order.findMany({
      include: { user: { include: { company: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.rFQ.findMany({
      include: { user: { include: { company: true } } },
      orderBy: { createdAt: 'desc' },
    })
  ]);

  // Normalize into a single list
  const combinedRecords = [
    ...orders.map((o: any) => ({
      id: o.id,
      displayId: o.orderNumber,
      date: o.createdAt,
      customerName: o.user.firstName + ' ' + o.user.lastName,
      company: o.user.company?.name || null,
      email: o.user.email,
      totalValue: o.totalAmount,
      type: 'D2C' as const,
      status: o.status,
    })),
    ...rfqs.map((r: any) => ({
      id: r.id,
      displayId: r.rfqNumber,
      date: r.createdAt,
      customerName: r.user.firstName + ' ' + r.user.lastName,
      company: r.user.company?.name || null,
      email: r.user.email,
      totalValue: 0, // RFQ total is calculated during quote
      type: 'B2B RFQ' as const,
      status: r.status,
    }))
  ].sort((a: any, b: any) => b.date.getTime() - a.date.getTime());

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center premium-card p-6">
        <div>
          <h1 className="font-serif text-[28px] font-light text-primary tracking-wide m-0">Orders &amp; RFQs</h1>
          <p className="font-mono text-[9px] uppercase tracking-widest text-muted mt-2">Manage incoming payments, shipping logs and business RFQs</p>
        </div>
        <OrderActionsClient data={combinedRecords} />
      </div>

      <div className="premium-card flex flex-col overflow-hidden">
        <div className="p-6 border-b border-border flex gap-4 bg-surface-muted/30">
          <input 
            type="text" 
            placeholder="Search by Order ID, Customer, or Email..." 
            className="w-1/3 px-4 py-2.5 border border-border bg-background text-primary font-body text-[13px] focus:outline-none focus:border-accent transition-colors placeholder:text-muted/50"
          />
          <select className="px-5 py-3 border border-border bg-background text-secondary font-mono text-[11px] uppercase tracking-widest focus:outline-none focus:border-accent transition-colors cursor-pointer">
            <option>All Statuses</option>
            <option>Pending</option>
            <option>Processing</option>
            <option>Shipped</option>
            <option>Delivered</option>
          </select>
          <select className="px-5 py-3 border border-border bg-background text-secondary font-mono text-[11px] uppercase tracking-widest focus:outline-none focus:border-accent transition-colors cursor-pointer">
            <option>All Types</option>
            <option>B2B Orders</option>
            <option>D2C Orders</option>
            <option>RFQs</option>
          </select>
        </div>

        <div className="flex-1 table-responsive">
          <table className="w-full text-left">
            <thead className="border-b border-border bg-surface-muted/30">
              <tr>
                <th className="px-8 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal">Order/RFQ ID</th>
                <th className="px-8 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal">Date</th>
                <th className="px-8 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal">Customer / Company</th>
                <th className="px-8 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal text-right">Total Value</th>
                <th className="px-8 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal">Type</th>
                <th className="px-8 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal">Status</th>
                <th className="px-8 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {combinedRecords.map((record) => {
                const getStatusStyle = (status: string) => {
                  const s = status.toUpperCase();
                  if (['DELIVERED', 'APPROVED', 'PAID', 'SUCCESS', 'SHIPPED', 'QUOTE_SENT'].includes(s)) {
                    return 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10';
                  }
                  if (['PENDING', 'PROCESSING', 'UNDER_REVIEW', 'SUBMITTED'].includes(s)) {
                    return 'text-amber-500 border-amber-500/30 bg-amber-500/10';
                  }
                  if (['CANCELLED', 'REJECTED', 'EXPIRED', 'REFUNDED', 'FAILED'].includes(s)) {
                    return 'text-rose-500 border-rose-500/30 bg-rose-500/10';
                  }
                  return 'text-muted border-border bg-surface-muted';
                };

                const isRFQ = record.type === 'B2B RFQ';
                const typeColor = isRFQ ? 'text-purple-400 border-purple-400/30 bg-purple-400/10' : 'text-sky-400 border-sky-400/30 bg-sky-400/10';
                
                return (
                  <ClickableRow key={record.id} href={`/orders/${record.id}`}>
                    <td className="px-8 py-5 font-mono text-[12px] text-accent font-semibold">{record.displayId}</td>
                    <td className="px-8 py-5 font-mono text-[12px] text-secondary">
                      {record.date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-8 py-5">
                      <div className="font-serif text-[16px] text-primary">{record.company || record.customerName}</div>
                      <div className="font-mono text-[10px] text-muted mt-1 tracking-wider">{record.email}</div>
                    </td>
                    <td className="px-8 py-5 font-mono text-[14px] text-secondary text-right tabular-nums font-semibold">
                      {isRFQ ? (
                        <span className="text-[11px] text-muted font-mono uppercase tracking-widest">— (Pending Quote)</span>
                      ) : (
                        `₹${record.totalValue.toLocaleString('en-IN')}`
                      )}
                    </td>
                    <td className="px-8 py-5">
                      <span className={`font-mono text-[9px] uppercase tracking-wider border px-3 py-1 rounded-full ${typeColor}`}>
                        {record.type}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`font-mono text-[9px] uppercase tracking-wider border px-3 py-1 rounded-full ${getStatusStyle(record.status)}`}>
                        {record.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <Link href={`/orders/${record.id}`} className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted hover:text-white transition-colors">
                        {isRFQ ? 'Review' : 'View Details →'}
                      </Link>
                    </td>
                  </ClickableRow>
                );
              })}
              
              {combinedRecords.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-8 py-8 text-center text-muted font-mono text-[10px] uppercase tracking-widest">
                    No orders or RFQs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-6 border-t border-border flex justify-between items-center bg-background/50">
          <span className="font-mono text-[9px] tracking-wider text-muted">Showing 1 to {combinedRecords.length} of {combinedRecords.length} entries</span>
          <div className="flex gap-2">
            <button className="px-4 py-2 border border-border text-[9px] font-mono tracking-widest uppercase text-muted bg-background disabled:opacity-50" disabled>Prev</button>
            <button className="px-4 py-2 border border-border text-[9px] font-mono tracking-widest uppercase text-muted bg-background disabled:opacity-50" disabled>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
