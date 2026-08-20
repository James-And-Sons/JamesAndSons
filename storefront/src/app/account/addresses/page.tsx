import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import AddressListClient from './AddressListClient'

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
            <main style={{ paddingTop: '64px', minHeight: '100vh', background: 'var(--obsidian)' }}>
        <div style={{ background: 'var(--void)', borderBottom: '1px solid var(--border)', padding: '48px 40px' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div className="section-label">Account</div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '42px', fontWeight: 300, color: 'var(--cream)', marginTop: '8px' }}>Address Book</h1>
          </div>
        </div>

        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '48px 40px' }}>
          <AddressListClient initialAddresses={addresses} />
        </div>
      </main>
    </>
  )
}
