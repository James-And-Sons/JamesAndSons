import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Navigation from '@/components/Navigation'
import Link from 'next/link'

export default async function AddressesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/account/addresses')

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
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', color: 'var(--text-muted)', marginBottom: '16px' }}>No saved addresses</div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-dim)', marginBottom: '32px' }}>Add a default shipping and billing address for faster checkout.</p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <button className="btn-primary" style={{ padding: '12px 32px', textDecoration: 'none' }}>+ Add New Address</button>
              <Link href="/account" className="btn-outline" style={{ padding: '12px 32px', textDecoration: 'none' }}>Back to Account</Link>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
