"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Coupon, Affiliate, OrderStats, PromotionFilterState } from "./types";
import {
  adminCreateCoupon,
  adminUpdateCoupon,
  adminDeleteCoupon,
  adminUpdateCouponStatus,
  adminLaunchPrebuiltPromotion,
  adminSyncGoogleMerchantPromotion,
  adminBulkGenerateCoupons,
  adminGenerateAIPromotion,
  adminTestValidateCoupon,
  adminScanUpcomingEventsAI,
  adminSyncPromotionEmailCampaign,
} from "./server-actions";

import PromotionsHeader from "./components/PromotionsHeader";
import PrebuiltPromotionsGrid from "./components/PrebuiltPromotionsGrid";
import PromotionsFilterToolbar from "./components/PromotionsFilterToolbar";
import PromotionsTable from "./components/PromotionsTable";
import PromotionFormModal from "./components/PromotionFormModal";
import ChannelSyncModal from "./components/ChannelSyncModal";
import AICouponGeneratorModal from "./components/AICouponGeneratorModal";
import StorefrontTesterModal from "./components/StorefrontTesterModal";

export default function PromotionsManagerClient({
  initialCoupons,
  affiliates,
  orderStats,
}: {
  initialCoupons: Coupon[];
  affiliates: Affiliate[];
  orderStats?: OrderStats;
}) {
  const router = useRouter();
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons);
  const [isPending, startTransition] = useTransition();

  // Filter Toolbar State
  const [filters, setFilters] = useState<PromotionFilterState>({
    search: "",
    status: "ALL",
    type: "ALL",
    channel: "ALL",
  });

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [inspectingCoupon, setInspectingCoupon] = useState<Coupon | null>(null);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isTesterModalOpen, setIsTesterModalOpen] = useState(false);
  const [testerInitialCode, setTesterInitialCode] = useState("");
  const [isScanningEvents, setIsScanningEvents] = useState(false);

  // Scan Upcoming Indian Events via AI
  const handleScanEventsAI = async () => {
    setIsScanningEvents(true);
    try {
      const res = await adminScanUpcomingEventsAI();
      alert(
        `✨ ${res.aiSummary}\n\nSeeded ${res.holidaysSeeded} new Indian holidays in DB & generated ${res.promotionsGenerated.length} seasonal promotion presets!`,
      );
      router.refresh();
    } catch (err: any) {
      alert(`Event scan error: ${err.message}`);
    } finally {
      setIsScanningEvents(false);
    }
  };

  // Auto-generate AI Email Marketing Campaign for specific coupon
  const handleSyncEmailAI = (couponId: string) => {
    startTransition(async () => {
      try {
        const res = await adminSyncPromotionEmailCampaign(couponId);
        alert(
          `✨ AI Email Campaign Synced Successfully!\n\nSubject: "${res.emailSubject}"\nCampaign Name: ${res.campaignName}\n\nYour campaign is now ready in the Marketing / Email Campaigns panel!`,
        );
        router.refresh();
      } catch (err: any) {
        alert(`Email sync error: ${err.message}`);
      }
    });
  };

  const handleFilterChange = (
    key: keyof PromotionFilterState,
    value: string,
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: "",
      status: "ALL",
      type: "ALL",
      channel: "ALL",
    });
  };

  // Direct AI Launch Handler
  const handleAILaunch = async (promoData: any) => {
    const created = await adminCreateCoupon(promoData);
    setCoupons((prev) => [created as any, ...prev]);
    router.refresh();
  };

  // Bulk state
  const [bulkCount, setBulkCount] = useState("10");
  const [bulkPrefix, setBulkPrefix] = useState("JNS");
  const [bulkType, setBulkType] = useState<Coupon["type"]>("PERCENTAGE");
  const [bulkValue, setBulkValue] = useState("10");

  // Filtered Coupons list
  const filteredCoupons = useMemo(() => {
    return coupons.filter((c) => {
      // Search term
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const matchesCode = c.code.toLowerCase().includes(q);
        const matchesDesc = (c.description || "").toLowerCase().includes(q);
        const matchesSource = (c.source || "").toLowerCase().includes(q);
        if (!matchesCode && !matchesDesc && !matchesSource) return false;
      }

      // Status filter
      if (filters.status !== "ALL" && c.status !== filters.status) {
        return false;
      }

      // Type filter
      if (filters.type !== "ALL" && c.type !== filters.type) {
        return false;
      }

      // Channel filter
      if (filters.channel !== "ALL") {
        const sources = (c.source || "internal").split(",");
        if (!sources.includes(filters.channel) && !sources.includes("all")) {
          return false;
        }
      }

      return true;
    });
  }, [coupons, filters]);

  const activeCount = useMemo(
    () => coupons.filter((c) => c.status === "ACTIVE").length,
    [coupons],
  );

  // 1-Click Launch Prebuilt Promotion Handler
  const handleLaunchPrebuilt = async (presetId: string) => {
    try {
      const res = await adminLaunchPrebuiltPromotion(presetId);
      setCoupons((prev) => [res.coupon as any, ...prev]);
      router.refresh();
    } catch (err: any) {
      alert(`Failed to launch prebuilt promotion: ${err.message}`);
    }
  };

  // Toggle Status Action
  const handleToggleStatus = (couponId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "ACTIVE" ? "PAUSED" : "ACTIVE";
    startTransition(async () => {
      await adminUpdateCouponStatus(couponId, nextStatus);
      setCoupons((prev) =>
        prev.map((c) => (c.id === couponId ? { ...c, status: nextStatus } : c)),
      );
    });
  };

  // Delete Coupon Action
  const handleDeleteCoupon = (couponId: string) => {
    if (!confirm("Are you sure you want to delete this promotion?")) return;
    startTransition(async () => {
      await adminDeleteCoupon(couponId);
      setCoupons((prev) => prev.filter((c) => c.id !== couponId));
    });
  };

  // Sync Google Merchant
  const handleSyncGoogleMerchant = async (couponId: string) => {
    try {
      const res = await adminSyncGoogleMerchantPromotion(couponId);
      setCoupons((prev) =>
        prev.map((c) => {
          if (c.id === couponId) {
            const sources = Array.from(
              new Set([
                ...(c.source || "internal").split(","),
                "google_merchant",
              ]),
            ).join(",");
            return { ...c, source: sources };
          }
          return c;
        }),
      );
      alert(res.message);
    } catch (err: any) {
      alert(`Google Merchant sync error: ${err.message}`);
    }
  };

  // Save / Update Form Action
  const handleSaveCouponForm = async (formData: any) => {
    if (formData.id) {
      // Edit
      const updated = await adminUpdateCoupon(formData.id, formData);
      setCoupons((prev) =>
        prev.map((c) => (c.id === formData.id ? { ...c, ...updated } : c)),
      );
    } else {
      // Create
      const created = await adminCreateCoupon(formData);
      setCoupons((prev) => [created as any, ...prev]);
    }
    router.refresh();
  };

  // Bulk Coupon Generation Action
  const handleBulkGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const createdCodes = await adminBulkGenerateCoupons({
        count: Number(bulkCount),
        prefix: bulkPrefix,
        type: bulkType,
        value: Number(bulkValue),
      });
      alert(
        `Successfully generated ${createdCodes.length} bulk promotion coupons.`,
      );
      setIsBulkModalOpen(false);
      router.refresh();
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header & Metric Cards */}
      <PromotionsHeader
        orderStats={orderStats}
        activeCount={activeCount}
        totalCount={coupons.length}
        onOpenCreate={() => {
          setEditingCoupon(null);
          setIsFormModalOpen(true);
        }}
        onOpenBulk={() => setIsBulkModalOpen(true)}
        onOpenAI={() => setIsAIModalOpen(true)}
        onOpenTester={() => {
          setTesterInitialCode(coupons[0]?.code || "FESTIVE20");
          setIsTesterModalOpen(true);
        }}
        onScanEventsAI={handleScanEventsAI}
        isScanningEvents={isScanningEvents}
      />

      {/* 1-Click Prebuilt Promotions Grid */}
      <PrebuiltPromotionsGrid
        onLaunchPreset={handleLaunchPrebuilt}
        isLaunching={isPending}
      />

      {/* Filter Toolbar */}
      <PromotionsFilterToolbar
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* Promotions Table */}
      <PromotionsTable
        coupons={filteredCoupons}
        onEdit={(c) => {
          setEditingCoupon(c);
          setIsFormModalOpen(true);
        }}
        onDelete={handleDeleteCoupon}
        onToggleStatus={handleToggleStatus}
        onSyncGoogleMerchant={handleSyncGoogleMerchant}
        onInspectSync={(c) => setInspectingCoupon(c)}
        onSyncEmailAI={handleSyncEmailAI}
        isPending={isPending}
      />

      {/* Modal: AI Promotion Architect */}
      <AICouponGeneratorModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        onGenerateAI={(prompt, answers) =>
          adminGenerateAIPromotion(prompt, answers)
        }
        onApplyToForm={(promo) => {
          setEditingCoupon(promo as any);
          setIsFormModalOpen(true);
        }}
        onDirectLaunch={handleAILaunch}
      />

      {/* Modal: Storefront Redemption Simulator */}
      <StorefrontTesterModal
        isOpen={isTesterModalOpen}
        onClose={() => setIsTesterModalOpen(false)}
        initialCode={testerInitialCode}
        onValidate={(code, subtotal) => adminTestValidateCoupon(code, subtotal)}
      />

      {/* Modal: Create / Edit Promotion */}
      <PromotionFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingCoupon(null);
        }}
        coupon={editingCoupon}
        affiliates={affiliates}
        onSubmit={handleSaveCouponForm}
      />

      {/* Modal: Google Merchant Feed & Channel Inspector */}
      <ChannelSyncModal
        coupon={inspectingCoupon}
        onClose={() => setInspectingCoupon(null)}
        onResync={handleSyncGoogleMerchant}
      />

      {/* Modal: Bulk Coupon Generator */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-sm max-w-md w-full p-6 space-y-4">
            <h2 className="font-mono text-sm font-bold uppercase text-primary">
              Bulk Promo Generator
            </h2>
            <form onSubmit={handleBulkGenerate} className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono uppercase text-muted mb-1">
                  Prefix
                </label>
                <input
                  type="text"
                  value={bulkPrefix}
                  onChange={(e) => setBulkPrefix(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-background border border-border rounded text-primary uppercase"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono uppercase text-muted mb-1">
                  Count (Quantity)
                </label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={bulkCount}
                  onChange={(e) => setBulkCount(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-background border border-border rounded text-primary"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono uppercase text-muted mb-1">
                  Discount Type
                </label>
                <select
                  value={bulkType}
                  onChange={(e) =>
                    setBulkType(e.target.value as Coupon["type"])
                  }
                  className="w-full px-3 py-2 text-xs font-mono bg-background border border-border rounded text-primary"
                >
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED_AMOUNT">Fixed Amount (₹)</option>
                  <option value="FREE_SHIPPING">Free Shipping</option>
                </select>
              </div>
              {bulkType !== "FREE_SHIPPING" && (
                <div>
                  <label className="block text-[11px] font-mono uppercase text-muted mb-1">
                    Value
                  </label>
                  <input
                    type="number"
                    value={bulkValue}
                    onChange={(e) => setBulkValue(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono bg-background border border-border rounded text-primary"
                  />
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-mono uppercase border border-border text-muted rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-1.5 text-xs font-mono uppercase bg-accent text-accent-foreground rounded font-semibold"
                >
                  {isPending ? "Generating..." : "Generate Codes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
