'use client';

import { useState } from 'react';
import { deleteUserAddressAction, setDefaultAddressAction, addUserAddressAction } from './actions';

export default function AddressListClient({ initialAddresses }: { initialAddresses: any[] }) {
  const [addresses, setAddresses] = useState(initialAddresses);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [adding, setAdding] = useState(false);
  
  const [newAddr, setNewAddr] = useState({
    name: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    isDefault: false
  });

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this address?')) return;
    setLoadingId(id);
    const res = await deleteUserAddressAction(id);
    if (res.success) {
      setAddresses(prev => prev.filter(a => a.id !== id));
    } else {
      alert(res.error || 'Failed to remove address');
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
      alert(res.error || 'Failed to set default');
    }
    setLoadingId(null);
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    const res = await addUserAddressAction(newAddr);
    if (res.success) {
      setAddresses(prev => [...prev.map(a => newAddr.isDefault ? {...a, isDefault: false} : a), res.address]);
      setShowModal(false);
      setNewAddr({ name: '', street: '', city: '', state: '', pincode: '', phone: '', isDefault: false });
    } else {
      alert(res.error || 'Failed to add address');
    }
    setAdding(false);
  };

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
        {addresses.map((addr) => (
          <div key={addr.id} style={{ background: 'var(--surface)', border: `1px solid ${addr.isDefault ? 'var(--gold)' : 'var(--border)'}`, padding: '24px', position: 'relative', transition: 'all 0.3s' }}>
            {addr.isDefault && (
              <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'var(--gold)', color: 'var(--obsidian)', fontSize: '9px', padding: '2px 8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Default</div>
            )}
            
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gold)', marginBottom: '16px' }}>{addr.name}</div>
            
            <div style={{ color: 'var(--cream)', fontSize: '15px', lineHeight: 1.6, marginBottom: '20px', minHeight: '80px' }}>
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
                style={{ background: 'none', border: 'none', color: 'var(--red)', fontSize: '11px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em', padding: 0, opacity: 0.8 }}
              >
                {loadingId === addr.id ? '...' : 'Remove'}
              </button>
            </div>
          </div>
        ))}

        {/* Add New Address Card */}
        <div 
          onClick={() => setShowModal(true)}
          className="add-address-card" 
          style={{ background: 'transparent', border: '1px dashed var(--border)', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', minHeight: '200px' }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', color: 'var(--gold)', marginBottom: '8px' }}>+</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Add New Address</div>
          </div>
        </div>
      </div>

      {/* Modal Overlay */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--obsidian)', border: '1px solid var(--border)', width: '100%', maxWidth: '500px', padding: '40px', position: 'relative', animation: 'fadeIn 0.3s ease' }}>
            <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}>×</button>
            
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', fontWeight: 300, color: 'var(--cream)', marginBottom: '32px' }}>Add New Address</h2>
            
            <form onSubmit={handleAddAddress} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>Address Name (e.g. Home, Office)</label>
                <input required value={newAddr.name} onChange={e => setNewAddr({...newAddr, name: e.target.value})} style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', padding: '12px', color: 'var(--cream)', outline: 'none' }} placeholder="Home" />
              </div>
              
              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>Street Address</label>
                <input required value={newAddr.street} onChange={e => setNewAddr({...newAddr, street: e.target.value})} style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', padding: '12px', color: 'var(--cream)', outline: 'none' }} placeholder="123 Luxury Lane" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>City</label>
                  <input required value={newAddr.city} onChange={e => setNewAddr({...newAddr, city: e.target.value})} style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', padding: '12px', color: 'var(--cream)', outline: 'none' }} placeholder="Mumbai" />
                </div>
                <div>
                  <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>State</label>
                  <input required value={newAddr.state} onChange={e => setNewAddr({...newAddr, state: e.target.value})} style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', padding: '12px', color: 'var(--cream)', outline: 'none' }} placeholder="Maharashtra" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>Pincode</label>
                  <input required value={newAddr.pincode} onChange={e => setNewAddr({...newAddr, pincode: e.target.value})} style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', padding: '12px', color: 'var(--cream)', outline: 'none' }} placeholder="400001" maxLength={6} />
                </div>
                <div>
                  <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>Phone Number</label>
                  <input required value={newAddr.phone} onChange={e => setNewAddr({...newAddr, phone: e.target.value})} style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', padding: '12px', color: 'var(--cream)', outline: 'none' }} placeholder="9876543210" maxLength={10} />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                <input type="checkbox" id="isDefault" checked={newAddr.isDefault} onChange={e => setNewAddr({...newAddr, isDefault: e.target.checked})} />
                <label htmlFor="isDefault" style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-muted)', cursor: 'pointer' }}>Set as default address</label>
              </div>

              <button disabled={adding} type="submit" className="btn-primary" style={{ width: '100%', marginTop: '12px', padding: '16px' }}>
                {adding ? 'Adding...' : 'Save Address'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
