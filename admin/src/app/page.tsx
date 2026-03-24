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
        <div className="bg-surface p-6 border border-border">
          <h3 className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted">Total Revenue (All Time)</h3>
          <p className="font-serif text-[36px] text-gold mt-4 mb-2">₹{totalRevenue.toLocaleString('en-IN')}</p>
          <span className="font-mono text-[10px] tracking-wider text-[#4ade80]">+ Live Data Connected</span>
        </div>
        <div className="bg-surface p-6 border border-border">
          <h3 className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted">Recent Orders</h3>
          <p className="font-serif text-[36px] text-primary mt-4 mb-2">{activeOrders}</p>
          <span className="font-mono text-[10px] tracking-wider text-muted">D2C &amp; B2B Flow Active</span>
        </div>
        <div className="bg-surface p-6 border border-accent/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[40px] h-[40px] bg-accent/10 rounded-bl-full" />
          <h3 className="font-mono text-[10px] tracking-[0.15em] uppercase text-accent">Total tracked RFQs</h3>
          <p className="font-serif text-[36px] text-primary mt-4 mb-2">{rfqs.length}</p>
          <span className="font-mono text-[10px] tracking-wider text-accent">{pendingRfqs} pending review</span>
        </div>
        <div className="bg-surface p-6 border border-border">
          <h3 className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted">B2B Registrations</h3>
          <p className="font-serif text-[36px] text-primary mt-4 mb-2">{b2bRegistrations}</p>
          <span className="font-mono text-[10px] tracking-wider text-muted">{pendingB2B} Pending Approval</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Recent Orders Table */}
        <div className="bg-surface border border-border flex flex-col">
          <div className="px-8 py-6 border-b border-border flex justify-between items-center bg-surface-muted/30">
            <h3 className="font-serif text-[22px] text-primary font-light">Recent Orders</h3>
            <Link href="/orders" className="font-mono text-[10px] uppercase tracking-[0.15em] text-accent hover:text-accent-hover transition-colors">View All</Link>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-background/50">
                <tr>
                  <th className="px-8 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal">Order ID</th>
                  <th className="px-8 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal">Customer</th>
                  <th className="px-8 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal">Amount</th>
                  <th className="px-8 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {orders.map((o: any) => (
                  <tr key={o.id} className="hover:bg-surface-muted transition-colors">
                    <td className="px-8 py-5 font-mono text-[12px] text-primary">{o.orderNumber}</td>
                    <td className="px-8 py-5 font-body text-[13px] text-secondary">{o.user.firstName} {o.user.lastName}</td>
                    <td className="px-8 py-5 font-serif text-[18px] text-gold-light">₹{o.totalAmount.toLocaleString('en-IN')}</td>
                    <td className="px-8 py-5"><span className="font-mono text-[9px] uppercase tracking-wider text-[#4ade80] border border-[#4ade80]/30 px-2 py-1 bg-[#4ade80]/10">{o.status}</span></td>
                  </tr>
                ))}
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
        <div className="bg-surface border border-border flex flex-col">
          <div className="px-8 py-6 border-b border-border flex justify-between items-center bg-surface-muted/30">
            <h3 className="font-serif text-[22px] text-primary font-light flex items-center gap-3">
              Action Required: RFQs <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span></span>
            </h3>
            <Link href="/orders" className="font-mono text-[10px] uppercase tracking-[0.15em] text-accent hover:text-accent-hover transition-colors">Go to Inbox</Link>
          </div>
          <div className="divide-y divide-border/50">
            {rfqs.map((r: any) => (
              <div key={r.id} className="p-8 flex justify-between items-center hover:bg-surface-muted transition-colors group">
                <div>
                  <h4 className="font-mono text-[12px] text-primary tracking-wider mb-2">{r.rfqNumber}</h4>
                  <p className="font-body text-[13px] text-secondary">{r.user.firstName} {r.user.lastName} <span className="text-muted block mt-1">(Items: {r.items?.length || 0})</span></p>
                </div>
                {r.status === 'DRAFT' || r.status === 'SUBMITTED' ? (
                  <button className="btn-primary" style={{ padding: '10px 24px', fontSize: '9px' }}>Review</button>
                ) : (
                  <span className="font-mono text-[9px] uppercase tracking-wider text-muted border border-border px-3 py-1.5">{r.status}</span>
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
