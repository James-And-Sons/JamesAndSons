'use client';

import { useState, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  adminCreateAffiliate,
  adminUpdateAffiliate,
  adminDeleteAffiliate,
} from '../promotions/server-actions';

interface Affiliate {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  affiliateCode: string;
  status: 'ACTIVE' | 'SUSPENDED';
  commissionRate: number;
  totalRevenue: number;
  totalCommission: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    conversions: number;
  };
}

export default function AffiliatesManagerClient({
  initialAffiliates,
}: {
  initialAffiliates: Affiliate[];
}) {
  const router = useRouter();
  const [affiliates, setAffiliates] = useState<Affiliate[]>(initialAffiliates);
  const [isPending, startTransition] = useTransition();

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingAffiliate, setEditingAffiliate] = useState<Affiliate | null>(null);

  // Form States
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formCommissionRate, setFormCommissionRate] = useState('10');
  const [formNotes, setFormNotes] = useState('');
  const [formStatus, setFormStatus] = useState<'ACTIVE' | 'SUSPENDED'>('ACTIVE');

  // Toast
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Auto Generate Affiliate Code
  const handleAutoGenerateCode = () => {
    if (!formName.trim()) {
      const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
      setFormCode(`AFF${rand}`);
      return;
    }
    const cleanName = formName.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
    const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
    setFormCode(`${cleanName}${rand}`);
  };

  // Open Create/Edit modal
  const openCreateModal = (affiliate?: Affiliate) => {
    if (affiliate) {
      setEditingAffiliate(affiliate);
      setFormName(affiliate.name);
      setFormEmail(affiliate.email);
      setFormPhone(affiliate.phone || '');
      setFormCode(affiliate.affiliateCode);
      setFormCommissionRate(String(affiliate.commissionRate));
      setFormNotes(affiliate.notes || '');
      setFormStatus(affiliate.status);
    } else {
      setEditingAffiliate(null);
      setFormName('');
      setFormEmail('');
      setFormPhone('');
      setFormCode('');
      setFormCommissionRate('10');
      setFormNotes('');
      setFormStatus('ACTIVE');
    }
    setIsCreateModalOpen(true);
  };

  // Save Affiliate
  const handleSaveAffiliate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast('Name is required', 'err');
      return;
    }
    if (!formEmail.trim()) {
      showToast('Email is required', 'err');
      return;
    }
    if (!formCode.trim()) {
      showToast('Affiliate code is required', 'err');
      return;
    }

    const payload = {
      name: formName.trim(),
      email: formEmail.trim(),
      phone: formPhone.trim() || undefined,
      affiliateCode: formCode.trim().toUpperCase(),
      commissionRate: Number(formCommissionRate) || 0,
      notes: formNotes || undefined,
      status: formStatus,
    };

    startTransition(async () => {
      try {
        if (editingAffiliate) {
          await adminUpdateAffiliate(editingAffiliate.id, payload);
          showToast(`Affiliate ${payload.name} updated successfully`);
        } else {
          await adminCreateAffiliate(payload);
          showToast(`Affiliate ${payload.name} invited successfully`);
        }
        setIsCreateModalOpen(false);
        router.refresh();
      } catch (err: any) {
        showToast(err.message || 'Failed to save affiliate', 'err');
      }
    });
  };

  // Toggle Status
  const handleToggleStatus = async (affiliate: Affiliate) => {
    const newStatus = affiliate.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    startTransition(async () => {
      try {
        await adminUpdateAffiliate(affiliate.id, {
          name: affiliate.name,
          email: affiliate.email,
          affiliateCode: affiliate.affiliateCode,
          status: newStatus,
        });
        showToast(`Affiliate ${affiliate.name} status updated to ${newStatus.toLowerCase()}`);
        router.refresh();
      } catch (err: any) {
        showToast(err.message || 'Failed to update status', 'err');
      }
    });
  };

  // Delete Affiliate
  const handleDelete = async (affiliate: Affiliate) => {
    if (!confirm(`Are you sure you want to delete affiliate ${affiliate.name}?`)) return;

    startTransition(async () => {
      try {
        await adminDeleteAffiliate(affiliate.id);
        showToast(`Affiliate ${affiliate.name} deleted successfully`);
        router.refresh();
      } catch (err: any) {
        showToast(err.message || 'Failed to delete affiliate', 'err');
      }
    });
  };

  // Filter & Search Logic
  const filteredAffiliates = useMemo(() => {
    return affiliates.filter(a => {
      const matchesSearch =
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.affiliateCode.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [affiliates, searchTerm, statusFilter]);

  // Sync state with props when router refreshes
  useMemo(() => {
    setAffiliates(initialAffiliates);
  }, [initialAffiliates]);

  // Stats Calculations
  const totalCount = affiliates.length;
  const activeCount = affiliates.filter(a => a.status === 'ACTIVE').length;
  const totalRevenue = affiliates.reduce((sum, a) => sum + (a.totalRevenue || 0), 0);
  const totalCommission = affiliates.reduce((sum, a) => sum + (a.totalCommission || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 premium-card p-6 rounded-lg">
        <div>
          <h1 className="font-serif text-[28px] font-normal text-primary tracking-wide m-0">
            Affiliate Partners
          </h1>
          <p className="font-body text-muted text-[13px] mt-1 m-0">
            Manage tracking codes, custom commissions rates, and attributed referral conversions.
          </p>
        </div>
        <div>
          <button
            onClick={() => openCreateModal()}
            className="font-mono text-[10px] uppercase tracking-[0.12em] bg-accent text-background px-5 py-2.5 hover:bg-accent-hover transition-colors rounded-sm cursor-pointer font-semibold"
          >
            + New Affiliate
          </button>
        </div>
      </div>

      {/* Analytics Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Affiliates', value: totalCount, indicator: '👥' },
          { label: 'Active', value: activeCount, colorClass: 'text-emerald-400', indicator: '🟢' },
          { label: 'Revenue Attributed', value: `₹${totalRevenue.toLocaleString('en-IN')}`, colorClass: 'text-accent', indicator: '📈' },
          { label: 'Commission Earned', value: `₹${totalCommission.toLocaleString('en-IN')}`, indicator: '💰' },
        ].map((stat, idx) => (
          <div key={idx} className="premium-card p-5 rounded-lg flex items-center justify-between">
            <div>
              <div className="font-mono text-[10px] text-muted uppercase tracking-wider">{stat.label}</div>
              <div className={`font-serif text-[24px] mt-1.5 font-light ${stat.colorClass || 'text-primary'}`}>
                {stat.value}
              </div>
            </div>
            <span className="text-[24px] opacity-75">{stat.indicator}</span>
          </div>
        ))}
      </div>

      {/* How It Works Explainer Box */}
      <div className="border border-accent/20 bg-accent/5 p-4 rounded-lg text-[13px] text-muted leading-relaxed font-body">
        <strong className="text-accent font-semibold block mb-0.5">How Link Tracking Operates:</strong>
        Share custom links formatted like <code className="bg-background text-primary px-1.5 py-0.5 rounded-sm font-mono text-[11px] border border-border">jamesandsons.in?ref=AFFILIATECODE</code>.
        Visits set a tracking cookie. Any checkout placement within 30 days automatically links revenue and updates payouts.
      </div>

      {/* Search and Filters */}
      <div className="premium-card p-4 rounded-lg flex flex-wrap gap-4 items-center justify-between">
        <div className="flex-1 flex items-center gap-2 border border-border bg-background px-3 py-2.5 rounded-sm focus-within:border-accent min-w-[280px]">
          <span className="text-muted text-xs">🔍</span>
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by partner name, email, ref code..."
            className="bg-transparent text-primary font-mono text-[12px] focus:outline-none w-full placeholder:text-muted/60"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="text-muted hover:text-primary font-mono text-[10px] uppercase">
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] uppercase tracking-wider text-muted">Status</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 border border-border bg-background text-secondary font-mono text-[11px] uppercase tracking-wider focus:outline-none focus:border-accent transition-colors cursor-pointer rounded-sm"
          >
            <option value="ALL">All Partners</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>

      {/* Affiliates List Table */}
      <div className="premium-card flex flex-col overflow-hidden rounded-lg">
        {filteredAffiliates.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-[32px] mb-3 opacity-60">🤝</div>
            <h3 className="font-serif text-[16px] text-primary mb-1">No Affiliate Partners</h3>
            <p className="font-body text-muted text-[13px] max-w-sm mx-auto">
              No matching records. Adjust filters or invite a new affiliate partner to start tracking.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/60 bg-surface-muted/40 font-mono text-[10px] uppercase tracking-wider text-muted">
                  <th className="px-6 py-4 font-semibold">Affiliate details</th>
                  <th className="px-6 py-4 font-semibold">Referral Code</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Commission %</th>
                  <th className="px-6 py-4 font-semibold">Attributed Revenue</th>
                  <th className="px-6 py-4 font-semibold">Calculated Commission</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredAffiliates.map(aff => {
                  const isSuspended = aff.status === 'SUSPENDED';
                  return (
                    <tr key={aff.id} className="hover:bg-surface-muted/15 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-sans text-[14px] text-primary font-medium">{aff.name}</div>
                        <div className="text-[11px] text-muted font-body mt-0.5">{aff.email}</div>
                        {aff.phone && (
                          <div className="text-[10px] text-muted font-mono mt-0.5">{aff.phone}</div>
                        )}
                        {aff.notes && (
                          <div className="text-[10px] text-muted/75 italic mt-1 font-body">💡 {aff.notes}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-[12px] text-primary font-semibold tracking-wider">
                          {aff.affiliateCode}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`status-pill ${isSuspended ? 'status-pending' : 'status-active'}`}>
                          <span className="dot" />
                          {aff.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-[12px] text-primary font-semibold">
                        {aff.commissionRate}%
                      </td>
                      <td className="px-6 py-4 font-serif text-[15px] text-accent">
                        ₹{aff.totalRevenue.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 font-mono text-[13px] text-primary">
                        ₹{aff.totalCommission.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2" onClick={e => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(aff)}
                            className={`font-mono text-[10px] uppercase tracking-[0.1em] border px-2.5 py-1.5 rounded-sm cursor-pointer transition-colors bg-background ${
                              aff.status === 'ACTIVE'
                                ? 'border-amber-500/30 text-amber-400 hover:bg-amber-900/10'
                                : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-900/10'
                            }`}
                            title={aff.status === 'ACTIVE' ? 'Suspend Affiliate' : 'Activate Affiliate'}
                          >
                            {aff.status === 'ACTIVE' ? '⏸ Suspend' : '▶ Activate'}
                          </button>
                          <button
                            type="button"
                            onClick={() => openCreateModal(aff)}
                            className="font-mono text-[10px] uppercase tracking-[0.1em] text-accent border border-accent/30 px-2.5 py-1.5 hover:border-accent hover:bg-accent/8 transition-colors bg-background rounded-sm cursor-pointer font-semibold"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(aff)}
                            className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted border border-border px-2 py-1.5 hover:border-red-500/50 hover:text-red-400 transition-colors bg-background rounded-sm cursor-pointer"
                            title="Delete Affiliate"
                          >
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE & EDIT SLIDE-OVER MODAL */}
      {isCreateModalOpen && (
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-6"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-surface border border-border rounded-lg w-full max-w-[500px] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent">Affiliate Engine</div>
                <h2 className="font-serif text-[18px] text-primary font-normal m-0">
                  {editingAffiliate ? `Edit Partner: ${editingAffiliate.name}` : 'Invite Affiliate Partner'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-muted hover:text-primary font-mono text-[16px] cursor-pointer bg-transparent border-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAffiliate} className="p-5 space-y-4">
              {/* Name */}
              <div>
                <label className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted block mb-1">
                  Full Partner Name *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="e.g. Architect Rajesh Gupta"
                  className="w-full px-3 py-2 border border-border bg-background text-primary font-mono text-[12px] focus:outline-none focus:border-accent rounded-sm"
                />
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted block mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={e => setFormEmail(e.target.value)}
                    placeholder="e.g. rajesh@gupta.com"
                    className="w-full px-3 py-2 border border-border bg-background text-primary font-mono text-[12px] focus:outline-none focus:border-accent rounded-sm"
                  />
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted block mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formPhone}
                    onChange={e => setFormPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full px-3 py-2 border border-border bg-background text-primary font-mono text-[12px] focus:outline-none focus:border-accent rounded-sm"
                  />
                </div>
              </div>

              {/* Code */}
              <div>
                <label className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted block mb-1">
                  Referral / Promo Code *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formCode}
                    onChange={e => setFormCode(e.target.value.toUpperCase())}
                    placeholder="e.g. RAJESH10"
                    disabled={!!editingAffiliate}
                    className="w-full px-3 py-2 border border-border bg-background text-primary font-mono text-[12px] focus:outline-none focus:border-accent rounded-sm disabled:opacity-50"
                  />
                  {!editingAffiliate && (
                    <button
                      type="button"
                      onClick={handleAutoGenerateCode}
                      className="font-mono text-[10px] uppercase tracking-[0.12em] text-accent border border-accent/30 px-3 hover:bg-accent/8 rounded-sm shrink-0 cursor-pointer min-h-[44px]"
                    >
                      🎲 Auto
                    </button>
                  )}
                </div>
              </div>

              {/* Commission Rate & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted block mb-1 font-body">
                    Commission Rate (%)
                  </label>
                  <input
                    type="number"
                    value={formCommissionRate}
                    onChange={e => setFormCommissionRate(e.target.value)}
                    min={0}
                    max={100}
                    placeholder="e.g. 10"
                    className="w-full px-3 py-2 border border-border bg-background text-primary font-mono text-[12px] focus:outline-none focus:border-accent rounded-sm"
                  />
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted block mb-1">
                    Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-border bg-background text-primary font-mono text-[12px] focus:outline-none focus:border-accent rounded-sm cursor-pointer"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted block mb-1">
                  Partner Notes / Special Agreements
                </label>
                <textarea
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder="e.g. 10% commission on catalog price referrals, paid monthly"
                  rows={3}
                  className="w-full px-3 py-2 border border-border bg-background text-primary font-mono text-[12px] focus:outline-none focus:border-accent rounded-sm resize-none"
                />
              </div>

              <div className="px-5 py-4 border-t border-border bg-surface-muted/40 flex justify-end gap-3 -mx-5 -mb-5 mt-6 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted border border-border px-4 py-2 hover:bg-surface-muted rounded-sm cursor-pointer bg-background min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="font-mono text-[10px] uppercase tracking-[0.12em] bg-accent text-background px-5 py-2 hover:bg-accent-hover transition-colors rounded-sm cursor-pointer font-semibold disabled:opacity-50 min-h-[44px]"
                >
                  {isPending ? 'Saving…' : 'Save Partner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
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
    </div>
  );
}
