'use client';

import { useState } from 'react';
import { submitNDRReattemptAction } from '../actions';
import Navigation from '@/components/Navigation';

export default function NDRSlotPickerClient({ shipmentId, orderNumber }: { shipmentId: string, orderNumber: string }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  
  // Generate next 3 days for selection
  const dates = [1, 2, 3].map(add => {
    const d = new Date();
    d.setDate(d.getDate() + add);
    return {
      raw: d.toISOString().split('T')[0],
      display: d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })
    };
  });

  const handleReattempt = async () => {
    if (!selectedDate) {
      setError('Please select a preferred date for re-delivery.');
      return;
    }
    setLoading(true);
    const res = await submitNDRReattemptAction(shipmentId, selectedDate, 'Customer requested via NDR portal');
    if (res.success) {
      setStep(2);
    } else {
      setError(res.message || 'Action failed.');
    }
    setLoading(false);
  };

  return (
    <>
      <main style={{ minHeight: '100vh', background: 'var(--obsidian)', color: 'var(--cream)' }}>
        <div style={{ maxWidth: '500px', margin: '0 auto', padding: '120px 20px' }}>
          
          {step === 1 ? (
            <div style={{ animation: 'fadeIn 0.5s ease' }}>
              <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                <div style={{ width: '60px', height: '60px', background: 'rgba(196,160,90,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: '1px solid var(--gold)' }}>
                  <span style={{ fontSize: '24px', color: 'var(--gold)' }}>🚚</span>
                </div>
                <div className="section-label">Delivery Re-attempt</div>
                <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', fontWeight: 300, marginTop: '8px' }}>Missed You!</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '12px', lineHeight: 1.6 }}>
                  Our courier couldn't deliver your order <strong>{orderNumber}</strong>. Please select a convenient time for us to try again.
                </p>
              </div>

              {error && <div style={{ color: 'var(--red)', fontSize: '11px', marginBottom: '20px', textAlign: 'center' }}>⚠ {error}</div>}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>Available Slots</div>
                {dates.map(d => (
                  <button 
                    key={d.raw}
                    onClick={() => setSelectedDate(d.raw)}
                    style={{ 
                      padding: '18px', 
                      textAlign: 'left', 
                      background: selectedDate === d.raw ? 'rgba(196,160,90,0.1)' : 'var(--surface)', 
                      border: `1px solid ${selectedDate === d.raw ? 'var(--gold)' : 'var(--border)'}`,
                      color: selectedDate === d.raw ? 'var(--cream)' : 'var(--text-muted)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '15px' }}>{d.display}</span>
                    {selectedDate === d.raw && <span style={{ color: 'var(--gold)' }}>✓</span>}
                  </button>
                ))}
              </div>

              <button 
                disabled={loading} 
                onClick={handleReattempt} 
                className="btn-primary" 
                style={{ width: '100%', padding: '18px' }}
              >
                {loading ? 'Scheduling...' : 'Confirm Re-delivery'}
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>
              <div style={{ width: '80px', height: '80px', background: 'var(--gold)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px' }}>
                <span style={{ fontSize: '32px', color: 'var(--obsidian)' }}>✓</span>
              </div>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '36px', fontWeight: 300, color: 'var(--cream)', marginBottom: '16px' }}>Scheduled</h1>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--text-muted)', marginBottom: '40px', lineHeight: 1.6 }}>
                Thank you. We have notified the courier. Your order will be re-attempted on <strong>{dates.find(d => d.raw === selectedDate)?.display}</strong>.
              </p>
              <button onClick={() => window.location.href = '/'} className="btn-outline" style={{ padding: '14px 40px' }}>Back to Store</button>
            </div>
          )}

        </div>
      </main>
    </>
  );
}
