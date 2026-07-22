'use client';

import { useState, useCallback, useMemo } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
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

interface DynamicCoupon {
  id: string;
  uniqueCode: string;
  discountValue: number;
  isRedeemed: boolean;
  expiresAt: string;
  createdAt: string;
  customerId?: string | null;
  customer?: { firstName?: string; lastName?: string; email?: string } | null;
}

type View = 'DASHBOARD' | 'EDITOR' | 'COUPONS';
type EditorTab = 'EMAIL' | 'WHATSAPP' | 'PREVIEW';

// ─── Status helpers (match platform's globals.css status-pill classes) ────────
function statusPillClass(status: string): string {
  switch (status) {
    case 'ACTIVE':    return 'status-pill status-active';
    case 'SCHEDULED': return 'status-pill status-processing';
    case 'DRAFT':     return 'status-pill status-draft';
    case 'COMPLETED': return 'status-pill status-paid';
    case 'CANCELLED': return 'status-pill status-pending';
    default:          return 'status-pill status-draft';
  }
}

// Urgency color for day counts
function urgencyColor(days: number): string {
  if (days < 0)  return 'var(--color-muted)';
  if (days <= 7)  return '#c97e6a'; // rust
  if (days <= 20) return 'var(--color-accent)'; // gold trigger zone
  return 'var(--color-muted)';
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CampaignManagerClient({
  initialHolidays,
  initialCampaigns,
  initialAnalytics,
  initialCatalogProducts,
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

  const [view, setView] = useState<View>('DASHBOARD');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  // Editor state
  const [editorTab, setEditorTab] = useState<EditorTab>('EMAIL');
  const [editSubject, setEditSubject] = useState('');
  const [editBodyHtml, setEditBodyHtml] = useState('');
  const [editWhatsappText, setEditWhatsappText] = useState('');
  const [editSegment, setEditSegment] = useState('VIP');
  const [editDiscount, setEditDiscount] = useState(15);
  const [editProducts, setEditProducts] = useState<any[]>([]);

  // Coupons view state
  const [couponsForCampaign, setCouponsForCampaign] = useState<DynamicCoupon[]>([]);
  const [couponSearch, setCouponSearch] = useState('');
  const [couponFilter, setCouponFilter] = useState<'ALL' | 'REDEEMED' | 'UNREDEEMED'>('ALL');
  const [loadingCoupons, setLoadingCoupons] = useState(false);

  // Loading states
  const [isDrafting, setIsDrafting] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [isCronRunning, setIsCronRunning] = useState(false);
  const [confirmSweep, setConfirmSweep] = useState(false);
  const [swapIndex, setSwapIndex] = useState<number | null>(null);
  const [swapQuery, setSwapQuery] = useState('');
  const [couponsPreview, setCouponsPreview] = useState<string[]>([]);
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);

  // ── Utilities ──────────────────────────────────────────────────────────────
  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const refreshData = useCallback(async () => {
    try {
      const [hRes, cRes] = await Promise.all([
        fetch('/api/admin/campaigns/holidays'),
        fetch('/api/admin/campaigns'),
      ]);
      if (hRes.ok) { const d = await hRes.json(); setHolidays(d.holidays || []); }
      if (cRes.ok) { const d = await cRes.json(); setCampaigns(d.campaigns || []); setAnalytics(d.analytics || {}); }
    } catch { /* silent */ }
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

  const openCoupons = async (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setCouponSearch('');
    setCouponFilter('ALL');
    setLoadingCoupons(true);
    setView('COUPONS');
    try {
      const res = await fetch(`/api/admin/campaigns/${campaign.id}`);
      if (res.ok) {
        const data = await res.json();
        setCouponsForCampaign(data.campaign?.dynamicCoupons || []);
      }
    } catch { /* silent */ }
    setLoadingCoupons(false);
  };

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleDraftAI = async (holidayId: string, segment = 'VIP') => {
    setIsDrafting(holidayId);
    try {
      const res = await fetch('/api/admin/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DRAFT_AI', holidayId, segment, discountValue: 15 }),
      });
      const data = await res.json();
      if (data.success && data.campaign) {
        await refreshData();
        openEditor(data.campaign);
        showToast('AI draft ready — review & personalize below.');
      } else {
        showToast(data.error || 'Failed to generate AI draft.', 'err');
      }
    } catch (e: any) {
      showToast(e.message || 'Network error.', 'err');
    } finally {
      setIsDrafting(null);
    }
  };

  const handleSave = async (): Promise<boolean> => {
    if (!selectedCampaign) return false;
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
          recommendedProducts: editProducts,
        }),
      });
      if (res.ok) { await refreshData(); showToast('Draft saved.'); return true; }
      showToast('Failed to save.', 'err'); return false;
    } catch { showToast('Network error.', 'err'); return false; }
    finally { setIsSaving(false); }
  };

  const handleSchedule = async () => {
    if (!selectedCampaign) return;
    setIsDispatching(true);
    await handleSave();
    try {
      const res = await fetch(`/api/admin/campaigns/${selectedCampaign.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'APPROVE_AND_SCHEDULE' }),
      });
      const data = await res.json();
      if (data.success) {
        setCouponsPreview(data.result.sampleCodes || []);
        showToast(`Scheduled. ${data.result.couponsGenerated} unique vouchers generated.`);
        await refreshData();
        setSelectedCampaign(prev => prev ? { ...prev, status: 'SCHEDULED' } : null);
      } else {
        showToast(data.error || 'Failed to schedule.', 'err');
      }
    } catch (e: any) {
      showToast(e.message, 'err');
    } finally {
      setIsDispatching(false);
    }
  };

  const handleSweep = async () => {
    setConfirmSweep(false);
    setIsCronRunning(true);
    try {
      const res = await fetch('/api/cron/campaign-automation');
      const data = await res.json();
      await refreshData();
      showToast(`Calendar sweep complete — ${data.triggeredActions || 0} actions executed.`);
    } catch {
      showToast('Sweep failed.', 'err');
    } finally {
      setIsCronRunning(false);
    }
  };

  const handleRevokeCoupon = async (couponId: string) => {
    if (!confirm('Revoke this coupon? It will become permanently unusable.')) return;
    try {
      const res = await fetch(`/api/admin/campaigns/coupons/${couponId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setCouponsForCampaign(prev => prev.filter(c => c.id !== couponId));
        showToast('Coupon revoked.');
      } else {
        showToast('Failed to revoke.', 'err');
      }
    } catch {
      showToast('Network error.', 'err');
    }
  };

  // ── Derived data ───────────────────────────────────────────────────────────
  const draftCount = campaigns.filter(c => c.status === 'DRAFT').length;
  const upcomingTrigger = holidays.filter(h => h.daysRemaining >= 0 && h.daysRemaining <= 22);

  const filteredCoupons = useMemo(() => {
    let list = couponsForCampaign;
    if (couponFilter === 'REDEEMED') list = list.filter(c => c.isRedeemed);
    if (couponFilter === 'UNREDEEMED') list = list.filter(c => !c.isRedeemed);
    if (couponSearch) list = list.filter(c =>
      c.uniqueCode.toLowerCase().includes(couponSearch.toLowerCase()) ||
      c.customer?.email?.toLowerCase().includes(couponSearch.toLowerCase()) ||
      c.customer?.firstName?.toLowerCase().includes(couponSearch.toLowerCase())
    );
    return list;
  }, [couponsForCampaign, couponFilter, couponSearch]);

  const personalizedSubject = editSubject.replace(/\{\{CUSTOMER_NAME\}\}/g, 'Priya').replace(/\{\{COUPON_CODE\}\}/g, 'DIW8K9X2');
  const personalizedHtml = editBodyHtml.replace(/\{\{CUSTOMER_NAME\}\}/g, 'Priya').replace(/\{\{COUPON_CODE\}\}/g, 'DIW8K9X2').replace(/\{\{DISCOUNT_VALUE\}\}/g, String(editDiscount));
  const personalizedWA = editWhatsappText.replace(/\{\{CUSTOMER_NAME\}\}/g, 'Priya').replace(/\{\{COUPON_CODE\}\}/g, 'DIW8K9X2').replace(/\{\{DISCOUNT_VALUE\}\}/g, String(editDiscount));

  const swapFiltered = swapQuery
    ? catalogProducts.filter(p => p.name.toLowerCase().includes(swapQuery.toLowerCase()))
    : catalogProducts;

  // ════════════════════════════════════════════════════════════════════════════
  // VIEW: COUPONS
  // ════════════════════════════════════════════════════════════════════════════
  if (view === 'COUPONS' && selectedCampaign) {
    const redeemed = couponsForCampaign.filter(c => c.isRedeemed).length;
    const total = couponsForCampaign.length;
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="premium-card p-5 flex flex-wrap items-center gap-4 justify-between rounded-lg">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setView('DASHBOARD')}
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted border border-border px-3 py-2 hover:bg-surface-muted hover:text-primary transition-colors bg-background rounded-sm cursor-pointer"
            >
              ← Back
            </button>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent mb-0.5">
                Dynamic Voucher Control
              </div>
              <h1 className="font-serif text-[22px] font-normal text-primary m-0">
                {selectedCampaign.name}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">Total Issued</div>
              <div className="font-serif text-[22px] text-primary tabular-nums">{total}</div>
            </div>
            <div className="text-right">
              <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">Redeemed</div>
              <div className="font-serif text-[22px] tabular-nums" style={{ color: '#8cae7e' }}>{redeemed}</div>
            </div>
            <div className="text-right">
              <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">Redemption Rate</div>
              <div className="font-serif text-[22px] text-accent tabular-nums">
                {total > 0 ? ((redeemed / total) * 100).toFixed(1) : '0.0'}%
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="premium-card flex flex-col overflow-hidden rounded-lg">
          {/* Filters */}
          <div className="p-4 border-b border-border flex flex-wrap gap-3 bg-surface-muted/40 items-center justify-between">
            <div className="flex-1 min-w-[220px] flex items-center gap-2 border border-border bg-background px-3 py-2 rounded-sm focus-within:border-accent transition-colors">
              <span className="text-muted text-xs" aria-hidden="true">🔍</span>
              <input
                type="text"
                value={couponSearch}
                onChange={e => setCouponSearch(e.target.value)}
                placeholder="Search code, customer name, or email..."
                className="bg-transparent text-primary font-mono text-[12px] focus:outline-none w-full placeholder:text-muted/60"
              />
              {couponSearch && (
                <button onClick={() => setCouponSearch('')} className="text-muted hover:text-primary font-mono text-[10px] uppercase cursor-pointer">Clear</button>
              )}
            </div>
            <div className="flex gap-2">
              {(['ALL', 'UNREDEEMED', 'REDEEMED'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setCouponFilter(f)}
                  className={`font-mono text-[10px] uppercase tracking-[0.12em] px-3 py-2 border transition-colors rounded-sm cursor-pointer ${
                    couponFilter === f
                      ? 'bg-accent text-background border-accent'
                      : 'border-border text-muted hover:border-accent hover:text-primary bg-background'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="table-responsive">
            <table className="w-full text-left border-collapse">
              <caption className="sr-only">Dynamic voucher codes for {selectedCampaign.name}</caption>
              <thead className="border-b border-border bg-surface-muted/20">
                <tr>
                  {['Voucher Code', 'Customer', 'Discount', 'Status', 'Expires', 'Issued', ''].map(h => (
                    <th key={h} scope="col" className="px-5 py-3 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {loadingCoupons && (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-muted font-mono text-[11px] uppercase tracking-widest">
                      Loading vouchers…
                    </td>
                  </tr>
                )}
                {!loadingCoupons && filteredCoupons.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-muted font-mono text-[11px] uppercase tracking-widest">
                      No vouchers found.
                    </td>
                  </tr>
                )}
                {filteredCoupons.map(c => (
                  <tr key={c.id} className="hover:bg-surface-muted/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-[13px] text-accent tracking-[0.12em] font-semibold">{c.uniqueCode}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      {c.customer ? (
                        <div>
                          <div className="font-serif text-[13px] text-primary">{c.customer.firstName} {c.customer.lastName}</div>
                          <div className="font-mono text-[10px] text-muted mt-0.5">{c.customer.email}</div>
                        </div>
                      ) : (
                        <span className="font-mono text-[11px] text-muted">Unassigned</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[13px] text-primary tabular-nums">{c.discountValue}%</td>
                    <td className="px-5 py-3.5">
                      <span className={`status-pill ${c.isRedeemed ? 'status-paid' : 'status-active'}`}>
                        <span className="dot" aria-hidden="true" />
                        {c.isRedeemed ? 'Redeemed' : 'Active'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[11px] text-muted tabular-nums">
                      {new Date(c.expiresAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[11px] text-muted tabular-nums">
                      {new Date(c.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </td>
                    <td className="px-5 py-3.5">
                      {!c.isRedeemed && (
                        <button
                          onClick={() => handleRevokeCoupon(c.id)}
                          className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted border border-border px-2.5 py-1.5 hover:border-red-600/50 hover:text-red-400 transition-colors bg-background rounded-sm cursor-pointer"
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {toast && <ToastBar msg={toast.msg} type={toast.type} />}
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // VIEW: EDITOR
  // ════════════════════════════════════════════════════════════════════════════
  if (view === 'EDITOR' && selectedCampaign) {
    const isDraft = selectedCampaign.status === 'DRAFT';
    const isLive = ['SCHEDULED', 'ACTIVE'].includes(selectedCampaign.status);

    return (
      <div className="flex flex-col" style={{ height: 'calc(100vh - 57px)' }}>
        {/* Editor Top Bar */}
        <div className="flex flex-wrap items-center gap-3 px-6 py-3 border-b border-border bg-surface shrink-0">
          <button
            onClick={() => setView('DASHBOARD')}
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted border border-border px-3 py-2 hover:bg-surface-muted hover:text-primary transition-colors bg-background rounded-sm cursor-pointer"
          >
            ← Campaigns
          </button>
          <div className="w-px h-4 bg-border mx-1" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent">Campaign Editor</div>
            <h1 className="font-serif text-[18px] font-normal text-primary m-0 truncate">{selectedCampaign.name}</h1>
          </div>
          <span className={statusPillClass(selectedCampaign.status)}>
            <span className="dot" aria-hidden="true" />
            {selectedCampaign.status}
          </span>
          {selectedCampaign.holiday && (
            <span className="font-mono text-[10px] text-muted border border-border px-2.5 py-1 rounded-sm bg-background">
              🪔 {selectedCampaign.holiday.name} · {Math.max(0, selectedCampaign.holiday.daysRemaining)}d away
            </span>
          )}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted border border-border px-4 py-2 hover:bg-surface-muted hover:text-primary transition-colors bg-background rounded-sm cursor-pointer disabled:opacity-50"
            >
              {isSaving ? 'Saving…' : 'Save Draft'}
            </button>
            {isDraft && (
              <button
                onClick={handleSchedule}
                disabled={isDispatching}
                className="font-mono text-[10px] uppercase tracking-[0.14em] bg-accent text-background px-4 py-2 hover:bg-accent-hover transition-colors rounded-sm cursor-pointer disabled:opacity-50"
              >
                {isDispatching ? 'Scheduling…' : 'Approve & Schedule →'}
              </button>
            )}
            {isLive && (
              <>
                <button className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted border border-border px-4 py-2 hover:bg-surface-muted hover:text-primary transition-colors bg-background rounded-sm cursor-pointer">
                  ✉ Send Email Now
                </button>
                <button className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted border border-border px-4 py-2 hover:bg-surface-muted hover:text-primary transition-colors bg-background rounded-sm cursor-pointer">
                  💬 WhatsApp Now
                </button>
              </>
            )}
          </div>
        </div>

        {/* Editor Body: 3-column split */}
        <div className="flex flex-1 overflow-hidden">

          {/* PANEL 1: Settings */}
          <aside
            aria-label="Campaign settings"
            className="w-[240px] shrink-0 border-r border-border overflow-y-auto p-5 space-y-6 bg-surface"
          >
            {/* Segment */}
            <fieldset>
              <legend className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent mb-3">Audience</legend>
              <div className="space-y-1.5">
                {[
                  { id: 'VIP',    label: 'VIP Buyers',     desc: 'Orders > ₹25k' },
                  { id: 'LAPSED', label: 'Lapsed (90d+)',   desc: 'Win-back' },
                  { id: 'ALL',    label: 'All Customers',   desc: 'Full base' },
                ].map(s => (
                  <label
                    key={s.id}
                    className={`flex items-center gap-3 px-3 py-2.5 border cursor-pointer transition-colors rounded-sm ${
                      editSegment === s.id
                        ? 'border-accent/60 bg-accent/5 text-primary'
                        : 'border-border hover:border-accent/30 text-muted hover:text-primary'
                    }`}
                  >
                    <input
                      type="radio"
                      name="segment"
                      value={s.id}
                      checked={editSegment === s.id}
                      onChange={() => setEditSegment(s.id)}
                      className="sr-only"
                    />
                    <div>
                      <div className="font-mono text-[11px] tracking-wide">{s.label}</div>
                      <div className="font-mono text-[9px] text-muted mt-0.5 uppercase tracking-[0.1em]">{s.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </fieldset>

            {/* Discount */}
            <fieldset>
              <legend className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent mb-3">Voucher Discount</legend>
              <div className="flex items-center gap-2 border border-border bg-background rounded-sm px-3 py-2 focus-within:border-accent transition-colors">
                <input
                  type="number"
                  value={editDiscount}
                  onChange={e => setEditDiscount(Number(e.target.value))}
                  min={5} max={50}
                  aria-label="Discount percentage"
                  className="w-14 bg-transparent text-accent font-serif text-[22px] focus:outline-none tabular-nums"
                />
                <div>
                  <div className="font-serif text-[18px] text-accent">%</div>
                  <div className="font-mono text-[9px] text-muted uppercase tracking-[0.1em]">off sitewide</div>
                </div>
              </div>
              <p className="font-mono text-[10px] text-muted mt-2 leading-relaxed">
                Each customer gets a unique 8-char code, e.g.{' '}
                <code className="text-accent tracking-wider">DIW8K9X2</code>
              </p>
            </fieldset>

            {/* Tokens */}
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent mb-3">Personalization Tokens</div>
              <div className="space-y-1">
                {[
                  { token: '{{CUSTOMER_NAME}}', desc: "First name" },
                  { token: '{{COUPON_CODE}}',   desc: "Unique code" },
                  { token: '{{HOLIDAY_NAME}}',  desc: "Festival" },
                  { token: '{{DISCOUNT_VALUE}}',desc: "% value" },
                ].map(t => (
                  <button
                    key={t.token}
                    onClick={() => { navigator.clipboard.writeText(t.token); showToast(`Copied ${t.token}`); }}
                    title={`Click to copy ${t.token}`}
                    className="w-full flex items-center justify-between gap-2 px-2.5 py-2 border border-border bg-background hover:border-accent/40 transition-colors cursor-pointer rounded-sm group"
                  >
                    <code className="font-mono text-[10px] text-accent group-hover:text-accent-hover">{t.token}</code>
                    <span className="font-mono text-[9px] text-muted uppercase tracking-[0.08em]">{t.desc}</span>
                  </button>
                ))}
              </div>
              <p className="font-mono text-[10px] text-muted mt-2">Click any token to copy to clipboard.</p>
            </div>

            {/* Sample Vouchers */}
            {couponsPreview.length > 0 && (
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent mb-3">Sample Vouchers</div>
                <div className="space-y-1.5">
                  {couponsPreview.map((code, i) => (
                    <div key={i} className="font-mono text-[12px] text-accent tracking-[0.2em] font-semibold px-3 py-2 bg-accent/5 border border-accent/20 rounded-sm tabular-nums">
                      {code}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* PANEL 2: Content Editor */}
          <main className="flex-1 flex flex-col overflow-hidden bg-background" aria-label="Campaign content editor">
            {/* Tabs */}
            <div className="flex gap-0 border-b border-border shrink-0">
              {(['EMAIL', 'WHATSAPP', 'PREVIEW'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setEditorTab(tab)}
                  className={`font-mono text-[10px] uppercase tracking-[0.14em] px-5 py-3 border-b-2 transition-colors cursor-pointer ${
                    editorTab === tab
                      ? 'border-b-accent text-accent bg-surface/50'
                      : 'border-b-transparent text-muted hover:text-primary hover:bg-surface/30'
                  }`}
                >
                  {tab === 'EMAIL' ? '✉ Email' : tab === 'WHATSAPP' ? '💬 WhatsApp' : '👁 Preview'}
                </button>
              ))}
              <div className="flex-1" />
              <span className="font-mono text-[10px] text-muted self-center pr-4">
                AI personalizes {'{{CUSTOMER_NAME}}'} per recipient at send time
              </span>
            </div>

            {/* EMAIL */}
            {editorTab === 'EMAIL' && (
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <div>
                  <label htmlFor="email-subject" className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted block mb-1.5">
                    Subject Line
                  </label>
                  <input
                    id="email-subject"
                    type="text"
                    value={editSubject}
                    onChange={e => setEditSubject(e.target.value)}
                    placeholder="e.g. {{CUSTOMER_NAME}}, your exclusive Diwali offer awaits ✨"
                    className="w-full px-3 py-2.5 border border-border bg-surface text-primary font-mono text-[12px] focus:outline-none focus:border-accent transition-colors rounded-sm"
                  />
                </div>
                <div className="flex-1 flex flex-col">
                  <label htmlFor="email-body" className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted block mb-1.5">
                    Email Body (HTML)
                    <span className="ml-2 normal-case tracking-normal text-muted/70">— use {'{{CUSTOMER_NAME}}'} for personalization</span>
                  </label>
                  <textarea
                    id="email-body"
                    value={editBodyHtml}
                    onChange={e => setEditBodyHtml(e.target.value)}
                    rows={22}
                    className="w-full p-3.5 border border-border bg-surface text-primary font-mono text-[11px] leading-relaxed focus:outline-none focus:border-accent transition-colors resize-y rounded-sm"
                    spellCheck={false}
                  />
                </div>
              </div>
            )}

            {/* WHATSAPP */}
            {editorTab === 'WHATSAPP' && (
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <div className="flex gap-2.5 p-3.5 border border-border rounded-sm bg-surface">
                  <span aria-hidden="true">💡</span>
                  <p className="font-mono text-[11px] text-muted m-0 leading-relaxed">
                    WhatsApp Business API: use <strong>*bold*</strong> for emphasis. Keep under 160 words.{' '}
                    <code className="text-accent text-[10px]">{'{{CUSTOMER_NAME}}'}</code> is personalized per recipient.
                  </p>
                </div>
                <div>
                  <label htmlFor="wa-body" className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted block mb-1.5">
                    Broadcast Message
                  </label>
                  <textarea
                    id="wa-body"
                    value={editWhatsappText}
                    onChange={e => setEditWhatsappText(e.target.value)}
                    rows={16}
                    className="w-full p-3.5 border border-border bg-surface text-primary font-mono text-[12px] leading-relaxed focus:outline-none focus:border-accent transition-colors resize-y rounded-sm"
                    placeholder={`🪔 *Namaste {{CUSTOMER_NAME}}!* ✨\n\nCelebrate Diwali with James & Sons handcrafted brass lighting.\n\nYour personal *{{DISCOUNT_VALUE}}% OFF* voucher: *{{COUPON_CODE}}*\n\nShop: https://jamesandsons.in/collections/festive`}
                  />
                </div>
                <div className="flex justify-between font-mono text-[10px] text-muted">
                  <span>{editWhatsappText.length} characters</span>
                  <span className={editWhatsappText.trim().split(/\s+/).filter(Boolean).length > 160 ? 'text-red-400' : ''}>
                    {editWhatsappText.trim().split(/\s+/).filter(Boolean).length} words
                  </span>
                </div>
              </div>
            )}

            {/* PREVIEW */}
            {editorTab === 'PREVIEW' && (
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                <div className="p-3.5 border border-border rounded-sm bg-surface flex gap-2.5">
                  <span aria-hidden="true">🔍</span>
                  <p className="font-mono text-[11px] text-muted m-0">
                    Preview for sample customer <strong className="text-primary">Priya</strong> with code <code className="text-accent tracking-wider">DIW8K9X2</code>.
                  </p>
                </div>
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted mb-1.5">Email Subject</div>
                  <div className="px-4 py-3 border border-border bg-surface rounded-sm font-serif text-[15px] text-primary">
                    {personalizedSubject || '(no subject)'}
                  </div>
                </div>
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted mb-1.5">Email HTML</div>
                  <div
                    className="border border-border rounded-sm overflow-hidden"
                    dangerouslySetInnerHTML={{ __html: personalizedHtml }}
                  />
                </div>
                {editWhatsappText && (
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted mb-1.5">WhatsApp Preview</div>
                    <div className="bg-[#0b141a] rounded-sm p-5 border border-border">
                      <div className="bg-[#202c33] rounded-xl rounded-bl-none max-w-[85%] px-4 py-3">
                        <p className="text-[#e9edef] font-mono text-[12px] leading-[1.75] m-0 whitespace-pre-wrap">{personalizedWA}</p>
                        <div className="font-mono text-[9px] text-[#8696a0] mt-1.5 text-right">Delivered ✓✓</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </main>

          {/* PANEL 3: Products */}
          <aside
            aria-label="Featured products"
            className="w-[260px] shrink-0 border-l border-border flex flex-col overflow-hidden bg-surface"
          >
            <div className="px-5 py-3.5 border-b border-border shrink-0">
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent">Featured Products</div>
              <p className="font-mono text-[10px] text-muted mt-0.5">Embedded in this campaign</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {editProducts.length === 0 ? (
                <div className="py-8 text-center border border-dashed border-border rounded-sm">
                  <p className="font-mono text-[10px] text-muted uppercase tracking-[0.1em]">No products selected</p>
                </div>
              ) : editProducts.map((p, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2.5 border border-border bg-background rounded-sm group hover:border-accent/30 transition-colors">
                  {p.images?.[0]
                    ? <img src={p.images[0]} alt={p.name} className="w-10 h-10 object-cover rounded-sm shrink-0" />
                    : <div className="w-10 h-10 bg-surface-muted rounded-sm shrink-0 flex items-center justify-center text-accent text-xs">✦</div>
                  }
                  <div className="flex-1 min-w-0">
                    <div className="font-serif text-[12px] text-primary truncate">{p.name}</div>
                    <div className="font-mono text-[10px] text-accent tabular-nums mt-0.5">₹{(p.d2cPrice || 0).toLocaleString('en-IN')}</div>
                  </div>
                  <button
                    onClick={() => { setSwapIndex(idx); setSwapQuery(''); }}
                    className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted border border-border px-2 py-1 hover:border-accent/40 hover:text-primary transition-colors bg-surface rounded-sm cursor-pointer shrink-0 opacity-0 group-hover:opacity-100"
                  >
                    Swap
                  </button>
                </div>
              ))}
            </div>

            {/* Dispatch context */}
            <div className="p-4 border-t border-border shrink-0 space-y-2">
              {isDraft && (
                <div className="px-3 py-2.5 border border-border bg-accent/5 rounded-sm">
                  <p className="font-mono text-[10px] text-accent leading-relaxed m-0">
                    Approving generates unique 8-char vouchers and activates the 2-stage dispatch sequence.
                  </p>
                </div>
              )}
              {isLive && (
                <div className="px-3 py-2.5 border border-border bg-surface-muted rounded-sm">
                  <p className="font-mono text-[10px] text-muted leading-relaxed m-0">
                    Stage 1 blast fires 20 days before festival. Stage 2 expiry warning fires 48h before.
                  </p>
                </div>
              )}
            </div>
          </aside>
        </div>

        {toast && <ToastBar msg={toast.msg} type={toast.type} />}

        {/* Product Swap Drawer */}
        {swapIndex !== null && (
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-6"
            role="dialog"
            aria-modal="true"
            aria-label="Select replacement product"
          >
            <div className="bg-surface border border-border rounded-lg w-full max-w-[480px] max-h-[75vh] flex flex-col overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between shrink-0">
                <h2 className="font-serif text-[16px] text-primary font-normal m-0">Swap Product</h2>
                <button onClick={() => setSwapIndex(null)} className="text-muted hover:text-primary font-mono text-[16px] cursor-pointer bg-transparent border-none">✕</button>
              </div>
              <div className="px-5 py-3 border-b border-border shrink-0">
                <div className="flex items-center gap-2 border border-border bg-background px-3 py-2 rounded-sm focus-within:border-accent transition-colors">
                  <span className="text-muted text-xs" aria-hidden="true">🔍</span>
                  <input
                    type="text"
                    value={swapQuery}
                    onChange={e => setSwapQuery(e.target.value)}
                    placeholder="Search catalog…"
                    autoFocus
                    className="bg-transparent text-primary font-mono text-[12px] focus:outline-none w-full placeholder:text-muted/60"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {swapFiltered.map(p => (
                  <button
                    key={p.id}
                    onClick={() => {
                      const updated = [...editProducts];
                      updated[swapIndex] = p;
                      setEditProducts(updated);
                      setSwapIndex(null);
                    }}
                    className="w-full flex items-center gap-3 p-3 border border-border bg-background hover:border-accent/50 hover:bg-accent/5 transition-colors cursor-pointer text-left rounded-sm"
                  >
                    {p.images?.[0]
                      ? <img src={p.images[0]} alt={p.name} className="w-10 h-10 object-cover rounded-sm shrink-0" />
                      : <div className="w-10 h-10 bg-surface-muted rounded-sm shrink-0 flex items-center justify-center text-accent text-xs">✦</div>
                    }
                    <div className="flex-1 min-w-0">
                      <div className="font-serif text-[13px] text-primary truncate">{p.name}</div>
                      <div className="font-mono text-[10px] text-accent tabular-nums mt-0.5">₹{(p.d2cPrice || 0).toLocaleString('en-IN')}</div>
                    </div>
                    <span className="font-mono text-[10px] text-accent shrink-0">Select →</span>
                  </button>
                ))}
                {swapFiltered.length === 0 && (
                  <p className="text-center font-mono text-[11px] text-muted py-8">No products match "{swapQuery}"</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // VIEW: DASHBOARD
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent mb-1">AI Marketing Engine</div>
          <h1 className="font-serif text-[28px] md:text-[32px] font-normal text-primary tracking-wide m-0">
            Festival Campaign Manager
          </h1>
          <p className="font-mono text-[12px] text-muted mt-1 m-0">
            AI-personalized multi-channel campaigns · 20-day calendar triggers · Per-customer unique vouchers
          </p>
        </div>
        <div>
          {confirmSweep ? (
            <div className="flex items-center gap-2 p-3 border border-border rounded-sm bg-surface-muted">
              <span className="font-mono text-[11px] text-muted">
                This will auto-draft for {upcomingTrigger.length} festival(s) within 20 days. Proceed?
              </span>
              <button
                onClick={handleSweep}
                disabled={isCronRunning}
                className="font-mono text-[10px] uppercase tracking-[0.12em] bg-accent text-background px-3 py-2 hover:bg-accent-hover transition-colors rounded-sm cursor-pointer disabled:opacity-50"
              >
                {isCronRunning ? 'Sweeping…' : 'Confirm'}
              </button>
              <button
                onClick={() => setConfirmSweep(false)}
                className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted border border-border px-3 py-2 hover:bg-surface-muted rounded-sm cursor-pointer bg-background"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmSweep(true)}
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent border border-accent/40 px-4 py-2.5 hover:bg-accent/8 hover:border-accent transition-colors rounded-sm cursor-pointer bg-background"
            >
              ⚡ Run 20-Day Calendar Sweep
            </button>
          )}
        </div>
      </div>

      {/* KPI Row — collapses to 2×2 on mobile */}
      <section aria-label="Campaign metrics" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Dispatches',    value: (analytics.totalSent || 0).toLocaleString(),            sub: 'Email + WhatsApp',   color: undefined },
          { label: 'Avg Open Rate',       value: `${analytics.overallOpenRate || '0.0'}%`,               sub: 'All campaigns',      color: 'var(--color-accent)' },
          { label: 'Vouchers Redeemed',   value: (analytics.totalRedeemed || 0).toLocaleString(),        sub: 'Single-use codes',   color: '#8cae7e' },
          { label: 'Attributed Revenue',  value: `₹${(analytics.totalRevenue || 0).toLocaleString('en-IN')}`, sub: 'Festive orders', color: 'var(--color-accent)' },
        ].map(k => (
          <div key={k.label} className="premium-card p-5 rounded-lg">
            <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted mb-2">{k.label}</div>
            <div
              className="font-serif text-[28px] font-normal leading-tight tabular-nums"
              style={{ color: k.color || 'var(--color-primary)' }}
            >
              {k.value}
            </div>
            <div className="font-mono text-[10px] text-muted mt-1.5">{k.sub}</div>
          </div>
        ))}
      </section>

      {/* Main grid: Calendar + Campaign List */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">

        {/* Indian Festival Calendar */}
        <section aria-labelledby="calendar-heading" className="premium-card p-5 rounded-lg flex flex-col">
          <div className="flex items-center justify-between mb-4 shrink-0">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent">Indian Calendar</div>
              <h2 id="calendar-heading" className="font-serif text-[18px] font-normal text-primary m-0">Upcoming Festivals</h2>
            </div>
            <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted border border-border px-2 py-1 rounded-sm bg-background">
              Auto 20-Day
            </span>
          </div>

          {/* Legend */}
          <div className="flex gap-4 mb-3 shrink-0">
            {[
              { color: '#c97e6a', label: '≤7 days' },
              { color: 'var(--color-accent)', label: '≤20 days (trigger)' },
              { color: 'var(--color-muted)', label: 'Upcoming' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: l.color }} aria-hidden="true" />
                <span className="font-mono text-[9px] text-muted">{l.label}</span>
              </div>
            ))}
          </div>

          <div className="space-y-2 overflow-y-auto flex-1" style={{ maxHeight: '480px' }}>
            {holidays.map(h => {
              const hasDraft = campaigns.some(c => c.holiday?.id === h.id || c.holidayId === h.id);
              const draft = campaigns.find(c => c.holiday?.id === h.id || c.holidayId === h.id);
              const isPast = h.daysRemaining < 0;
              const urgColor = urgencyColor(h.daysRemaining);
              const isInTriggerZone = h.daysRemaining >= 0 && h.daysRemaining <= 22;

              return (
                <article
                  key={h.id}
                  className={`border rounded-sm transition-opacity ${isPast ? 'opacity-40' : 'opacity-100'} ${isInTriggerZone ? 'border-accent/30 bg-accent/5' : 'border-border bg-background'}`}
                  aria-label={`${h.name}, ${h.daysRemaining < 0 ? 'passed' : h.daysRemaining + ' days away'}`}
                >
                  <div className="flex items-center justify-between px-3 py-2.5">
                    <div>
                      <div className="font-serif text-[13px] text-primary">{h.name}</div>
                      <div className="font-mono text-[10px] text-muted mt-0.5">
                        {new Date(h.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                    <div
                      className="font-mono text-[13px] font-semibold tabular-nums shrink-0"
                      style={{ color: urgColor }}
                      aria-label={isPast ? 'Passed' : `${h.daysRemaining} days remaining`}
                    >
                      {isPast ? '—' : h.daysRemaining === 0 ? 'Today' : `${h.daysRemaining}d`}
                    </div>
                  </div>
                  {!isPast && (
                    <div className="px-3 pb-2.5">
                      {hasDraft && draft ? (
                        <button
                          onClick={() => openEditor(draft)}
                          className="w-full font-mono text-[9px] uppercase tracking-[0.12em] text-center py-1.5 border border-border rounded-sm text-muted hover:border-accent/40 hover:text-accent bg-background transition-colors cursor-pointer"
                        >
                          ✓ Draft Ready — Open Editor →
                        </button>
                      ) : (
                        <button
                          onClick={() => handleDraftAI(h.id)}
                          disabled={isDrafting === h.id}
                          className="w-full font-mono text-[9px] uppercase tracking-[0.12em] text-center py-1.5 border border-border rounded-sm text-muted hover:border-accent/40 hover:text-accent bg-background transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {isDrafting === h.id ? '🤖 Generating…' : '+ Generate AI Campaign'}
                        </button>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        {/* Campaign List */}
        <section aria-labelledby="campaigns-heading" className="premium-card flex flex-col overflow-hidden rounded-lg">
          <div className="px-5 py-4 border-b border-border flex flex-wrap items-center justify-between gap-3 bg-surface-muted/40 shrink-0">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent">Campaign Inbox</div>
              <h2 id="campaigns-heading" className="font-serif text-[18px] font-normal text-primary m-0">
                All Campaigns ({campaigns.length})
              </h2>
            </div>
            {/* Status summary pills */}
            <div className="flex flex-wrap gap-2">
              {(['DRAFT', 'SCHEDULED', 'ACTIVE', 'COMPLETED'] as const).map(s => {
                const count = campaigns.filter(c => c.status === s).length;
                if (!count) return null;
                return (
                  <span key={s} className={statusPillClass(s)}>
                    <span className="dot" aria-hidden="true" />
                    {count} {s}
                  </span>
                );
              })}
            </div>
          </div>

          {campaigns.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-center px-8">
              <span className="text-[36px] mb-3" aria-hidden="true">🪔</span>
              <div className="font-serif text-[18px] text-primary mb-2">No campaigns yet</div>
              <p className="font-mono text-[12px] text-muted max-w-[300px] leading-relaxed">
                Select a festival from the calendar and click "+ Generate AI Campaign" to create a personalized, multi-channel campaign draft.
              </p>
            </div>
          ) : (
            <div className="table-responsive flex-1">
              <table className="w-full text-left border-collapse">
                <caption className="sr-only">Festival marketing campaigns</caption>
                <thead className="border-b border-border bg-surface-muted/20 sticky top-0">
                  <tr>
                    {['Campaign', 'Segment', 'Status', 'Dispatches', 'Redeemed', 'Revenue', 'Actions'].map((h, i) => (
                      <th
                        key={h}
                        scope="col"
                        className={`px-5 py-3 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal ${i >= 3 && i <= 5 ? 'text-right' : ''}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {campaigns.map(c => (
                    <tr key={c.id} className="hover:bg-surface-muted/40 transition-colors group">
                      <td className="px-5 py-4">
                        <div className="font-serif text-[14px] text-primary">{c.name}</div>
                        <div className="font-mono text-[10px] text-muted mt-0.5">
                          {c.stage === 'STAGE_2_EXPIRY_WARNING' ? '⚠ Stage 2 · Expiry Warning' : '📤 Stage 1 · Blast'}
                          {' · '}
                          {new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted border border-border px-2 py-1 rounded-sm bg-background">
                          {c.segmentationRules?.segment || 'VIP'}
                        </span>
                        <div className="font-mono text-[10px] text-accent mt-1">{c.segmentationRules?.discountValue || 15}% OFF</div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={statusPillClass(c.status)}>
                          <span className="dot" aria-hidden="true" />
                          {c.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono text-[13px] text-primary tabular-nums text-right">{c.metricsSummary?.sent || 0}</td>
                      <td className="px-5 py-4 font-mono text-[13px] tabular-nums text-right" style={{ color: '#8cae7e' }}>{c.metricsSummary?.redeemed || 0}</td>
                      <td className="px-5 py-4 font-mono text-[13px] text-accent tabular-nums text-right">
                        ₹{(c.metricsSummary?.revenue || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => openCoupons(c)}
                            className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted border border-border px-2.5 py-1.5 hover:border-accent/40 hover:text-accent transition-colors bg-background rounded-sm cursor-pointer"
                            title={`Manage vouchers for ${c.name}`}
                          >
                            Vouchers
                          </button>
                          <button
                            onClick={() => openEditor(c)}
                            className="font-mono text-[10px] uppercase tracking-[0.1em] text-accent border border-accent/30 px-2.5 py-1.5 hover:border-accent hover:bg-accent/8 transition-colors bg-background rounded-sm cursor-pointer"
                          >
                            Edit →
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {toast && <ToastBar msg={toast.msg} type={toast.type} />}
    </div>
  );
}

// ─── Toast notification ───────────────────────────────────────────────────────
function ToastBar({ msg, type }: { msg: string; type: 'ok' | 'err' }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-6 right-6 z-[9999] px-4 py-3 rounded-sm border font-mono text-[12px] max-w-sm shadow-xl backdrop-blur-sm ${
        type === 'err'
          ? 'bg-red-900/20 border-red-600/40 text-red-300'
          : 'bg-surface border-border text-primary'
      }`}
    >
      {msg}
    </div>
  );
}
