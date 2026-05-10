'use client';

import { useState } from 'react';
import { deleteUserAddressAction, setDefaultAddressAction } from './actions';

export default function AddressListClient({ initialAddresses }: { initialAddresses: any[] }) {
  const [addresses, setAddresses] = useState(initialAddresses);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this address?')) return;
    setLoadingId(id);
    const res = await deleteUserAddressAction(id);
    if (res.success) {
      setAddresses(prev => prev.filter(a => a.id !== id));
    } else {
      alert(res.error);
    }
    setLoadingId(null);
  };

  const handleSetDefault = async (id: string) => {
    setLoadingId(id);
    const res = await setDefaultAddressAction(id);
    if (res.success) {
      setAddresses(prev => prev.map(a => ({
        ...a,
        isDefault: a.id === id
      })));
    } else {
      alert(res.error);
    }
    setLoadingId(null);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
      {addresses.map((addr) => (
        <div key={addr.id} style={{ background: 'var(--surface)', border: `1px solid ${addr.isDefault ? 'var(--gold)' : 'var(--border)'}`, padding: '24px', position: 'relative', transition: 'all 0.3s' }}>
          {addr.isDefault && (
            <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'var(--gold)', color: 'var(--obsidian)', fontSize: '9px', padding: '2px 8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Default</div>
          )}
          
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '16px' }}>{addr.name}</div>
          
          <div style={{ color: 'var(--cream)', fontSize: '15px', lineHeight: 1.6, marginBottom: '20px' }}>
            {addr.street}<br />
            {addr.city}, {addr.state} {addr.pincode}<br />
            {addr.phone && <span style={{ color: 'var(--text-dim)', fontSize: '13px' }}>Phone: {addr.phone}</span>}
          </div>

          <div style={{ display: 'flex', gap: '16px', borderTop: '1px solid var(--surface2)', paddingTop: '16px' }}>
            {!addr.isDefault && (
              <button 
                onClick={() => handleSetDefault(addr.id)}
                disabled={loadingId === addr.id}
                style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: '11px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em', padding: 0 }}
              >
                Set as Default
              </button>
            )}
            <button 
              onClick={() => handleDelete(addr.id)}
              disabled={loadingId === addr.id}
              style={{ background: 'none', border: 'none', color: 'var(--red)', fontSize: '11px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em', padding: 0 }}
            >
              Remove
            </button>
          </div>
        </div>
      ))}

      {/* Add New Address Placeholder */}
      <div className="add-address-card" style={{ background: 'transparent', border: '1px dashed var(--border)', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'border-color 0.2s' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', color: 'var(--gold)', marginBottom: '8px' }}>+</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Add New Address</div>
        </div>
      </div>
    </div>
  );
}
