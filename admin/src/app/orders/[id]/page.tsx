import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  User,
  MapPin,
  CreditCard,
  Package,
  Phone,
  Mail,
  ExternalLink,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  RotateCcw,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";
import OrderStatusControls from "./OrderStatusControls";
import EditableShippingAddress from "./EditableShippingAddress";
import { requireAdmin } from "@/lib/auth";
import CustomerAddressEditor from "./CustomerAddressEditor";
import OrderSidebarSync from "./OrderSidebarSync";

function formatPrice(n: number): string {
  return `₹${n.toLocaleString("en-IN")}`;
}

const STATUS_STEPS = ["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED"];

const STATUS_ICONS: Record<string, any> = {
  PENDING: Clock,
  PAID: CreditCard,
  PROCESSING: RefreshCw,
  SHIPPED: Truck,
  DELIVERED: CheckCircle2,
  CANCELLED: XCircle,
  RETURNED: RotateCcw,
};

export default async function OrderDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin("orders");
  const params = await props.params;
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      orderNumber: true,
      invoiceNumber: true,
      status: true,
      channel: true,
      createdAt: true,
      totalAmount: true,
      taxAmount: true,
      shippingAmount: true,
      discountAmount: true,
      trackingNumber: true,
      awbNumber: true,
      razorpayPaymentId: true,
      razorpayOrderId: true,
      amazonOrderId: true,
      amazonOrderStatus: true,
      amazonFulfillmentType: true,
      shippingAddress: true,
      shippingCity: true,
      shippingState: true,
      shippingPincode: true,
      shippingPhone: true,
      companyName: true,
      gstin: true,
      fulfillmentError: true,
      // Per-order recipient fields — never shared across orders (critical for Amazon)
      recipientName: true,
      recipientEmail: true,
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          company: {
            select: {
              name: true,
              gstin: true,
            },
          },
        },
      },
      items: {
        select: {
          id: true,
          quantity: true,
          unitPrice: true,
          product: {
            select: {
              name: true,
              slug: true,
              sku: true,
              dimensions: true,
              images: true,
              weight: true,
              length: true,
              breadth: true,
              height: true,
            },
          },
        },
      },
    },
  });

  if (!order) return notFound();

  const currentStatusIdx = STATUS_STEPS.indexOf(order.status);
  const isAmazonOrder =
    order.channel === "AMAZON" || Boolean(order.amazonOrderId);

  // Amazon order type detection:
  // Easy Ship = Amazon ATS handles pickup & delivery (needs Easy Ship booking)
  // MFN / Self-Ship = We ship ourselves via Shiprocket and push AWB to Amazon SP-API
  // amazonOrderStatus "Unshipped" with no awbNumber = unshipped, could be either type
  // Heuristic: if the order was marked via Easy Ship API or has amazon-specific slot data → Easy Ship
  // For now we use a field or env toggle; when SP-API gives us fulfillmentChannel we'll use that.
  // "AFN" = Amazon fulfilled (FBA), "MFN" = Merchant fulfilled (self-ship or easy-ship)
  // Easy Ship is always MFN but with ATS pickup. We can't distinguish without SP-API data yet.
  // Safe default: show both sections; user picks the right one.
  // When SP-API gives us fulfillmentChannel we pass it in:
  const isEasyShipOrder = isAmazonOrder; // Will be refined when SP-API provides fulfillmentChannel
  const isMFNOrder = isAmazonOrder; // Amazon MFN (Self-Ship) includes both Easy Ship and manual ship

  // ── Display name/email resolution (per-order fields take precedence) ──────
  // recipientName is written per-order (never shared). Use it first.
  // Fall back to real user name for D2C orders. Never show placeholder strings.
  function isPlaceholderName(n?: string | null) {
    if (!n) return true;
    return (
      n.includes("Amazon") ||
      n.includes("Marketplace") ||
      n.includes("Not Authorized") ||
      n.trim() === ""
    );
  }
  function isPlaceholderEmail(e?: string | null) {
    if (!e) return true;
    return e.startsWith("amazon-") || e.includes("amazon-marketplace");
  }

  const userFullName =
    `${order.user.firstName || ""} ${order.user.lastName || ""}`.trim();
  const displayName =
    order.recipientName ||
    (!isPlaceholderName(userFullName) ? userFullName : null) ||
    null;

  const displayEmail =
    order.recipientEmail ||
    (!isPlaceholderEmail(order.user.email) ? order.user.email : null) ||
    null;

  const displayPhone =
    order.shippingPhone ||
    (!isPlaceholderEmail(order.user.email) ? order.user.phone : null) ||
    null;

  const hasRecipient = Boolean(order.recipientName);
  // ──────────────────────────────────────────────────────────────────────────

  const channelBadge = isAmazonOrder
    ? {
        label: "▲ Amazon",
        color: "text-amber-400/90 bg-amber-500/5 border-amber-500/20",
      }
    : order.channel === "B2B"
      ? {
          label: "🏢 B2B",
          color: "text-purple-300/90 bg-purple-500/5 border-purple-500/20",
        }
      : {
          label: "🛍️ D2C Store",
          color: "text-sky-300/90 bg-sky-500/5 border-sky-500/20",
        };

  const statusColor =
    order.status === "DELIVERED"
      ? "text-emerald-400/90 bg-emerald-500/5 border-emerald-500/20"
      : order.status === "SHIPPED"
        ? "text-cyan-400/90 bg-cyan-500/5 border-cyan-500/20"
        : order.status === "CANCELLED"
          ? "text-rose-400/90 bg-rose-500/5 border-rose-500/20"
          : order.status === "PAID" || order.status === "PROCESSING"
            ? "text-amber-400/90 bg-amber-500/5 border-amber-500/20"
            : "text-muted bg-surface border-border";

  return (
    <div className="max-w-5xl mx-auto pb-16 px-4 sm:px-6 space-y-4">
      {/* ── Navigation ── */}
      <div className="flex justify-between items-center pt-2">
        <Link
          href="/orders"
          className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.15em] text-muted hover:text-accent transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>All Orders</span>
        </Link>
        <span className="font-mono text-[11px] text-muted">
          {new Date(order.createdAt).toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>

      {/* ── Hero Order Header ── */}
      <div className="bg-surface border border-border rounded-sm overflow-hidden">
        {/* Top accent bar */}
        <div className="h-0.5 w-full bg-accent/30" />
        <div className="p-5 sm:p-6 flex flex-col sm:flex-row justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-mono text-[24px] sm:text-[28px] font-bold text-primary tracking-tight m-0">
                {order.orderNumber}
              </h1>
              <span
                className={`font-mono text-[10px] sm:text-[11px] uppercase tracking-wider px-2.5 py-1 border rounded-xs font-semibold ${channelBadge.color}`}
              >
                {channelBadge.label}
              </span>
              <span
                className={`font-mono text-[10px] sm:text-[11px] uppercase tracking-wider px-2.5 py-1 border rounded-xs font-semibold flex items-center gap-1.5 ${statusColor}`}
              >
                {STATUS_ICONS[order.status] &&
                  (() => {
                    const Icon = STATUS_ICONS[order.status];
                    return <Icon className="w-3.5 h-3.5" />;
                  })()}
                <span>{order.status.replace("_", " ")}</span>
              </span>
            </div>
            {order.amazonOrderId && (
              <p className="font-mono text-[11px] sm:text-[12px] text-muted m-0">
                AMZ Order ID:{" "}
                <strong className="text-amber-400/90">
                  {order.amazonOrderId}
                </strong>
              </p>
            )}
            {order.invoiceNumber && (
              <p className="font-mono text-[11px] sm:text-[12px] text-muted m-0">
                Invoice Number:{" "}
                <strong className="text-primary">{order.invoiceNumber}</strong>
              </p>
            )}
          </div>

          {/* Quick summary */}
          <div className="flex items-start gap-6 text-right">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted m-0">
                Order Value
              </p>
              <p className="font-serif text-[24px] text-accent font-light m-0">
                {formatPrice(order.totalAmount)}
              </p>
            </div>
            {(order.trackingNumber || order.awbNumber) && (
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted m-0">
                  AWB / Tracking
                </p>
                <p className="font-mono text-[13px] text-accent font-semibold m-0 break-all">
                  {order.awbNumber || order.trackingNumber}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Order Lifecycle Progress ── */}
      <div className="bg-surface border border-border p-4 sm:p-5 rounded-sm">
        <div className="overflow-x-auto">
          <div className="flex items-center min-w-[360px]">
            {STATUS_STEPS.map((status, idx) => {
              const StepIcon = STATUS_ICONS[status] || Package;
              return (
                <div key={status} className="flex items-center flex-1">
                  <div className="flex flex-col items-center gap-1.5">
                    <div
                      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                        idx < currentStatusIdx
                          ? "border-accent bg-accent/30 text-accent font-bold"
                          : idx === currentStatusIdx
                            ? "border-accent bg-accent text-obsidian font-bold shadow-md shadow-accent/20"
                            : "border-border bg-background text-muted opacity-50"
                      }`}
                    >
                      {idx < currentStatusIdx ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <StepIcon className="w-4 h-4" />
                      )}
                    </div>
                    <span
                      className={`font-mono text-[9px] sm:text-[10px] uppercase tracking-widest text-center whitespace-nowrap ${idx <= currentStatusIdx ? "text-accent font-semibold" : "text-muted/50"}`}
                    >
                      {status.replace("_", " ")}
                    </span>
                  </div>
                  {idx < STATUS_STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-1.5 mb-5 transition-all duration-500 ${idx < currentStatusIdx ? "bg-accent" : "bg-border"}`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Sidebar Sync ── */}
      <OrderSidebarSync
        orderId={order.id}
        orderNumber={order.orderNumber}
        channel={order.channel}
        status={order.status}
        totalAmount={order.totalAmount}
        customerName={displayName || undefined}
        itemCount={order.items.length}
        awbNumber={order.awbNumber || order.trackingNumber}
        amazonOrderId={order.amazonOrderId}
        amazonFulfillmentType={order.amazonFulfillmentType}
      />

      {/* ── STEP 1 (for non-website orders): Customer Details ── */}
      {isAmazonOrder && (
        <div id="customer-info">
          <CustomerAddressEditor
            orderId={order.id}
            initialName={displayName || ""}
            initialEmail={displayEmail || ""}
            initialPhone={displayPhone || ""}
            initialAddress={order.shippingAddress}
            initialCity={order.shippingCity}
            initialState={order.shippingState}
            initialPincode={order.shippingPincode}
            initialCompanyName={order.companyName || order.user.company?.name}
            initialGstin={order.gstin || order.user.company?.gstin}
            isAmazon={true}
            hasNoRecipient={!hasRecipient}
          />
        </div>
      )}

      {/* ── Fulfillment & Status Controls ── */}
      <div id="fulfillment-studio">
        <OrderStatusControls
          orderId={order.id}
          currentStatus={order.status}
          trackingNumber={order.trackingNumber}
          awbNumber={order.awbNumber}
          fulfillmentError={order.fulfillmentError}
          razorpayPaymentId={order.razorpayPaymentId}
          razorpayOrderId={order.razorpayOrderId}
          amazonOrderId={order.amazonOrderId}
          amazonOrderStatus={order.amazonOrderStatus}
          amazonFulfillmentType={order.amazonFulfillmentType}
          channel={order.channel}
          shippingAddress={order.shippingAddress}
          shippingCity={order.shippingCity}
          shippingState={order.shippingState}
          shippingPincode={order.shippingPincode}
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
      </div>

      {/* ── Customer & Logistics Details Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Customer Info Card */}
        <div
          id="customer-info"
          className="bg-surface border border-border p-5 rounded-sm"
        >
          <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted mb-4 border-b border-border pb-2 m-0 flex items-center gap-2">
            <User className="w-4 h-4 text-accent" />
            <span>Customer Details</span>
          </h3>
          {displayName ? (
            <p className="font-serif text-[18px] text-primary font-medium m-0 leading-tight">
              {displayName}
            </p>
          ) : (
            <p className="font-serif text-[14px] text-muted font-medium m-0 italic">
              {isAmazonOrder
                ? "Import customer details above ↑"
                : "No name on record"}
            </p>
          )}
          {displayEmail && (
            <p className="font-mono text-[11px] text-muted mt-2 break-all m-0 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-muted/70 flex-shrink-0" />
              <span>{displayEmail}</span>
            </p>
          )}
          {displayPhone && (
            <p className="font-mono text-[12px] text-accent mt-1.5 m-0 font-semibold flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-accent flex-shrink-0" />
              <span>{displayPhone}</span>
            </p>
          )}
          {(order.companyName || order.user.company) && (
            <div className="mt-3 pt-3 border-t border-border">
              <span className="font-mono text-[9px] uppercase tracking-wider text-muted block mb-0.5">
                Company
              </span>
              <p className="font-sans text-[13px] text-secondary m-0 font-medium">
                {order.companyName || order.user.company?.name}
              </p>
              {(order.gstin || order.user.company?.gstin) && (
                <p className="font-mono text-[10px] text-muted mt-0.5 m-0">
                  GSTIN: {order.gstin || order.user.company?.gstin}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Delivery Address */}
        {!isAmazonOrder ? (
          <EditableShippingAddress
            orderId={order.id}
            initialAddress={order.shippingAddress}
            initialCity={order.shippingCity}
            initialState={order.shippingState}
            initialPincode={order.shippingPincode}
            initialPhone={order.shippingPhone}
            status={order.status}
          />
        ) : (
          <div className="bg-surface border border-border p-5 rounded-sm">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted mb-4 border-b border-border pb-2 m-0 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-accent" />
              <span>Delivery Address</span>
            </h3>
            {order.shippingAddress &&
            !order.shippingAddress.includes("Amazon Marketplace") ? (
              <div className="space-y-1">
                <p className="font-sans text-[13px] text-secondary leading-relaxed font-medium m-0">
                  {order.shippingAddress}
                </p>
                {(order.shippingCity ||
                  order.shippingState ||
                  order.shippingPincode) && (
                  <p className="font-mono text-[11px] text-muted m-0">
                    {[order.shippingCity, order.shippingState]
                      .filter(Boolean)
                      .join(", ")}
                    {order.shippingPincode ? ` - ${order.shippingPincode}` : ""}
                  </p>
                )}
              </div>
            ) : (
              <p className="font-mono text-[11px] text-muted m-0 italic">
                Import customer details above to populate address
              </p>
            )}
          </div>
        )}

        {/* Financial Summary */}
        <div
          id="payment-summary"
          className="bg-surface border border-border p-5 rounded-sm"
        >
          <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted mb-4 border-b border-border pb-2 m-0 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-accent" />
            <span>Payment Summary</span>
          </h3>
          <div className="space-y-2">
            {[
              [
                "Subtotal",
                formatPrice(
                  order.totalAmount - order.taxAmount - order.shippingAmount,
                ),
              ],
              ["GST Tax", formatPrice(order.taxAmount)],
              [
                "Shipping",
                order.shippingAmount === 0
                  ? "FREE"
                  : formatPrice(order.shippingAmount),
              ],
              ...(order.discountAmount > 0
                ? [["Discount", `- ${formatPrice(order.discountAmount)}`]]
                : []),
            ].map(([l, v]) => (
              <div
                key={l}
                className="flex justify-between font-mono text-[11px] text-muted"
              >
                <span>{l}</span>
                <span className={l === "Discount" ? "text-emerald-400" : ""}>
                  {v}
                </span>
              </div>
            ))}
            <div className="flex justify-between font-serif text-[20px] text-accent pt-2.5 border-t border-border font-light">
              <span>Total</span>
              <span>{formatPrice(order.totalAmount)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── D2C Customer Details Studio ── */}
      {!isAmazonOrder && (
        <div id="customer-info">
          <CustomerAddressEditor
            orderId={order.id}
            initialName={displayName || ""}
            initialEmail={displayEmail || ""}
            initialPhone={displayPhone || ""}
            initialAddress={order.shippingAddress}
            initialCity={order.shippingCity}
            initialState={order.shippingState}
            initialPincode={order.shippingPincode}
            initialCompanyName={order.companyName || order.user.company?.name}
            initialGstin={order.gstin || order.user.company?.gstin}
            isAmazon={false}
            hasNoRecipient={false}
          />
        </div>
      )}

      {/* ── Order Line Items (Reworked with Large Image & Prominent SKU) ── */}
      <div
        id="order-items"
        className="bg-surface border border-border rounded-sm overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-border flex justify-between items-center bg-gradient-to-r from-surface via-surface to-background">
          <h3 className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted m-0 flex items-center gap-2">
            <Package className="w-4 h-4 text-accent" />
            <span>Order Items ({order.items.length})</span>
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[540px]">
            <thead className="border-b border-border text-muted bg-background/60">
              <tr>
                <th className="py-3.5 px-6 font-mono text-[9px] uppercase tracking-[0.15em] font-normal">
                  Product &amp; SKU
                </th>
                <th className="py-3.5 px-6 font-mono text-[9px] uppercase tracking-[0.15em] font-normal text-center">
                  Qty
                </th>
                <th className="py-3.5 px-6 font-mono text-[9px] uppercase tracking-[0.15em] font-normal">
                  Unit Price
                </th>
                <th className="py-3.5 px-6 font-mono text-[9px] uppercase tracking-[0.15em] font-normal text-right">
                  Line Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {order.items.map((item) => {
                const imageUrl = item.product.images?.[0];
                const storefrontProductUrl = `${process.env.NEXT_PUBLIC_STOREFRONT_URL || "https://jamesandsons.in"}/products/${item.product.slug}`;
                return (
                  <tr
                    key={item.id}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-start gap-4">
                        {/* Large Crisp Image Thumbnail (w-16 h-16 sm:w-20 sm:h-20) */}
                        <a
                          href={storefrontProductUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-sm border border-border/80 bg-black overflow-hidden flex-shrink-0 flex items-center justify-center group/img relative"
                        >
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={item.product.name}
                              className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-200"
                            />
                          ) : (
                            <Package className="w-8 h-8 text-muted/40" />
                          )}
                        </a>

                        {/* Product Title & Prominent SKU Badge */}
                        <div className="space-y-1.5 flex-1">
                          <a
                            href={storefrontProductUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-serif text-[15px] sm:text-[16px] text-primary hover:text-accent font-medium leading-snug group/link flex items-center gap-1.5 inline-flex"
                          >
                            <span>{item.product.name}</span>
                            <ExternalLink className="w-3.5 h-3.5 text-accent opacity-70 group-hover/link:opacity-100 transition-opacity flex-shrink-0" />
                          </a>

                          {/* Prominent SKU Badge */}
                          <div>
                            <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 bg-accent/10 border border-accent/30 text-accent rounded-xs tracking-wider">
                              SKU: {item.product.sku}
                            </span>
                          </div>

                          {item.product.dimensions && (
                            <p className="font-mono text-[10px] text-muted m-0">
                              Dims: {item.product.dimensions}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6 text-center font-mono text-[15px] text-primary font-bold">
                      {item.quantity}
                    </td>
                    <td className="py-4 px-6 font-mono text-[13px] text-muted">
                      ₹{item.unitPrice.toLocaleString("en-IN")}
                    </td>
                    <td className="py-4 px-6 font-mono text-[16px] text-primary font-bold text-right">
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
