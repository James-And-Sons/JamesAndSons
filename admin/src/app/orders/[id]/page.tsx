import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import OrderStatusControls from './OrderStatusControls';

function formatPrice(n: number): string {
  if (n >= 100000) return `₹${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)}L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

const STATUS_STEPS = ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

export default async function OrderDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      user: { include: { company: true } },
      items: { include: { product: true } }
    }
  });

  if (!order) return notFound();

  const currentStatusIdx = STATUS_STEPS.indexOf(order.status);

  return (
    <div className="space-y-6">
      <Link href="/orders" className="inline-flex items-center text-accent hover:text-white transition-colors font-mono text-[10px] uppercase tracking-[0.1em]">
        ← Back to Orders
      </Link>

      <div className="flex justify-between items-start bg-surface border border-border p-6">
        <div>
          <h1 className="font-mono text-[22px] text-primary tracking-[0.05em] m-0">{order.orderNumber}</h1>
          <p className="font-body text-secondary text-[13px] mt-1">{new Date(order.createdAt).toLocaleDateString('en-US', { dateStyle: 'full' })}</p>
        </div>
        <span className={`font-mono text-[10px] uppercase tracking-[0.15em] px-3 py-1.5 border ${
          order.status === 'DELIVERED' ? 'bg-[#1a2e22] text-[#4ade80] border-[#4ade80]/20'
          : order.status === 'SHIPPED' ? 'bg-[#1a2030] text-[#60a5fa] border-[#60a5fa]/20'
          : order.status === 'PAID' || order.status === 'PROCESSING' ? 'bg-[#1c1c21] text-accent border-[rgba(196,160,90,0.2)]'
          : 'bg-[#16161a] text-secondary border-border'
        }`}>
          {order.status.replace('_', ' ')}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="bg-surface border border-border p-6">
        <h3 className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted mb-6">Order Progress</h3>
        <div className="flex items-center gap-0">
          {STATUS_STEPS.map((status, idx) => (
            <div key={status} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-mono transition-colors ${
                  idx <= currentStatusIdx ? 'border-accent bg-accent/20 text-accent' : 'border-border bg-background text-muted'
                }`}>
                  {idx < currentStatusIdx ? '✓' : idx + 1}
                </div>
                <span className="font-mono text-[8px] uppercase tracking-widest text-muted mt-2 text-center">{status.replace('_', ' ')}</span>
              </div>
              {idx < STATUS_STEPS.length - 1 && (
                <div className={`flex-1 h-px mx-2 mb-5 transition-colors ${idx < currentStatusIdx ? 'bg-accent' : 'bg-border'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Customer */}
        <div className="bg-surface border border-border p-6">
          <h3 className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted mb-4 border-b border-border pb-2">Customer</h3>
          <p className="font-serif text-[18px] text-primary">{order.user.firstName} {order.user.lastName}</p>
          <p className="font-body text-[13px] text-secondary mt-1">{order.user.email}</p>
          {order.user.phone && <p className="font-body text-[13px] text-secondary">{order.user.phone}</p>}
          {order.user.company && <p className="font-mono text-[11px] text-accent mt-2">{order.user.company.name}</p>}
        </div>

        {/* Shipping */}
        <div className="bg-surface border border-border p-6">
          <h3 className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted mb-4 border-b border-border pb-2">Shipping Address</h3>
          <p className="font-body text-[13px] text-secondary leading-relaxed">{order.shippingAddress}</p>
          {order.trackingNumber && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted mb-1">Tracking</p>
              <p className="font-mono text-[13px] text-accent">{order.trackingNumber}</p>
              {order.awbNumber && <p className="font-mono text-[11px] text-secondary mt-1">AWB: {order.awbNumber}</p>}
            </div>
          )}
        </div>

        {/* Financials */}
        <div className="bg-surface border border-border p-6">
          <h3 className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted mb-4 border-b border-border pb-2">Financials</h3>
          <div className="space-y-2">
            {[
              ['Subtotal', formatPrice(order.totalAmount - order.taxAmount - order.shippingAmount)],
              ['Tax', formatPrice(order.taxAmount)],
              ['Shipping', order.shippingAmount === 0 ? 'Free' : formatPrice(order.shippingAmount)],
            ].map(([l, v]) => (
              <div key={l} className="flex justify-between font-mono text-[11px] text-muted">
                <span>{l}</span><span>{v}</span>
              </div>
            ))}
            <div className="flex justify-between font-serif text-[20px] text-accent pt-3 border-t border-border">
              <span>Total</span><span>{formatPrice(order.totalAmount)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="bg-surface border border-border overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted">Order Items ({order.items.length})</h3>
        </div>
        <table className="w-full text-left">
          <thead className="border-b border-border text-muted">
            <tr>
              <th className="py-3 px-6 font-mono text-[9px] uppercase tracking-[0.15em] font-normal">Product</th>
              <th className="py-3 px-6 font-mono text-[9px] uppercase tracking-[0.15em] font-normal">SKU</th>
              <th className="py-3 px-6 font-mono text-[9px] uppercase tracking-[0.15em] font-normal">Qty</th>
              <th className="py-3 px-6 font-mono text-[9px] uppercase tracking-[0.15em] font-normal">Unit Price</th>
              <th className="py-3 px-6 font-mono text-[9px] uppercase tracking-[0.15em] font-normal text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map(item => (
              <tr key={item.id} className="border-b border-border">
                <td className="py-4 px-6 font-serif text-[16px] text-primary">{item.product.name}</td>
                <td className="py-4 px-6 font-mono text-[11px] text-muted">{item.product.sku}</td>
                <td className="py-4 px-6 font-mono text-[13px] text-primary">{item.quantity}</td>
                <td className="py-4 px-6 font-mono text-[13px] text-secondary">{formatPrice(item.unitPrice)}</td>
                <td className="py-4 px-6 font-serif text-[16px] text-accent text-right">{formatPrice(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Status Controls */}
      <OrderStatusControls orderId={order.id} currentStatus={order.status} />
    </div>
  );
}
