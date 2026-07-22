'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';

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
type Channel = 'EMAIL' | 'WHATSAPP';
type ViewMode = 'VISUAL' | 'HTML' | 'PREVIEW';
type MobileStep = 'AUDIENCE' | 'CONTENT' | 'PRODUCTS' | 'PREVIEW';

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

function urgencyColor(days: number): string {
  if (days < 0)  return 'var(--color-muted)';
  if (days <= 7)  return '#c97e6a'; // rust
  if (days <= 20) return 'var(--color-accent)'; // gold trigger zone
  return 'var(--color-muted)';
}

function formatDate(dateInput: string | Date | null | undefined, includeYear = true): string {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = d.getUTCDate();
  const month = months[d.getUTCMonth()];
  const year = d.getUTCFullYear();
  return includeYear ? `${day} ${month} ${year}` : `${day} ${month}`;
}

// Helper to compile plain text fields into luxury HTML template for non-tech users
function compileVisualHtml({
  headline,
  greeting,
  bodyText,
  ctaText,
  discountValue
}: {
  headline: string;
  greeting: string;
  bodyText: string;
  ctaText: string;
  discountValue: number;
}): string {
  const paragraphs = bodyText
    .split('\n')
    .filter(p => p.trim().length > 0)
    .map(p => `<p style="color: #cccccc; font-size: 14px; line-height: 1.6; margin-bottom: 16px;">${p.trim()}</p>`)
    .join('');

  return `
<div style="background-color: #0d0d0d; color: #f5f5f5; font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px 20px; max-width: 600px; margin: 0 auto; border: 1px solid rgba(212,175,55,0.3); border-radius: 16px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h2 style="color: #D4AF37; font-size: 24px; letter-spacing: 0.15em; text-transform: uppercase; margin: 0;">James &amp; Sons</h2>
    <p style="color: #888888; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; margin-top: 4px;">Bespoke Handcrafted Luxury</p>
  </div>
  
  <div style="text-align: center; padding: 30px 20px; background: rgba(255,255,255,0.02); border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
    ${greeting ? `<p style="color: #D4AF37; font-size: 13px; margin-bottom: 8px;">${greeting}</p>` : ''}
    <h1 style="color: #ffffff; font-size: 26px; font-weight: 300; margin-bottom: 16px;">${headline || 'Festive Celebration'}</h1>
    
    <div style="text-align: left; margin-bottom: 24px;">
      ${paragraphs || '<p style="color: #cccccc; font-size: 14px; line-height: 1.6;">We invite you to elevate your interior spaces with our signature handcrafted brass lighting.</p>'}
    </div>

    <div style="background: linear-gradient(135deg, rgba(212,175,55,0.2) 0%, rgba(212,175,55,0.05) 100%); border: 1px dashed #D4AF37; padding: 20px; border-radius: 10px; display: inline-block; margin: 10px 0 24px; text-align: center;">
      <span style="display: block; color: #D4AF37; font-size: 12px; letter-spacing: 0.15em; text-transform: uppercase;">Your Personal Single-Use Code</span>
      <strong style="color: #ffffff; font-size: 28px; letter-spacing: 0.2em; font-family: monospace; display: block; margin-top: 6px;">{{COUPON_CODE}}</strong>
      <span style="color: #aaaaaa; font-size: 11px; margin-top: 4px; display: block;">Valid for ${discountValue}% OFF your entire festive order</span>
    </div>

    <div>
      <a href="https://jamesandsons.in/collections/festive" style="background-color: #D4AF37; color: #000000; padding: 14px 32px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.15em; text-decoration: none; border-radius: 30px; display: inline-block;">
        ${ctaText || 'Claim Your Voucher'}
      </a>
    </div>
  </div>

  <div style="text-align: center; margin-top: 30px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 20px; color: #666666; font-size: 11px;">
    &copy; ${new Date().getFullYear()} James &amp; Sons. All rights reserved. | CNI Church Compound, Civil Lines, Aligarh, UP 202001
  </div>
</div>
  `.trim();
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

  // Separate Channel axis from View Mode axis
  const [channel, setChannel] = useState<Channel>('EMAIL');
  const [viewMode, setViewMode] = useState<ViewMode>('VISUAL');
  const [mobileStep, setMobileStep] = useState<MobileStep>('CONTENT');
  
  // Editable campaign fields
  const [editName, setEditName] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editBodyHtml, setEditBodyHtml] = useState('');
  const [editWhatsappText, setEditWhatsappText] = useState('');
  const [editSegment, setEditSegment] = useState('VIP');
  const [editDiscount, setEditDiscount] = useState(15);
  const [editProducts, setEditProducts] = useState<any[]>([]);

  // Non-tech Visual Editor state fields
  const [visHeadline, setVisHeadline] = useState('');
  const [visGreeting, setVisGreeting] = useState('');
  const [visBodyText, setVisBodyText] = useState('');
  const [visCtaText, setVisCtaText] = useState('');

  // Confirmation Modals
  const [confirmScheduleModal, setConfirmScheduleModal] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [newCustomName, setNewCustomName] = useState('');
  const [newCustomHolidayId, setNewCustomHolidayId] = useState('');
  const [newCustomSegment, setNewCustomSegment] = useState('VIP');
  const [newCustomDiscount, setNewCustomDiscount] = useState(15);

  // Coupons view state
  const [couponsForCampaign, setCouponsForCampaign] = useState<DynamicCoupon[]>([]);
  const [couponSearch, setCouponSearch] = useState('');
  const [couponFilter, setCouponFilter] = useState<'ALL' | 'REDEEMED' | 'UNREDEEMED'>('ALL');
  const [loadingCoupons, setLoadingCoupons] = useState(false);

  // Loading & confirmation states
  const [isDrafting, setIsDrafting] = useState<string | null>(null);
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);
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
    setEditName(campaign.name || '');
    setEditSubject(campaign.emailSubject || '');
    setEditBodyHtml(campaign.emailBodyHtml || '');
    setEditWhatsappText(campaign.whatsappText || '');
    setEditSegment(campaign.segmentationRules?.segment || 'VIP');
    setEditDiscount(campaign.segmentationRules?.discountValue || 15);
    setEditProducts(campaign.recommendedProducts || []);
    
    // Parse visual text defaults
    setVisHeadline(campaign.name.replace(/Festive Blast.*/, '').trim() || 'Festive Celebration');
    setVisGreeting('Dear {{CUSTOMER_NAME}},');
    setVisBodyText('We invite you to elevate your interior spaces with our signature handcrafted brass lighting and festive decor collection.');
    setVisCtaText('Claim Your Exclusive Voucher');

    setChannel('EMAIL');
    setViewMode('VISUAL');
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

  // Recompile HTML when visual text fields change in VISUAL edit mode
  useEffect(() => {
    if (viewMode === 'VISUAL') {
      const compiled = compileVisualHtml({
        headline: visHeadline,
        greeting: visGreeting,
        bodyText: visBodyText,
        ctaText: visCtaText,
        discountValue: editDiscount
      });
      setEditBodyHtml(compiled);
    }
  }, [visHeadline, visGreeting, visBodyText, visCtaText, editDiscount, viewMode]);

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

  const handleCreateCustom = async () => {
    if (!newCustomName.trim()) {
      showToast('Please enter a campaign name.', 'err');
      return;
    }
    setIsCreatingCustom(true);
    try {
      const res = await fetch('/api/admin/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE_CUSTOM',
          name: newCustomName,
          holidayId: newCustomHolidayId || undefined,
          segment: newCustomSegment,
          discountValue: newCustomDiscount
        })
      });
      const data = await res.json();
      if (data.success && data.campaign) {
        setIsCustomModalOpen(false);
        setNewCustomName('');
        await refreshData();
        openEditor(data.campaign);
        showToast('Custom campaign draft created successfully!');
      } else {
        showToast(data.error || 'Failed to create campaign.', 'err');
      }
    } catch (e: any) {
      showToast(e.message || 'Error creating custom campaign.', 'err');
    } finally {
      setIsCreatingCustom(false);
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
          name: editName,
          emailSubject: editSubject,
          emailBodyHtml: editBodyHtml,
          whatsappText: editWhatsappText,
          segmentationRules: { ...selectedCampaign.segmentationRules, segment: editSegment, discountValue: editDiscount },
          recommendedProducts: editProducts,
        }),
      });
      if (res.ok) {
        await refreshData();
        showToast('Draft saved successfully.');
        return true;
      }
      showToast('Failed to save.', 'err'); return false;
    } catch { showToast('Network error.', 'err'); return false; }
    finally { setIsSaving(false); }
  };

  const handleScheduleConfirm = async () => {
    if (!selectedCampaign) return;
    setConfirmScheduleModal(false);
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
        showToast(`✨ Campaign Scheduled! ${data.result.couponsGenerated} single-use vouchers generated.`);
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

  const handleUnschedule = async (campaignId: string) => {
    if (!confirm('Undo schedule and revert this campaign back to draft mode?')) return;
    try {
      const res = await fetch(`/api/admin/campaigns/${campaignId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'UNSCHEDULE' })
      });
      const data = await res.json();
      if (data.success) {
        await refreshData();
        if (selectedCampaign && selectedCampaign.id === campaignId) {
          setSelectedCampaign({ ...selectedCampaign, status: 'DRAFT' });
        }
        showToast('Campaign reverted to draft mode.');
      } else {
        showToast(data.error || 'Failed to revert schedule.', 'err');
      }
    } catch (e: any) {
      showToast('Error unscheduling campaign.', 'err');
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!confirm('Are you sure you want to delete this campaign? All generated vouchers will also be deleted.')) return;
    try {
      const res = await fetch(`/api/admin/campaigns/${campaignId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await refreshData();
        if (selectedCampaign?.id === campaignId) {
          setView('DASHBOARD');
          setSelectedCampaign(null);
        }
        showToast('Campaign deleted successfully.');
      } else {
        showToast('Failed to delete campaign.', 'err');
      }
    } catch {
      showToast('Network error.', 'err');
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
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted border border-border px-3.5 py-2.5 hover:bg-surface-muted hover:text-primary transition-colors bg-background rounded-sm cursor-pointer min-h-[44px]"
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
          <div className="p-4 border-b border-border flex flex-wrap gap-3 bg-surface-muted/40 items-center justify-between">
            <div className="flex-1 min-w-[220px] flex items-center gap-2 border border-border bg-background px-3 py-2 rounded-sm focus-within:border-accent transition-colors">
              <label htmlFor="coupon-search" className="sr-only">Search vouchers</label>
              <span className="text-muted text-xs" aria-hidden="true">🔍</span>
              <input
                id="coupon-search"
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
                  className={`font-mono text-[10px] uppercase tracking-[0.12em] px-3.5 py-2.5 border transition-colors rounded-sm cursor-pointer min-h-[44px] ${
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
                    <td className="px-5 py-3.5 font-mono text-[11px] text-muted tabular-nums" suppressHydrationWarning>
                      {formatDate(c.expiresAt, true)}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[11px] text-muted tabular-nums" suppressHydrationWarning>
                      {formatDate(c.createdAt, false)}
                    </td>
                    <td className="px-5 py-3.5">
                      {!c.isRedeemed && (
                        <button
                          onClick={() => handleRevokeCoupon(c.id)}
                          className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted border border-border px-3 py-2 hover:border-red-600/50 hover:text-red-400 transition-colors bg-background rounded-sm cursor-pointer min-h-[44px]"
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
        <header className="flex flex-wrap items-center gap-3 px-6 py-3 border-b border-border bg-surface shrink-0">
          <button
            onClick={() => setView('DASHBOARD')}
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted border border-border px-3.5 py-2 hover:bg-surface-muted hover:text-primary transition-colors bg-background rounded-sm cursor-pointer"
          >
            ← Campaigns
          </button>
          <div className="w-px h-4 bg-border mx-1" aria-hidden="true" />
          
          {/* Editable Campaign Name */}
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <label htmlFor="edit-campaign-name" className="sr-only">Campaign Name</label>
            <input
              id="edit-campaign-name"
              type="text"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              placeholder="Campaign Name..."
              className="font-serif text-[18px] font-normal text-primary bg-transparent border-b border-transparent hover:border-border focus:border-accent focus:outline-none px-1 py-0.5 transition-colors w-full max-w-[340px]"
            />
          </div>

          <span className={statusPillClass(selectedCampaign.status)}>
            <span className="dot" aria-hidden="true" />
            {selectedCampaign.status}
          </span>
          
          {selectedCampaign.holiday && (
            <span className="font-mono text-[10px] text-muted border border-border px-2.5 py-1 rounded-sm bg-background">
              🪔 {selectedCampaign.holiday.name}
            </span>
          )}

          {/* Grouped Action Buttons with clear separation between Save vs Approve vs Delete */}
          <div className="flex gap-2 flex-wrap items-center">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted border border-border px-3.5 py-2.5 hover:bg-surface-muted hover:text-primary transition-colors bg-background rounded-sm cursor-pointer disabled:opacity-50 min-h-[44px]"
            >
              {isSaving ? 'Saving…' : '💾 Save Draft'}
            </button>

            {isDraft && (
              <button
                onClick={() => setConfirmScheduleModal(true)}
                disabled={isDispatching}
                className="font-mono text-[10px] uppercase tracking-[0.14em] bg-accent text-background px-4 py-2.5 hover:bg-accent-hover transition-colors rounded-sm cursor-pointer disabled:opacity-50 font-semibold min-h-[44px]"
              >
                {isDispatching ? 'Scheduling…' : '🚀 Approve & Schedule →'}
              </button>
            )}

            {isLive && (
              <button
                onClick={() => handleUnschedule(selectedCampaign.id)}
                className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent border border-accent/40 px-3.5 py-2.5 hover:bg-accent/10 transition-colors bg-background rounded-sm cursor-pointer min-h-[44px]"
                title="Revert scheduled campaign back to draft for editing"
              >
                ↺ Undo Schedule
              </button>
            )}

            <div className="w-px h-4 bg-border/60 mx-1" aria-hidden="true" />

            <button
              onClick={() => handleDeleteCampaign(selectedCampaign.id)}
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-red-400 border border-red-500/30 px-3 py-2.5 hover:bg-red-900/20 hover:border-red-500 transition-colors bg-background rounded-sm cursor-pointer min-h-[44px]"
              title="Delete campaign"
            >
              🗑 Delete
            </button>
          </div>
        </header>

        {/* Mobile Viewport Step Selector Bar (< lg viewports) */}
        <div className="lg:hidden flex border-b border-border bg-surface shrink-0 overflow-x-auto">
          {[
            { id: 'AUDIENCE', label: '1. Setup' },
            { id: 'CONTENT', label: '2. Copy Content' },
            { id: 'PRODUCTS', label: '3. Products' },
            { id: 'PREVIEW', label: '4. Preview' },
          ].map(step => (
            <button
              key={step.id}
              onClick={() => setMobileStep(step.id as MobileStep)}
              className={`flex-1 min-w-[100px] font-mono text-[10px] uppercase tracking-[0.1em] py-2.5 px-3 border-b-2 text-center transition-colors cursor-pointer ${
                mobileStep === step.id
                  ? 'border-accent text-accent bg-accent/5 font-semibold'
                  : 'border-transparent text-muted hover:text-primary'
              }`}
            >
              {step.label}
            </button>
          ))}
        </div>

        {/* Editor Body: 3-column desktop / 1-column mobile step flow */}
        <div className="flex flex-1 overflow-hidden">

          {/* PANEL 1: Settings */}
          <aside
            aria-label="Campaign setup and targeting"
            className={`w-full lg:w-[240px] shrink-0 border-r border-border overflow-y-auto p-5 space-y-6 bg-surface ${
              mobileStep === 'AUDIENCE' ? 'block' : 'hidden lg:block'
            }`}
          >
            {/* Audience Segment */}
            <fieldset className="border-0 p-0 m-0">
              <legend className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent mb-3 p-0">Audience Segment</legend>
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
            <fieldset className="border-0 p-0 m-0">
              <legend className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent mb-3 p-0">Voucher Discount</legend>
              <div className="flex items-center gap-2 border border-border bg-background rounded-sm px-3 py-2 focus-within:border-accent transition-colors">
                <label htmlFor="discount-val" className="sr-only">Discount percentage</label>
                <input
                  id="discount-val"
                  type="number"
                  value={editDiscount}
                  onChange={e => setEditDiscount(Number(e.target.value))}
                  min={5} max={50}
                  className="w-14 bg-transparent text-accent font-serif text-[22px] focus:outline-none tabular-nums"
                />
                <div>
                  <div className="font-serif text-[18px] text-accent">%</div>
                  <div className="font-mono text-[9px] text-muted uppercase tracking-[0.1em]">off sitewide</div>
                </div>
              </div>
              <p className="font-mono text-[10px] text-muted mt-2 leading-relaxed">
                Unique 8-char code per user, e.g.{' '}
                <code className="text-accent tracking-wider">DIW8K9X2</code>
              </p>
            </fieldset>

            {/* Personalization Tokens */}
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent mb-3">Personalization Tokens</div>
              <div className="space-y-1.5">
                {[
                  { token: '{{CUSTOMER_NAME}}', desc: "First name" },
                  { token: '{{COUPON_CODE}}',   desc: "Unique code" },
                  { token: '{{HOLIDAY_NAME}}',  desc: "Festival" },
                  { token: '{{DISCOUNT_VALUE}}',desc: "% value" },
                ].map(t => (
                  <button
                    key={t.token}
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(t.token);
                      showToast(`Copied ${t.token} to clipboard!`);
                    }}
                    title={`Click to copy ${t.token}`}
                    className="w-full flex items-center justify-between gap-2 px-2.5 py-2 border border-border bg-background hover:border-accent/50 hover:bg-accent/5 transition-colors cursor-pointer rounded-sm group active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-muted text-[11px] group-hover:text-accent" aria-hidden="true">📋</span>
                      <code className="font-mono text-[10px] text-accent group-hover:text-accent-hover truncate">{t.token}</code>
                    </div>
                    <span className="font-mono text-[9px] text-muted uppercase tracking-[0.08em] shrink-0">{t.desc}</span>
                  </button>
                ))}
              </div>
              <p className="font-mono text-[10px] text-muted mt-2">Click to copy token to clipboard.</p>
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
          <main
            aria-label="Campaign content editor"
            className={`flex-1 flex flex-col overflow-hidden bg-background ${
              mobileStep === 'CONTENT' || mobileStep === 'PREVIEW' ? 'block' : 'hidden lg:flex'
            }`}
          >
            {/* Top Bar Axis 1: Channel Switcher (Email vs WhatsApp) */}
            <div className="px-5 py-2.5 border-b border-border bg-surface flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted mr-1">Channel:</span>
                <button
                  type="button"
                  onClick={() => setChannel('EMAIL')}
                  className={`font-mono text-[10px] uppercase tracking-[0.12em] px-3.5 py-1.5 rounded-sm border cursor-pointer transition-colors ${
                    channel === 'EMAIL'
                      ? 'bg-accent/15 border-accent text-accent font-semibold'
                      : 'border-border text-muted hover:text-primary bg-background'
                  }`}
                >
                  ✉️ Email Blast
                </button>
                <button
                  type="button"
                  onClick={() => setChannel('WHATSAPP')}
                  className={`font-mono text-[10px] uppercase tracking-[0.12em] px-3.5 py-1.5 rounded-sm border cursor-pointer transition-colors ${
                    channel === 'WHATSAPP'
                      ? 'bg-[#25D366]/15 border-[#25D366]/60 text-[#25D366] font-semibold'
                      : 'border-border text-muted hover:text-primary bg-background'
                  }`}
                >
                  💬 WhatsApp Broadcast
                </button>
              </div>

              {/* Axis 2: View Mode Switcher (Friendly Text vs Raw HTML vs Live Preview) */}
              <div className="flex items-center gap-1 bg-background border border-border p-1 rounded-sm">
                <button
                  type="button"
                  onClick={() => setViewMode('VISUAL')}
                  className={`font-mono text-[9px] uppercase tracking-[0.1em] px-2.5 py-1 rounded-sm cursor-pointer transition-colors ${
                    viewMode === 'VISUAL'
                      ? 'bg-accent text-background font-semibold'
                      : 'text-muted hover:text-primary'
                  }`}
                >
                  ✨ Friendly Text Editor
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('HTML')}
                  className={`font-mono text-[9px] uppercase tracking-[0.1em] px-2.5 py-1 rounded-sm cursor-pointer transition-colors ${
                    viewMode === 'HTML'
                      ? 'bg-accent text-background font-semibold'
                      : 'text-muted hover:text-primary'
                  }`}
                >
                  &lt;/&gt; Raw HTML
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('PREVIEW')}
                  className={`font-mono text-[9px] uppercase tracking-[0.1em] px-2.5 py-1 rounded-sm cursor-pointer transition-colors ${
                    viewMode === 'PREVIEW'
                      ? 'bg-accent text-background font-semibold'
                      : 'text-muted hover:text-primary'
                  }`}
                >
                  👁 Live Preview
                </button>
              </div>
            </div>

            {/* EMAIL TAB CONTENT */}
            {channel === 'EMAIL' && viewMode !== 'PREVIEW' && (
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="email-subject" className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted block">
                      Email Subject Line
                    </label>

                    {/* Real-time Subject Length Counter */}
                    <span className={`font-mono text-[10px] ${editSubject.length > 60 ? 'text-[#c97e6a] font-semibold' : 'text-muted'}`}>
                      Subject length: {editSubject.length} / 60 chars {editSubject.length > 60 ? '(Clipped on mobile)' : '(Optimal: 40-60)'}
                    </span>
                  </div>

                  <input
                    id="email-subject"
                    type="text"
                    value={editSubject}
                    onChange={e => setEditSubject(e.target.value)}
                    placeholder="e.g. {{CUSTOMER_NAME}}, your exclusive Diwali offer awaits ✨"
                    className={`w-full px-3 py-2.5 border bg-surface text-primary font-mono text-[12px] focus:outline-none transition-colors rounded-sm ${
                      editSubject.length > 60 ? 'border-[#c97e6a]' : 'border-border focus:border-accent'
                    }`}
                  />
                </div>

                {/* VISUAL TEXT EDITOR */}
                {viewMode === 'VISUAL' ? (
                  <div className="space-y-4 border border-border/60 bg-surface/40 p-4 rounded-sm">
                    <div className="flex items-center justify-between border-b border-border/40 pb-2">
                      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-accent">
                        ✨ Friendly Text Fields (No HTML Code Required)
                      </span>
                      <span className="font-mono text-[10px] text-muted">
                        Automatically generates luxury email design
                      </span>
                    </div>

                    <div>
                      <label htmlFor="vis-headline" className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted block mb-1">
                        Main Headline / Title
                      </label>
                      <input
                        id="vis-headline"
                        type="text"
                        value={visHeadline}
                        onChange={e => setVisHeadline(e.target.value)}
                        placeholder="e.g. Celebrate Diwali in Grandeur"
                        className="w-full px-3 py-2 border border-border bg-surface text-primary font-mono text-[12px] focus:outline-none focus:border-accent rounded-sm"
                      />
                    </div>

                    <div>
                      <label htmlFor="vis-greeting" className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted block mb-1">
                        Personalized Greeting Line
                      </label>
                      <input
                        id="vis-greeting"
                        type="text"
                        value={visGreeting}
                        onChange={e => setVisGreeting(e.target.value)}
                        placeholder="e.g. Dear {{CUSTOMER_NAME}},"
                        className="w-full px-3 py-2 border border-border bg-surface text-primary font-mono text-[12px] focus:outline-none focus:border-accent rounded-sm"
                      />
                    </div>

                    <div>
                      <label htmlFor="vis-body" className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted block mb-1">
                        Message Body (Plain English Paragraphs)
                      </label>
                      <textarea
                        id="vis-body"
                        value={visBodyText}
                        onChange={e => setVisBodyText(e.target.value)}
                        rows={6}
                        placeholder="Type your main invitation or announcement here in plain English..."
                        className="w-full p-3 border border-border bg-surface text-primary font-serif text-[14px] leading-relaxed focus:outline-none focus:border-accent rounded-sm"
                      />
                    </div>

                    <div>
                      <label htmlFor="vis-cta" className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted block mb-1">
                        Button Label
                      </label>
                      <input
                        id="vis-cta"
                        type="text"
                        value={visCtaText}
                        onChange={e => setVisCtaText(e.target.value)}
                        placeholder="e.g. Claim Your Exclusive Voucher"
                        className="w-full px-3 py-2 border border-border bg-surface text-primary font-mono text-[12px] focus:outline-none focus:border-accent rounded-sm"
                      />
                    </div>
                  </div>
                ) : (
                  /* RAW HTML EDITOR */
                  <div className="flex-1 flex flex-col">
                    <label htmlFor="email-body" className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted block mb-1.5">
                      Email Body HTML Code
                    </label>
                    <textarea
                      id="email-body"
                      value={editBodyHtml}
                      onChange={e => setEditBodyHtml(e.target.value)}
                      rows={18}
                      className="w-full p-3.5 border border-border bg-surface text-primary font-mono text-[11px] leading-relaxed focus:outline-none focus:border-accent transition-colors resize-y rounded-sm"
                      spellCheck={false}
                    />
                  </div>
                )}
              </div>
            )}

            {/* WHATSAPP TAB CONTENT */}
            {channel === 'WHATSAPP' && viewMode !== 'PREVIEW' && (
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <div className="flex gap-2.5 p-3.5 border border-border rounded-sm bg-surface">
                  <span aria-hidden="true">💡</span>
                  <p className="font-mono text-[11px] text-muted m-0 leading-relaxed">
                    WhatsApp Business Broadcast: Use <strong>*bold*</strong> for emphasis. Keep under 160 words.{' '}
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
                    rows={14}
                    className="w-full p-3.5 border border-border bg-surface text-primary font-mono text-[12px] leading-relaxed focus:outline-none focus:border-accent transition-colors resize-y rounded-sm"
                    placeholder={`🪔 *Namaste {{CUSTOMER_NAME}}!* ✨\n\nCelebrate with James & Sons handcrafted brass lighting.\n\nYour personal *{{DISCOUNT_VALUE}}% OFF* voucher: *{{COUPON_CODE}}*\n\nShop: https://jamesandsons.in/collections/festive`}
                  />
                </div>
                <div className="flex justify-between font-mono text-[10px] text-muted">
                  <span>{editWhatsappText.length} characters</span>
                  <span className={editWhatsappText.trim().split(/\s+/).filter(Boolean).length > 160 ? 'text-[#c97e6a]' : ''}>
                    {editWhatsappText.trim().split(/\s+/).filter(Boolean).length} words
                  </span>
                </div>
              </div>
            )}

            {/* PREVIEW CONTENT */}
            {viewMode === 'PREVIEW' && (
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                <div className="p-3.5 border border-border rounded-sm bg-surface flex gap-2.5">
                  <span aria-hidden="true">🔍</span>
                  <p className="font-mono text-[11px] text-muted m-0">
                    Preview for sample customer <strong className="text-primary">Priya</strong> with voucher code <code className="text-accent tracking-wider">DIW8K9X2</code>.
                  </p>
                </div>

                {channel === 'EMAIL' ? (
                  <>
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted mb-1.5">Email Subject</div>
                      <div className="px-4 py-3 border border-border bg-surface rounded-sm font-serif text-[15px] text-primary">
                        {personalizedSubject || '(no subject)'}
                      </div>
                    </div>
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted mb-1.5">Rendered Email HTML</div>
                      <div
                        className="border border-border rounded-sm overflow-hidden"
                        dangerouslySetInnerHTML={{ __html: personalizedHtml }}
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted mb-1.5">WhatsApp Broadcast Preview</div>
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
            className={`w-full lg:w-[260px] shrink-0 border-l border-border flex flex-col overflow-hidden bg-surface ${
              mobileStep === 'PRODUCTS' ? 'block' : 'hidden lg:flex'
            }`}
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
                    <div className="font-serif text-[12px] text-primary truncate" title={p.name}>{p.name}</div>
                    <div className="font-mono text-[10px] text-accent tabular-nums mt-0.5">₹{(p.d2cPrice || 0).toLocaleString('en-IN')}</div>
                  </div>
                  <button
                    type="button"
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
                    Status: {selectedCampaign.status}. Use "Undo Schedule" above to revert back to draft if changes are needed.
                  </p>
                </div>
              )}
            </div>
          </aside>
        </div>

        {/* CONFIRM APPROVE & SCHEDULE MODAL */}
        {confirmScheduleModal && (
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-6"
            role="dialog"
            aria-modal="true"
            aria-label="Confirm Schedule & Voucher Generation"
          >
            <div className="bg-surface border border-border rounded-lg w-full max-w-[480px] flex flex-col overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent">Points of Dispatch</div>
                  <h2 className="font-serif text-[18px] text-primary font-normal m-0">Confirm Campaign Dispatch</h2>
                </div>
                <button onClick={() => setConfirmScheduleModal(false)} className="text-muted hover:text-primary font-mono text-[16px] cursor-pointer bg-transparent border-none">✕</button>
              </div>

              <div className="p-5 space-y-3">
                <div className="p-3.5 border border-accent/30 bg-accent/5 rounded-sm space-y-2 font-mono text-[11px]">
                  <div className="flex justify-between text-primary">
                    <span className="text-muted uppercase">Target Segment:</span>
                    <span className="font-semibold text-accent">{editSegment} Buyers</span>
                  </div>
                  <div className="flex justify-between text-primary">
                    <span className="text-muted uppercase">Voucher Discount:</span>
                    <span className="font-semibold text-accent">{editDiscount}% OFF</span>
                  </div>
                  <div className="flex justify-between text-primary">
                    <span className="text-muted uppercase">Voucher Format:</span>
                    <span className="font-semibold">8-Char Single-Use Alphanumeric</span>
                  </div>
                </div>

                <p className="font-mono text-[11px] text-muted leading-relaxed m-0">
                  This will save all edits and batch-generate unique single-use vouchers for all active customers in the <strong>{editSegment}</strong> audience segment. Stage 1 email &amp; WhatsApp dispatches will be activated.
                </p>
              </div>

              <div className="px-5 py-4 border-t border-border bg-surface-muted/40 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmScheduleModal(false)}
                  className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted border border-border px-4 py-2 hover:bg-surface-muted rounded-sm cursor-pointer bg-background"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleScheduleConfirm}
                  disabled={isDispatching}
                  className="font-mono text-[10px] uppercase tracking-[0.12em] bg-accent text-background px-5 py-2 hover:bg-accent-hover transition-colors rounded-sm cursor-pointer font-semibold disabled:opacity-50 min-h-[44px]"
                >
                  {isDispatching ? 'Generating Vouchers…' : '🚀 Confirm & Issue Vouchers'}
                </button>
              </div>
            </div>
          </div>
        )}

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
                  <label htmlFor="swap-search" className="sr-only">Search catalog</label>
                  <span className="text-muted text-xs" aria-hidden="true">🔍</span>
                  <input
                    id="swap-search"
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
            Festival &amp; Custom Campaign Manager
          </h1>
          <p className="font-mono text-[12px] text-muted mt-1 m-0">
            AI-personalized multi-channel campaigns · Calendar triggers &amp; Custom Promotions · Per-customer unique vouchers
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCustomModalOpen(true)}
            className="font-mono text-[10px] uppercase tracking-[0.14em] bg-accent text-background px-4 py-2.5 hover:bg-accent-hover transition-colors rounded-sm cursor-pointer font-semibold min-h-[44px]"
          >
            + New Campaign
          </button>

          {confirmSweep ? (
            <div className="flex items-center gap-2 p-2.5 border border-border rounded-sm bg-surface-muted">
              <span className="font-mono text-[11px] text-muted">
                Auto-draft for {upcomingTrigger.length} festival(s)?
              </span>
              <button
                onClick={handleSweep}
                disabled={isCronRunning}
                className="font-mono text-[10px] uppercase tracking-[0.12em] bg-accent text-background px-3 py-1.5 hover:bg-accent-hover transition-colors rounded-sm cursor-pointer disabled:opacity-50 min-h-[44px]"
              >
                {isCronRunning ? 'Sweeping…' : 'Confirm'}
              </button>
              <button
                onClick={() => setConfirmSweep(false)}
                className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted border border-border px-2.5 py-1.5 hover:bg-surface-muted rounded-sm cursor-pointer bg-background min-h-[44px]"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmSweep(true)}
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted border border-border px-4 py-2.5 hover:bg-surface-muted hover:text-primary transition-colors rounded-sm cursor-pointer bg-background min-h-[44px]"
            >
              ⚡ Run 20-Day Sweep
            </button>
          )}
        </div>
      </div>

      {/* KPI Row with Trend Context */}
      <section aria-label="Campaign metrics" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Dispatches',    value: (analytics.totalSent || 0).toLocaleString(),            sub: analytics.totalSent > 0 ? 'Email + WhatsApp dispatches' : 'No campaigns sent yet', color: undefined },
          { label: 'Avg Open Rate',       value: `${analytics.overallOpenRate || '0.0'}%`,               sub: analytics.totalSent > 0 ? 'Live benchmark tracking' : 'Updates live upon send',     color: 'var(--color-accent)' },
          { label: 'Vouchers Redeemed',   value: (analytics.totalRedeemed || 0).toLocaleString(),        sub: analytics.totalSent > 0 ? 'Single-use customer codes' : 'Tracked upon checkout',    color: '#8cae7e' },
          { label: 'Attributed Revenue',  value: `₹${(analytics.totalRevenue || 0).toLocaleString('en-IN')}`, sub: analytics.totalSent > 0 ? 'Attributed festive sales' : 'Measured via vouchers', color: 'var(--color-accent)' },
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

          <div className="flex gap-4 mb-3 shrink-0">
            {[
              { color: '#c97e6a', label: '≤7 days' },
              { color: 'var(--color-accent)', label: '≤20 days' },
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
                      <div className="font-mono text-[10px] text-muted mt-0.5" suppressHydrationWarning>
                        {formatDate(h.date, true)}
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
                          className="w-full font-mono text-[9px] uppercase tracking-[0.12em] text-center py-2 border border-border rounded-sm text-muted hover:border-accent/40 hover:text-accent bg-background transition-colors cursor-pointer min-h-[44px]"
                        >
                          ✓ Draft Ready — Open Editor →
                        </button>
                      ) : (
                        <button
                          onClick={() => handleDraftAI(h.id)}
                          disabled={isDrafting === h.id}
                          className="w-full font-mono text-[9px] uppercase tracking-[0.12em] text-center py-2 border border-border rounded-sm text-muted hover:border-accent/40 hover:text-accent bg-background transition-colors cursor-pointer disabled:opacity-50 min-h-[44px]"
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

        {/* Campaign List (Responsive Table on Desktop, Cards on Mobile) */}
        <section aria-labelledby="campaigns-heading" className="premium-card flex flex-col overflow-hidden rounded-lg">
          <div className="px-5 py-4 border-b border-border flex flex-wrap items-center justify-between gap-3 bg-surface-muted/40 shrink-0">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent">Campaign Inbox</div>
              <h2 id="campaigns-heading" className="font-serif text-[18px] font-normal text-primary m-0">
                All Campaigns ({campaigns.length})
              </h2>
            </div>
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
              <p className="font-mono text-[12px] text-muted max-w-[320px] leading-relaxed mb-4">
                Create a campaign from the festival calendar or click "+ New Campaign" above to build a custom promotion.
              </p>
              <button
                onClick={() => setIsCustomModalOpen(true)}
                className="font-mono text-[10px] uppercase tracking-[0.14em] bg-accent text-background px-4 py-2 hover:bg-accent-hover transition-colors rounded-sm cursor-pointer font-semibold min-h-[44px]"
              >
                + Create Custom Campaign
              </button>
            </div>
          ) : (
            <>
              {/* Desktop Table (md and up) */}
              <div className="hidden md:block table-responsive flex-1">
                <table className="w-full text-left border-collapse">
                  <caption className="sr-only">E-commerce marketing campaigns</caption>
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
                          <div className="font-mono text-[10px] text-muted mt-0.5" suppressHydrationWarning>
                            {c.holiday ? `🪔 ${c.holiday.name} · ` : '✨ Standalone Campaign · '}
                            {formatDate(c.createdAt, false)}
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

                            {['SCHEDULED', 'ACTIVE'].includes(c.status) && (
                              <button
                                onClick={() => handleUnschedule(c.id)}
                                className="font-mono text-[10px] uppercase tracking-[0.1em] text-accent border border-accent/30 px-2 py-1.5 hover:bg-accent/10 transition-colors bg-background rounded-sm cursor-pointer"
                                title="Undo schedule & revert to draft"
                              >
                                ↺ Undo
                              </button>
                            )}

                            <button
                              onClick={() => handleDeleteCampaign(c.id)}
                              className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted border border-border px-2 py-1.5 hover:border-red-500/50 hover:text-red-400 transition-colors bg-background rounded-sm cursor-pointer"
                              title="Delete campaign"
                            >
                              🗑
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List (< md viewports) to avoid horizontal scroll */}
              <div className="md:hidden divide-y divide-border/40 overflow-y-auto">
                {campaigns.map(c => (
                  <article key={c.id} className="p-4 space-y-3 bg-background/50">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-serif text-[15px] text-primary">{c.name}</div>
                        <div className="font-mono text-[10px] text-muted mt-0.5">
                          {c.holiday ? `🪔 ${c.holiday.name}` : '✨ Standalone Campaign'}
                        </div>
                      </div>
                      <span className={statusPillClass(c.status)}>
                        <span className="dot" aria-hidden="true" />
                        {c.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono border-y border-border/40 py-2">
                      <div>
                        <span className="text-muted">Segment: </span>
                        <span className="text-primary font-semibold">{c.segmentationRules?.segment || 'VIP'} ({c.segmentationRules?.discountValue || 15}% OFF)</span>
                      </div>
                      <div>
                        <span className="text-muted">Revenue: </span>
                        <span className="text-accent font-semibold">₹{(c.metricsSummary?.revenue || 0).toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => openCoupons(c)}
                        className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted border border-border px-3 py-2 hover:bg-surface-muted rounded-sm cursor-pointer min-h-[44px]"
                      >
                        Vouchers
                      </button>
                      <button
                        onClick={() => openEditor(c)}
                        className="font-mono text-[10px] uppercase tracking-[0.1em] bg-accent text-background px-3 py-2 hover:bg-accent-hover rounded-sm cursor-pointer font-semibold min-h-[44px]"
                      >
                        Edit →
                      </button>
                      {['SCHEDULED', 'ACTIVE'].includes(c.status) && (
                        <button
                          onClick={() => handleUnschedule(c.id)}
                          className="font-mono text-[10px] uppercase tracking-[0.1em] text-accent border border-accent/40 px-3 py-2 hover:bg-accent/10 rounded-sm cursor-pointer min-h-[44px]"
                        >
                          ↺ Undo
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteCampaign(c.id)}
                        className="font-mono text-[10px] uppercase tracking-[0.1em] text-red-400 border border-red-500/30 px-3 py-2 hover:bg-red-900/20 rounded-sm cursor-pointer min-h-[44px]"
                      >
                        🗑
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      {/* CREATE CUSTOM CAMPAIGN MODAL */}
      {isCustomModalOpen && (
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Create new custom campaign"
        >
          <div className="bg-surface border border-border rounded-lg w-full max-w-[500px] flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent">Campaign Builder</div>
                <h2 className="font-serif text-[18px] text-primary font-normal m-0">Create New Campaign</h2>
              </div>
              <button
                onClick={() => setIsCustomModalOpen(false)}
                className="text-muted hover:text-primary font-mono text-[16px] cursor-pointer bg-transparent border-none"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label htmlFor="custom-name" className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted block mb-1">
                  Campaign Title / Name
                </label>
                <input
                  id="custom-name"
                  type="text"
                  value={newCustomName}
                  onChange={e => setNewCustomName(e.target.value)}
                  placeholder="e.g. Spring Luxury Chandelier Showcase"
                  className="w-full px-3 py-2 border border-border bg-background text-primary font-mono text-[12px] focus:outline-none focus:border-accent rounded-sm"
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="custom-holiday" className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted block mb-1">
                  Associated Festival / Event (Optional)
                </label>
                <select
                  id="custom-holiday"
                  value={newCustomHolidayId}
                  onChange={e => setNewCustomHolidayId(e.target.value)}
                  className="w-full px-3 py-2 border border-border bg-background text-primary font-mono text-[12px] focus:outline-none focus:border-accent rounded-sm cursor-pointer"
                >
                  <option value="">None (Standalone Promotion)</option>
                  {holidays.map(h => (
                    <option key={h.id} value={h.id}>
                      🪔 {h.name} ({formatDate(h.date, false)})
                    </option>
                  ))}
                </select>
              </div>

              <fieldset className="border-0 p-0 m-0">
                <legend className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted block mb-1 p-0">
                  Target Audience Segment
                </legend>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'VIP', label: 'VIP Buyers' },
                    { id: 'LAPSED', label: 'Lapsed (90d+)' },
                    { id: 'ALL', label: 'All Base' },
                  ].map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setNewCustomSegment(s.id)}
                      className={`font-mono text-[10px] uppercase tracking-[0.1em] py-2 px-2 border transition-colors rounded-sm cursor-pointer min-h-[44px] ${
                        newCustomSegment === s.id
                          ? 'bg-accent text-background border-accent font-semibold'
                          : 'border-border text-muted hover:border-accent/40 bg-background'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <div>
                <label htmlFor="custom-discount" className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted block mb-1">
                  Voucher Discount Percentage
                </label>
                <div className="flex items-center gap-2 border border-border bg-background px-3 py-2 rounded-sm w-36">
                  <input
                    id="custom-discount"
                    type="number"
                    value={newCustomDiscount}
                    onChange={e => setNewCustomDiscount(Number(e.target.value))}
                    min={5}
                    max={50}
                    className="w-12 bg-transparent text-accent font-serif text-[18px] focus:outline-none tabular-nums"
                  />
                  <span className="font-serif text-[16px] text-accent">% OFF</span>
                </div>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-border bg-surface-muted/40 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsCustomModalOpen(false)}
                className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted border border-border px-4 py-2 hover:bg-surface-muted rounded-sm cursor-pointer bg-background min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateCustom}
                disabled={isCreatingCustom}
                className="font-mono text-[10px] uppercase tracking-[0.12em] bg-accent text-background px-5 py-2 hover:bg-accent-hover transition-colors rounded-sm cursor-pointer font-semibold disabled:opacity-50 min-h-[44px]"
              >
                {isCreatingCustom ? 'Creating…' : 'Create & Edit Draft →'}
              </button>
            </div>
          </div>
        </div>
      )}

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
