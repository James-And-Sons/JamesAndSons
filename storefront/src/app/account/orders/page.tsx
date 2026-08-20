import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatPrice } from '@/lib/utils'

export default async function OrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !user.email) redirect('/login?next=/account/orders')

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
    include: {
      orders: {
        orderBy: { createdAt: 'desc' },
        include: { items: { include: { product: true } } }
      }
    }
  })

  const orders = dbUser?.orders || []

  return (
    <>
      <main className="md:pt-16 min-h-screen" style={{ background: 'var(--obsidian)' }}>

        {/* Page Header — Desktop */}
        <div style={{ background: 'var(--void)', borderBottom: '1px solid var(--border)', padding: '48px 40px' }} className="hidden md:block">
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div className="section-label">Account</div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '42px', fontWeight: 300, color: 'var(--cream)', marginTop: '8px' }}>My Orders</h1>
          </div>
        </div>

        {/* Mobile Header */}
        <div className="md:hidden" style={{ padding: '24px 16px 8px' }}>
          <div className="section-label" style={{ fontSize: '10px' }}>Archives</div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', fontWeight: 300, color: 'var(--cream)', marginTop: '4px' }}>Order <em>History</em></h1>
        </div>

        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px 16px' }}>
          {orders.length === 0 ? (
            <div style={{ background: 'var(--surface)', border: '1.5px dashed var(--border)', borderRadius: '24px', padding: '60px 20px', textAlign: 'center' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(196,160,90,0.1)', border: '1px solid rgba(196,160,90,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: 'var(--gold)' }}>
                <i className="ti ti-shopping-bag" style={{ fontSize: '28px' }}></i>
              </div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', color: 'var(--cream)', marginBottom: '12px' }}>No orders found</div>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-muted)', maxWidth: '300px', margin: '0 auto 32px' }}>Your past and current orders will appear here once you make a purchase.</p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexDirection: 'column', maxWidth: '240px', margin: '0 auto' }}>
                <Link href="/collections" className="btn-primary" style={{ padding: '14px', borderRadius: '14px', textDecoration: 'none', fontSize: '12px' }}>Start Shopping</Link>
                <Link href="/account" style={{ color: 'var(--gold)', fontSize: '12px', textDecoration: 'none', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>Back to Profile</Link>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {orders.map(order => (
                <Link
                  key={order.id}
                  href={`/account/orders/${order.orderNumber}`}
                  style={{ textDecoration: 'none', display: 'block' }}
                >
                  <div style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: '24px', overflow: 'hidden', transition: 'border-color 0.2s' }}>
                    {/* Order Header */}
                    <div style={{ padding: '16px 20px', borderBottom: '0.5px solid var(--border)', background: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--gold)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{order.orderNumber}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: order.status === 'DELIVERED' ? '#4ade80' : 'var(--gold-light)', padding: '4px 10px', borderRadius: '20px', background: order.status === 'DELIVERED' ? 'rgba(74,222,128,0.1)' : 'rgba(196,160,90,0.1)', border: `0.5px solid ${order.status === 'DELIVERED' ? 'rgba(74,222,128,0.2)' : 'rgba(196,160,90,0.2)'}`, display: 'inline-block' }}>
                          {order.status}
                        </div>
                        <i className="ti ti-chevron-right" style={{ color: 'var(--border)', fontSize: '16px' }}></i>
                      </div>
                    </div>

                    {/* Order Items Preview */}
                    <div style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {order.items.slice(0, 2).map(item => (
                          <div key={item.id} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <div style={{ width: '48px', height: '56px', background: 'var(--surface2)', border: '0.5px solid var(--border)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                              {item.product.images?.[0] ? (
                                <img src={item.product.images[0]} alt={item.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <i className="ti ti-bulb" style={{ color: 'var(--gold)', opacity: 0.4 }}></i>
                              )}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '14px', color: 'var(--cream)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{item.product.name}</div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '4px' }}>
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>QTY: {item.quantity}</div>
                                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '13px', color: 'var(--gold-light)' }}>{formatPrice(item.total)}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                        {order.items.length > 2 && (
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                            +{order.items.length - 2} more item{order.items.length - 2 > 1 ? 's' : ''}
                          </div>
                        )}
                      </div>

                      <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '0.5px dashed var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Amount</div>
                        <div style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', color: 'var(--cream)', fontWeight: 400 }}>{formatPrice(order.totalAmount)}</div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
