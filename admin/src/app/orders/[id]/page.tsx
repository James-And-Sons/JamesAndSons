import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import OrderStatusControls from "./OrderStatusControls";
import EditableShippingAddress from "./EditableShippingAddress";

function formatPrice(n: number): string {
  return `₹${n.toLocaleString("en-IN")}`;
}

const STATUS_STEPS = ["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED"];

export default async function OrderDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      user: { include: { company: true } },
      items: { include: { product: true } },
    },
  });

  if (!order) return notFound();

  const currentStatusIdx = STATUS_STEPS.indexOf(order.status);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* ── Navigation ────────────────────────────────────────────────────── */}
      <div className="flex justify-between items-center">
        <Link
          href="/orders"
          className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-accent hover:underline transition-colors"
        >
          ← Back to All Orders
        </Link>
        <span className="font-mono text-[10px] text-muted uppercase tracking-wider">
          Created {new Date(order.createdAt).toLocaleString("en-IN")}
        </span>
      </div>

      {/* ── Order Header Banner ───────────────────────────────────────────── */}
      <div className="bg-surface border border-border p-6 rounded-sm shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-[26px] font-light text-primary tracking-wide m-0">
              {order.orderNumber}
            </h1>
            {order.channel === "AMAZON" ? (
              <span className="px-2.5 py-1 bg-orange-500/10 border border-orange-500/30 text-orange-400 font-mono text-[9px] uppercase tracking-wider rounded-xs font-semibold">
                ▲ Amazon Order
              </span>
            ) : order.channel === "B2B" ? (
              <span className="px-2.5 py-1 bg-purple-500/10 border border-purple-500/30 text-purple-400 font-mono text-[9px] uppercase tracking-wider rounded-xs font-semibold">
                🏢 B2B Order
              </span>
            ) : (
              <span className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-400 font-mono text-[9px] uppercase tracking-wider rounded-xs font-semibold">
                🛍️ D2C Storefront
              </span>
            )}
          </div>
          <p className="font-mono text-[11px] text-muted mt-1.5 m-0">
            Internal DB ID: {order.id}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`font-mono text-[10px] uppercase tracking-[0.15em] px-4 py-2 border rounded-xs font-bold ${
              order.status === "DELIVERED"
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                : order.status === "SHIPPED"
                  ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                  : order.status === "PAID" || order.status === "PROCESSING"
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                    : "bg-surface text-muted border-border"
            }`}
          >
            ● {order.status.replace("_", " ")}
          </span>
        </div>
      </div>

      {/* ── Visual Status Progress Tracker ────────────────────────────────── */}
      <div className="bg-surface border border-border p-6 rounded-sm">
        <h3 className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted mb-6">
          Order Lifecycle Status
        </h3>
        <div className="overflow-x-auto pb-2">
          <div className="flex items-center gap-0 min-w-[500px]">
            {STATUS_STEPS.map((status, idx) => (
              <div key={status} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-mono transition-all ${
                      idx <= currentStatusIdx
                        ? "border-accent bg-accent/20 text-accent font-bold shadow-md"
                        : "border-border bg-background text-muted"
                    }`}
                  >
                    {idx < currentStatusIdx ? "✓" : idx + 1}
                  </div>
                  <span className="font-mono text-[8px] uppercase tracking-widest text-muted mt-2 text-center font-medium">
                    {status.replace("_", " ")}
                  </span>
                </div>
                {idx < STATUS_STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 mb-5 transition-colors ${idx < currentStatusIdx ? "bg-accent" : "bg-border"}`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Status Controls & Pickup Dispatch ──────────────────────────────── */}
      <OrderStatusControls
        orderId={order.id}
        currentStatus={order.status}
        trackingNumber={order.trackingNumber}
        awbNumber={order.awbNumber}
        razorpayPaymentId={order.razorpayPaymentId}
        razorpayOrderId={order.razorpayOrderId}
        amazonOrderId={order.amazonOrderId}
        isAmazon={order.channel === "AMAZON"}
        orderItems={order.items.map((i) => ({
          id: i.id,
          quantity: i.quantity,
          product: {
            name: i.product.name,
            sku: i.product.sku,
            weight: i.product.weight,
            length: i.product.length,
            breadth: i.product.breadth,
            height: i.product.height,
          },
        }))}
      />

      {/* ── Customer & Logistics Details Grid ─────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Customer Info */}
        <div className="bg-surface border border-border p-6 rounded-sm">
          <h3 className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted mb-4 border-b border-border pb-2">
            👤 Customer Information
          </h3>
          <p className="font-serif text-[18px] text-primary font-medium m-0">
            {order.user.firstName} {order.user.lastName}
          </p>
          <p className="font-mono text-[11px] text-muted mt-1 break-all">
            {order.user.email}
          </p>
          {order.user.phone && (
            <p className="font-mono text-[11px] text-muted mt-0.5">
              📞 {order.user.phone}
            </p>
          )}
          {order.user.company && (
            <div className="mt-3 pt-3 border-t border-border">
              <span className="font-mono text-[9px] uppercase tracking-wider text-accent block mb-1">
                Company
              </span>
              <p className="font-serif text-[15px] text-primary m-0">
                {order.user.company.name}
              </p>
              {order.user.company.gstin && (
                <p className="font-mono text-[10px] text-muted mt-0.5">
                  GSTIN: {order.user.company.gstin}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Shipping Address */}
        <div className="bg-surface border border-border p-6 rounded-sm">
          <h3 className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted mb-4 border-b border-border pb-2">
            📍 Delivery Address
          </h3>
          <EditableShippingAddress
            orderId={order.id}
            initialAddress={order.shippingAddress}
            initialPhone={order.shippingPhone}
            status={order.status}
          />
        </div>

        {/* Financial Summary */}
        <div className="bg-surface border border-border p-6 rounded-sm">
          <h3 className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted mb-4 border-b border-border pb-2">
            💰 Financial Summary
          </h3>
          <div className="space-y-2.5">
            {[
              [
                "Subtotal",
                formatPrice(
                  order.totalAmount - order.taxAmount - order.shippingAmount,
                ),
              ],
              ["GST Tax", formatPrice(order.taxAmount)],
              [
                "Shipping Fee",
                order.shippingAmount === 0
                  ? "FREE"
                  : formatPrice(order.shippingAmount),
              ],
            ].map(([l, v]) => (
              <div
                key={l}
                className="flex justify-between font-mono text-[11px] text-muted"
              >
                <span>{l}</span>
                <span>{v}</span>
              </div>
            ))}
            <div className="flex justify-between font-serif text-[22px] text-accent pt-3 border-t border-border font-light">
              <span>Total Value</span>
              <span>{formatPrice(order.totalAmount)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Line Items Table ──────────────────────────────────────────────── */}
      <div className="bg-surface border border-border rounded-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-border flex justify-between items-center">
          <h3 className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted m-0">
            Order Items ({order.items.length})
          </h3>
          <span className="font-mono text-[8px] uppercase tracking-widest text-muted hidden sm:inline-block">
            Click product to view on storefront ↗
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[550px]">
            <thead className="border-b border-border text-muted bg-background/50">
              <tr>
                <th className="py-3.5 px-6 font-mono text-[9px] uppercase tracking-[0.15em] font-normal">
                  Product
                </th>
                <th className="py-3.5 px-6 font-mono text-[9px] uppercase tracking-[0.15em] font-normal">
                  SKU
                </th>
                <th className="py-3.5 px-6 font-mono text-[9px] uppercase tracking-[0.15em] font-normal">
                  Qty
                </th>
                <th className="py-3.5 px-6 font-mono text-[9px] uppercase tracking-[0.15em] font-normal">
                  Unit Price
                </th>
                <th className="py-3.5 px-6 font-mono text-[9px] uppercase tracking-[0.15em] font-normal text-right">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {order.items.map((item) => {
                const imageUrl = item.product.images?.[0];
                const storefrontProductUrl = `${process.env.NEXT_PUBLIC_STOREFRONT_URL || "https://jamesandsons.in"}/products/${item.product.slug}`;
                return (
                  <tr
                    key={item.id}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-4 px-6">
                      <a
                        href={storefrontProductUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3.5 group/prod text-left"
                      >
                        <div className="w-12 h-12 rounded border border-border/80 bg-background overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={item.product.name}
                              className="w-full h-full object-cover group-hover/prod:scale-105 transition-transform duration-200"
                            />
                          ) : (
                            <span className="text-[18px]">💡</span>
                          )}
                        </div>
                        <div>
                          <p className="font-serif text-[15px] text-primary group-hover/prod:text-accent transition-colors m-0 flex items-center gap-1.5 font-medium">
                            {item.product.name}
                            <span className="font-mono text-[10px] text-accent opacity-0 group-hover/prod:opacity-100 transition-opacity">
                              ↗
                            </span>
                          </p>
                          {item.product.dimensions && (
                            <p className="font-mono text-[10px] text-muted m-0 mt-0.5">
                              {item.product.dimensions}
                            </p>
                          )}
                        </div>
                      </a>
                    </td>
                    <td className="py-4 px-6 font-mono text-[11px] text-muted">
                      {item.product.sku}
                    </td>
                    <td className="py-4 px-6 font-mono text-[13px] text-primary font-semibold">
                      {item.quantity}
                    </td>
                    <td className="py-4 px-6 font-mono text-[13px] text-muted">
                      ₹{item.unitPrice.toLocaleString("en-IN")}
                    </td>
                    <td className="py-4 px-6 font-mono text-[14px] text-primary font-bold text-right">
                      ₹
                      {(item.quantity * item.unitPrice).toLocaleString("en-IN")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
