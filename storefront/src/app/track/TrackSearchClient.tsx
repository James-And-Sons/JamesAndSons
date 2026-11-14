'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TrackSearchClient() {
  const [orderNumber, setOrderNumber] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderNumber.trim()) {
      router.push(`/track/${orderNumber.trim().toUpperCase()}`);
    }
  };

  return (
    <main style={{ minHeight: '100vh', background: 'var(--obsidian)', color: 'var(--cream)' }}>
      
      {/* Mobile Layout */}
      <div className="md:hidden" style={{ paddingTop: '20px' }}>
        <div className="mobile-section-intro">
          <div>
            <div className="section-label" style={{ marginBottom: '2px' }}>Concierge Services</div>
            <div className="section-title" style={{ fontSize: '22px' }}>
              Track Your <em>Order</em>
            </div>
          </div>
        </div>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-muted)', margin: '16px 24px 32px', lineHeight: 1.6 }}>
          Enter your order number to follow the journey of your James & Sons masterpieces.
        </p>

        <form onSubmit={handleSearch} style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input 
            type="text" 
            placeholder="Order Number (e.g. JNS-1001)" 
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '16px 20px', 
              background: 'var(--surface)', 
              border: '1px solid var(--border)', 
              color: 'var(--cream)', 
              fontSize: '14px',
              fontFamily: 'var(--font-mono)',
              outline: 'none',
              borderRadius: '12px'
            }}
          />
          <button 
            type="submit"
            style={{ 
              width: '100%',
              background: 'var(--gold)',
              border: 'none',
              color: 'var(--obsidian)',
              padding: '16px',
              fontSize: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontWeight: 600,
              cursor: 'pointer',
              borderRadius: '12px'
            }}
          >
            Track Order
          </button>
        </form>

        <div style={{ marginTop: '40px', padding: '0 24px' }}>
          <div style={{ background: 'var(--surface2)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Order number can be found in your confirmation email. Need help? 
              <br /><br />
              <a href="mailto:vishal@jamesandsons.in" style={{ color: 'var(--gold)', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '10px' }}>Contact Concierge →</a>
            </p>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex" style={{ width: '100%', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: '500px', width: '100%', padding: '40px 20px', textAlign: 'center' }}>
          
          <div className="section-label">Concierge Services</div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '42px', fontWeight: 300, marginTop: '12px', marginBottom: '24px' }}>Track Your Order</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px', marginBottom: '48px', lineHeight: 1.6 }}>
            Enter your order number to follow the journey of your James & Sons masterpieces.
          </p>

          <form onSubmit={handleSearch} style={{ position: 'relative' }}>
            <input 
              type="text" 
              placeholder="Order Number (e.g. JNS-1001)" 
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '20px 24px', 
                background: 'var(--surface)', 
                border: '1px solid var(--border)', 
                color: 'var(--cream)', 
                fontSize: '14px',
                fontFamily: 'var(--font-mono)',
                outline: 'none',
                transition: 'border-color 0.3s'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--gold)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
            />
            <button 
              type="submit"
              style={{ 
                position: 'absolute', 
                right: '12px', 
                top: '50%', 
                transform: 'translateY(-50%)',
                background: 'var(--gold)',
                border: 'none',
                color: 'var(--obsidian)',
                padding: '8px 20px',
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Track
            </button>
          </form>

          <div style={{ marginTop: '60px', borderTop: '1px solid var(--surface2)', paddingTop: '32px' }}>
            <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
              Order number can be found in your confirmation email. 
              Need help? <a href="mailto:vishal@jamesandsons.in" style={{ color: 'var(--gold)', textDecoration: 'none' }}>Contact Concierge</a>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
