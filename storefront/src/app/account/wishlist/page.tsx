import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Navigation from '@/components/Navigation'
import Link from 'next/link'
import WishlistClient from './WishlistClient'

export default async function WishlistPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/account/wishlist')

  return (
    <main className="min-h-screen bg-[var(--obsidian)] text-[var(--text)] pt-12">
      <Navigation />
      <div className="pb-24 px-6 md:px-12">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-col items-center text-center mb-16">
            <div className="font-mono text-[11px] tracking-[0.2em] uppercase text-[var(--gold)] mb-4">Curated Collection</div>
            <h1 className="font-serif text-5xl md:text-7xl font-light text-[var(--cream)] mb-6">Saved <em className="italic text-[var(--gold-light)]">Items</em></h1>
            <p className="font-body text-[16px] text-[var(--text-muted)] max-w-[600px] leading-relaxed">
              Pieces you've marked for future consideration or collaboration.
            </p>
          </div>

          <WishlistClient />
        </div>
      </div>
    </main>
  )
}
