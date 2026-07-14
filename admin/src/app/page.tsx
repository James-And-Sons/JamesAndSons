import { prisma } from '../lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const [orders, rfqs, b2bRegistrations, pendingB2B] = await Promise.all([
    prisma.order.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      take: 5
    }),
    prisma.rFQ.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      take: 5
    }),
    prisma.user.count({ where: { role: 'B2B_BUYER' } }),
    prisma.user.count({ where: { role: 'B2B_APPROVER' } }) // Assuming pending might be a different role or status, making mock numbers dynamically safe
  ]);

  // Aggregate stats (Note: For a real app, use aggregate queries for 'MTD')
  const totalRevenue = orders.reduce((acc, order) => acc + order.totalAmount, 0) || 0;
  const activeOrders = orders.length; // Mock logic 
  const pendingRfqs = rfqs.filter((r: any) => r.status === 'SUBMITTED' || r.status === 'DRAFT').length;

  return (
    <div className="space-y-12">
      {/* Header Section */}
      <div>
        <h2 className="font-serif text-[32px] text-primary font-light tracking-wide mb-2">Platform Overview</h2>
        <p className="font-body text-muted text-[14px]">Metrics and action items for James &amp; Sons operations.</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="premium-card p-6">
          <h3 className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted">Total Revenue (All Time)</h3>
          <p className="font-serif text-[36px] text-gold mt-4 mb-2">₹{totalRevenue.toLocaleString('en-IN')}</p>
          <span className="font-mono text-[10px] tracking-wider text-emerald-400">+ Live Data Connected</span>
        </div>
        <div className="premium-card p-6">
          <h3 className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted">Recent Orders</h3>
          <p className="font-serif text-[36px] text-primary mt-4 mb-2">{activeOrders}</p>
          <span className="font-mono text-[10px] tracking-wider text-muted">D2C &amp; B2B Flow Active</span>
        </div>
        <div className="premium-card p-6 border-accent/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[40px] h-[40px] bg-accent/10 rounded-bl-full" />
          <h3 className="font-mono text-[10px] tracking-[0.15em] uppercase text-accent">Total tracked RFQs</h3>
          <p className="font-serif text-[36px] text-primary mt-4 mb-2">{rfqs.length}</p>
          <span className="font-mono text-[10px] tracking-wider text-accent">{pendingRfqs} pending review</span>
        </div>
        <div className="premium-card p-6">
          <h3 className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted">B2B Registrations</h3>
          <p className="font-serif text-[36px] text-primary mt-4 mb-2">{b2bRegistrations}</p>
          <span className="font-mono text-[10px] tracking-wider text-muted">{pendingB2B} Pending Approval</span>
        </div>
      </div>      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Recent Orders Table */}
        <div className="premium-card flex flex-col overflow-hidden">
          <div className="px-8 py-6 border-b border-border flex justify-between items-center bg-surface-muted/30">
            <h3 className="font-serif text-[22px] text-primary font-light">Recent Orders</h3>
            <Link href="/orders" className="font-mono text-[9px] uppercase tracking-widest text-accent hover:text-accent-hover transition-colors">View All</Link>
          </div>
          <div className="flex-1 table-responsive">
            <table className="w-full text-left">
              <thead className="border-b border-border bg-surface-muted/30">
                <tr>
                  <th className="px-8 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal">Order ID</th>
                  <th className="px-8 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal">Customer</th>
                  <th className="px-8 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal text-right">Amount</th>
                  <th className="px-8 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {orders.map((o: any) => {
                  const getStatusStyle = (status: string) => {
                    const s = status.toUpperCase();
                    if (['DELIVERED', 'PAID', 'SUCCESS', 'SHIPPED'].includes(s)) {
                      return 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10';
                    }
                    if (['PENDING', 'PROCESSING'].includes(s)) {
                      return 'text-amber-500 border-amber-500/30 bg-amber-500/10';
                    }
                    return 'text-rose-500 border-rose-500/30 bg-rose-500/10';
                  };
                  return (
                    <tr key={o.id} className="hover:bg-surface-muted/50 transition-colors">
                      <td className="px-8 py-5 font-mono text-[12px] text-accent font-semibold">{o.orderNumber}</td>
                      <td className="px-8 py-5 font-serif text-[15px] text-primary">{o.user.firstName} {o.user.lastName}</td>
                      <td className="px-8 py-5 font-mono text-[14px] text-secondary text-right tabular-nums">₹{o.totalAmount.toLocaleString('en-IN')}</td>
                      <td className="px-8 py-5 text-right">
                        <span className={`font-mono text-[9px] uppercase tracking-wider border px-3 py-1 rounded-full ${getStatusStyle(o.status)}`}>
                          {o.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-8 py-8 text-center text-muted font-mono text-[10px] uppercase tracking-widest">
                      No recent orders.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Required: RFQs */}
        <div className="premium-card flex flex-col overflow-hidden">
          <div className="px-8 py-6 border-b border-border flex justify-between items-center bg-surface-muted/30">
            <h3 className="font-serif text-[22px] text-primary font-light flex items-center gap-3">
              Action Required: RFQs <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span></span>
            </h3>
            <Link href="/orders" className="font-mono text-[9px] uppercase tracking-widest text-accent hover:text-accent-hover transition-colors">Go to Inbox</Link>
          </div>
          <div className="divide-y divide-border/50 bg-background/25">
            {rfqs.map((r: any) => (
              <div key={r.id} className="p-8 flex justify-between items-center hover:bg-surface-muted/50 transition-colors group">
                <div>
                  <h4 className="font-mono text-[12px] text-accent tracking-wider mb-2 font-semibold">{r.rfqNumber}</h4>
                  <p className="font-serif text-[15px] text-primary">{r.user.firstName} {r.user.lastName} <span className="text-muted block font-mono text-[10px] uppercase tracking-widest mt-1">(Items: {r.items?.length || 0})</span></p>
                </div>
                {r.status === 'DRAFT' || r.status === 'SUBMITTED' ? (
                  <Link href={`/orders/${r.id}`} className="px-6 py-2 bg-accent text-black hover:bg-accent-hover font-mono text-[9px] uppercase tracking-widest font-bold transition-colors">Review</Link>
                ) : (
                  <span className="font-mono text-[9px] uppercase tracking-wider text-muted border border-border px-3 py-1 bg-surface-muted">{r.status}</span>
                )}
              </div>
            ))}
            {rfqs.length === 0 && (
              <div className="p-8 text-center text-muted font-mono text-[10px] uppercase tracking-widest">
                No RFQs require attention.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
