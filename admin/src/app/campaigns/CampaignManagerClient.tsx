'use client';

import { useState, useEffect } from 'react';

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
}

export default function CampaignManagerClient({ initialHolidays, initialCampaigns, initialAnalytics, initialCatalogProducts }: {
  initialHolidays: Holiday[];
  initialCampaigns: Campaign[];
  initialAnalytics: any;
  initialCatalogProducts: any[];
}) {
  const [holidays, setHolidays] = useState<Holiday[]>(initialHolidays);
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns);
  const [analytics, setAnalytics] = useState<any>(initialAnalytics);
  const [catalogProducts] = useState<any[]>(initialCatalogProducts);

  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [editorTab, setEditorTab] = useState<'EMAIL' | 'WHATSAPP'>('EMAIL');
  const [isDrafting, setIsDrafting] = useState<string | null>(null);
  const [isDispatching, setIsDispatching] = useState(false);
  const [isCronRunning, setIsCronRunning] = useState(false);

  // Editable state inside modal
  const [editSubject, setEditSubject] = useState('');
  const [editBodyHtml, setEditBodyHtml] = useState('');
  const [editWhatsappText, setEditWhatsappText] = useState('');
  const [editSegment, setEditSegment] = useState('VIP');
  const [editDiscount, setEditDiscount] = useState(15);
  const [editProducts, setEditProducts] = useState<any[]>([]);

  // Product Swap state
  const [swapModalIndex, setSwapModalIndex] = useState<number | null>(null);

  const refreshData = async () => {
    try {
      const [hRes, cRes] = await Promise.all([
        fetch('/api/admin/campaigns/holidays'),
        fetch('/api/admin/campaigns')
      ]);
      if (hRes.ok) {
        const hData = await hRes.json();
        setHolidays(hData.holidays || []);
      }
      if (cRes.ok) {
        const cData = await cRes.json();
        setCampaigns(cData.campaigns || []);
        setAnalytics(cData.analytics || {});
      }
    } catch (err) {
      console.error('Failed to refresh campaigns data:', err);
    }
  };

  const handleDraftAICampaign = async (holidayId: string, segment: string = 'VIP') => {
    setIsDrafting(holidayId);
    try {
      const res = await fetch('/api/admin/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DRAFT_AI', holidayId, segment, discountValue: 15 })
      });
      const data = await res.json();
      if (data.success && data.campaign) {
        await refreshData();
        openEditorModal(data.campaign);
      } else {
        alert(data.error || 'Failed to draft AI campaign');
      }
    } catch (err: any) {
      alert(err.message || 'Error drafting AI campaign');
    } finally {
      setIsDrafting(null);
    }
  };

  const handleTriggerCronAutomation = async () => {
    setIsCronRunning(true);
    try {
      const res = await fetch('/api/cron/campaign-automation');
      const data = await res.json();
      alert(`Automated Calendar Sweep Complete! ${data.triggeredActions} actions executed.`);
      await refreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to run automation cron.');
    } finally {
      setIsCronRunning(false);
    }
  };

  const openEditorModal = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setEditSubject(campaign.emailSubject || '');
    setEditBodyHtml(campaign.emailBodyHtml || '');
    setEditWhatsappText(campaign.whatsappText || '');
    setEditSegment(campaign.segmentationRules?.segment || 'VIP');
    setEditDiscount(campaign.segmentationRules?.discountValue || 15);
    setEditProducts(campaign.recommendedProducts || []);
    setEditorTab('EMAIL');
  };

  const handleSaveDraft = async () => {
    if (!selectedCampaign) return;
    try {
      const res = await fetch(`/api/admin/campaigns/${selectedCampaign.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailSubject: editSubject,
          emailBodyHtml: editBodyHtml,
          whatsappText: editWhatsappText,
          segmentationRules: {
            ...selectedCampaign.segmentationRules,
            segment: editSegment,
            discountValue: editDiscount
          },
          recommendedProducts: editProducts
        })
      });
      if (res.ok) {
        alert('Campaign draft saved successfully!');
        await refreshData();
      }
    } catch (err) {
      alert('Failed to save draft.');
    }
  };

  const handleApproveAndSchedule = async () => {
    if (!selectedCampaign) return;
    setIsDispatching(true);
    try {
      // First save current changes
      await handleSaveDraft();
      
      // Dispatch Stage 1: Batch-generate dynamic 8-character coupons and schedule sequence
      const res = await fetch(`/api/admin/campaigns/${selectedCampaign.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'APPROVE_AND_SCHEDULE' })
      });
      const data = await res.json();
      if (data.success) {
        alert(`✨ Campaign Approved & Scheduled! Generated ${data.result.couponsGenerated} single-use vouchers (Sample: ${data.result.sampleCodes?.join(', ')}).`);
        setSelectedCampaign(null);
        await refreshData();
      } else {
        alert(data.error || 'Failed to schedule campaign.');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to approve campaign.');
    } finally {
      setIsDispatching(false);
    }
  };

  const handleSwapProduct = (index: number, newProduct: any) => {
    const updated = [...editProducts];
    updated[index] = newProduct;
    setEditProducts(updated);
    setSwapModalIndex(null);
  };

  const draftsPending = campaigns.filter(c => c.status === 'DRAFT');

  return (
    <div style={{ padding: '32px', background: 'var(--obsidian)', minHeight: '100vh', color: 'var(--cream)' }}>
      
      {/* --- TOP HEADER --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <div style={{ fontSize: '10px', color: 'var(--gold)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '6px' }}>
            AI Marketing &amp; Automation Engine
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', color: 'var(--cream)', fontWeight: 300, margin: 0 }}>
            Festival Campaigns &amp; Dynamic Vouchers
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-dim)', marginTop: '4px', maxWidth: '650px' }}>
            Automated Indian holiday calendar tracking, 20-day AI copy drafting, 8-character single-use coupon batching, and 2-stage urgency warnings.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleTriggerCronAutomation}
            disabled={isCronRunning}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              background: 'linear-gradient(135deg, rgba(212,175,55,0.2) 0%, rgba(212,175,55,0.05) 100%)',
              border: '1px solid var(--gold)',
              borderRadius: '12px',
              color: 'var(--gold)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: isCronRunning ? 'not-allowed' : 'pointer'
            }}
          >
            <span>⚡</span>
            {isCronRunning ? 'Sweeping Calendar...' : 'Trigger 20-Day Calendar Sweep'}
          </button>
        </div>
      </div>

      {/* --- BENTO GRID DASHBOARD --- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '20px', marginBottom: '32px' }}>
        
        {/* BENTO CARD 1: Upcoming Indian Holidays (Cols 1-4) */}
        <div style={{ gridColumn: 'span 4', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <div style={{ fontSize: '10px', color: 'var(--gold)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Indian Calendar</div>
              <h3 style={{ fontSize: '16px', fontWeight: 500, margin: '2px 0 0', color: 'var(--cream)' }}>Upcoming Holidays</h3>
            </div>
            <span style={{ fontSize: '11px', background: 'rgba(212,175,55,0.15)', color: 'var(--gold)', padding: '4px 10px', borderRadius: '20px' }}>
              Auto 20-Day
            </span>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '420px', overflowY: 'auto' }}>
            {holidays.map(h => {
              const isNearTrigger = h.daysRemaining <= 22 && h.daysRemaining >= 18;
              const hasDraft = campaigns.some(c => c.holiday?.id === h.id || c.holidayId === h.id);

              return (
                <div
                  key={h.id}
                  style={{
                    padding: '14px 16px',
                    background: isNearTrigger ? 'rgba(212,175,55,0.06)' : 'var(--obsidian)',
                    border: isNearTrigger ? '1px solid rgba(212,175,55,0.3)' : '1px solid var(--border)',
                    borderRadius: '14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--cream)' }}>{h.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {new Date(h.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: h.daysRemaining <= 20 ? 'var(--gold)' : 'var(--text-dim)' }}>
                      {h.daysRemaining > 0 ? `${h.daysRemaining} days left` : 'Today'}
                    </div>

                    {hasDraft ? (
                      <span style={{ fontSize: '10px', color: '#4CAF7A', display: 'block', marginTop: '4px' }}>Draft Ready ✓</span>
                    ) : (
                      <button
                        onClick={() => handleDraftAICampaign(h.id, 'VIP')}
                        disabled={isDrafting === h.id}
                        style={{
                          marginTop: '6px',
                          padding: '4px 10px',
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          color: 'var(--gold)',
                          fontSize: '10px',
                          cursor: 'pointer'
                        }}
                      >
                        {isDrafting === h.id ? 'Drafting...' : '+ Draft AI Campaign'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* BENTO CARD 2: AI Drafts Pending Review (Cols 5-12) */}
        <div style={{ gridColumn: 'span 8', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <div style={{ fontSize: '10px', color: 'var(--gold)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Review Inbox</div>
              <h3 style={{ fontSize: '16px', fontWeight: 500, margin: '2px 0 0', color: 'var(--cream)' }}>
                AI Drafts Pending Review ({draftsPending.length})
              </h3>
            </div>
          </div>

          {draftsPending.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', background: 'var(--obsidian)', borderRadius: '14px', border: '1px dashed var(--border)' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🪔</div>
              <div style={{ fontSize: '14px', color: 'var(--cream)', fontWeight: 500 }}>No Drafts Waiting</div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', maxWidth: '350px', marginTop: '4px' }}>
                The 20-Day trigger will automatically draft campaigns for upcoming Indian holidays, or you can manually click "+ Draft AI Campaign" on any holiday.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
              {draftsPending.map(c => (
                <div
                  key={c.id}
                  style={{
                    background: 'var(--obsidian)',
                    border: '1px solid var(--border)',
                    borderRadius: '14px',
                    padding: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <span style={{ fontSize: '10px', background: 'rgba(212,175,55,0.12)', color: 'var(--gold)', padding: '3px 8px', borderRadius: '6px', textTransform: 'uppercase' }}>
                        {c.segmentationRules?.segment || 'VIP'} Segment
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        Drafted {new Date(c.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--cream)', marginBottom: '4px' }}>
                      {c.name}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-dim)', fontStyle: 'italic', marginBottom: '12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      "{c.emailSubject}"
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--border)', paddingTop: '12px', marginTop: '12px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Offer: {c.segmentationRules?.discountValue || 15}% OFF Voucher
                    </span>
                    <button
                      onClick={() => openEditorModal(c)}
                      style={{
                        padding: '8px 14px',
                        background: 'var(--gold)',
                        color: '#000',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      Review &amp; Edit →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* BENTO CARD 3: Full-Funnel Campaign Analytics (Cols 1-12) */}
        <div style={{ gridColumn: 'span 12', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px', padding: '24px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <div style={{ fontSize: '10px', color: 'var(--gold)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Full-Funnel Metrics</div>
              <h3 style={{ fontSize: '18px', fontWeight: 500, margin: '2px 0 0', color: 'var(--cream)' }}>Campaign Analytics &amp; Performance</h3>
            </div>
          </div>

          {/* Metric Pillars Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
            <div style={{ background: 'var(--obsidian)', padding: '20px', borderRadius: '14px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Dispatches (Email + WA)</div>
              <div style={{ fontSize: '26px', fontWeight: 600, color: 'var(--cream)', marginTop: '4px' }}>{analytics.totalSent?.toLocaleString() || 0}</div>
            </div>

            <div style={{ background: 'var(--obsidian)', padding: '20px', borderRadius: '14px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Avg. Open Rate</div>
              <div style={{ fontSize: '26px', fontWeight: 600, color: 'var(--gold)', marginTop: '4px' }}>{analytics.overallOpenRate || '0.0'}%</div>
            </div>

            <div style={{ background: 'var(--obsidian)', padding: '20px', borderRadius: '14px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Single-Use Coupons Redeemed</div>
              <div style={{ fontSize: '26px', fontWeight: 600, color: '#4CAF7A', marginTop: '4px' }}>{analytics.totalRedeemed?.toLocaleString() || 0}</div>
            </div>

            <div style={{ background: 'var(--obsidian)', padding: '20px', borderRadius: '14px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Attributed Festive Revenue</div>
              <div style={{ fontSize: '26px', fontWeight: 600, color: '#D4AF37', marginTop: '4px' }}>
                ₹{(analytics.totalRevenue || 0).toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Campaign History Table */}
          <div style={{ background: 'var(--obsidian)', borderRadius: '14px', border: '1px solid var(--border)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)', color: 'var(--gold)', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.12em' }}>
                  <th style={{ padding: '14px 20px' }}>Campaign Name</th>
                  <th style={{ padding: '14px 20px' }}>Target Segment</th>
                  <th style={{ padding: '14px 20px' }}>Status &amp; Stage</th>
                  <th style={{ padding: '14px 20px' }}>Dispatches</th>
                  <th style={{ padding: '14px 20px' }}>Redemptions</th>
                  <th style={{ padding: '14px 20px' }}>Revenue</th>
                  <th style={{ padding: '14px 20px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No campaigns created yet. Click "+ Draft AI Campaign" on any holiday above.
                    </td>
                  </tr>
                ) : (
                  campaigns.map(c => (
                    <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '14px 20px', fontWeight: 500, color: 'var(--cream)' }}>
                        {c.name}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ fontSize: '11px', padding: '3px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                          {c.segmentationRules?.segment || 'VIP'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{
                          fontSize: '10px',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontWeight: 600,
                          background: c.status === 'ACTIVE' ? 'rgba(76,175,122,0.15)' : c.status === 'DRAFT' ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.08)',
                          color: c.status === 'ACTIVE' ? '#4CAF7A' : c.status === 'DRAFT' ? 'var(--gold)' : 'var(--text-muted)'
                        }}>
                          {c.status} ({c.stage === 'STAGE_2_EXPIRY_WARNING' ? 'Stage 2 Warning' : 'Stage 1 Blast'})
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px' }}>{c.metricsSummary?.sent || 0}</td>
                      <td style={{ padding: '14px 20px', color: '#4CAF7A' }}>{c.metricsSummary?.redeemed || 0}</td>
                      <td style={{ padding: '14px 20px', color: 'var(--gold)' }}>₹{(c.metricsSummary?.revenue || 0).toLocaleString('en-IN')}</td>
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <button
                          onClick={() => openEditorModal(c)}
                          style={{ background: 'none', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: '8px', color: 'var(--cream)', fontSize: '11px', cursor: 'pointer' }}
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>

      </div>

      {/* --- CAMPAIGN EDITOR MODAL --- */}
      {selectedCampaign && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '24px' }}>
          
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '24px', width: '100%', maxWidth: '950px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)' }}>
            
            {/* Modal Header */}
            <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--obsidian)' }}>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--gold)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Campaign Editor &amp; Review</div>
                <h2 style={{ fontSize: '20px', color: 'var(--cream)', fontWeight: 500, margin: '2px 0 0' }}>{selectedCampaign.name}</h2>
              </div>
              <button
                onClick={() => setSelectedCampaign(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ flex: 1, padding: '24px 28px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* SECTION 1: Audience Segmentation */}
              <div style={{ background: 'var(--obsidian)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px' }}>
                <div style={{ fontSize: '11px', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '12px' }}>
                  1. Audience Segmentation &amp; Voucher Value
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  {[
                    { id: 'VIP', label: 'VIP / High Value', desc: 'Orders > ₹25,000' },
                    { id: 'LAPSED', label: 'Lapsed Buyers', desc: 'Inactive > 90 Days' },
                    { id: 'ALL', label: 'All Customers', desc: 'Full Subscriber Base' }
                  ].map(seg => (
                    <div
                      key={seg.id}
                      onClick={() => setEditSegment(seg.id)}
                      style={{
                        padding: '14px',
                        borderRadius: '12px',
                        border: editSegment === seg.id ? '1px solid var(--gold)' : '1px solid var(--border)',
                        background: editSegment === seg.id ? 'rgba(212,175,55,0.08)' : 'rgba(255,255,255,0.02)',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--cream)' }}>{seg.label}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{seg.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 2: Multi-Channel Copy Editor (Email vs WhatsApp Tabs) */}
              <div style={{ background: 'var(--obsidian)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                    2. Multi-Channel Content Review
                  </div>

                  <div style={{ display: 'flex', gap: '8px', background: 'var(--surface)', padding: '4px', borderRadius: '10px' }}>
                    <button
                      onClick={() => setEditorTab('EMAIL')}
                      style={{
                        padding: '6px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        background: editorTab === 'EMAIL' ? 'var(--gold)' : 'transparent',
                        color: editorTab === 'EMAIL' ? '#000' : 'var(--text-dim)',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      ✉️ Email Blast Draft
                    </button>
                    <button
                      onClick={() => setEditorTab('WHATSAPP')}
                      style={{
                        padding: '6px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        background: editorTab === 'WHATSAPP' ? '#25D366' : 'transparent',
                        color: editorTab === 'WHATSAPP' ? '#000' : 'var(--text-dim)',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      💬 Meta WhatsApp Broadcast
                    </button>
                  </div>
                </div>

                {editorTab === 'EMAIL' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Email Subject Line</label>
                      <input
                        type="text"
                        value={editSubject}
                        onChange={e => setEditSubject(e.target.value)}
                        style={{ width: '100%', padding: '12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--cream)', fontSize: '13px' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Email Body (HTML Preview)</label>
                      <div
                        dangerouslySetInnerHTML={{ __html: editBodyHtml }}
                        style={{ background: '#0a0a0a', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', maxHeight: '250px', overflowY: 'auto' }}
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>WhatsApp Broadcast Text (Meta Payload)</label>
                    <textarea
                      rows={6}
                      value={editWhatsappText}
                      onChange={e => setEditWhatsappText(e.target.value)}
                      style={{ width: '100%', padding: '12px', background: '#0b141a', border: '1px solid #25D366', borderRadius: '10px', color: '#e9edef', fontSize: '13px', fontFamily: 'sans-serif' }}
                    />
                  </div>
                )}
              </div>

              {/* SECTION 3: AI Product Recommendations Grid */}
              <div style={{ background: 'var(--obsidian)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px' }}>
                <div style={{ fontSize: '11px', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '14px' }}>
                  3. Embedded Product Recommendations (Top 4 Catalog Items)
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                  {editProducts.map((p, idx) => (
                    <div key={idx} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        {p.images && p.images[0] ? (
                          <img src={p.images[0]} alt={p.name} style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '8px', marginBottom: '8px' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)', marginBottom: '8px' }}>
                            ✨ Product
                          </div>
                        )}
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--cream)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {p.name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--gold)', marginTop: '4px' }}>₹{(p.d2cPrice || 0).toLocaleString('en-IN')}</div>
                      </div>

                      <button
                        onClick={() => setSwapModalIndex(idx)}
                        style={{ marginTop: '10px', padding: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-dim)', fontSize: '10px', cursor: 'pointer' }}
                      >
                        🔄 Swap Item
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 4: Review & Schedule Confirmation Pane */}
              <div style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.12) 0%, rgba(212,175,55,0.02) 100%)', border: '1px solid var(--gold)', borderRadius: '16px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    4. Sequence Confirmation
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--cream)', margin: '4px 0 0' }}>
                    Will batch-generate 8-character single-use vouchers expiring on holiday date &amp; trigger 2-stage expiry warnings on Day -2.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={handleSaveDraft}
                    style={{ padding: '12px 20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--cream)', fontSize: '12px', cursor: 'pointer' }}
                  >
                    Save Draft
                  </button>
                  <button
                    onClick={handleApproveAndSchedule}
                    disabled={isDispatching}
                    style={{ padding: '12px 24px', background: 'var(--gold)', color: '#000', borderRadius: '10px', fontSize: '12px', fontWeight: 700, border: 'none', cursor: isDispatching ? 'not-allowed' : 'pointer' }}
                  >
                    {isDispatching ? 'Dispatching & Batching...' : 'Approve &amp; Schedule Sequence →'}
                  </button>
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* SWAP PRODUCT PICKER MODAL */}
      {swapModalIndex !== null && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '24px' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px', width: '100%', maxWidth: '600px', padding: '20px', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', color: 'var(--cream)', margin: 0 }}>Select Replacement Catalog Item</h3>
              <button onClick={() => setSwapModalIndex(null)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {catalogProducts.map(p => (
                <div
                  key={p.id}
                  onClick={() => handleSwapProduct(swapModalIndex, p)}
                  style={{ padding: '12px', background: 'var(--obsidian)', border: '1px solid var(--border)', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                >
                  {p.images && p.images[0] ? (
                    <img src={p.images[0]} alt={p.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px' }} />
                  ) : (
                    <div style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)' }}>✨</div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', color: 'var(--cream)', fontWeight: 500 }}>{p.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--gold)' }}>₹{(p.d2cPrice || 0).toLocaleString('en-IN')}</div>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--gold)' }}>Select →</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
