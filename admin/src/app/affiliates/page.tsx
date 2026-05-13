import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { formatPrice } from '@/lib/utils';

async function getAffiliates() {
  return (prisma as any).affiliate.findMany({
    include: {
      _count: { select: { conversions: true } },
      coupons: { select: { code: true, status: true } },
    },
    orderBy: { totalRevenue: 'desc' },
  });
}


const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  ACTIVE:    { bg: 'rgba(76,175,122,0.12)',  color: '#4CAF7A' },
  SUSPENDED: { bg: 'rgba(200,80,80,0.12)',   color: '#C85050' },
};

export default async function AffiliatesPage() {
  await requireAdmin();
  const affiliates = await getAffiliates();

  const totalRevenue = (affiliates as any[]).reduce((s: number, a: any) => s + (a.totalRevenue || 0), 0);
  const totalCommission = (affiliates as any[]).reduce((s: number, a: any) => s + (a.totalCommission || 0), 0);


  return (
    <div style={{ padding: '32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--gold)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '4px' }}>Marketing</div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', color: 'var(--cream)', fontWeight: 300, margin: 0 }}>Affiliates</h1>
        </div>
        <Link
          href="/affiliates/new"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', background: 'var(--gold)', borderRadius: '10px', color: '#0A0905', fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}
        >
          + New Affiliate
        </Link>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'Total Affiliates', value: affiliates.length.toString() },
          { label: 'Active', value: affiliates.filter(a => a.status === 'ACTIVE').length.toString(), color: '#4CAF7A' },
          { label: 'Total Revenue Attributed', value: `₹${totalRevenue.toLocaleString('en-IN')}`, color: 'var(--gold)' },
          { label: 'Total Commission Earned', value: `₹${totalCommission.toLocaleString('en-IN')}` },
        ].map(stat => (
          <div key={stat.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px 24px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>{stat.label}</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', color: stat.color ?? 'var(--cream)' }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* How It Works Info Banner */}
      <div style={{ background: 'rgba(201,168,76,0.06)', border: '0.5px solid rgba(201,168,76,0.2)', borderRadius: '14px', padding: '16px 20px', marginBottom: '24px', fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
        <strong style={{ color: 'var(--gold)' }}>How Affiliate Tracking Works:</strong> Share a link like{' '}
        <code style={{ background: 'var(--obsidian)', padding: '2px 6px', borderRadius: '4px', color: 'var(--cream)' }}>
          jamesandsons.in?ref=AFFILIATECODE
        </code>
        . When a customer visits and places an order within 30 days, the conversion is automatically attributed to this affiliate.
      </div>

      {/* Affiliates Table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px', overflow: 'hidden' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 120px 80px 100px 100px 100px 48px', gap: '12px' }}>
          {['Affiliate', 'Code', 'Status', 'Commission %', 'Revenue', 'Commission', ''].map(h => (
            <div key={h} style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{h}</div>
          ))}
        </div>

        {affiliates.length === 0 && (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No affiliates yet. <Link href="/affiliates/new" style={{ color: 'var(--gold)' }}>Add one →</Link>
          </div>
        )}

        {affiliates.map(aff => {
          const s = STATUS_COLORS[aff.status] ?? STATUS_COLORS.SUSPENDED;
          return (
            <div key={aff.id} style={{ padding: '16px 24px', borderBottom: '0.5px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 120px 80px 100px 100px 100px 48px', gap: '12px', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '14px', color: 'var(--cream)' }}>{aff.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{aff.email}</div>
                {aff.coupons.length > 0 && (
                  <div style={{ fontSize: '10px', color: 'var(--gold)', marginTop: '3px' }}>
                    {aff.coupons.length} coupon{aff.coupons.length !== 1 ? 's' : ''} linked
                  </div>
                )}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--cream)', letterSpacing: '0.06em' }}>
                {aff.affiliateCode}
              </div>
              <div>
                <span style={{ fontSize: '10px', padding: '3px 10px', borderRadius: '20px', background: s.bg, color: s.color }}>
                  {aff.status}
                </span>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--cream)' }}>{aff.commissionRate}%</div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '14px', color: 'var(--gold)' }}>
                ₹{aff.totalRevenue.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--cream)' }}>
                ₹{aff.totalCommission.toLocaleString('en-IN')}
              </div>
              <Link href={`/affiliates/${aff.id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', background: 'var(--obsidian)', borderRadius: '8px', color: 'var(--text)', fontSize: '14px', textDecoration: 'none' }}>
                →
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
