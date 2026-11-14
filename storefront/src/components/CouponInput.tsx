'use client';

import { useState, useTransition } from 'react';
import { useCartStore } from '@/store/cart';
import { validateCoupon } from '@/app/promotions/actions';
import { formatPrice } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────
// Reusable Coupon Input Component
// Used in: CartDrawer, CartPageClient, CheckoutPageClient
// ─────────────────────────────────────────────────────────────

export default function CouponInput({ userId }: { userId?: string | null }) {
  const { total, appliedCoupon, applyCoupon, removeCoupon } = useCartStore();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleApply = () => {
    if (!code.trim()) return;
    setError('');
    startTransition(async () => {
      const result = await validateCoupon(code.trim(), total(), userId);
      if (result.valid) {
        applyCoupon({
          couponId: result.couponId,
          code: result.code,
          discountAmount: result.discountAmount,
          freeShipping: result.freeShipping,
          description: result.description,
        });
        setCode('');
      } else {
        setError(result.error);
      }
    });
  };

  // ── If a coupon is already applied, show the applied state ──
  if (appliedCoupon) {
    return (
      <div style={{
        background: 'rgba(76, 175, 122, 0.08)',
        border: '0.5px solid rgba(76, 175, 122, 0.3)',
        borderRadius: '12px',
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <i className="ti ti-discount-check" style={{ color: 'var(--green)', fontSize: '18px', flexShrink: 0 }}></i>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--green)', letterSpacing: '0.1em' }}>
              {appliedCoupon.code}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>
              {appliedCoupon.freeShipping
                ? 'Free shipping applied'
                : `${formatPrice(appliedCoupon.discountAmount)} off`}
            </div>
          </div>
        </div>
        <button
          onClick={removeCoupon}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-dim)',
            fontSize: '11px',
            cursor: 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            flexShrink: 0,
          }}
        >
          Remove
        </button>
      </div>
    );
  }

  // ── Input state ──────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={code}
          onChange={e => { setCode(e.target.value.toUpperCase()); setError(''); }}
          onKeyDown={e => e.key === 'Enter' && handleApply()}
          placeholder="PROMO CODE"
          maxLength={30}
          style={{
            flex: 1,
            background: 'var(--void)',
            border: `1px solid ${error ? 'rgba(200,80,80,0.5)' : 'var(--border)'}`,
            color: 'var(--cream)',
            padding: '10px 12px',
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            letterSpacing: '0.08em',
            outline: 'none',
            borderRadius: '8px',
            transition: 'border-color 0.2s',
          }}
        />
        <button
          onClick={handleApply}
          disabled={!code.trim() || isPending}
          style={{
            background: code.trim() ? 'rgba(201,168,76,0.15)' : 'transparent',
            border: '1px solid var(--border)',
            color: code.trim() ? 'var(--gold)' : 'var(--text-dim)',
            padding: '0 16px',
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            cursor: code.trim() ? 'pointer' : 'not-allowed',
            borderRadius: '8px',
            transition: 'all 0.2s',
            whiteSpace: 'nowrap',
          }}
        >
          {isPending ? '...' : 'Apply'}
        </button>
      </div>
      {error && (
        <div style={{ fontSize: '11px', color: 'rgba(200,80,80,0.9)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <i className="ti ti-alert-circle" style={{ fontSize: '13px' }}></i>
          {error}
        </div>
      )}
    </div>
  );
}
