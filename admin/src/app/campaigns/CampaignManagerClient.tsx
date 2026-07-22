'use client';

import { useState, useCallback } from 'react';

interface Holiday {
  id: string;
  name: string;
  date: string;
  isMajor: boolean;
  daysRemaining: number;
}

interface Campaign {
  id: string;
  name: string;
  status: 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  stage: 'STAGE_1_DISPATCH' | 'STAGE_2_EXPIRY_WARNING';
  segmentationRules: any;
  metrics: any;
  metricsSummary?: any;
  emailSubject: string | null;
  emailBodyHtml: string | null;
  whatsappText: string | null;
  recommendedProducts: any[] | null;
  holidayId?: string | null;
  holiday?: Holiday | null;
  createdAt: string;
  scheduledAt?: string | null;
  dynamicCoupons?: any[];
}

type View = 'DASHBOARD' | 'EDITOR';

const STATUS_COLORS: Record<string, string> = {
  DRAFT:     '#D4AF37',
  SCHEDULED: '#60a5fa',
  ACTIVE:    '#4CAF7A',
  COMPLETED: '#888',
  CANCELLED: '#f87171',
};

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_COLORS[status] || '#888';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em',
      textTransform: 'uppercase', padding: '3px 9px', borderRadius: '20px',
      background: `${c}18`, color: c, border: `1px solid ${c}40`
    }}>
      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: c, display: 'inline-block' }} />
      {status}
    </span>
  );
}

function StatCard({ label, value, sub, color = 'var(--cream)' }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{ background: 'var(--obsidian)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px 22px' }}>
      <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '8px' }}>{label}</div>
      <div style={{ fontSize: '28px', fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '6px' }}>{sub}</div>}
    </div>
  );
}

