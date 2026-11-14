'use client';

import React, { useState, useEffect } from 'react';
import { submitQuickInquiryAction, getLoggedInUserAction } from '@/app/rfq/actions';

interface InquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    name: string;
    sku: string;
    d2cPrice: number;
    image?: string;
  };
  userEmail?: string;
  userName?: string;
}

export default function InquiryModal({
  isOpen,
  onClose,
  product,
  userEmail = '',
  userName = ''
}: InquiryModalProps) {
  const [name, setName] = useState(userName);
  const [email, setEmail] = useState(userEmail);
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [projectName, setProjectName] = useState('');
  const [pincode, setPincode] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [targetPrice, setTargetPrice] = useState('');
  const [customSpecsNotes, setCustomSpecsNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [rfqNumber, setRfqNumber] = useState('');
  const [error, setError] = useState('');

  // Prefill details for logged in users
  useEffect(() => {
    if (!isOpen) return;
    async function prefillUser() {
      const dbUser = await getLoggedInUserAction();
      if (dbUser) {
        setName(`${dbUser.firstName} ${dbUser.lastName}`);
        setEmail(dbUser.email);
        if (dbUser.phone) setPhone(dbUser.phone);
        if (dbUser.company?.name) setCompany(dbUser.company.name);
      }
    }
    prefillUser();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await submitQuickInquiryAction({
      name,
      email,
      phone,
      company,
      projectName,
      productId: product.id,
      quantity,
      targetPrice,
      customSpecsNotes,
      pincode,
      channel: 'PRODUCT_INQUIRY'
    });

    if (res.success && res.rfqNumber) {
      setSubmitted(true);
      setRfqNumber(res.rfqNumber);
    } else {
      setError(res.error || 'Failed to submit inquiry');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div 
        className="w-full max-w-xl bg-[#111114] border border-[#c4a05a]/40 p-6 md:p-8 rounded-sm shadow-2xl relative max-h-[90vh] overflow-y-auto"
        style={{ color: 'var(--cream)' }}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-muted hover:text-white font-mono text-xl p-2 cursor-pointer transition-colors"
        >
          ✕
        </button>

        {submitted ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#c4a05a]/10 border border-[#c4a05a] text-[#c4a05a] flex items-center justify-center text-3xl font-serif mx-auto">
              ✓
            </div>
            <h3 className="font-serif text-2xl text-[#f0ead8] font-light">Inquiry Received</h3>
            <p className="font-mono text-xs uppercase tracking-widest text-[#c4a05a]">
              Reference: {rfqNumber}
            </p>
            <p className="font-body text-xs text-[#6b6860] leading-relaxed max-w-sm mx-auto">
              Thank you! Our trade team will review your specifications for <strong className="text-[#f0ead8]">{product.name}</strong> and send a detailed quotation to <span className="text-[#c4a05a]">{email}</span> within 24 hours.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 px-8 py-3 font-mono text-xs uppercase tracking-[0.15em] bg-[#c4a05a] text-black hover:bg-[#e2c882] font-semibold transition-all rounded-sm cursor-pointer"
            >
              Close Window
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Header */}
            <div className="border-b border-[#25252a] pb-4">
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#c4a05a] font-semibold block mb-1">
                Trade & Bulk Inquiry
              </span>
              <h2 className="font-serif text-xl md:text-2xl text-[#f0ead8] font-light">
                Request Quote: {product.name}
              </h2>
              <span className="font-mono text-[10px] text-[#6b6860] uppercase mt-0.5 block">
                SKU: {product.sku}
              </span>
            </div>

            {error && (
              <div className="p-3 border border-red-500/40 bg-red-950/20 text-red-400 font-mono text-xs">
                {error}
              </div>
            )}

            {/* Input Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#6b6860] block mb-1">
                  Full Name *
                </label>
                <input
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full bg-[#16161a] border border-white/10 focus:border-[#c4a05a] px-3 py-2 text-xs font-body text-[#f0ead8] outline-none transition-colors rounded-sm"
                />
              </div>

              <div>
                <label className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#6b6860] block mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Email Address"
                  className="w-full bg-[#16161a] border border-white/10 focus:border-[#c4a05a] px-3 py-2 text-xs font-body text-[#f0ead8] outline-none transition-colors rounded-sm"
                />
              </div>

              <div>
                <label className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#6b6860] block mb-1">
                  Phone / WhatsApp *
                </label>
                <input
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="Phone Number"
                  className="w-full bg-[#16161a] border border-white/10 focus:border-[#c4a05a] px-3 py-2 text-xs font-body text-[#f0ead8] outline-none transition-colors rounded-sm"
                />
              </div>

              <div>
                <label className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#6b6860] block mb-1">
                  Company / Firm
                </label>
                <input
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                  placeholder="Company Name"
                  className="w-full bg-[#16161a] border border-white/10 focus:border-[#c4a05a] px-3 py-2 text-xs font-body text-[#f0ead8] outline-none transition-colors rounded-sm"
                />
              </div>

              <div>
                <label className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#6b6860] block mb-1">
                  Quantity Required *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={quantity}
                  onChange={e => setQuantity(parseInt(e.target.value) || 1)}
                  className="w-full bg-[#16161a] border border-white/10 focus:border-[#c4a05a] px-3 py-2 text-xs font-mono text-[#f0ead8] outline-none transition-colors rounded-sm"
                />
              </div>

              <div>
                <label className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#6b6860] block mb-1">
                  Target Price per Unit (Optional)
                </label>
                <input
                  value={targetPrice}
                  onChange={e => setTargetPrice(e.target.value)}
                  placeholder="Target Price per Unit"
                  className="w-full bg-[#16161a] border border-white/10 focus:border-[#c4a05a] px-3 py-2 text-xs font-mono text-[#f0ead8] outline-none transition-colors rounded-sm"
                />
              </div>

              <div>
                <label className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#6b6860] block mb-1">
                  Delivery Pincode *
                </label>
                <input
                  required
                  maxLength={6}
                  value={pincode}
                  onChange={e => setPincode(e.target.value.replace(/\D/g, ''))}
                  placeholder="6-digit Pincode"
                  className="w-full bg-[#16161a] border border-white/10 focus:border-[#c4a05a] px-3 py-2 text-xs font-mono text-[#f0ead8] outline-none transition-colors rounded-sm"
                />
              </div>

              <div>
                <label className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#6b6860] block mb-1">
                  Project Name / Location (Optional)
                </label>
                <input
                  value={projectName}
                  onChange={e => setProjectName(e.target.value)}
                  placeholder="Project Name / Location"
                  className="w-full bg-[#16161a] border border-white/10 focus:border-[#c4a05a] px-3 py-2 text-xs font-body text-[#f0ead8] outline-none transition-colors rounded-sm"
                />
              </div>
            </div>

            <div>
              <label className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#6b6860] block mb-1">
                Custom Specs & Wiring Requirements
              </label>
              <textarea
                rows={3}
                value={customSpecsNotes}
                onChange={e => setCustomSpecsNotes(e.target.value)}
                placeholder="Describe your custom finish, voltage, wiring, or drop length requirements..."
                className="w-full bg-[#16161a] border border-white/10 focus:border-[#c4a05a] px-3 py-2 text-xs font-body text-[#f0ead8] outline-none transition-colors rounded-sm"
              />
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 font-mono text-xs uppercase tracking-[0.15em] text-[#6b6860] border border-white/10 hover:text-white transition-colors bg-transparent rounded-sm cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 font-mono text-xs uppercase tracking-[0.15em] bg-[#c4a05a] text-black hover:bg-[#e2c882] font-semibold transition-all rounded-sm cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {loading && (
                  <span className="inline-block animate-spin border border-t-transparent border-black rounded-full w-3 h-3" />
                )}
                {loading ? 'Submitting...' : 'Submit Inquiry'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
