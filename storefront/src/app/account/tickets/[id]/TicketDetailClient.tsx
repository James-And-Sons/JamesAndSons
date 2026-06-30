'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';

interface TicketMessage {
  id: string;
  authorId: string;
  message: string;
  isAdmin: boolean;
  attachments: string[];
  createdAt: string | Date;
}

interface Ticket {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  category: string;
  attachments: string[];
  orderItems: any;
  createdAt: string | Date;
  order?: {
    id: string;
    orderNumber: string;
  } | null;
  ticketMessages: TicketMessage[];
}

interface TicketDetailClientProps {
  ticket: Ticket;
  userId: string;
  addReplyAction: (message: string, attachments: string[]) => Promise<{ success: boolean; error?: string }>;
  resolveTicketAction: () => Promise<{ success: boolean; error?: string }>;
}

export default function TicketDetailClient({
  ticket,
  userId,
  addReplyAction,
  resolveTicketAction
}: TicketDetailClientProps) {
  const [replyMessage, setReplyMessage] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'color: var(--gold); border-color: var(--border-gold); background: rgba(196,160,90,0.05);';
      case 'IN_PROGRESS': return 'color: #60a5fa; border-color: rgba(96,165,250,0.4); background: rgba(96,165,250,0.05);';
      case 'RESOLVED': return 'color: #4ade80; border-color: rgba(74,222,128,0.4); background: rgba(74,222,128,0.05);';
      case 'CLOSED': return 'color: var(--text-muted); border-color: var(--border); background: rgba(255,255,255,0.02);';
      default: return 'color: var(--text); border-color: var(--border);';
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'GENERAL': return 'General Inquiry';
      case 'RETURN': return 'Return Request';
      case 'DAMAGE': return 'Product Defect / Damage';
      case 'SHIPPING': return 'Logistics & Delivery';
      case 'BILLING': return 'Billing & Invoice';
      default: return cat;
    }
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
          throw new Error('Cloudinary configuration is missing. Verify env variables.');
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
          throw new Error('Failed to sign upload request.');
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
      setErrorMessage(error.message || 'Error uploading file.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAttachment = (indexToRemove: number) => {
    setAttachments(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;

    setSubmitting(true);
    setErrorMessage('');

    try {
      const res = await addReplyAction(replyMessage, attachments);
      if (res.success) {
        setReplyMessage('');
        setAttachments([]);
      } else {
        setErrorMessage(res.error || 'Failed to send reply.');
      }
    } catch (err: any) {
      setErrorMessage('Failed to send message.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async () => {
    setSubmitting(true);
    setErrorMessage('');
    try {
      const res = await resolveTicketAction();
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to mark ticket resolved.');
      }
    } catch (err) {
      setErrorMessage('Failed to resolve ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main style={{ paddingTop: '64px', minHeight: '100vh', background: 'var(--obsidian)' }}>
      {/* Header Info */}
      <div style={{ background: 'var(--void)', borderBottom: '1px solid var(--border)', padding: '40px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <Link href="/account/tickets" style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-muted)', textDecoration: 'none', marginBottom: '16px', display: 'inline-block' }}>
              ← Back to Tickets
            </Link>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(24px,3vw,32px)', fontWeight: 300, color: 'var(--cream)', lineHeight: 1.2, marginBottom: '8px' }}>
              {ticket.subject}
            </h1>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
              <span>Ticket #{ticket.ticketNumber}</span>
              <span>·</span>
              <span>Created: {new Date(ticket.createdAt).toLocaleDateString()}</span>
              <span>·</span>
              <span style={{ color: 'var(--gold)' }}>{getCategoryLabel(ticket.category)}</span>
            </div>
            {ticket.order && (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
                Related Order: <Link href={`/account/orders`} style={{ color: 'var(--gold)', textDecoration: 'none' }}>#{ticket.order.orderNumber}</Link>
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
            <span style={{ 
              fontFamily: 'var(--font-mono)', 
              fontSize: '10px', 
              textTransform: 'uppercase', 
              letterSpacing: '0.15em', 
              padding: '6px 12px', 
              border: '1px solid', 
              borderRadius: '4px',
              ...({
                color: getStatusColor(ticket.status).split('color:')[1].split(';')[0].trim(),
                borderColor: getStatusColor(ticket.status).split('border-color:')[1].split(';')[0].trim(),
                background: getStatusColor(ticket.status).split('background:')[1].split(';')[0].trim()
              } as any)
            }}>
              {ticket.status.replace('_', ' ')}
            </span>

            {ticket.status !== 'CLOSED' && ticket.status !== 'RESOLVED' && (
              <button 
                onClick={handleResolve}
                disabled={submitting}
                className="btn-outline"
                style={{ padding: '6px 12px', fontSize: '10px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em' }}
              >
                Mark as Resolved
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 40px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Selected Items Detail Panel for Return / Damage requests */}
        {ticket.orderItems && Array.isArray(ticket.orderItems) && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '24px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Items reported in this ticket
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {ticket.orderItems.map((item: any, idx: number) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: idx === ticket.orderItems.length - 1 ? 'none' : '1px solid var(--border)' }}>
                  <div style={{ color: 'var(--cream)', fontSize: '14px', fontWeight: 500 }}>
                    {item.name}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--gold)' }}>
                    QTY: {item.quantity}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
          
          {/* Chat Messages Log */}
          <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', maxHeight: '550px', overflowY: 'auto' }}>
            {ticket.ticketMessages.map((msg: any) => {
              const isMine = msg.authorId === userId && !msg.isAdmin;
              return (
                <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    {isMine ? 'You' : 'Support Concierge'} · {new Date(msg.createdAt).toLocaleString()}
                  </div>
                  
                  <div style={{ 
                    background: isMine ? 'rgba(196,160,90,0.06)' : 'var(--background)',
                    border: `1px solid ${isMine ? 'var(--gold)' : 'var(--border)'}`,
                    padding: '16px 20px',
                    borderRadius: '8px',
                    borderTopRightRadius: isMine ? '0' : '8px',
                    borderTopLeftRadius: !isMine ? '0' : '8px',
                    fontFamily: 'var(--font-body)',
                    fontSize: '14px',
                    color: isMine ? 'var(--cream)' : 'var(--text)',
                    lineHeight: 1.6,
                    maxWidth: '85%',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {msg.message}

                    {/* Inline Attachments Rendering inside bubbles */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '14px', borderTop: '0.5px solid var(--border)', paddingTop: '12px' }}>
                        {msg.attachments.map((url: string, imgIdx: number) => {
                          const isPdf = url.toLowerCase().endsWith('.pdf');
                          return (
                            <a 
                              key={imgIdx} 
                              href={url} 
                              target="_blank" 
                              rel="noreferrer" 
                              style={{ 
                                display: 'block', 
                                width: '60px', 
                                height: '60px', 
                                border: '1px solid var(--border)', 
                                borderRadius: '4px', 
                                overflow: 'hidden', 
                                background: 'var(--background)',
                                cursor: 'pointer'
                              }}
                            >
                              {isPdf ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                                  <i className="ti ti-file-text" style={{ fontSize: '18px', color: 'var(--red)' }}></i>
                                  <span style={{ fontSize: '7px', marginTop: '2px' }}>PDF</span>
                                </div>
                              ) : (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={url} alt="Attachment Reference" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              )}
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Reply Form Section */}
          {ticket.status !== 'CLOSED' ? (
            <div style={{ padding: '24px', borderTop: '1px solid var(--border)', background: 'var(--void)' }}>
              <form onSubmit={handleSendReply} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {errorMessage && (
                  <div style={{ color: 'var(--red)', fontFamily: 'var(--font-mono)', fontSize: '11px', padding: '8px', background: 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,0.2)' }}>
                    ⚠ {errorMessage}
                  </div>
                )}
                
                <textarea 
                  required
                  rows={4}
                  value={replyMessage}
                  onChange={e => setReplyMessage(e.target.value)}
                  placeholder={ticket.status === 'RESOLVED' ? "This ticket is resolved. Type a message here to reopen it..." : "Type your message here..."}
                  style={{ width: '100%', padding: '16px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: '14px', resize: 'vertical', outline: 'none' }}
                />

                {/* Reply File Uploader */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                  <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input 
                      type="file"
                      multiple
                      accept="image/*,application/pdf"
                      onChange={handleFileUpload}
                      disabled={uploading || submitting}
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                    />
                    <button 
                      type="button" 
                      disabled={uploading || submitting}
                      style={{ background: 'none', border: '0.5px solid var(--border)', color: 'var(--text-muted)', padding: '8px 14px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <i className="ti ti-paperclip" style={{ color: 'var(--gold)' }}></i>
                      {uploading ? 'Uploading...' : 'Add Attachments'}
                    </button>
                  </div>

                  <button 
                    type="submit" 
                    disabled={submitting || uploading || !replyMessage.trim()}
                    className="btn-primary" 
                    style={{ padding: '10px 24px', fontSize: '12px' }}
                  >
                    {submitting ? 'Sending...' : ticket.status === 'RESOLVED' ? 'Reopen & Send' : 'Send Message'}
                  </button>
                </div>

                {/* Reply Attachments Previews */}
                {attachments.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
                    {attachments.map((url, index) => {
                      const isPdf = url.toLowerCase().endsWith('.pdf');
                      return (
                        <div key={index} style={{ position: 'relative', width: '50px', height: '50px', border: '1px solid var(--border)', borderRadius: '4px', overflow: 'hidden', background: 'var(--background)' }}>
                          {isPdf ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                              <i className="ti ti-file-text" style={{ fontSize: '16px', color: 'var(--red)' }}></i>
                              <span style={{ fontSize: '8px' }}>PDF</span>
                            </div>
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={url} alt="Reply Attachment" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveAttachment(index)}
                            style={{
                              position: 'absolute',
                              top: '2px',
                              right: '2px',
                              width: '12px',
                              height: '12px',
                              background: 'rgba(0,0,0,0.7)',
                              border: 'none',
                              color: '#fff',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '8px',
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
              </form>
            </div>
          ) : (
            <div style={{ padding: '24px', borderTop: '1px dashed var(--border)', background: 'var(--void)', textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-muted)' }}>
                This ticket has been locked/closed by support concierge.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
