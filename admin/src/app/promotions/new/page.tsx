'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { adminCreateCoupon } from '@/app/promotions/server-actions';

type CouponType = 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';

export default function NewCouponPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    code: '',
    description: '',
    type: 'PERCENTAGE' as CouponType,
    value: '',
    minOrderAmount: '',
    maxDiscountCap: '',
    usageLimit: '',
    usageLimitPerUser: '1',
    startsAt: '',
    expiresAt: '',
    source: 'internal',
  });
  const [error, setError] = useState('');

  const generateCode = () => {
    const code = `JNS${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    setForm(f => ({ ...f, code }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.code.trim()) return setError('Code is required');
    if (!form.value && form.type !== 'FREE_SHIPPING') return setError('Value is required');

    startTransition(async () => {
      try {
        await adminCreateCoupon({
          code: form.code,
          description: form.description || undefined,
          type: form.type,
          value: Number(form.value) || 0,
          minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : undefined,
          maxDiscountCap: form.maxDiscountCap ? Number(form.maxDiscountCap) : undefined,
          usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
          usageLimitPerUser: form.usageLimitPerUser ? Number(form.usageLimitPerUser) : 1,
          startsAt: form.startsAt ? new Date(form.startsAt) : undefined,
          expiresAt: form.expiresAt ? new Date(form.expiresAt) : undefined,
          source: form.source,
        });
        router.push('/promotions');
      } catch (err: any) {
        setError(err.message || 'Failed to create coupon');
      }
    });
  };

  return (
    <div style={{ padding: '32px', maxWidth: '640px' }}>
      <div style={{ marginBottom: '32px' }}>
        <div style={{ fontSize: '11px', color: 'var(--gold)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '4px' }}>Promotions</div>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', color: 'var(--cream)', fontWeight: 300, margin: 0 }}>New Coupon</h1>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Code */}
        <div>
          <label style={labelStyle}>Coupon Code *</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="e.g. LUXE20" style={{ ...inputStyle, flex: 1, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }} />
            <button type="button" onClick={generateCode} style={secondaryBtnStyle}>Auto-Generate</button>
          </div>
        </div>

        {/* Description */}
        <div>
          <label style={labelStyle}>Internal Note (optional)</label>
          <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="e.g. Diwali 2025 campaign" style={inputStyle} />
        </div>

        {/* Type + Value */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={labelStyle}>Type *</label>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as CouponType }))} style={inputStyle}>
              <option value="PERCENTAGE">Percentage (%)</option>
              <option value="FIXED_AMOUNT">Fixed Amount (₹)</option>
              <option value="FREE_SHIPPING">Free Shipping</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>{form.type === 'PERCENTAGE' ? 'Discount %' : form.type === 'FIXED_AMOUNT' ? 'Amount (₹)' : 'Value (N/A)'}</label>
            <input
              value={form.value}
              onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
              type="number" min="0"
              placeholder={form.type === 'PERCENTAGE' ? '10' : '500'}
              disabled={form.type === 'FREE_SHIPPING'}
              style={{ ...inputStyle, opacity: form.type === 'FREE_SHIPPING' ? 0.4 : 1 }}
            />
          </div>
        </div>

        {/* Constraints */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={labelStyle}>Min Order Amount (₹)</label>
            <input value={form.minOrderAmount} onChange={e => setForm(f => ({ ...f, minOrderAmount: e.target.value }))} type="number" min="0" placeholder="e.g. 20000" style={inputStyle} />
          </div>
          {form.type === 'PERCENTAGE' && (
            <div>
              <label style={labelStyle}>Max Discount Cap (₹)</label>
              <input value={form.maxDiscountCap} onChange={e => setForm(f => ({ ...f, maxDiscountCap: e.target.value }))} type="number" min="0" placeholder="e.g. 5000" style={inputStyle} />
            </div>
          )}
        </div>

        {/* Usage Limits */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={labelStyle}>Total Usage Limit</label>
            <input value={form.usageLimit} onChange={e => setForm(f => ({ ...f, usageLimit: e.target.value }))} type="number" min="1" placeholder="Unlimited (leave empty)" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Uses Per User</label>
            <input value={form.usageLimitPerUser} onChange={e => setForm(f => ({ ...f, usageLimitPerUser: e.target.value }))} type="number" min="1" placeholder="1" style={inputStyle} />
          </div>
        </div>

        {/* Dates */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={labelStyle}>Start Date (optional)</label>
            <input value={form.startsAt} onChange={e => setForm(f => ({ ...f, startsAt: e.target.value }))} type="datetime-local" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Expiry Date (optional)</label>
            <input value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} type="datetime-local" style={inputStyle} />
          </div>
        </div>

        {/* Source */}
        <div>
          <label style={labelStyle}>Source / Partner</label>
          <select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} style={inputStyle}>
            <option value="internal">Internal</option>
            <option value="pauket">Pauket</option>
            <option value="coupondunia">CouponDunia</option>
            <option value="cashkaro">CashKaro</option>
            <option value="other">Other</option>
          </select>
        </div>

        {error && <div style={{ color: '#C85050', fontSize: '13px', padding: '10px 14px', background: 'rgba(200,80,80,0.1)', borderRadius: '8px' }}>{error}</div>}

        <div style={{ display: 'flex', gap: '12px', paddingTop: '8px' }}>
          <button type="submit" disabled={isPending} style={{ ...primaryBtnStyle, opacity: isPending ? 0.7 : 1 }}>
            {isPending ? 'Creating...' : 'Create Coupon'}
          </button>
          <button type="button" onClick={() => router.back()} style={secondaryBtnStyle}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' };
const inputStyle: React.CSSProperties = { width: '100%', background: 'var(--obsidian)', border: '1px solid var(--border)', color: 'var(--cream)', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' };
const primaryBtnStyle: React.CSSProperties = { background: 'var(--gold)', color: '#0A0905', border: 'none', borderRadius: '10px', padding: '12px 24px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' };
const secondaryBtnStyle: React.CSSProperties = { background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px 20px', fontSize: '12px', cursor: 'pointer' };
