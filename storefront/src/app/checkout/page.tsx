import Navigation from '@/components/Navigation';
import CheckoutPageClient from './CheckoutPageClient';
import Script from 'next/script';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

export default async function CheckoutPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/checkout');
  }

  // Fetch user details and default address for prefilling
  const dbUser = await prisma.user.findUnique({
    where: { email: user.email! },
    include: {
      addresses: {
        where: { isDefault: true },
        take: 1
      }
    }
  });

  const defaultAddr = dbUser?.addresses?.[0];

  const initialData = {
    name: dbUser ? `${dbUser.firstName} ${dbUser.lastName}`.trim() : '',
    email: dbUser?.email || user.email || '',
    phone: dbUser?.phone || '',
    pincode: defaultAddr?.pincode || dbUser?.lastPincode || '',
    address: defaultAddr?.street || '',
    city: defaultAddr?.city || '',
    state: defaultAddr?.state || '',
  };

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <Navigation />
      <main style={{ paddingTop: '64px', minHeight: '100vh', background: 'var(--obsidian)' }}>
        <div style={{ background: 'var(--void)', borderBottom: '1px solid var(--border)', padding: '32px 40px' }} className="checkout-title-bg">
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <div className="section-label">Secure Checkout</div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '36px', fontWeight: 300, color: 'var(--cream)', marginTop: '6px' }}>Complete Your Order</h1>
          </div>
        </div>
        <CheckoutPageClient initialData={initialData} />
      </main>
    </>
  );
}
