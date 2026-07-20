'use client';

import { useEffect, useState } from 'react';
import { getOrderTrackingAction } from '../actions';
import Navigation from '@/components/Navigation';
import { formatPrice } from '@/lib/utils';

export default function TrackingPageClient({ orderNumber }: { orderNumber: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTracking = async () => {
      const res = await getOrderTrackingAction(orderNumber);
      if (res.success) {
        setData(res);
      } else {
        setError(res.error || 'Tracking unavailable');
      }
      setLoading(false);
    };
    fetchTracking();
  }, [orderNumber]);

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--obsidian)' }}>
        <div className="loader"></div>
      </div>
    );
  }

  const tracking = data?.tracking;
  const shipStatus = tracking?.shipment_track?.[0];
  const history = tracking?.shipment_track_activities || [];

  return (
    <>
      <main style={{ minHeight: '100vh', background: 'var(--obsidian)', color: 'var(--cream)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '120px 20px' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <div className="section-label">Order Tracking</div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '48px', fontWeight: 300, marginTop: '12px' }}>{orderNumber}</h1>
          </div>

          {!tracking ? (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '40px', textAlign: 'center' }}>
              <div style={{ fontSize: '18px', color: 'var(--gold)', marginBottom: '12px' }}>Preparing Shipment</div>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{data?.message || 'We are carefully preparing your masterpieces for delivery.'}</p>
            </div>
          ) : (
            <div style={{ animation: 'fadeIn 0.8s ease' }}>
              
              {/* Status Header */}
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '32px', marginBottom: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Current Status</div>
                    <div style={{ fontSize: '24px', color: 'var(--gold)', marginTop: '4px' }}>{shipStatus?.current_status || 'In Transit'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Estimated Delivery</div>
                    <div style={{ fontSize: '18px', color: 'var(--cream)', marginTop: '4px' }}>{shipStatus?.expected_date || 'Calculated Soon'}</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div style={{ height: '4px', background: 'var(--surface2)', borderRadius: '2px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ 
                    position: 'absolute', 
                    top: 0, left: 0, height: '100%', 
                    width: shipStatus?.current_status === 'Delivered' ? '100%' : '65%', 
                    background: 'var(--gold)',
                    transition: 'width 1.5s ease-in-out'
                  }}></div>
                </div>
              </div>

              {/* Activity History */}
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '32px' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '24px' }}>Shipment History</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {history.map((activity: any, idx: number) => (
                    <div key={idx} style={{ display: 'flex', gap: '20px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: idx === 0 ? 'var(--gold)' : 'var(--border)', marginTop: '6px' }}></div>
                        {idx < history.length - 1 && <div style={{ width: '1px', flex: 1, background: 'var(--border)', margin: '4px 0' }}></div>}
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', color: idx === 0 ? 'var(--cream)' : 'var(--text-muted)', fontWeight: idx === 0 ? 500 : 400 }}>{activity.activity}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '2px' }}>{activity.location} | {activity.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          <div style={{ marginTop: '40px', textAlign: 'center' }}>
            <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Questions about your delivery? Contact our concierge at vishal@jamesandsons.in</p>
          </div>

        </div>
      </main>
    </>
  );
}
