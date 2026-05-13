import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

async function getCoupons() {
  return (prisma as any).coupon.findMany({
    include: {
      _count: { select: { usages: true } },
      affiliate: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}


const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  ACTIVE:    { bg: 'rgba(76,175,122,0.12)',  color: '#4CAF7A' },
  PAUSED:    { bg: 'rgba(201,168,76,0.12)',  color: '#C9A84C' },
  EXPIRED:   { bg: 'rgba(150,150,150,0.12)', color: '#888' },
  EXHAUSTED: { bg: 'rgba(200,80,80,0.12)',   color: '#C85050' },
};

export default async function PromotionsPage() {
  await requireAdmin();
  const coupons = await getCoupons();

  return (
    <div style={{ padding: '32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--gold)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '4px' }}>Marketing</div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', color: 'var(--cream)', fontWeight: 300, margin: 0 }}>Promotions</h1>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link
            href="/promotions/bulk"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text)', fontSize: '12px', textDecoration: 'none' }}
          >
            <span>⚡</span> Bulk Generate
          </Link>
          <Link
            href="/promotions/new"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', background: 'var(--gold)', borderRadius: '10px', color: '#0A0905', fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}
          >
            + New Coupon
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'Total Coupons', value: coupons.length },
          { label: 'Active', value: coupons.filter((c: any) => c.status === 'ACTIVE').length, color: '#4CAF7A' },
          { label: 'Total Redemptions', value: coupons.reduce((s: number, c: any) => s + (c.usedCount || 0), 0) },
          { label: 'Exhausted', value: coupons.filter((c: any) => c.status === 'EXHAUSTED').length, color: '#C85050' },

        ].map(stat => (
          <div key={stat.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px 24px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>{stat.label}</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', color: stat.color ?? 'var(--cream)' }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Coupon Table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px', overflow: 'hidden' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 90px 100px 80px 100px 80px 80px 48px', gap: '12px' }}>
          {['Code', 'Type', 'Value', 'Status', 'Used / Limit', 'Source', 'Expires', ''].map(h => (
            <div key={h} style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{h}</div>
          ))}
        </div>

        {coupons.length === 0 && (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No coupons yet. <Link href="/promotions/new" style={{ color: 'var(--gold)' }}>Create one →</Link>
          </div>
        )}

        {coupons.map(coupon => {
          const s = STATUS_COLORS[coupon.status] ?? STATUS_COLORS.EXPIRED;
          return (
            <div key={coupon.id} style={{ padding: '16px 24px', borderBottom: '0.5px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 90px 100px 80px 100px 80px 80px 48px', gap: '12px', alignItems: 'center' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--cream)', letterSpacing: '0.06em' }}>{coupon.code}</div>
                {coupon.description && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{coupon.description}</div>}
                {coupon.affiliate && <div style={{ fontSize: '10px', color: 'var(--gold)', marginTop: '2px' }}>↳ {coupon.affiliate.name}</div>}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                {coupon.type === 'PERCENTAGE' ? '%' : coupon.type === 'FIXED_AMOUNT' ? '₹ Fixed' : 'Free Ship'}
              </div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '16px', color: 'var(--cream)' }}>
                {coupon.type === 'PERCENTAGE' ? `${coupon.value}%` : coupon.type === 'FIXED_AMOUNT' ? `₹${coupon.value.toLocaleString('en-IN')}` : '—'}
              </div>
              <div style={{ display: 'inline-flex' }}>
                <span style={{ fontSize: '10px', padding: '3px 10px', borderRadius: '20px', background: s.bg, color: s.color, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  {coupon.status}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--cream)' }}>
                {coupon.usedCount}{coupon.usageLimit ? ` / ${coupon.usageLimit}` : ' / ∞'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                {coupon.source ?? 'internal'}
              </div>
              <div style={{ fontSize: '11px', color: coupon.expiresAt && new Date(coupon.expiresAt) < new Date() ? '#C85050' : 'var(--text-muted)' }}>
                {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '∞'}
              </div>
              <Link href={`/promotions/${coupon.id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', background: 'var(--obsidian)', borderRadius: '8px', color: 'var(--text)', fontSize: '14px', textDecoration: 'none' }}>
                →
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
