'use client'
import { useState } from 'react'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'
import { useRouter } from 'next/navigation'

const STATUS_STEPS = ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED']

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Order Placed',
  PAID: 'Payment Confirmed',
  PROCESSING: 'Being Prepared',
  SHIPPED: 'Out for Delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  RETURNED: 'Returned',
}

const STATUS_ICONS: Record<string, string> = {
  PENDING: 'ti-clock',
  PAID: 'ti-circle-check',
  PROCESSING: 'ti-package',
  SHIPPED: 'ti-truck',
  DELIVERED: 'ti-home-check',
  CANCELLED: 'ti-circle-x',
  RETURNED: 'ti-arrow-back-up',
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#C9A84C',
  PAID: '#4ade80',
  PROCESSING: '#60a5fa',
  SHIPPED: '#f59e0b',
  DELIVERED: '#4ade80',
  CANCELLED: '#f87171',
  RETURNED: '#a78bfa',
}

interface OrderDetailClientProps {
  order: {
    id: string
    orderNumber: string
    status: string
    totalAmount: number
    taxAmount: number
    shippingAmount: number
    discountAmount: number
    couponCode?: string | null
    shippingAddress: string
    shippingPhone?: string | null
    shippingCity?: string | null
    shippingState?: string | null
    shippingPincode?: string | null
    trackingNumber?: string | null
    awbNumber?: string | null
    razorpayOrderId?: string | null
    razorpayPaymentId?: string | null
    createdAt: Date | string
    items: Array<{
      id: string
      quantity: number
      unitPrice: number
      total: number
      product: {
        id: string
        name: string
        slug: string
        images: string[] | null
      }
    }>
  }
}

