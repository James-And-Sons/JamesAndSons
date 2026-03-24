'use client';
import { useState } from 'react';
import type { Product } from '@/lib/utils';
import { formatPrice } from '@/lib/utils';
import { User } from '@supabase/supabase-js';

type Props = {
  products: Product[];
  preselectedProduct?: Product;
  user: User;
};

type RFQLineItem = {
  product: Product;
  quantity: number;
  targetPrice: string;
};

import { submitRfqAction } from './actions';

export default function RFQForm({ products, preselectedProduct, user }: Props) {
  const meta = user.user_metadata || {};
  const [items, setItems] = useState<RFQLineItem[]>(
    preselectedProduct ? [{ product: preselectedProduct, quantity: 1, targetPrice: '' }] : []
  );
  const [selectedProductId, setSelectedProductId] = useState('');
  const [projectName, setProjectName] = useState('');
  const [timeline, setTimeline] = useState('');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addProduct = () => {
    const p = products.find(pr => pr.id === selectedProductId);
    if (!p) return;
    if (items.some(i => i.product.id === p.id)) return;
    setItems(prev => [...prev, { product: p, quantity: 1, targetPrice: '' }]);
    setSelectedProductId('');
  };

  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.product.id !== id));
  const updateItem = (id: string, field: keyof Pick<RFQLineItem, 'quantity' | 'targetPrice'>, value: string | number) => {
    setItems(prev => prev.map(i => i.product.id === id ? { ...i, [field]: value } : i));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    setLoading(true);
    setError('');

    const res = await submitRfqAction(user.id, {
      projectName,
      timeline,
      notes,
      items: items.map(i => ({
        productId: i.product.id,
        quantity: i.quantity,
        targetPrice: i.targetPrice
      }))
    });

    if (res.success) {
      setSubmitted(true);
    } else {
      setError(res.error || 'Failed to submit RFQ');
    }
    setLoading(false);
  };

  if (submitted) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', border: '1px solid var(--border-gold)', background: 'rgba(196,160,90,0.03)' }}>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: '52px', color: 'var(--gold)', marginBottom: '16px' }}>✓</div>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', fontWeight: 300, color: 'var(--cream)', marginBottom: '12px' }}>RFQ Submitted</h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.7, maxWidth: '400px', margin: '0 auto 28px' }}>
          Thank you! Our trade team will review your request and send a detailed quotation to <strong style={{ color: 'var(--text)' }}>{user.email}</strong> within 48 hours.
        </p>
        <a href="/account" className="btn-primary" style={{ textDecoration: 'none', padding: '12px 32px' }}>View My Account</a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>

      {/* Contact & Project Info */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '28px' }}>
        <div className="section-label" style={{ marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid var(--border)' }}>Contact Details</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Name</label>
            <input readOnly value={meta.contact_name || `${meta.first_name || ''} ${meta.last_name || ''}`.trim() || user.email || ''} className="rfq-input" />
          </div>
          <div>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Email</label>
            <input readOnly value={user.email || ''} className="rfq-input" />
          </div>
          {meta.company_name && (
            <div>
              <label style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Company</label>
              <input readOnly value={meta.company_name} className="rfq-input" />
            </div>
          )}
          <div>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Project Name <span style={{ color: 'var(--red)' }}>*</span></label>
            <input required value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="e.g. Oberoi Hotel Delhi Lobby" className="rfq-input" />
          </div>
          <div>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Delivery Timeline</label>
            <select value={timeline} onChange={e => setTimeline(e.target.value)} className="rfq-input">
              <option value="">Select timeline</option>
              <option value="urgent">Urgent (within 2 weeks)</option>
              <option value="standard">Standard (4–8 weeks)</option>
              <option value="custom">Custom manufacturing (10–14 weeks)</option>
              <option value="flexible">Flexible</option>
            </select>
          </div>
        </div>
      </div>

      {/* Product Line Items */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '28px' }}>
        <div className="section-label" style={{ marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid var(--border)' }}>Products Required</div>

        {items.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
            <thead>
              <tr style={{ background: 'var(--surface2)' }}>
                {['Product', 'D2C Price', 'Quantity', 'Target Price (optional)', ''].map(h => (
                  <th key={h} style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', padding: '10px 12px', textAlign: 'left', border: '1px solid var(--border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.product.id}>
                  <td style={{ padding: '12px', border: '1px solid var(--border)', fontFamily: 'var(--font-serif)', fontSize: '14px', color: 'var(--cream)' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '2px' }}>{item.product.sku}</div>
                    {item.product.name}
                  </td>
                  <td style={{ padding: '12px', border: '1px solid var(--border)', fontFamily: 'var(--font-serif)', fontSize: '15px', color: 'var(--gold-light)' }}>{formatPrice(item.product.d2cPrice)}</td>
                  <td style={{ padding: '12px', border: '1px solid var(--border)' }}>
                    <input type="number" min={1} value={item.quantity} onChange={e => updateItem(item.product.id, 'quantity', parseInt(e.target.value) || 1)} className="rfq-input" style={{ width: '70px' }} />
                  </td>
                  <td style={{ padding: '12px', border: '1px solid var(--border)' }}>
                    <input type="text" placeholder="₹ Target" value={item.targetPrice} onChange={e => updateItem(item.product.id, 'targetPrice', e.target.value)} className="rfq-input" style={{ width: '120px' }} />
                  </td>
                  <td style={{ padding: '12px', border: '1px solid var(--border)', textAlign: 'center' }}>
                    <button type="button" onClick={() => removeItem(item.product.id)} style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '16px' }}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Add a Product</label>
            <select value={selectedProductId} onChange={e => setSelectedProductId(e.target.value)} className="rfq-input">
              <option value="">Select product...</option>
              {products.filter(p => !items.some(i => i.product.id === p.id)).map(p => (
                <option key={p.id} value={p.id}>{p.name} — {formatPrice(p.d2cPrice)}</option>
              ))}
            </select>
          </div>
          <button type="button" onClick={addProduct} disabled={!selectedProductId} className="btn-outline" style={{ padding: '10px 20px', whiteSpace: 'nowrap', opacity: selectedProductId ? 1 : 0.5 }}>+ Add</button>
        </div>
      </div>

      {/* Notes */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '28px' }}>
        <div className="section-label" style={{ marginBottom: '16px', paddingBottom: '14px', borderBottom: '1px solid var(--border)' }}>Additional Notes</div>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={5}
          placeholder="Describe your project, customisation requirements, special finishes, installation preferences, or any other details..."
          className="rfq-input"
          style={{ resize: 'vertical', width: '100%' }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '16px 0' }}>
        <a href="/collections" className="btn-outline" style={{ padding: '14px 28px', textDecoration: 'none' }}>Continue Browsing</a>
        <button type="submit" disabled={items.length === 0 || loading} className="btn-primary" style={{ padding: '14px 36px', opacity: items.length === 0 ? 0.5 : 1, cursor: items.length === 0 ? 'not-allowed' : 'pointer' }}>
          {loading ? 'Submitting...' : 'Submit RFQ →'}
        </button>
      </div>

      <style>{`
        .rfq-input {
          background: var(--surface2);
          border: 1px solid var(--border);
          color: var(--text);
          font-family: var(--font-body);
          font-size: 13px;
          padding: 9px 12px;
          outline: none;
          width: 100%;
          transition: border-color 0.2s;
        }
        .rfq-input:focus { border-color: var(--gold); }
        .rfq-input[readonly] { opacity: 0.6; cursor: default; }
      `}</style>
    </form>
  );
}
