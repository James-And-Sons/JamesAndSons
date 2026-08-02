'use client';

import { useState, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  adminCreateCoupon,
  adminUpdateCoupon,
  adminDeleteCoupon,
  adminBulkGenerateCoupons,
} from './server-actions';

interface Affiliate {
  id: string;
  name: string;
  affiliateCode: string;
}

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';
  value: number;
  status: 'ACTIVE' | 'PAUSED' | 'EXPIRED' | 'EXHAUSTED';
  minOrderAmount: number | null;
  maxDiscountCap: number | null;
  usageLimit: number | null;
  usageLimitPerUser: number | null;
  usedCount: number;
  startsAt: string | null;
  expiresAt: string | null;
  source: string | null;
  affiliateId: string | null;
  affiliate?: { name: string } | null;
}

export default function PromotionsManagerClient({
  initialCoupons,
  affiliates,
}: {
  initialCoupons: Coupon[];
  affiliates: Affiliate[];
}) {
  const router = useRouter();
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons);
  const [isPending, startTransition] = useTransition();

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  // Form states
  const [formCode, setFormCode] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formType, setFormType] = useState<'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING'>('PERCENTAGE');
  const [formValue, setFormValue] = useState('');
  const [formMinOrderAmount, setFormMinOrderAmount] = useState('');
  const [formMaxDiscountCap, setFormMaxDiscountCap] = useState('');
  const [formUsageLimit, setFormUsageLimit] = useState('');
  const [formUsageLimitPerUser, setFormUsageLimitPerUser] = useState('1');
  const [formStartsAt, setFormStartsAt] = useState('');
  const [formExpiresAt, setFormExpiresAt] = useState('');
  const [formSource, setFormSource] = useState('internal');
  const [formAffiliateId, setFormAffiliateId] = useState('');

  // Bulk form states
  const [bulkCount, setBulkCount] = useState('10');
  const [bulkPrefix, setBulkPrefix] = useState('JNS');
  const [bulkType, setBulkType] = useState<'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING'>('PERCENTAGE');
  const [bulkValue, setBulkValue] = useState('10');
  const [bulkMinOrderAmount, setBulkMinOrderAmount] = useState('');
  const [bulkExpiresAt, setBulkExpiresAt] = useState('');
  const [bulkSource, setBulkSource] = useState('internal');
  const [bulkAffiliateId, setBulkAffiliateId] = useState('');

  // Toast
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Auto Generate Coupon Code
  const handleAutoGenerateCode = () => {
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    setFormCode(`JNS${random}`);
  };

  // Open Create/Edit modal
  const openCreateModal = (coupon?: Coupon) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setFormCode(coupon.code);
      setFormDescription(coupon.description || '');
      setFormType(coupon.type);
      setFormValue(String(coupon.value));
      setFormMinOrderAmount(coupon.minOrderAmount ? String(coupon.minOrderAmount) : '');
      setFormMaxDiscountCap(coupon.maxDiscountCap ? String(coupon.maxDiscountCap) : '');
      setFormUsageLimit(coupon.usageLimit ? String(coupon.usageLimit) : '');
      setFormUsageLimitPerUser(coupon.usageLimitPerUser ? String(coupon.usageLimitPerUser) : '1');
      setFormStartsAt(coupon.startsAt ? new Date(coupon.startsAt).toISOString().slice(0, 16) : '');
      setFormExpiresAt(coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().slice(0, 16) : '');
      setFormSource(coupon.source || 'internal');
      setFormAffiliateId(coupon.affiliateId || '');
    } else {
      setEditingCoupon(null);
      setFormCode('');
      setFormDescription('');
      setFormType('PERCENTAGE');
      setFormValue('');
      setFormMinOrderAmount('');
      setFormMaxDiscountCap('');
      setFormUsageLimit('');
      setFormUsageLimitPerUser('1');
      setFormStartsAt('');
      setFormExpiresAt('');
      setFormSource('internal');
      setFormAffiliateId('');
    }
    setIsCreateModalOpen(true);
  };

  // Submit Create/Edit
  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode.trim()) {
      showToast('Coupon code is required', 'err');
      return;
    }
    if (formType !== 'FREE_SHIPPING' && !formValue) {
      showToast('Discount value is required', 'err');
      return;
    }

    const payload = {
      code: formCode.trim().toUpperCase(),
      description: formDescription || undefined,
      type: formType,
      value: Number(formValue) || 0,
      minOrderAmount: formMinOrderAmount ? Number(formMinOrderAmount) : undefined,
      maxDiscountCap: formMaxDiscountCap ? Number(formMaxDiscountCap) : undefined,
      usageLimit: formUsageLimit ? Number(formUsageLimit) : undefined,
      usageLimitPerUser: formUsageLimitPerUser ? Number(formUsageLimitPerUser) : 1,
      startsAt: formStartsAt ? new Date(formStartsAt) : undefined,
      expiresAt: formExpiresAt ? new Date(formExpiresAt) : undefined,
      source: formSource,
      affiliateId: formAffiliateId || undefined,
    };

    startTransition(async () => {
      try {
        if (editingCoupon) {
          await adminUpdateCoupon(editingCoupon.id, payload);
          showToast(`Coupon ${payload.code} updated successfully`);
        } else {
          await adminCreateCoupon(payload);
          showToast(`Coupon ${payload.code} created successfully`);
        }
        setIsCreateModalOpen(false);
        router.refresh();
      } catch (err: any) {
        showToast(err.message || 'Failed to save coupon', 'err');
      }
    });
  };

  // Toggle Status
  const handleToggleStatus = async (coupon: Coupon) => {
    const newStatus = coupon.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    startTransition(async () => {
      try {
        await adminUpdateCoupon(coupon.id, {
          code: coupon.code,
          type: coupon.type,
          value: coupon.value,
          status: newStatus,
        });
        showToast(`Coupon ${coupon.code} is now ${newStatus.toLowerCase()}`);
        router.refresh();
      } catch (err: any) {
        showToast(err.message || 'Failed to update status', 'err');
      }
    });
  };

  // Delete Coupon
  const handleDelete = async (coupon: Coupon) => {
    if (!confirm(`Are you sure you want to delete coupon ${coupon.code}?`)) return;

    startTransition(async () => {
      try {
        await adminDeleteCoupon(coupon.id);
        showToast(`Coupon ${coupon.code} deleted successfully`);
        router.refresh();
      } catch (err: any) {
        showToast(err.message || 'Failed to delete coupon', 'err');
      }
    });
  };

  // Submit Bulk Generate
  const handleBulkGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    const count = Number(bulkCount);
    if (isNaN(count) || count < 1 || count > 500) {
      showToast('Bulk count must be between 1 and 500', 'err');
      return;
    }

    startTransition(async () => {
      try {
        const createdCodes = await adminBulkGenerateCoupons({
          count,
          type: bulkType,
          value: Number(bulkValue) || 0,
          expiresAt: bulkExpiresAt ? new Date(bulkExpiresAt) : undefined,
          source: bulkSource,
          affiliateId: bulkAffiliateId || undefined,
          minOrderAmount: bulkMinOrderAmount ? Number(bulkMinOrderAmount) : undefined,
          prefix: bulkPrefix || 'JNS',
        });
        showToast(`Successfully generated ${createdCodes.length} coupons`);
        setIsBulkModalOpen(false);
        router.refresh();
      } catch (err: any) {
        showToast(err.message || 'Failed to bulk generate coupons', 'err');
      }
    });
  };

  // Filters & Search logic
  const filteredCoupons = useMemo(() => {
    return coupons.filter(c => {
      const matchesSearch =
        c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.source || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
      const matchesType = typeFilter === 'ALL' || c.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [coupons, searchTerm, statusFilter, typeFilter]);

  // Sync state with props when router refreshes
  useMemo(() => {
    setCoupons(initialCoupons);
  }, [initialCoupons]);

  // Statistics
  const totalCouponsCount = coupons.length;
  const activeCount = coupons.filter(c => c.status === 'ACTIVE').length;
  const totalRedemptions = coupons.reduce((sum, c) => sum + c.usedCount, 0);
  const exhaustedCount = coupons.filter(c => c.status === 'EXHAUSTED').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 premium-card p-6 rounded-lg">
        <div>
          <h1 className="font-serif text-[28px] font-normal text-primary tracking-wide m-0">
            Coupons &amp; Promotions
          </h1>
          <p className="font-body text-muted text-[13px] mt-1 m-0">
            Configure discount codes, shipping vouchers, and partner promotions.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="font-mono text-[10px] uppercase tracking-[0.12em] text-accent border border-accent/30 hover:border-accent hover:bg-accent/8 px-4 py-2.5 rounded-sm transition-colors cursor-pointer bg-background"
          >
            ⚡ Bulk Generate
          </button>
          <button
            onClick={() => openCreateModal()}
            className="font-mono text-[10px] uppercase tracking-[0.12em] bg-accent text-background px-5 py-2.5 hover:bg-accent-hover transition-colors rounded-sm cursor-pointer font-semibold"
          >
            + New Coupon
          </button>
        </div>
      </div>

      {/* Analytics Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Coupons', value: totalCouponsCount, indicator: '🎟️' },
          { label: 'Active', value: activeCount, colorClass: 'text-emerald-400', indicator: '🟢' },
          { label: 'Total Redemptions', value: totalRedemptions, indicator: '🔄' },
          { label: 'Exhausted', value: exhaustedCount, colorClass: 'text-red-400', indicator: '⚠️' },
        ].map((stat, idx) => (
          <div key={idx} className="premium-card p-5 rounded-lg flex items-center justify-between">
            <div>
              <div className="font-mono text-[10px] text-muted uppercase tracking-wider">{stat.label}</div>
              <div className={`font-serif text-[26px] mt-1.5 font-light ${stat.colorClass || 'text-primary'}`}>
                {stat.value}
              </div>
            </div>
            <span className="text-[24px] opacity-75">{stat.indicator}</span>
          </div>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="premium-card p-4 rounded-lg flex flex-wrap gap-4 items-center justify-between">
        <div className="flex-1 flex items-center gap-2 border border-border bg-background px-3 py-2.5 rounded-sm focus-within:border-accent min-w-[280px]">
          <span className="text-muted text-xs">🔍</span>
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by code, notes, source..."
            className="bg-transparent text-primary font-mono text-[12px] focus:outline-none w-full placeholder:text-muted/60"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="text-muted hover:text-primary font-mono text-[10px] uppercase">
              Clear
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] uppercase tracking-wider text-muted">Status</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 border border-border bg-background text-secondary font-mono text-[11px] uppercase tracking-wider focus:outline-none focus:border-accent transition-colors cursor-pointer rounded-sm"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PAUSED">Paused</option>
              <option value="EXPIRED">Expired</option>
              <option value="EXHAUSTED">Exhausted</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] uppercase tracking-wider text-muted">Type</span>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="px-3 py-2.5 border border-border bg-background text-secondary font-mono text-[11px] uppercase tracking-wider focus:outline-none focus:border-accent transition-colors cursor-pointer rounded-sm"
            >
              <option value="ALL">All Types</option>
              <option value="PERCENTAGE">Percentage (%)</option>
              <option value="FIXED_AMOUNT">Fixed Amount (₹)</option>
              <option value="FREE_SHIPPING">Free Shipping</option>
            </select>
          </div>
        </div>
      </div>

      {/* Coupons Table Listing */}
      <div className="premium-card flex flex-col overflow-hidden rounded-lg">
        {filteredCoupons.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-[32px] mb-3 opacity-60">🏷️</div>
            <h3 className="font-serif text-[16px] text-primary mb-1">No Coupons Found</h3>
            <p className="font-body text-muted text-[13px] max-w-sm mx-auto">
              No promotions matching the selected criteria. Try adjusting filters or create a new coupon code.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/60 bg-surface-muted/40 font-mono text-[10px] uppercase tracking-wider text-muted">
                    <th className="px-6 py-4 font-semibold">Code / Description</th>
                    <th className="px-6 py-4 font-semibold">Discount Details</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold">Redemptions</th>
                    <th className="px-6 py-4 font-semibold">Source</th>
                    <th className="px-6 py-4 font-semibold">Valid Period</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredCoupons.map(coupon => {
                    const expiryDate = coupon.expiresAt ? new Date(coupon.expiresAt) : null;
                    const isExpired = expiryDate ? expiryDate < new Date() : false;

                    let statusClass = 'status-pill status-draft';
                    if (coupon.status === 'ACTIVE' && !isExpired) statusClass = 'status-pill status-active';
                    else if (coupon.status === 'PAUSED') statusClass = 'status-pill status-processing';
                    else if (coupon.status === 'EXHAUSTED') statusClass = 'status-pill status-paid';
                    else if (isExpired || coupon.status === 'EXPIRED') statusClass = 'status-pill status-pending';

                    return (
                      <tr key={coupon.id} className="hover:bg-surface-muted/15 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-mono text-[13px] text-primary tracking-wide font-semibold">
                            {coupon.code}
                          </div>
                          {coupon.description && (
                            <div className="text-[11px] text-muted mt-1 font-body">{coupon.description}</div>
                          )}
                          {coupon.affiliate && (
                            <div className="text-[10px] text-accent mt-1.5 font-mono">
                              🤝 Affiliate: {coupon.affiliate.name}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-serif text-[15px] text-primary">
                            {coupon.type === 'PERCENTAGE'
                              ? `${coupon.value}% OFF`
                              : coupon.type === 'FIXED_AMOUNT'
                              ? `₹${coupon.value.toLocaleString('en-IN')} OFF`
                              : '✈️ Free Shipping'}
                          </div>
                          {coupon.minOrderAmount && (
                            <div className="text-[10px] text-muted font-mono mt-1">
                              Min order: ₹{coupon.minOrderAmount.toLocaleString('en-IN')}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={statusClass}>
                            <span className="dot" />
                            {isExpired ? 'EXPIRED' : coupon.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-[12px] text-primary">
                          <div className="font-semibold">
                            {coupon.usedCount} {coupon.usageLimit ? `/ ${coupon.usageLimit}` : '/ ∞'}
                          </div>
                          <div className="text-[10px] text-muted mt-0.5">uses</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-[10px] uppercase tracking-wider bg-surface border border-border px-2 py-0.5 rounded-sm text-secondary">
                            {coupon.source || 'internal'}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-[11px] text-muted">
                          {coupon.startsAt ? (
                            <div>
                              From: {new Date(coupon.startsAt).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                              })}
                            </div>
                          ) : null}
                          <div>
                            Expires:{' '}
                            {coupon.expiresAt ? (
                              <span className={isExpired ? 'text-red-400 font-semibold' : ''}>
                                {new Date(coupon.expiresAt).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </span>
                            ) : (
                              'Never'
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2" onClick={e => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(coupon)}
                              className={`font-mono text-[10px] uppercase tracking-[0.1em] border px-2.5 py-1.5 rounded-sm cursor-pointer transition-colors bg-background ${
                                coupon.status === 'ACTIVE'
                                  ? 'border-amber-500/30 text-amber-400 hover:bg-amber-900/10'
                                  : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-900/10'
                              }`}
                              title={coupon.status === 'ACTIVE' ? 'Pause Coupon' : 'Activate Coupon'}
                            >
                              {coupon.status === 'ACTIVE' ? '⏸ Pause' : '▶ Activate'}
                            </button>
                            <button
                              type="button"
                              onClick={() => openCreateModal(coupon)}
                              className="font-mono text-[10px] uppercase tracking-[0.1em] text-accent border border-accent/30 px-2.5 py-1.5 hover:border-accent hover:bg-accent/8 transition-colors bg-background rounded-sm cursor-pointer font-semibold"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(coupon)}
                              className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted border border-border px-2 py-1.5 hover:border-red-500/50 hover:text-red-400 transition-colors bg-background rounded-sm cursor-pointer"
                              title="Delete Coupon"
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
          </>
        )}
      </div>

      {/* CREATE & EDIT SLIDE-OVER / DIALOG MODAL */}
      {isCreateModalOpen && (
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-6"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-surface border border-border rounded-lg w-full max-w-[560px] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent">Promotions Engine</div>
                <h2 className="font-serif text-[18px] text-primary font-normal m-0">
                  {editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : 'Create New Coupon'}
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

            <form onSubmit={handleSaveCoupon} className="flex-1 overflow-y-auto p-5 space-y-4 max-h-[80vh]">
              {/* Code */}
              <div>
                <label className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted block mb-1">
                  Coupon Code *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formCode}
                    onChange={e => setFormCode(e.target.value.toUpperCase())}
                    placeholder="e.g. LUXE20"
                    disabled={!!editingCoupon}
                    className="w-full px-3 py-2 border border-border bg-background text-primary font-mono text-[12px] focus:outline-none focus:border-accent rounded-sm disabled:opacity-50"
                  />
                  {!editingCoupon && (
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

              {/* Description */}
              <div>
                <label className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted block mb-1">
                  Internal Description
                </label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  placeholder="e.g. Welcome campaign promo"
                  className="w-full px-3 py-2 border border-border bg-background text-primary font-mono text-[12px] focus:outline-none focus:border-accent rounded-sm"
                />
              </div>

              {/* Type and Value */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted block mb-1">
                    Discount Type *
                  </label>
                  <select
                    value={formType}
                    onChange={e => setFormType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-border bg-background text-primary font-mono text-[12px] focus:outline-none focus:border-accent rounded-sm cursor-pointer"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED_AMOUNT">Fixed Amount (₹)</option>
                    <option value="FREE_SHIPPING">Free Shipping</option>
                  </select>
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted block mb-1">
                    {formType === 'PERCENTAGE'
                      ? 'Discount Value (%)'
                      : formType === 'FIXED_AMOUNT'
                      ? 'Discount Value (₹)'
                      : 'Value (N/A)'}
                  </label>
                  <input
                    type="number"
                    value={formValue}
                    onChange={e => setFormValue(e.target.value)}
                    disabled={formType === 'FREE_SHIPPING'}
                    placeholder={formType === 'PERCENTAGE' ? '15' : '500'}
                    className="w-full px-3 py-2 border border-border bg-background text-primary font-mono text-[12px] focus:outline-none focus:border-accent rounded-sm disabled:opacity-40"
                  />
                </div>
              </div>

              {/* Threshold & Caps */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted block mb-1">
                    Min Order Subtotal (₹)
                  </label>
                  <input
                    type="number"
                    value={formMinOrderAmount}
                    onChange={e => setFormMinOrderAmount(e.target.value)}
                    placeholder="e.g. 20000"
                    className="w-full px-3 py-2 border border-border bg-background text-primary font-mono text-[12px] focus:outline-none focus:border-accent rounded-sm"
                  />
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted block mb-1 font-body">
                    Max Discount Cap (₹)
                  </label>
                  <input
                    type="number"
                    value={formMaxDiscountCap}
                    onChange={e => setFormMaxDiscountCap(e.target.value)}
                    disabled={formType !== 'PERCENTAGE'}
                    placeholder="e.g. 5000"
                    className="w-full px-3 py-2 border border-border bg-background text-primary font-mono text-[12px] focus:outline-none focus:border-accent rounded-sm disabled:opacity-40"
                  />
                </div>
              </div>

              {/* Usage Limits */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted block mb-1">
                    Total Uses Limit
                  </label>
                  <input
                    type="number"
                    value={formUsageLimit}
                    onChange={e => setFormUsageLimit(e.target.value)}
                    placeholder="Unlimited (leave empty)"
                    className="w-full px-3 py-2 border border-border bg-background text-primary font-mono text-[12px] focus:outline-none focus:border-accent rounded-sm"
                  />
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted block mb-1">
                    Uses Limit Per User
                  </label>
                  <input
                    type="number"
                    value={formUsageLimitPerUser}
                    onChange={e => setFormUsageLimitPerUser(e.target.value)}
                    placeholder="e.g. 1"
                    className="w-full px-3 py-2 border border-border bg-background text-primary font-mono text-[12px] focus:outline-none focus:border-accent rounded-sm"
                  />
                </div>
              </div>

              {/* Validity Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted block mb-1">
                    Starts At (optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={formStartsAt}
                    onChange={e => setFormStartsAt(e.target.value)}
                    className="w-full px-3 py-2 border border-border bg-background text-primary font-mono text-[12px] focus:outline-none focus:border-accent rounded-sm cursor-pointer text-muted"
                  />
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted block mb-1">
                    Expires At (optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={formExpiresAt}
                    onChange={e => setFormExpiresAt(e.target.value)}
                    className="w-full px-3 py-2 border border-border bg-background text-primary font-mono text-[12px] focus:outline-none focus:border-accent rounded-sm cursor-pointer text-muted"
                  />
                </div>
              </div>

              {/* Source & Affiliate */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted block mb-1">
                    Partner / Source
                  </label>
                  <select
                    value={formSource}
                    onChange={e => setFormSource(e.target.value)}
                    className="w-full px-3 py-2 border border-border bg-background text-primary font-mono text-[12px] focus:outline-none focus:border-accent rounded-sm cursor-pointer"
                  >
                    <option value="internal">Internal Campaign</option>
                    <option value="pauket">Pauket</option>
                    <option value="coupondunia">CouponDunia</option>
                    <option value="cashkaro">CashKaro</option>
                    <option value="google">Google Ads</option>
                    <option value="meta">Meta Ads</option>
                    <option value="other">Other Partner</option>
                  </select>
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted block mb-1">
                    Attributed Affiliate (optional)
                  </label>
                  <select
                    value={formAffiliateId}
                    onChange={e => setFormAffiliateId(e.target.value)}
                    className="w-full px-3 py-2 border border-border bg-background text-primary font-mono text-[12px] focus:outline-none focus:border-accent rounded-sm cursor-pointer"
                  >
                    <option value="">None</option>
                    {affiliates.map(aff => (
                      <option key={aff.id} value={aff.id}>
                        {aff.name} ({aff.affiliateCode})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="px-5 py-4 border-t border-border bg-surface-muted/40 flex justify-end gap-3 -mx-5 -mb-5 mt-6">
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
                  {isPending ? 'Saving…' : 'Save Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK GENERATION MODAL */}
      {isBulkModalOpen && (
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-6"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-surface border border-border rounded-lg w-full max-w-[500px] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent">Bulk Engine</div>
                <h2 className="font-serif text-[18px] text-primary font-normal m-0">Bulk Generate Coupons</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(false)}
                className="text-muted hover:text-primary font-mono text-[16px] cursor-pointer bg-transparent border-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBulkGenerate} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted block mb-1">
                    Number of Coupons
                  </label>
                  <input
                    type="number"
                    value={bulkCount}
                    onChange={e => setBulkCount(e.target.value)}
                    min={1}
                    max={500}
                    placeholder="e.g. 50"
                    className="w-full px-3 py-2 border border-border bg-background text-primary font-mono text-[12px] focus:outline-none focus:border-accent rounded-sm"
                  />
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted block mb-1">
                    Code Prefix
                  </label>
                  <input
                    type="text"
                    value={bulkPrefix}
                    onChange={e => setBulkPrefix(e.target.value.toUpperCase())}
                    maxLength={6}
                    placeholder="e.g. FEST"
                    className="w-full px-3 py-2 border border-border bg-background text-primary font-mono text-[12px] focus:outline-none focus:border-accent rounded-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted block mb-1">
                    Discount Type
                  </label>
                  <select
                    value={bulkType}
                    onChange={e => setBulkType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-border bg-background text-primary font-mono text-[12px] focus:outline-none focus:border-accent rounded-sm cursor-pointer"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED_AMOUNT">Fixed Amount (₹)</option>
                    <option value="FREE_SHIPPING">Free Shipping</option>
                  </select>
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted block mb-1">
                    Discount Value
                  </label>
                  <input
                    type="number"
                    value={bulkValue}
                    onChange={e => setBulkValue(e.target.value)}
                    disabled={bulkType === 'FREE_SHIPPING'}
                    placeholder="e.g. 15"
                    className="w-full px-3 py-2 border border-border bg-background text-primary font-mono text-[12px] focus:outline-none focus:border-accent rounded-sm disabled:opacity-40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted block mb-1">
                    Min Order Subtotal (₹)
                  </label>
                  <input
                    type="number"
                    value={bulkMinOrderAmount}
                    onChange={e => setBulkMinOrderAmount(e.target.value)}
                    placeholder="e.g. 15000"
                    className="w-full px-3 py-2 border border-border bg-background text-primary font-mono text-[12px] focus:outline-none focus:border-accent rounded-sm"
                  />
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted block mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="datetime-local"
                    value={bulkExpiresAt}
                    onChange={e => setBulkExpiresAt(e.target.value)}
                    className="w-full px-3 py-2 border border-border bg-background text-primary font-mono text-[12px] focus:outline-none focus:border-accent rounded-sm cursor-pointer text-muted"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted block mb-1">
                    Partner / Source
                  </label>
                  <select
                    value={bulkSource}
                    onChange={e => setBulkSource(e.target.value)}
                    className="w-full px-3 py-2 border border-border bg-background text-primary font-mono text-[12px] focus:outline-none focus:border-accent rounded-sm cursor-pointer"
                  >
                    <option value="internal">Internal</option>
                    <option value="pauket">Pauket</option>
                    <option value="coupondunia">CouponDunia</option>
                    <option value="cashkaro">CashKaro</option>
                    <option value="other">Other Partner</option>
                  </select>
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted block mb-1">
                    Affiliate Attribution
                  </label>
                  <select
                    value={bulkAffiliateId}
                    onChange={e => setBulkAffiliateId(e.target.value)}
                    className="w-full px-3 py-2 border border-border bg-background text-primary font-mono text-[12px] focus:outline-none focus:border-accent rounded-sm cursor-pointer"
                  >
                    <option value="">None</option>
                    {affiliates.map(aff => (
                      <option key={aff.id} value={aff.id}>
                        {aff.name} ({aff.affiliateCode})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="px-5 py-4 border-t border-border bg-surface-muted/40 flex justify-end gap-3 -mx-5 -mb-5 mt-6">
                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(false)}
                  className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted border border-border px-4 py-2 hover:bg-surface-muted rounded-sm cursor-pointer bg-background min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="font-mono text-[10px] uppercase tracking-[0.12em] bg-accent text-background px-5 py-2 hover:bg-accent-hover transition-colors rounded-sm cursor-pointer font-semibold disabled:opacity-50 min-h-[44px]"
                >
                  {isPending ? 'Generating…' : 'Generate'}
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
