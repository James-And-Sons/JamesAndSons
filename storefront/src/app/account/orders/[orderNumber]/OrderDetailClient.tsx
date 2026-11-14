"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import OrderStepperTimeline from "./components/OrderStepperTimeline";
import {
  ArrowLeft,
  Download,
  RefreshCw,
  FileText,
  Truck,
  ShieldCheck,
} from "lucide-react";

interface OrderDetailClientProps {
  order: {
    id: string;
    orderNumber: string;
    status: string;
    totalAmount: number;
    taxAmount: number;
    shippingAmount: number;
    discountAmount: number;
    couponCode?: string | null;
    shippingAddress: string;
    shippingPhone?: string | null;
    shippingCity?: string | null;
    shippingState?: string | null;
    shippingPincode?: string | null;
    trackingNumber?: string | null;
    awbNumber?: string | null;
    razorpayOrderId?: string | null;
    razorpayPaymentId?: string | null;
    createdAt: Date | string;
    items: Array<{
      id: string;
      productId: string;
      quantity: number;
      unitPrice: number;
      total: number;
      product: {
        id: string;
        name: string;
        sku: string;
        slug: string;
        images: string[];
      };
    }>;
  };
}

export default function OrderDetailClient({ order }: OrderDetailClientProps) {
  const [cancelling, setCancelling] = useState(false);
  const [cancelMessage, setCancelMessage] = useState<string | null>(null);

  const dateStr = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/orders/${order.orderNumber}/cancel`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setCancelMessage("Order cancelled successfully.");
        window.location.reload();
      } else {
        setCancelMessage(data.error || "Failed to cancel order.");
      }
    } catch {
      setCancelMessage("Failed to connect to order cancellation API.");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 bg-background max-w-5xl mx-auto space-y-6">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/account/orders"
          className="text-xs text-textMuted hover:text-gold flex items-center gap-1"
        >
          <ArrowLeft size={14} />
          <span>Back to All Orders</span>
        </Link>
        <a
          href={`/api/orders/${order.orderNumber}/invoice`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 bg-surface border border-border hover:border-gold text-text text-xs rounded flex items-center gap-1.5"
        >
          <Download size={14} />
          <span>Download Invoice PDF</span>
        </a>
      </div>

      {/* Title & Status */}
      <div className="bg-surface p-6 rounded-2xl border border-border shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="text-xs font-mono text-textMuted">Order Details</div>
          <h1 className="text-2xl font-serif font-bold text-text mt-0.5">
            #{order.orderNumber}
          </h1>
          <div className="text-xs text-textMuted mt-1">Placed on {dateStr}</div>
        </div>

        <div className="text-right">
          <div className="text-sm font-mono font-bold text-gold">
            {formatPrice(order.totalAmount)}
          </div>
          <div className="text-xs font-mono text-textMuted capitalize">
            Status: {order.status}
          </div>
        </div>
      </div>

      {/* Stepper Timeline */}
      <OrderStepperTimeline status={order.status} />

      {cancelMessage && (
        <div className="p-3 bg-surface2 border border-gold/40 text-gold text-xs rounded-lg">
          {cancelMessage}
        </div>
      )}

      {/* Purchased Items List */}
      <div className="bg-surface p-6 rounded-2xl border border-border space-y-4">
        <h3 className="text-sm font-semibold text-text uppercase tracking-wider font-mono">
          Itemized Summary
        </h3>
        <div className="divide-y divide-border/50">
          {order.items.map((item) => (
            <div key={item.id} className="py-4 flex gap-4 items-center">
              <div className="w-16 h-16 relative bg-surface2 rounded-lg border border-border overflow-hidden flex-shrink-0">
                {item.product?.images?.[0] ? (
                  <Image
                    src={item.product.images[0]}
                    alt={item.product.name}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-textMuted">
                    No Image
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <Link
                  href={`/products/${item.product?.slug || item.productId}`}
                  className="font-semibold text-text text-sm hover:text-gold"
                >
                  {item.product?.name || "Product"}
                </Link>
                <div className="text-xs font-mono text-textMuted mt-0.5">
                  SKU: {item.product?.sku}
                </div>
                <div className="text-xs text-textMuted mt-0.5">
                  Qty: {item.quantity} × {formatPrice(item.unitPrice)}
                </div>
              </div>

              <div className="text-right font-mono font-bold text-gold text-sm">
                {formatPrice(item.total)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Delivery & Address Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface p-6 rounded-2xl border border-border space-y-2">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-gold">
            Shipping Address
          </h3>
          <p className="text-sm text-text whitespace-pre-line">
            {order.shippingAddress}
          </p>
          {order.shippingPhone && (
            <p className="text-xs text-textMuted">
              Phone: {order.shippingPhone}
            </p>
          )}
        </div>

        <div className="bg-surface p-6 rounded-2xl border border-border space-y-3">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-gold">
            Actions & Support
          </h3>
          {order.status === "PENDING" && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="w-full py-2 bg-red-900/30 text-red-300 border border-red-800 rounded text-xs hover:bg-red-900/50"
            >
              {cancelling ? "Cancelling..." : "Cancel Order"}
            </button>
          )}
          <Link
            href={`/account/tickets/new?orderId=${order.id}`}
            className="block text-center py-2 bg-surface2 border border-border text-text rounded text-xs hover:border-gold"
          >
            Raise Support Ticket for Order
          </Link>
        </div>
      </div>
    </div>
  );
}