export default function CampaignManagerClient({
  initialHolidays, initialCampaigns, initialAnalytics, initialCatalogProducts
}: {
  initialHolidays: Holiday[];
  initialCampaigns: Campaign[];
  initialAnalytics: any;
  initialCatalogProducts: any[];
}) {
  const [holidays, setHolidays] = useState<Holiday[]>(initialHolidays);
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns);
  const [analytics, setAnalytics] = useState<any>(initialAnalytics);
  const [catalogProducts] = useState<any[]>(initialCatalogProducts);

  // View state — dashboard or full-page editor
  const [view, setView] = useState<View>('DASHBOARD');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  // Editor state
  const [editorTab, setEditorTab] = useState<'EMAIL' | 'WHATSAPP' | 'PREVIEW'>('EMAIL');
  const [editSubject, setEditSubject] = useState('');
  const [editBodyHtml, setEditBodyHtml] = useState('');
  const [editWhatsappText, setEditWhatsappText] = useState('');
  const [editSegment, setEditSegment] = useState('VIP');
  const [editDiscount, setEditDiscount] = useState(15);
  const [editProducts, setEditProducts] = useState<any[]>([]);

  // UI states
  const [isDrafting, setIsDrafting] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [isCronRunning, setIsCronRunning] = useState(false);
  const [swapModalIndex, setSwapModalIndex] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [couponsPreview, setCouponsPreview] = useState<any[]>([]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4500);
  };

  const refreshData = useCallback(async () => {
    try {
      const [hRes, cRes] = await Promise.all([
        fetch('/api/admin/campaigns/holidays'),
        fetch('/api/admin/campaigns')
      ]);
      if (hRes.ok) { const d = await hRes.json(); setHolidays(d.holidays || []); }
      if (cRes.ok) { const d = await cRes.json(); setCampaigns(d.campaigns || []); setAnalytics(d.analytics || {}); }
    } catch {}
  }, []);

  const openEditor = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setEditSubject(campaign.emailSubject || '');
    setEditBodyHtml(campaign.emailBodyHtml || '');
    setEditWhatsappText(campaign.whatsappText || '');
    setEditSegment(campaign.segmentationRules?.segment || 'VIP');
    setEditDiscount(campaign.segmentationRules?.discountValue || 15);
    setEditProducts(campaign.recommendedProducts || []);
    setEditorTab('EMAIL');
    setCouponsPreview([]);
    setView('EDITOR');
  };

  const handleDraftAI = async (holidayId: string, segment = 'VIP') => {
    setIsDrafting(holidayId);
    try {
      const res = await fetch('/api/admin/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DRAFT_AI', holidayId, segment, discountValue: editDiscount || 15 })
      });
      const data = await res.json();
      if (data.success && data.campaign) {
        await refreshData();
        openEditor(data.campaign);
        showToast('AI draft generated! Review the personalized content below.', 'success');
      } else {
        showToast(data.error || 'Failed to generate AI draft.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to draft AI campaign.', 'error');
    } finally {
      setIsDrafting(null);
    }
  };

  const handleSaveDraft = async () => {
    if (!selectedCampaign) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/campaigns/${selectedCampaign.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailSubject: editSubject,
          emailBodyHtml: editBodyHtml,
          whatsappText: editWhatsappText,
          segmentationRules: { ...selectedCampaign.segmentationRules, segment: editSegment, discountValue: editDiscount },
          recommendedProducts: editProducts
        })
      });
      if (res.ok) {
        await refreshData();
        showToast('Draft saved successfully.');
      } else {
        showToast('Failed to save draft.', 'error');
      }
    } catch {
      showToast('Error saving draft.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleApproveAndSchedule = async () => {
    if (!selectedCampaign) return;
    setIsDispatching(true);
    try {
      await handleSaveDraft();
      const res = await fetch(`/api/admin/campaigns/${selectedCampaign.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'APPROVE_AND_SCHEDULE' })
      });
      const data = await res.json();
      if (data.success) {
        const { couponsGenerated, sampleCodes } = data.result;
        setCouponsPreview(sampleCodes || []);
        showToast(`✨ Campaign scheduled! ${couponsGenerated} unique vouchers generated.`);
        await refreshData();
        // Reload selected campaign with fresh data
        const fresh = campaigns.find(c => c.id === selectedCampaign.id);
        if (fresh) setSelectedCampaign({ ...fresh, ...{ status: 'SCHEDULED' as const } });
      } else {
        showToast(data.error || 'Failed to schedule campaign.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed.', 'error');
    } finally {
      setIsDispatching(false);
    }
  };

  const handleTriggerCron = async () => {
    setIsCronRunning(true);
    try {
      const res = await fetch('/api/cron/campaign-automation');
      const data = await res.json();
      await refreshData();
      showToast(`Automation sweep complete. ${data.triggeredActions || 0} actions executed.`);
    } catch (err: any) {
      showToast('Failed to run automation.', 'error');
    } finally {
      setIsCronRunning(false);
    }
  };

  const handleSwapProduct = (index: number, newProduct: any) => {
    const updated = [...editProducts];
    updated[index] = newProduct;
    setEditProducts(updated);
    setSwapModalIndex(null);
  };

  const draftsPending = campaigns.filter(c => c.status === 'DRAFT');
  const scheduledActive = campaigns.filter(c => ['SCHEDULED', 'ACTIVE'].includes(c.status));

  // ─── PERSONALIZATION TEMPLATE HELPERS ───────────────────────────────────────
  const personalizedEmail = editBodyHtml.replace(/{{CUSTOMER_NAME}}/g, 'Abhishek').replace(/{{COUPON_CODE}}/g, 'DIW8K9X2');
  const personalizedWA = editWhatsappText.replace(/{{CUSTOMER_NAME}}/g, 'Abhishek').replace(/{{COUPON_CODE}}/g, 'DIW8K9X2');

  // ─────────────────────────────────────────────────────────────────────────────
  // EDITOR VIEW
  // ─────────────────────────────────────────────────────────────────────────────
  if (view === 'EDITOR' && selectedCampaign) {
    const isDraft = selectedCampaign.status === 'DRAFT';
    const isScheduled = ['SCHEDULED', 'ACTIVE'].includes(selectedCampaign.status);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--obsidian)', color: 'var(--cream)' }}>
        
        {/* ── EDITOR TOPBAR ─────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 24px', background: 'var(--surface)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <button
            onClick={() => setView('DASHBOARD')}
            style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', borderRadius: '8px', transition: 'background 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            ← Back
          </button>
          <div style={{ width: '1px', height: '20px', background: 'var(--border)' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '10px', color: 'var(--gold)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Campaign Editor</div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--cream)', marginTop: '1px' }}>{selectedCampaign.name}</div>
          </div>
          <StatusBadge status={selectedCampaign.status} />
          {selectedCampaign.holiday && (
            <div style={{ fontSize: '12px', color: 'var(--text-dim)', background: 'rgba(255,255,255,0.04)', padding: '4px 12px', borderRadius: '8px' }}>
              🪔 {selectedCampaign.holiday.name} · {selectedCampaign.holiday.daysRemaining} days away
            </div>
          )}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleSaveDraft}
              disabled={isSaving}
              style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--cream)', fontSize: '12px', cursor: 'pointer', fontWeight: 500 }}
            >
              {isSaving ? 'Saving...' : '💾 Save Draft'}
            </button>
            {isDraft && (
              <button
                onClick={handleApproveAndSchedule}
                disabled={isDispatching}
                style={{ padding: '8px 20px', background: isDispatching ? 'rgba(212,175,55,0.4)' : 'var(--gold)', color: '#000', borderRadius: '8px', fontSize: '12px', fontWeight: 700, border: 'none', cursor: isDispatching ? 'not-allowed' : 'pointer' }}
              >
                {isDispatching ? '⏳ Scheduling...' : '🚀 Approve & Schedule →'}
              </button>
            )}
            {isScheduled && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleSendNow('EMAIL')}
                  style={{ padding: '8px 16px', background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.4)', borderRadius: '8px', color: '#60a5fa', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                >
                  ✉️ Send Email Now
                </button>
                <button
                  onClick={() => handleSendNow('WHATSAPP')}
                  style={{ padding: '8px 16px', background: 'rgba(37,211,102,0.12)', border: '1px solid rgba(37,211,102,0.4)', borderRadius: '8px', color: '#25D366', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                >
                  💬 Send WhatsApp Now
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── EDITOR BODY: 3-PANEL LAYOUT ───────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 340px', flex: 1, overflow: 'hidden' }}>
          
          {/* PANEL 1: Campaign Settings Sidebar */}
          <div style={{ borderRight: '1px solid var(--border)', overflowY: 'auto', padding: '20px' }}>
            <SidebarSection title="Audience Segment">
              {[
                { id: 'VIP', label: 'VIP Buyers', icon: '👑', desc: 'Orders > ₹25,000' },
                { id: 'LAPSED', label: 'Lapsed (90d+)', icon: '💤', desc: 'Win-back campaign' },
                { id: 'ALL', label: 'All Customers', icon: '🌐', desc: 'Full subscriber base' }
              ].map(seg => (
                <div
                  key={seg.id}
                  onClick={() => setEditSegment(seg.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px',
                    border: editSegment === seg.id ? '1px solid var(--gold)' : '1px solid transparent',
                    background: editSegment === seg.id ? 'rgba(212,175,55,0.08)' : 'rgba(255,255,255,0.02)',
                    cursor: 'pointer', marginBottom: '6px', transition: 'all 0.2s'
                  }}
                >
                  <span style={{ fontSize: '18px' }}>{seg.icon}</span>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: editSegment === seg.id ? 'var(--gold)' : 'var(--cream)' }}>{seg.label}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{seg.desc}</div>
                  </div>
                </div>
              ))}
            </SidebarSection>

            <SidebarSection title="Voucher Discount">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--obsidian)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 14px' }}>
                <input
                  type="number"
                  value={editDiscount}
                  onChange={e => setEditDiscount(Number(e.target.value))}
                  min={5} max={50}
                  style={{ width: '50px', background: 'none', border: 'none', color: 'var(--gold)', fontSize: '22px', fontWeight: 700, outline: 'none' }}
                />
                <div>
                  <div style={{ fontSize: '18px', color: 'var(--gold)', fontWeight: 700 }}>%</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>OFF sitewide</div>
                </div>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '8px', lineHeight: '1.5' }}>
                Each customer receives a unique 8-character single-use code (e.g. <code style={{ color: 'var(--gold)', fontSize: '10px' }}>DIW8K9X2</code>).
              </div>
            </SidebarSection>

            <SidebarSection title="Personalization Hooks">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[
                  { token: '{{CUSTOMER_NAME}}', desc: "Customer's first name" },
                  { token: '{{COUPON_CODE}}', desc: 'Unique single-use code' },
                  { token: '{{HOLIDAY_NAME}}', desc: 'Festival name' },
                  { token: '{{DISCOUNT_VALUE}}', desc: 'Discount percentage' },
                ].map(t => (
                  <div
                    key={t.token}
                    onClick={() => { navigator.clipboard.writeText(t.token); showToast(`Copied ${t.token}`); }}
                    title="Click to copy"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', background: 'var(--obsidian)', borderRadius: '8px', cursor: 'pointer', border: '1px solid var(--border)', transition: 'border-color 0.2s' }}
                  >
                    <code style={{ fontSize: '11px', color: 'var(--gold)', flex: 1 }}>{t.token}</code>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{t.desc}</span>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '8px' }}>Click any token to copy. AI replaces these per customer at send time.</div>
            </SidebarSection>

            {couponsPreview.length > 0 && (
              <SidebarSection title="Sample Vouchers Generated">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {couponsPreview.map((code: string, i) => (
                    <div key={i} style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, color: 'var(--gold)', letterSpacing: '0.15em', padding: '6px 10px', background: 'rgba(212,175,55,0.08)', borderRadius: '6px', border: '1px dashed rgba(212,175,55,0.4)' }}>
                      {code}
                    </div>
                  ))}
                </div>
              </SidebarSection>
            )}
          </div>

          {/* PANEL 2: Content Editor */}
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--obsidian)' }}>
            {/* Tab Bar */}
            <div style={{ display: 'flex', gap: '2px', padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0 }}>
              {(['EMAIL', 'WHATSAPP', 'PREVIEW'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setEditorTab(tab)}
                  style={{
                    padding: '7px 18px', borderRadius: '8px', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                    background: editorTab === tab
                      ? tab === 'EMAIL' ? 'rgba(96,165,250,0.2)' : tab === 'WHATSAPP' ? 'rgba(37,211,102,0.2)' : 'rgba(212,175,55,0.2)'
                      : 'transparent',
                    color: editorTab === tab
                      ? tab === 'EMAIL' ? '#60a5fa' : tab === 'WHATSAPP' ? '#25D366' : 'var(--gold)'
                      : 'var(--text-dim)'
                  }}
                >
                  {tab === 'EMAIL' ? '✉️ Email' : tab === 'WHATSAPP' ? '💬 WhatsApp' : '👁 Preview'}
                </button>
              ))}
              <div style={{ flex: 1 }} />
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'flex', alignItems: 'center' }}>
                Uses customer first name automatically
              </div>
            </div>

            {/* Email Editor */}
            {editorTab === 'EMAIL' && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px', gap: '16px', overflowY: 'auto' }}>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Subject Line</label>
                  <input
                    type="text"
                    value={editSubject}
                    onChange={e => setEditSubject(e.target.value)}
                    placeholder="e.g. ✨ {{CUSTOMER_NAME}}, your exclusive Diwali offer awaits"
                    style={{ width: '100%', padding: '12px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--cream)', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Email Body HTML
                    <span style={{ marginLeft: '8px', fontSize: '10px', color: 'var(--text-dim)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
                      Use {'{{CUSTOMER_NAME}}'} for first-name personalization
                    </span>
                  </label>
                  <textarea
                    value={editBodyHtml}
                    onChange={e => setEditBodyHtml(e.target.value)}
                    style={{ flex: 1, minHeight: '380px', padding: '14px', background: '#0c0c0c', border: '1px solid var(--border)', borderRadius: '10px', color: '#c9d1d9', fontSize: '12px', fontFamily: '"JetBrains Mono", monospace', lineHeight: '1.7', resize: 'vertical', outline: 'none' }}
                    spellCheck={false}
                  />
                </div>
              </div>
            )}

            {/* WhatsApp Editor */}
            {editorTab === 'WHATSAPP' && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px', gap: '16px', overflowY: 'auto' }}>
                <div style={{ display: 'flex', gap: '12px', padding: '12px 16px', background: 'rgba(37,211,102,0.06)', border: '1px solid rgba(37,211,102,0.2)', borderRadius: '10px', fontSize: '12px', color: '#4ade80' }}>
                  <span>💡</span>
                  <span>WhatsApp Business API: Use <strong>*bold*</strong> for emphasis. Keep under 160 words. <code style={{ fontSize: '11px' }}>{'{{CUSTOMER_NAME}}'}</code> is personalized per recipient.</span>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Broadcast Message</label>
                  <textarea
                    value={editWhatsappText}
                    onChange={e => setEditWhatsappText(e.target.value)}
                    style={{ flex: 1, minHeight: '300px', padding: '14px', background: '#0b141a', border: '1px solid rgba(37,211,102,0.3)', borderRadius: '10px', color: '#e9edef', fontSize: '13px', lineHeight: '1.8', resize: 'vertical', outline: 'none' }}
                    placeholder={`🪔 *Namaste {{CUSTOMER_NAME}}!* ✨\n\nCelebrate Diwali with James & Sons. Enjoy *{{DISCOUNT_VALUE}}% OFF* on handcrafted brass lighting & festive decor.\n\nYour personal voucher: *{{COUPON_CODE}}*\n\nShop now: https://jamesandsons.in/collections/festive`}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <span>Characters: {editWhatsappText.length} / ~160 words recommended</span>
                  <span style={{ color: editWhatsappText.length > 800 ? '#f87171' : 'var(--text-muted)' }}>
                    {editWhatsappText.trim().split(/\s+/).filter(Boolean).length} words
                  </span>
                </div>
              </div>
            )}

            {/* Preview Panel */}
            {editorTab === 'PREVIEW' && (
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                <div style={{ marginBottom: '16px', padding: '12px 16px', background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '10px', fontSize: '12px', color: 'var(--gold)' }}>
                  🔍 Preview shows how a sample customer "<strong>Abhishek</strong>" would see their personalized message, with sample code <strong>DIW8K9X2</strong>.
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Email Subject</div>
                <div style={{ padding: '12px 16px', background: 'var(--surface)', borderRadius: '10px', fontSize: '14px', fontWeight: 500, color: 'var(--cream)', marginBottom: '20px', border: '1px solid var(--border)' }}>
                  {editSubject.replace(/{{CUSTOMER_NAME}}/g, 'Abhishek').replace(/{{COUPON_CODE}}/g, 'DIW8K9X2') || '(No subject)'}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Email HTML Preview</div>
                <div
                  dangerouslySetInnerHTML={{ __html: personalizedEmail }}
                  style={{ border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', background: '#0d0d0d' }}
                />
                {editWhatsappText && (
                  <>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '24px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>WhatsApp Preview</div>
                    <div style={{ background: '#0b141a', borderRadius: '12px', padding: '20px', border: '1px solid rgba(37,211,102,0.2)' }}>
                      <div style={{ background: '#202c33', borderRadius: '12px 12px 12px 0', padding: '12px 16px', maxWidth: '85%' }}>
                        <div style={{ color: '#e9edef', fontSize: '13px', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                          {personalizedWA}
                        </div>
                        <div style={{ fontSize: '10px', color: '#8696a0', marginTop: '6px', textAlign: 'right' }}>Delivered ✓✓</div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* PANEL 3: Product Recommendations + Action Footer */}
          <div style={{ borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
              <div style={{ fontSize: '10px', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Featured Products</div>
              <div style={{ fontSize: '13px', color: 'var(--cream)', marginTop: '2px' }}>Embedded in this campaign</div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
              {editProducts.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', border: '1px dashed var(--border)', borderRadius: '10px' }}>
                  No products selected. AI will auto-pick relevant items.
                </div>
              ) : (
                editProducts.map((p, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '10px', background: 'var(--obsidian)', borderRadius: '10px', marginBottom: '8px', border: '1px solid var(--border)' }}>
                    {p.images?.[0] ? (
                      <img src={p.images[0]} alt={p.name} style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: '48px', height: '48px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)', fontSize: '18px', flexShrink: 0 }}>✨</div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--cream)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--gold)', marginTop: '2px' }}>₹{(p.d2cPrice || 0).toLocaleString('en-IN')}</div>
                    </div>
                    <button
                      onClick={() => setSwapModalIndex(idx)}
                      style={{ padding: '5px 8px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-dim)', fontSize: '10px', cursor: 'pointer', flexShrink: 0 }}
                    >
                      🔄
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Campaign Status + Schedule Info */}
            <div style={{ padding: '16px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
              {isScheduled && (
                <div style={{ marginBottom: '12px', padding: '12px', background: 'rgba(76,175,122,0.08)', border: '1px solid rgba(76,175,122,0.3)', borderRadius: '10px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#4CAF7A', marginBottom: '6px' }}>✅ Campaign Scheduled</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)', lineHeight: '1.6' }}>
                    Stage 1 blast: 20 days before {selectedCampaign.holiday?.name || 'festival'}<br />
                    Stage 2 expiry warning: 48hrs before holiday
                  </div>
                </div>
              )}
              {isDraft && (
                <div style={{ marginBottom: '12px', padding: '12px', background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '10px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--gold)', lineHeight: '1.6' }}>
                    Approving will batch-generate unique 8-character vouchers and activate the 2-stage dispatch sequence.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Toast */}
        {toast && <Toast msg={toast.msg} type={toast.type} />}

        {/* Product Swap Modal */}
        {swapModalIndex !== null && (
          <SwapModal
            catalogProducts={catalogProducts}
            onSelect={(p) => handleSwapProduct(swapModalIndex, p)}
            onClose={() => setSwapModalIndex(null)}
          />
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // DASHBOARD VIEW
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '32px', background: 'var(--obsidian)', minHeight: '100vh', color: 'var(--cream)' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <div style={{ fontSize: '10px', color: 'var(--gold)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '6px' }}>
            AI Marketing & Automation Engine
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', color: 'var(--cream)', fontWeight: 300, margin: 0 }}>
            Festival Campaign Manager
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-dim)', marginTop: '4px', maxWidth: '520px', lineHeight: '1.6' }}>
            AI-personalized multi-channel campaigns with automated 20-day calendar triggers and unique single-use vouchers.
          </p>
        </div>
        <button
          onClick={handleTriggerCron}
          disabled={isCronRunning}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', background: isCronRunning ? 'rgba(212,175,55,0.1)' : 'rgba(212,175,55,0.12)', border: '1px solid var(--gold)', borderRadius: '10px', color: 'var(--gold)', fontSize: '12px', fontWeight: 600, cursor: isCronRunning ? 'not-allowed' : 'pointer' }}
        >
          {isCronRunning ? '⚡ Sweeping...' : '⚡ Run 20-Day Calendar Sweep'}
        </button>
      </div>

      {/* ANALYTICS ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
        <StatCard label="Total Dispatches" value={(analytics.totalSent || 0).toLocaleString()} sub="Email + WhatsApp" />
        <StatCard label="Avg Open Rate" value={`${analytics.overallOpenRate || '0.0'}%`} color="var(--gold)" sub="All campaigns" />
        <StatCard label="Vouchers Redeemed" value={(analytics.totalRedeemed || 0).toLocaleString()} color="#4CAF7A" sub={`of ${(analytics.totalSent || 0).toLocaleString()} issued`} />
        <StatCard label="Attributed Revenue" value={`₹${(analytics.totalRevenue || 0).toLocaleString('en-IN')}`} color="#D4AF37" sub="Festive sales" />
      </div>

      {/* MAIN GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px', marginBottom: '28px' }}>
        
        {/* UPCOMING HOLIDAYS */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px', padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '10px', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Indian Calendar</div>
              <h3 style={{ margin: '2px 0 0', fontSize: '15px', fontWeight: 600 }}>Upcoming Festivals</h3>
            </div>
            <span style={{ fontSize: '10px', background: 'rgba(212,175,55,0.1)', color: 'var(--gold)', padding: '3px 10px', borderRadius: '20px', border: '1px solid rgba(212,175,55,0.3)' }}>Auto 20-Day</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '420px' }}>
            {holidays.map(h => {
              const hasDraft = campaigns.some(c => c.holiday?.id === h.id || c.holidayId === h.id);
              const draftCampaign = campaigns.find(c => c.holiday?.id === h.id || c.holidayId === h.id);
              const isNear = h.daysRemaining <= 22 && h.daysRemaining >= 0;
              const isPast = h.daysRemaining < 0;
              return (
                <div key={h.id} style={{ padding: '12px 14px', background: isNear ? 'rgba(212,175,55,0.05)' : 'var(--obsidian)', border: `1px solid ${isNear ? 'rgba(212,175,55,0.25)' : 'var(--border)'}`, borderRadius: '12px', opacity: isPast ? 0.45 : 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--cream)' }}>{h.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {new Date(h.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: h.daysRemaining <= 20 && !isPast ? 'var(--gold)' : 'var(--text-dim)' }}>
                        {isPast ? 'Passed' : h.daysRemaining === 0 ? 'Today' : `${h.daysRemaining}d`}
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: '10px' }}>
                    {hasDraft && draftCampaign ? (
                      <button
                        onClick={() => openEditor(draftCampaign)}
                        style={{ width: '100%', padding: '6px', background: 'rgba(76,175,122,0.1)', border: '1px solid rgba(76,175,122,0.3)', borderRadius: '8px', color: '#4CAF7A', fontSize: '11px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                      >
                        ✅ Draft Ready — Open Editor →
                      </button>
                    ) : !isPast ? (
                      <button
                        onClick={() => handleDraftAI(h.id, 'VIP')}
                        disabled={isDrafting === h.id}
                        style={{ width: '100%', padding: '6px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: '8px', color: isDrafting === h.id ? 'var(--text-muted)' : 'var(--gold)', fontSize: '11px', cursor: isDrafting === h.id ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                      >
                        {isDrafting === h.id ? '🤖 Generating AI Draft...' : '+ Generate AI Campaign'}
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CAMPAIGNS PANEL */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px', padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '10px', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Campaign Inbox</div>
              <h3 style={{ margin: '2px 0 0', fontSize: '15px', fontWeight: 600 }}>All Campaigns ({campaigns.length})</h3>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {(['DRAFT', 'SCHEDULED', 'ACTIVE', 'COMPLETED'] as const).map(s => {
                const count = campaigns.filter(c => c.status === s).length;
                if (count === 0) return null;
                return (
                  <span key={s} style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '20px', background: `${STATUS_COLORS[s]}15`, color: STATUS_COLORS[s], border: `1px solid ${STATUS_COLORS[s]}30` }}>
                    {count} {s}
                  </span>
                );
              })}
            </div>
          </div>

          {campaigns.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--border)', borderRadius: '14px', padding: '48px', textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>🪔</div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--cream)', marginBottom: '6px' }}>No campaigns yet</div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '300px', lineHeight: '1.7' }}>
                Click "+ Generate AI Campaign" on any festival to create a personalized, multi-channel campaign draft.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1 }}>
              {campaigns.map(c => (
                <div
                  key={c.id}
                  style={{ padding: '14px 18px', background: 'var(--obsidian)', border: '1px solid var(--border)', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '16px', transition: 'border-color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(212,175,55,0.3)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--cream)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                      <StatusBadge status={c.status} />
                    </div>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: 'var(--text-muted)' }}>
                      <span>👑 {c.segmentationRules?.segment || 'VIP'}</span>
                      <span>🏷 {c.segmentationRules?.discountValue || 15}% OFF</span>
                      <span>{c.stage === 'STAGE_2_EXPIRY_WARNING' ? '🔔 Stage 2' : '📤 Stage 1'}</span>
                      <span>📅 {new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#4CAF7A' }}>{c.metricsSummary?.redeemed || 0}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>redeemed</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--gold)' }}>₹{(c.metricsSummary?.revenue || 0).toLocaleString('en-IN')}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>revenue</div>
                    </div>
                    <button
                      onClick={() => openEditor(c)}
                      style={{ padding: '8px 14px', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: '8px', color: 'var(--gold)', fontSize: '11px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      Open Editor →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  );
}

// ─── Helper: handleSendNow ────────────────────────────────────────────────────
// (placeholder — attached to component via closure-level fn ref below)
function handleSendNow(channel: 'EMAIL' | 'WHATSAPP') {
  alert(`Sending ${channel} dispatch is handled by your email/WhatsApp integration service (Zoho, Meta API). Ensure the sendCampaign() integration is wired to this campaign's coupon batch.`);
}

// ─── Sidebar Section ──────────────────────────────────────────────────────────
function SidebarSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ fontSize: '10px', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '10px', fontWeight: 700 }}>{title}</div>
      {children}
    </div>
  );
}

// ─── Toast Notification ───────────────────────────────────────────────────────
function Toast({ msg, type }: { msg: string; type: 'success' | 'error' }) {
  return (
    <div style={{
      position: 'fixed', bottom: '24px', right: '24px', zIndex: 99999,
      padding: '12px 20px', borderRadius: '12px', fontSize: '13px', fontWeight: 500, maxWidth: '380px',
      background: type === 'error' ? 'rgba(248,113,113,0.15)' : 'rgba(76,175,122,0.15)',
      border: `1px solid ${type === 'error' ? 'rgba(248,113,113,0.4)' : 'rgba(76,175,122,0.4)'}`,
      color: type === 'error' ? '#f87171' : '#4CAF7A',
      backdropFilter: 'blur(12px)',
      animation: 'slideIn 0.3s ease'
    }}>
      {msg}
    </div>
  );
}

// ─── Swap Product Modal ───────────────────────────────────────────────────────
function SwapModal({ catalogProducts, onSelect, onClose }: { catalogProducts: any[]; onSelect: (p: any) => void; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const filtered = query
    ? catalogProducts.filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
    : catalogProducts;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '24px' }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px', width: '100%', maxWidth: '520px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--cream)' }}>Select Replacement Product</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '18px', lineHeight: 1 }}>✕</button>
        </div>
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search catalog..."
            autoFocus
            style={{ width: '100%', padding: '10px 14px', background: 'var(--obsidian)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--cream)', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filtered.map(p => (
            <div
              key={p.id}
              onClick={() => onSelect(p)}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', background: 'var(--obsidian)', border: '1px solid var(--border)', borderRadius: '10px', cursor: 'pointer', transition: 'border-color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--gold)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            >
              {p.images?.[0] ? (
                <img src={p.images[0]} alt={p.name} style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }} />
              ) : (
                <div style={{ width: '44px', height: '44px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)', flexShrink: 0 }}>✨</div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', color: 'var(--cream)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--gold)', marginTop: '2px' }}>₹{(p.d2cPrice || 0).toLocaleString('en-IN')}</div>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--gold)', flexShrink: 0 }}>Select →</span>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>No products found for "{query}"</div>
          )}
        </div>
      </div>
    </div>
  );
}