export default function OrderDetailClient({ order }: OrderDetailClientProps) {
  const router = useRouter()
  const [cancelling, setCancelling] = useState(false)
  const [cancelConfirm, setCancelConfirm] = useState(false)
  const [cancelError, setCancelError] = useState('')

  const isCancellable = !['SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED'].includes(order.status)
  const isPaymentFailed = order.status === 'PENDING' && !order.razorpayPaymentId
  const currentStepIndex = STATUS_STEPS.indexOf(order.status)
  const isCancelled = order.status === 'CANCELLED' || order.status === 'RETURNED'

  const statusColor = STATUS_COLORS[order.status] || '#C9A84C'

  async function handleCancel() {
    if (!cancelConfirm) {
      setCancelConfirm(true)
      return
    }
    setCancelling(true)
    setCancelError('')
    try {
      const res = await fetch(`/api/orders/${order.orderNumber}/cancel`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to cancel')
      router.refresh()
    } catch (err: any) {
      setCancelError(err.message)
    } finally {
      setCancelling(false)
      setCancelConfirm(false)
    }
  }

  const subtotal = order.totalAmount - order.taxAmount - order.shippingAmount + order.discountAmount

  return (
    <>
      <style>{`
        .order-track-step.active { opacity: 1 !important; }
        .order-track-step.done .step-dot { background: var(--green) !important; border-color: var(--green) !important; }
        .order-track-step.active .step-dot { background: var(--gold) !important; border-color: var(--gold) !important; box-shadow: 0 0 12px rgba(201,168,76,0.4); }
        @media (max-width: 768px) {
          .order-detail-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <main className="md:pt-16 min-h-screen" style={{ background: 'var(--obsidian)' }}>

        {/* Back Header */}
        <div style={{ padding: '16px 20px 0' }} className="md:hidden">
          <Link href="/account/orders" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '13px', fontFamily: 'var(--font-mono)' }}>
            <i className="ti ti-arrow-left"></i> Back to Orders
          </Link>
        </div>

        {/* Desktop Header */}
        <div style={{ background: 'var(--void)', borderBottom: '1px solid var(--border)', padding: '40px 40px 32px' }} className="hidden md:block">
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <Link href="/account/orders" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '12px', fontFamily: 'var(--font-mono)', marginBottom: '16px', letterSpacing: '0.06em' }}>
                  <i className="ti ti-arrow-left"></i> MY ORDERS
                </Link>
                <div className="section-label">Order Details</div>
                <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '38px', fontWeight: 300, color: 'var(--cream)', marginTop: '8px' }}>{order.orderNumber}</h1>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '6px' }}>Placed on</div>
                <div style={{ fontSize: '15px', color: 'var(--cream)' }}>
                  {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '20px 16px 60px' }}>

          {/* Mobile Order Header */}
          <div className="md:hidden" style={{ marginBottom: '20px' }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', color: 'var(--cream)', fontWeight: 300 }}>{order.orderNumber}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>

          {/* Status Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: `${statusColor}15`, border: `1px solid ${statusColor}30`, borderRadius: '24px', padding: '8px 16px', marginBottom: '24px' }}>
            <i className={`ti ${STATUS_ICONS[order.status] || 'ti-clock'}`} style={{ color: statusColor, fontSize: '16px' }}></i>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: statusColor, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {STATUS_LABELS[order.status] || order.status}
            </span>
          </div>

          {/* Retry Payment Banner */}
          {isPaymentFailed && (
            <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: '16px', padding: '16px 20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#f87171', marginBottom: '4px' }}>Payment Incomplete</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Your payment was not confirmed. Please retry to complete your order.</div>
              </div>
              <Link
                href="/checkout"
                style={{ background: '#f87171', color: '#fff', padding: '10px 18px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                Retry Payment →
              </Link>
            </div>
          )}

          {/* Main Grid */}
          <div className="order-detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '20px', alignItems: 'start' }}>

            {/* LEFT COLUMN */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Order Tracking */}
              {!isCancelled && (
                <div style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: '20px', padding: '20px 24px' }}>
                  <div style={{ fontSize: '13px', color: 'var(--gold)', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: '20px' }}>Order Progress</div>

                  {/* Progress Steps */}
                  <div style={{ position: 'relative' }}>
                    {/* Connector line */}
                    <div style={{ position: 'absolute', left: '14px', top: '14px', bottom: '14px', width: '1.5px', background: 'var(--border)' }} />
                    <div style={{ position: 'absolute', left: '14px', top: '14px', width: '1.5px', background: 'var(--gold)', height: `${Math.max(0, (currentStepIndex / (STATUS_STEPS.length - 1)) * 100)}%`, transition: 'height 0.6s ease' }} />

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                      {STATUS_STEPS.map((step, idx) => {
                        const isDone = idx < currentStepIndex
                        const isActive = idx === currentStepIndex
                        const isPending = idx > currentStepIndex
                        return (
                          <div key={step} className={`order-track-step ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}`}
                            style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 0', opacity: isPending ? 0.35 : 1 }}
                          >
                            <div className="step-dot" style={{
                              width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                              border: `1.5px solid ${isDone ? 'var(--green)' : isActive ? 'var(--gold)' : 'var(--border)'}`,
                              background: isDone ? 'var(--green)' : isActive ? 'var(--gold)' : 'var(--surface2)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              position: 'relative', zIndex: 1,
                              boxShadow: isActive ? '0 0 12px rgba(201,168,76,0.35)' : 'none'
                            }}>
                              <i className={`ti ${isDone ? 'ti-check' : STATUS_ICONS[step]}`}
                                style={{ fontSize: '12px', color: isDone || isActive ? '#0A0905' : 'var(--text-muted)' }}></i>
                            </div>
                            <div>
                              <div style={{ fontSize: '14px', fontWeight: isActive ? 600 : 400, color: isActive ? 'var(--cream)' : isDone ? 'var(--text)' : 'var(--text-muted)' }}>
                                {STATUS_LABELS[step]}
                              </div>
                              {isActive && (
                                <div style={{ fontSize: '11px', color: 'var(--gold)', fontFamily: 'var(--font-mono)', marginTop: '2px', letterSpacing: '0.04em' }}>Current Status</div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Courier Tracking */}
                  {order.awbNumber && (
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '0.5px dashed var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AWB Number</div>
                        <div style={{ fontSize: '13px', color: 'var(--cream)', marginTop: '2px' }}>{order.awbNumber}</div>
                      </div>
                      <a
                        href={`https://shiprocket.co/tracking/${order.awbNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ background: 'var(--gold)', color: '#0A0905', padding: '8px 16px', borderRadius: '10px', fontSize: '11px', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                      >
                        <i className="ti ti-current-location"></i>
                        Track Shipment
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Order Items */}
              <div style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: '20px', padding: '20px 24px' }}>
                <div style={{ fontSize: '13px', color: 'var(--gold)', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: '16px' }}>
                  Order Items ({order.items.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {order.items.map((item, idx) => (
                    <div key={item.id} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', paddingBottom: idx < order.items.length - 1 ? '16px' : 0, borderBottom: idx < order.items.length - 1 ? '0.5px dashed var(--border)' : 'none' }}>
                      <Link href={`/products/${item.product.slug}`} style={{ width: '64px', height: '72px', flexShrink: 0, border: '0.5px solid var(--border)', borderRadius: '12px', overflow: 'hidden', display: 'block', background: 'var(--surface2)' }}>
                        {item.product.images?.[0] ? (
                          <img src={item.product.images[0]} alt={item.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <i className="ti ti-lamp" style={{ color: 'var(--gold)', opacity: 0.3, fontSize: '20px' }}></i>
                          </div>
                        )}
                      </Link>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Link href={`/products/${item.product.slug}`} style={{ textDecoration: 'none' }}>
                          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '15px', color: 'var(--cream)', lineHeight: 1.3, marginBottom: '6px' }}>{item.product.name}</div>
                        </Link>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                            QTY {item.quantity} × {formatPrice(item.unitPrice)}
                          </div>
                          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '16px', color: 'var(--gold-light)' }}>
                            {formatPrice(item.total)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Address */}
              <div style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: '20px', padding: '20px 24px' }}>
                <div style={{ fontSize: '13px', color: 'var(--gold)', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: '14px' }}>Delivery Address</div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <i className="ti ti-map-pin" style={{ color: 'var(--gold)', fontSize: '18px', marginTop: '2px', flexShrink: 0 }}></i>
                  <div>
                    <div style={{ fontSize: '14px', color: 'var(--cream)', lineHeight: 1.5 }}>{order.shippingAddress}</div>
                    {(order.shippingCity || order.shippingState || order.shippingPincode) && (
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        {[order.shippingCity, order.shippingState, order.shippingPincode].filter(Boolean).join(', ')}
                      </div>
                    )}
                    {order.shippingPhone && (
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <i className="ti ti-phone" style={{ fontSize: '12px' }}></i>
                        {order.shippingPhone}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Cancel Order */}
              {isCancellable && (
                <div style={{ background: 'rgba(248,113,113,0.04)', border: '0.5px solid rgba(248,113,113,0.15)', borderRadius: '20px', padding: '20px 24px' }}>
                  <div style={{ fontSize: '13px', color: '#f87171', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: '10px' }}>Cancel Order</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: 1.5 }}>
                    You can cancel this order as it hasn't been shipped yet. Cancellations are final and refunds (if any) are processed within 5–7 business days.
                  </div>
                  {cancelError && (
                    <div style={{ fontSize: '13px', color: '#f87171', marginBottom: '12px', background: 'rgba(248,113,113,0.08)', padding: '8px 12px', borderRadius: '8px' }}>
                      {cancelError}
                    </div>
                  )}
                  {cancelConfirm ? (
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={handleCancel}
                        disabled={cancelling}
                        style={{ background: '#f87171', color: '#fff', padding: '10px 20px', borderRadius: '12px', fontSize: '13px', fontWeight: 600, border: 'none', cursor: cancelling ? 'wait' : 'pointer', opacity: cancelling ? 0.7 : 1 }}
                      >
                        {cancelling ? 'Cancelling...' : 'Yes, Cancel Order'}
                      </button>
                      <button
                        onClick={() => setCancelConfirm(false)}
                        style={{ background: 'var(--surface2)', color: 'var(--text-muted)', padding: '10px 20px', borderRadius: '12px', fontSize: '13px', border: '0.5px solid var(--border)', cursor: 'pointer' }}
                      >
                        Keep Order
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setCancelConfirm(true)}
                      style={{ background: 'none', border: '1px solid rgba(248,113,113,0.4)', color: '#f87171', padding: '10px 20px', borderRadius: '12px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
                    >
                      Request Cancellation
                    </button>
                  )}
                </div>
              )}

            </div>

            {/* RIGHT COLUMN — Bill */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Bill Summary */}
              <div style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: '20px', padding: '20px 24px', position: 'sticky', top: '88px' }}>
                <div style={{ fontSize: '13px', color: 'var(--gold)', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: '16px' }}>Order Bill</div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
                    <span style={{ color: 'var(--cream)' }}>{formatPrice(subtotal)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Tax (GST)</span>
                    <span style={{ color: 'var(--cream)' }}>{formatPrice(order.taxAmount)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Shipping</span>
                    <span style={{ color: order.shippingAmount === 0 ? 'var(--green)' : 'var(--cream)' }}>
                      {order.shippingAmount === 0 ? 'Free' : formatPrice(order.shippingAmount)}
                    </span>
                  </div>
                  {order.discountAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: 'var(--green)' }}>
                        Discount {order.couponCode && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px' }}>({order.couponCode})</span>}
                      </span>
                      <span style={{ color: 'var(--green)' }}>−{formatPrice(order.discountAmount)}</span>
                    </div>
                  )}
                </div>

                <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '0.5px dashed var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>Total Paid</span>
                  <span style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', color: 'var(--cream)', fontWeight: 400 }}>{formatPrice(order.totalAmount)}</span>
                </div>

                {/* Payment Info */}
                {order.razorpayPaymentId && (
                  <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '0.5px dashed var(--border)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Payment ID</div>
                    <div style={{ fontSize: '12px', color: 'var(--cream)', fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>{order.razorpayPaymentId}</div>
                  </div>
                )}

                {/* Trust Badges */}
                <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '0.5px dashed var(--border)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {['GST Invoice Included', 'Secure Payment', 'Pan-India Delivery'].map(t => (
                    <div key={t} style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      <span style={{ color: 'var(--gold)', fontSize: '12px' }}>✓</span>{t}
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: '20px', padding: '20px 24px' }}>
                <div style={{ fontSize: '13px', color: 'var(--gold)', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: '14px' }}>Quick Actions</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {order.awbNumber && (
                    <a
                      href={`https://shiprocket.co/tracking/${order.awbNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', background: 'var(--surface2)', border: '0.5px solid var(--border)', borderRadius: '12px', textDecoration: 'none', color: 'var(--cream)', fontSize: '13px' }}
                    >
                      <i className="ti ti-current-location" style={{ color: 'var(--gold)', fontSize: '17px' }}></i>
                      Track Shipment
                    </a>
                  )}
                  <Link
                    href="/account/tickets"
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', background: 'var(--surface2)', border: '0.5px solid var(--border)', borderRadius: '12px', textDecoration: 'none', color: 'var(--cream)', fontSize: '13px' }}
                  >
                    <i className="ti ti-headset" style={{ color: 'var(--gold)', fontSize: '17px' }}></i>
                    Contact Support
                  </Link>
                  <Link
                    href="/returns"
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', background: 'var(--surface2)', border: '0.5px solid var(--border)', borderRadius: '12px', textDecoration: 'none', color: 'var(--cream)', fontSize: '13px' }}
                  >
                    <i className="ti ti-arrow-back-up" style={{ color: 'var(--gold)', fontSize: '17px' }}></i>
                    Return / Exchange
                  </Link>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>
    </>
  )
}
