'use client';

import { useState, useTransition } from 'react';
import { adminSaveSystemConfig } from './config-actions';

interface BrandConfig {
  name: string;
  legalName: string;
  tagline: string;
  domain: string;
  storefrontUrl: string;
  supportEmail: string;
  ordersEmail: string;
  currencySymbol: string;
  currencyCode: string;
  defaultGstRate: number;
  phone: string;
  address: string;
  gstin: string;
}

export default function BrandSettingsForm({
  initialConfig,
}: {
  initialConfig: BrandConfig;
}) {
  const [config, setConfig] = useState<BrandConfig>(initialConfig);
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleFieldChange = (field: keyof BrandConfig, value: string | number) => {
    setConfig(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!config.name.trim()) {
      showToast('Brand name is required', 'err');
      return;
    }
    if (!config.supportEmail.trim()) {
      showToast('Support email is required', 'err');
      return;
    }

    startTransition(async () => {
      try {
        const payload = {
          ...config,
          defaultGstRate: Number(config.defaultGstRate) || 18.0,
        };
        await adminSaveSystemConfig('BRAND', payload);
        showToast('Brand settings updated successfully!');
      } catch (err: any) {
        showToast(err.message || 'Failed to update brand settings', 'err');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-surface border border-border shadow-sm p-8 rounded-sm">
        <h2 className="font-serif text-[20px] text-primary mb-6">Live Brand Identity</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted block">Brand Public Name</label>
            <input
              type="text"
              value={config.name}
              onChange={e => handleFieldChange('name', e.target.value)}
              placeholder="e.g. James & Sons"
              className="w-full bg-background border border-border px-4 py-3 text-primary font-body text-[14px] focus:outline-none focus:border-accent rounded-sm"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted block">Legal Entity Name</label>
            <input
              type="text"
              value={config.legalName}
              onChange={e => handleFieldChange('legalName', e.target.value)}
              placeholder="e.g. James and Sons Bespoke Interiors Private Limited"
              className="w-full bg-background border border-border px-4 py-3 text-primary font-body text-[14px] focus:outline-none focus:border-accent rounded-sm"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted block">Brand Tagline / Slogan</label>
            <input
              type="text"
              value={config.tagline}
              onChange={e => handleFieldChange('tagline', e.target.value)}
              placeholder="e.g. Luxury Artisanal Lighting & Home Accessories"
              className="w-full bg-background border border-border px-4 py-3 text-primary font-body text-[14px] focus:outline-none focus:border-accent rounded-sm"
            />
          </div>
        </div>
      </div>

      <div className="bg-surface border border-border shadow-sm p-8 rounded-sm">
        <h2 className="font-serif text-[20px] text-primary mb-6">Contact & Operational Details</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted block">Customer Support Email</label>
            <input
              type="email"
              value={config.supportEmail}
              onChange={e => handleFieldChange('supportEmail', e.target.value)}
              placeholder="e.g. concierge@jamesandsons.in"
              className="w-full bg-background border border-border px-4 py-3 text-primary font-body text-[14px] focus:outline-none focus:border-accent rounded-sm"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted block">Orders Notification Email</label>
            <input
              type="email"
              value={config.ordersEmail}
              onChange={e => handleFieldChange('ordersEmail', e.target.value)}
              placeholder="e.g. orders@jamesandsons.in"
              className="w-full bg-background border border-border px-4 py-3 text-primary font-body text-[14px] focus:outline-none focus:border-accent rounded-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted block">Customer Support Phone</label>
            <input
              type="text"
              value={config.phone}
              onChange={e => handleFieldChange('phone', e.target.value)}
              placeholder="e.g. +91 9999999999"
              className="w-full bg-background border border-border px-4 py-3 text-primary font-body text-[14px] focus:outline-none focus:border-accent rounded-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted block">GSTIN Number</label>
            <input
              type="text"
              value={config.gstin}
              onChange={e => handleFieldChange('gstin', e.target.value.toUpperCase())}
              placeholder="e.g. 09ABCDE1234F1Z1"
              className="w-full bg-background border border-border px-4 py-3 text-primary font-body text-[14px] focus:outline-none focus:border-accent rounded-sm uppercase"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted block">Registered Address (Tax Invoices / Contact)</label>
            <textarea
              value={config.address}
              onChange={e => handleFieldChange('address', e.target.value)}
              placeholder="Full operational address..."
              rows={3}
              className="w-full bg-background border border-border px-4 py-3 text-primary font-body text-[14px] focus:outline-none focus:border-accent rounded-sm resize-none"
            />
          </div>
        </div>
      </div>

      <div className="bg-surface border border-border shadow-sm p-8 rounded-sm">
        <h2 className="font-serif text-[20px] text-primary mb-6">Storefront Domain & Strategy</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted block">Public Domain</label>
            <input
              type="text"
              value={config.domain}
              onChange={e => handleFieldChange('domain', e.target.value)}
              placeholder="e.g. jamesandsons.in"
              className="w-full bg-background border border-border px-4 py-3 text-primary font-body text-[14px] focus:outline-none focus:border-accent rounded-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted block">Base Storefront URL</label>
            <input
              type="text"
              value={config.storefrontUrl}
              onChange={e => handleFieldChange('storefrontUrl', e.target.value)}
              placeholder="e.g. https://jamesandsons.in"
              className="w-full bg-background border border-border px-4 py-3 text-primary font-body text-[14px] focus:outline-none focus:border-accent rounded-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted block">Currency Symbol & Code</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={config.currencySymbol}
                onChange={e => handleFieldChange('currencySymbol', e.target.value)}
                placeholder="e.g. ₹"
                className="w-full bg-background border border-border px-4 py-3 text-primary font-body text-[14px] focus:outline-none focus:border-accent rounded-sm text-center"
              />
              <input
                type="text"
                value={config.currencyCode}
                onChange={e => handleFieldChange('currencyCode', e.target.value.toUpperCase())}
                placeholder="e.g. INR"
                className="w-full bg-background border border-border px-4 py-3 text-primary font-body text-[14px] focus:outline-none focus:border-accent rounded-sm text-center uppercase"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted block font-body">Default GST Rate (%)</label>
            <input
              type="number"
              value={config.defaultGstRate}
              onChange={e => handleFieldChange('defaultGstRate', parseFloat(e.target.value) || 0)}
              min={0}
              max={100}
              placeholder="e.g. 18"
              className="w-full bg-background border border-border px-4 py-3 text-primary font-body text-[14px] focus:outline-none focus:border-accent rounded-sm"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={isPending}
          className="btn-primary min-h-[44px] px-8 uppercase font-mono text-[11px] tracking-wider disabled:opacity-50"
        >
          {isPending ? 'Saving Configurations…' : 'Save Configurations'}
        </button>
      </div>

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-6 right-6 z-[9999] px-4 py-3 rounded-sm border font-mono text-[12px] max-w-sm shadow-xl backdrop-blur-sm ${
            toast.type === 'err'
              ? 'bg-red-900/20 border-red-600/40 text-red-300'
              : 'bg-surface border-border text-primary'
          }`}
        >
          {toast.msg}
        </div>
      )}
    </form>
  );
}
