'use client';

import { useState } from 'react';
import Link from 'next/link';

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  total: number;
  product: {
    id: string;
    name: string;
    images: string[];
  };
}

interface Order {
  id: string;
  orderNumber: string;
  createdAt: string | Date;
  status: string;
  items: OrderItem[];
}

interface NewTicketFormProps {
  orders: Order[];
  createTicketAction: (data: {
    category: string;
    subject: string;
    description: string;
    orderId?: string;
    orderItems?: any;
    attachments: string[];
  }) => Promise<{ success: boolean; error?: string; ticketId?: string }>;
}

export default function NewTicketForm({ orders, createTicketAction }: NewTicketFormProps) {
  const [category, setCategory] = useState('GENERAL');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});
  
  // Media Attachments states
  const [attachments, setAttachments] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const selectedOrder = orders.find(o => o.id === selectedOrderId);

  // Toggle order items selection
  const handleItemToggle = (itemId: string, maxQty: number) => {
    setSelectedItems(prev => {
      const next = { ...prev, [itemId]: !prev[itemId] };
      if (next[itemId]) {
        setItemQuantities(q => ({ ...q, [itemId]: maxQty }));
      } else {
        setItemQuantities(q => {
          const { [itemId]: _, ...rest } = q;
          return rest;
        });
      }
      return next;
    });
  };

  const handleQuantityChange = (itemId: string, val: number) => {
    setItemQuantities(prev => ({ ...prev, [itemId]: val }));
  };

  // Upload file to Cloudinary
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setErrorMessage('');

    try {
      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // 1. Get signature parameters
        const timestamp = Math.round(new Date().getTime() / 1000);
        const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ml_default';
        const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dy1durdrj';

        if (!apiKey) {
          throw new Error('Cloudinary configuration is missing. Verify NEXT_PUBLIC_CLOUDINARY_API_KEY is configured.');
        }

        const paramsToSign = {
          timestamp,
          upload_preset: uploadPreset,
        };

        // 2. Fetch signature from API
        const sigRes = await fetch('/api/sign-cloudinary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paramsToSign }),
        });
        
        if (!sigRes.ok) {
          throw new Error('Failed to obtain upload signature.');
        }
        
        const { signature } = await sigRes.json();

        // 3. Upload file directly to Cloudinary
        const formData = new FormData();
        formData.append('file', file);
        formData.append('api_key', apiKey);
        formData.append('timestamp', timestamp.toString());
        formData.append('signature', signature);
        formData.append('upload_preset', uploadPreset);

        const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          throw new Error(`Upload failed for ${file.name}`);
        }

        const data = await uploadRes.json();
        uploadedUrls.push(data.secure_url);
      }

      setAttachments(prev => [...prev, ...uploadedUrls]);
    } catch (error: any) {
      console.error('File upload error:', error);
      setErrorMessage(error.message || 'Error uploading file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAttachment = (indexToRemove: number) => {
    setAttachments(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage('');

    // Prepare selected items list
    let finalOrderItems: any = null;
    if ((category === 'RETURN' || category === 'DAMAGE') && selectedOrder) {
      const itemsList = selectedOrder.items
        .filter(item => selectedItems[item.id])
        .map(item => ({
          productId: item.product.id,
          name: item.product.name,
          quantity: itemQuantities[item.id] || item.quantity
        }));
      
      if (itemsList.length > 0) {
        finalOrderItems = itemsList;
      }
    }

    try {
      const result = await createTicketAction({
        category,
        subject,
        description,
        orderId: selectedOrderId || undefined,
        orderItems: finalOrderItems,
        attachments
      });

      if (result.success && result.ticketId) {
        window.location.href = `/account/tickets/${result.ticketId}`;
      } else {
        setErrorMessage(result.error || 'Failed to submit ticket.');
        setSubmitting(false);
      }
    } catch (err: any) {
      console.error('Ticket submission error:', err);
      setErrorMessage('An unexpected error occurred.');
      setSubmitting(false);
    }
  };

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '40px' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {errorMessage && (
          <div style={{ color: 'var(--red)', fontFamily: 'var(--font-mono)', fontSize: '11px', padding: '12px', background: 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '8px' }}>
            ⚠ {errorMessage}
          </div>
        )}

        <div>
          <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-muted)', marginBottom: '8px' }}>
            Topic / Category *
          </label>
          <select 
            value={category}
            onChange={e => {
              setCategory(e.target.value);
              setSelectedOrderId('');
              setSelectedItems({});
              setItemQuantities({});
            }}
            style={{ width: '100%', padding: '16px', background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: '15px', outline: 'none' }}
          >
            <option value="GENERAL">General Inquiry</option>
            <option value="RETURN">Return Request</option>
            <option value="DAMAGE">Damaged or Defective Product</option>
            <option value="SHIPPING">Delivery or Shipping Delay</option>
            <option value="BILLING">Billing or Payment Issue</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-muted)', marginBottom: '8px' }}>
            Subject *
          </label>
          <input 
            type="text" 
            required
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder={category === 'RETURN' ? 'E.g. Request return for custom chandelier' : 'E.g. Broken glass pane on arrival, installation assistance'}
            style={{ width: '100%', padding: '16px', background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: '15px' }}
          />
        </div>

        {/* Dynamic Order Selector */}
        {(category === 'RETURN' || category === 'DAMAGE' || category === 'SHIPPING' || category === 'BILLING') && (
          <div>
            <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Related Order {category === 'RETURN' ? '*' : '(Optional)'}
            </label>
            <select 
              required={category === 'RETURN'}
              value={selectedOrderId}
              onChange={e => {
                setSelectedOrderId(e.target.value);
                setSelectedItems({});
                setItemQuantities({});
              }}
              style={{ width: '100%', padding: '16px', background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: '15px', outline: 'none' }}
            >
              <option value="">-- Choose Order --</option>
              {orders.map(o => (
                <option key={o.id} value={o.id}>
                  Order #{o.orderNumber} - {new Date(o.createdAt).toLocaleDateString()} ({o.status})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Dynamic Items Checklist for Returns/Damage */}
        {(category === 'RETURN' || category === 'DAMAGE') && selectedOrder && (
          <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', padding: '24px', borderRadius: '8px' }}>
            <div style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Select Items to {category === 'RETURN' ? 'Return' : 'Report Issue'} *
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {selectedOrder.items.map(item => (
                <div 
                  key={item.id}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    padding: '12px 16px', 
                    background: selectedItems[item.id] ? 'rgba(196,160,90,0.04)' : 'var(--background)', 
                    border: `1px solid ${selectedItems[item.id] ? 'var(--gold)' : 'var(--border)'}`,
                    borderRadius: '8px' 
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input 
                      type="checkbox"
                      checked={!!selectedItems[item.id]}
                      onChange={() => handleItemToggle(item.id, item.quantity)}
                      style={{ cursor: 'pointer', accentColor: 'var(--gold)' }}
                    />
                    <div style={{ color: 'var(--cream)', fontSize: '14px', fontWeight: 500 }}>
                      {item.product.name}
                    </div>
                  </div>

                  {selectedItems[item.id] && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>QTY:</span>
                      <select
                        value={itemQuantities[item.id] || 1}
                        onChange={e => handleQuantityChange(item.id, parseInt(e.target.value))}
                        style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', padding: '4px 8px', outline: 'none', borderRadius: '4px' }}
                      >
                        {Array.from({ length: item.quantity }, (_, idx) => idx + 1).map(val => (
                          <option key={val} value={val}>{val}</option>
                        ))}
                      </select>
                      <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>of {item.quantity}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-muted)', marginBottom: '8px' }}>
            Description *
          </label>
          <textarea 
            required
            rows={6}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Please detail your request. For returns, state the reason or specific product issues..."
            style={{ width: '100%', padding: '16px', background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: '15px', resize: 'vertical' }}
          />
        </div>

        {/* Media Attachments Zone */}
        <div>
          <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-muted)', marginBottom: '8px' }}>
            Supporting Reference Media (Optional)
          </label>
          
          <div 
            style={{ 
              border: '1px dashed var(--border)', 
              borderRadius: '8px', 
              padding: '24px', 
              textAlign: 'center', 
              background: 'rgba(255,255,255,0.01)',
              position: 'relative'
            }}
          >
            <input 
              type="file"
              multiple
              accept="image/*,application/pdf"
              onChange={handleFileUpload}
              disabled={uploading}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: 0,
                cursor: 'pointer'
              }}
            />
            <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
              {uploading ? (
                <span style={{ color: 'var(--gold)' }}>Uploading attachments...</span>
              ) : (
                <>
                  <i className="ti ti-upload" style={{ fontSize: '20px', color: 'var(--gold)', display: 'block', marginBottom: '8px' }}></i>
                  Drag and drop files here, or <strong style={{ color: 'var(--gold)' }}>click to upload</strong> (Images or PDFs)
                </>
              )}
            </div>
          </div>

          {/* Attachments Thumbnails List */}
          {attachments.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '16px' }}>
              {attachments.map((url, idx) => {
                const isPdf = url.toLowerCase().endsWith('.pdf');
                return (
                  <div key={idx} style={{ position: 'relative', width: '80px', height: '80px', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden', background: 'var(--background)' }}>
                    {isPdf ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                        <i className="ti ti-file-text" style={{ fontSize: '24px', color: 'var(--red)' }}></i>
                        <span style={{ fontSize: '9px', marginTop: '4px' }}>PDF</span>
                      </div>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={url} alt="Attachment" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(idx)}
                      style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        width: '16px',
                        height: '16px',
                        background: 'rgba(0,0,0,0.6)',
                        border: 'none',
                        color: '#fff',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        cursor: 'pointer'
                      }}
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
          <Link href="/account/tickets" className="btn-outline" style={{ padding: '14px 28px', textDecoration: 'none' }}>
            Cancel
          </Link>
          <button 
            type="submit" 
            disabled={submitting || uploading}
            className="btn-primary" 
            style={{ padding: '14px 28px' }}
          >
            {submitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>
    </div>
  );
}
