import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Navigation from '@/components/Navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatPrice } from '@/lib/utils'

export default async function AddressesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/account/addresses')

  const addresses = await prisma.userAddress.findMany({
    where: { user: { email: user.email! } },
    orderBy: { isDefault: 'desc' }
  })

  return (
    <>
      <Navigation />
      <main style={{ paddingTop: '64px', minHeight: '100vh', background: 'var(--obsidian)' }}>
        <div style={{ background: 'var(--void)', borderBottom: '1px solid var(--border)', padding: '48px 40px' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div className="section-label">Account</div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '42px', fontWeight: 300, color: 'var(--cream)', marginTop: '8px' }}>Address Book</h1>
          </div>
        </div>

        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '48px 40px' }}>
          {addresses.length === 0 ? (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '60px 20px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', color: 'var(--text-muted)', marginBottom: '16px' }}>No saved addresses</div>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-dim)', marginBottom: '32px' }}>Add a default shipping and billing address for faster checkout.</p>
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                <button className="btn-primary" style={{ padding: '12px 32px', textDecoration: 'none' }}>+ Add New Address</button>
                <Link href="/account" className="btn-outline" style={{ padding: '12px 32px', textDecoration: 'none' }}>Back to Account</Link>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
              {addresses.map(addr => (
                <div key={addr.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '24px', position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--gold)' }}>{addr.name} {addr.isDefault && '(Default)'}</div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--cream)', lineHeight: 1.6, marginBottom: '24px' }}>
                    {addr.street}<br />
                    {addr.city}, {addr.state}<br />
                    {addr.pincode}
                  </div>
                  <div style={{ display: 'flex', gap: '16px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                    <button style={{ background: 'transparent', border: 'none', fontFamily: 'var(--font-mono)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', cursor: 'pointer' }}>Edit</button>
                    <button style={{ background: 'transparent', border: 'none', fontFamily: 'var(--font-mono)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--red)', cursor: 'pointer', opacity: 0.7 }}>Remove</button>
                  </div>
                </div>
              ))}
              <div className="add-address-card" style={{ background: 'transparent', border: '1px dashed var(--border)', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'border-color 0.2s' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', color: 'var(--gold)', marginBottom: '8px' }}>+</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Add New Address</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
