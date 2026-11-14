"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import {
  Search,
  Rocket,
  Mail,
  MessageSquare,
  Zap,
  Sparkles,
} from "lucide-react";

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
  status: "DRAFT" | "SCHEDULED" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  stage: "STAGE_1_DISPATCH" | "STAGE_2_EXPIRY_WARNING";
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

type View = "DASHBOARD" | "EDITOR" | "COUPONS";
type Channel = "EMAIL" | "WHATSAPP";
type PreviewDevice = "DESKTOP" | "MOBILE";

// ─── Status helpers (match platform's globals.css status-pill classes) ────────
function statusPillClass(status: string): string {
  switch (status) {
    case "ACTIVE":
      return "status-pill status-active";
    case "SCHEDULED":
      return "status-pill status-processing";
    case "DRAFT":
      return "status-pill status-draft";
    case "COMPLETED":
      return "status-pill status-paid";
    case "CANCELLED":
      return "status-pill status-pending";
    default:
      return "status-pill status-draft";
  }
}

function urgencyColor(days: number): string {
  if (days < 0) return "var(--color-muted)";
  if (days <= 7) return "#c97e6a"; // rust
  if (days <= 20) return "var(--color-accent)"; // gold trigger zone
  return "var(--color-muted)";
}

function formatDate(
  dateInput: string | Date | null | undefined,
  includeYear = true,
): string {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
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
  discountValue,
  discountType = "PERCENTAGE",
}: {
  headline: string;
  greeting: string;
  bodyText: string;
  ctaText: string;
  discountValue: number;
  discountType?: "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING";
}): string {
  const paragraphs = bodyText
    .split("\n")
    .filter((p) => p.trim().length > 0)
    .map(
      (p) =>
        `<p style="color: #cccccc; font-size: 14px; line-height: 1.6; margin-bottom: 16px;">${p.trim()}</p>`,
    )
    .join("");

  const discountLabel =
    discountType === "PERCENTAGE"
      ? `${discountValue}% OFF`
      : discountType === "FIXED_AMOUNT"
        ? `₹${discountValue.toLocaleString("en-IN")} OFF`
        : "Free Delivery & Installation";

  return `
<div style="background-color: #0c0a09; color: #f5f5f4; font-family: 'Playfair Display', Georgia, serif; padding: 40px 20px; max-width: 600px; margin: 0 auto; border: 1px solid rgba(212,175,55,0.3); border-radius: 8px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h2 style="color: #D4AF37; font-size: 24px; letter-spacing: 0.15em; text-transform: uppercase; margin: 0;">James &amp; Sons</h2>
    <p style="color: #888888; font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; margin-top: 4px;">Bespoke Handcrafted Luxury</p>
  </div>
  
  <div style="text-align: center; padding: 30px 20px; background: rgba(255,255,255,0.02); border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
    ${greeting ? `<p style="color: #D4AF37; font-size: 13px; margin-bottom: 8px;">${greeting}</p>` : ""}
    ${headline ? `<h1 style="color: #ffffff; font-size: 24px; font-weight: 300; margin-bottom: 16px;">${headline}</h1>` : ""}
    
    <div style="text-align: left; margin-bottom: 24px;">
      ${paragraphs}
    </div>

    <div style="background: linear-gradient(135deg, rgba(212,175,55,0.2) 0%, rgba(212,175,55,0.05) 100%); border: 1px dashed #D4AF37; padding: 20px; border-radius: 8px; display: inline-block; margin: 10px 0 24px; text-align: center;">
      <span style="display: block; color: #D4AF37; font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase;">Your Personal Single-Use Code</span>
      <strong style="color: #ffffff; font-size: 28px; letter-spacing: 0.2em; font-family: monospace; display: block; margin-top: 6px;">{{COUPON_CODE}}</strong>
      <span style="color: #aaaaaa; font-size: 11px; margin-top: 4px; display: block;">Valid for ${discountLabel} your entire order</span>
    </div>

    <div>
      <a href="https://jamesandsons.in/collections" style="background-color: #D4AF37; color: #000000; padding: 14px 32px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.15em; text-decoration: none; border-radius: 4px; display: inline-block;">
        ${ctaText || "Claim Your Voucher"}
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

  const [view, setView] = useState<View>("DASHBOARD");
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(
    null,
  );

  // Editor controls (Clean Split Canvas)
  const [channel, setChannel] = useState<Channel>("EMAIL");
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>("DESKTOP");

  // Editable campaign fields
  const [editName, setEditName] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editBodyHtml, setEditBodyHtml] = useState("");
  const [editWhatsappText, setEditWhatsappText] = useState("");
  const [editSegment, setEditSegment] = useState("VIP");
  const [editDiscount, setEditDiscount] = useState(15);
  const [editDiscountType, setEditDiscountType] = useState<
    "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING"
  >("PERCENTAGE");
  const [editProducts, setEditProducts] = useState<any[]>([]);

  // Simple text editor fields
  const [visHeadline, setVisHeadline] = useState("");
  const [visBodyText, setVisBodyText] = useState("");
  const [visCtaText, setVisCtaText] = useState("");

  // Confirmation Modals & Drawers
  const [confirmScheduleModal, setConfirmScheduleModal] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [newCustomName, setNewCustomName] = useState("");
  const [newCustomHolidayId, setNewCustomHolidayId] = useState("");
  const [newCustomSegment, setNewCustomSegment] = useState("VIP");
  const [newCustomDiscount, setNewCustomDiscount] = useState(15);

  // Coupons view state
  const [couponsForCampaign, setCouponsForCampaign] = useState<DynamicCoupon[]>(
    [],
  );
  const [couponSearch, setCouponSearch] = useState("");
  const [couponFilter, setCouponFilter] = useState<
    "ALL" | "REDEEMED" | "UNREDEEMED"
  >("ALL");
  const [loadingCoupons, setLoadingCoupons] = useState(false);

  // Loading & confirmation states
  const [isDrafting, setIsDrafting] = useState<string | null>(null);
  const [isRegeneratingAI, setIsRegeneratingAI] = useState(false);
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [isCronRunning, setIsCronRunning] = useState(false);
  const [confirmSweep, setConfirmSweep] = useState(false);
  const [swapIndex, setSwapIndex] = useState<number | null>(null);
  const [swapQuery, setSwapQuery] = useState("");
  const [couponsPreview, setCouponsPreview] = useState<string[]>([]);
  const [toast, setToast] = useState<{
    msg: string;
    type: "ok" | "err";
  } | null>(null);

  // ── Utilities ──────────────────────────────────────────────────────────────
  const showToast = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleRegenerateAI = async () => {
    if (!selectedCampaign) return;
    setIsRegeneratingAI(true);
    try {
      const res = await fetch(`/api/admin/campaigns/${selectedCampaign.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REGENERATE_AI",
          segment: editSegment,
          discountValue: editDiscount,
        }),
      });
      const data = await res.json();
      if (data.success && data.aiResult) {
        setEditSubject(data.aiResult.emailSubject || editSubject);
        setEditBodyHtml(data.aiResult.emailBodyHtml || editBodyHtml);
        setEditWhatsappText(data.aiResult.whatsappText || editWhatsappText);
        showToast(
          `✨ AI generated fresh copy tailored for ${editSegment} segment!`,
        );
      } else {
        showToast(data.error || "Failed to generate AI copy.", "err");
      }
    } catch (e: any) {
      showToast(e.message || "Error running AI generation.", "err");
    } finally {
      setIsRegeneratingAI(false);
    }
  };

  const refreshData = useCallback(async () => {
    try {
      const [hRes, cRes] = await Promise.all([
        fetch("/api/admin/campaigns/holidays"),
        fetch("/api/admin/campaigns"),
      ]);
      if (hRes.ok) {
        const d = await hRes.json();
        setHolidays(d.holidays || []);
      }
      if (cRes.ok) {
        const d = await cRes.json();
        setCampaigns(d.campaigns || []);
        setAnalytics(d.analytics || {});
      }
    } catch {
      /* silent */
    }
  }, []);

  const openEditor = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    const cleanName = campaign.name.replace(/\[AI Synced\]\s*/g, "");
    const initialDiscount = campaign.segmentationRules?.discountValue || 15;
    const initialType: "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING" =
      campaign.segmentationRules?.discountType ||
      (initialDiscount > 100 ? "FIXED_AMOUNT" : "PERCENTAGE");

    const initialHeadline = campaign.emailSubject
      ? campaign.emailSubject
          .replace(/\[AI Synced\]\s*/g, "")
          .replace(/✨|🪔/g, "")
          .trim()
      : cleanName;

    const initialBodyText = campaign.whatsappText
      ? campaign.whatsappText
          .replace(/Namaste.*?\!/gi, "")
          .replace(/https:.*/gi, "")
          .trim()
      : "We invite you to elevate your interior spaces with our signature handcrafted brass lighting and festive decor collection.";

    setEditName(cleanName);
    setEditSubject(
      campaign.emailSubject
        ? campaign.emailSubject.replace(/\[AI Synced\]\s*/g, "")
        : "",
    );
    setEditBodyHtml(campaign.emailBodyHtml || "");
    setEditWhatsappText(campaign.whatsappText || "");
    setEditSegment(campaign.segmentationRules?.segment || "VIP");
    setEditDiscount(initialDiscount);
    setEditDiscountType(initialType);
    setEditProducts(campaign.recommendedProducts || []);

    setVisHeadline(initialHeadline);
    setVisBodyText(initialBodyText);
    setVisCtaText("Claim Your Exclusive Voucher");

    setChannel("EMAIL");
    setPreviewDevice("DESKTOP");
    setCouponsPreview([]);
    setView("EDITOR");
  };

  const openCoupons = async (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setCouponSearch("");
    setCouponFilter("ALL");
    setLoadingCoupons(true);
    setView("COUPONS");
    try {
      const res = await fetch(`/api/admin/campaigns/${campaign.id}`);
      if (res.ok) {
        const data = await res.json();
        setCouponsForCampaign(data.campaign?.dynamicCoupons || []);
      }
    } catch {
      /* silent */
    }
    setLoadingCoupons(false);
  };

  // Recompile HTML when visual text fields change
  useEffect(() => {
    if (!visHeadline && !visBodyText) return;
    const compiled = compileVisualHtml({
      headline: visHeadline,
      greeting: "Dear {{CUSTOMER_NAME}},",
      bodyText: visBodyText,
      ctaText: visCtaText,
      discountValue: editDiscount,
      discountType: editDiscountType,
    });
    setEditBodyHtml(compiled);
  }, [visHeadline, visBodyText, visCtaText, editDiscount, editDiscountType]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleDraftAI = async (holidayId: string, segment = "VIP") => {
    setIsDrafting(`${holidayId}_${segment}`);
    try {
      const res = await fetch("/api/admin/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "DRAFT_AI",
          holidayId,
          segment,
          discountValue: editDiscount || 15,
        }),
      });
      const data = await res.json();
      if (data.success && data.campaign) {
        await refreshData();
        openEditor(data.campaign);
        showToast(`Marketing draft for ${segment} buyers ready!`);
      } else {
        showToast(data.error || "Failed to generate marketing draft.", "err");
      }
    } catch (e: any) {
      showToast(e.message || "Network error.", "err");
    } finally {
      setIsDrafting(null);
    }
  };

  const handleCreateCustom = async () => {
    if (!newCustomName.trim()) {
      showToast("Please enter a campaign name.", "err");
      return;
    }
    setIsCreatingCustom(true);
    try {
      const res = await fetch("/api/admin/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_CUSTOM",
          name: newCustomName,
          holidayId: newCustomHolidayId || undefined,
          segment: newCustomSegment,
          discountValue: newCustomDiscount,
        }),
      });
      const data = await res.json();
      if (data.success && data.campaign) {
        setIsCustomModalOpen(false);
        setNewCustomName("");
        await refreshData();
        openEditor(data.campaign);
        showToast("Custom campaign draft created successfully!");
      } else {
        showToast(data.error || "Failed to create campaign.", "err");
      }
    } catch (e: any) {
      showToast(e.message || "Error creating custom campaign.", "err");
    } finally {
      setIsCreatingCustom(false);
    }
  };

  const handleSave = async (): Promise<boolean> => {
    if (!selectedCampaign) return false;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/campaigns/${selectedCampaign.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          emailSubject: editSubject,
          emailBodyHtml: editBodyHtml,
          whatsappText: editWhatsappText,
          segmentationRules: {
            ...selectedCampaign.segmentationRules,
            segment: editSegment,
            discountValue: editDiscount,
          },
          recommendedProducts: editProducts,
        }),
      });
      if (res.ok) {
        await refreshData();
        showToast("Draft saved successfully.");
        return true;
      }
      showToast("Failed to save.", "err");
      return false;
    } catch {
      showToast("Network error.", "err");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleScheduleConfirm = async () => {
    if (!selectedCampaign) return;
    setConfirmScheduleModal(false);
    setIsDispatching(true);
    await handleSave();
    try {
      const res = await fetch(`/api/admin/campaigns/${selectedCampaign.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "APPROVE_AND_SCHEDULE" }),
      });
      const data = await res.json();
      if (data.success) {
        setCouponsPreview(data.result.sampleCodes || []);
        showToast(
          `✨ Campaign Scheduled! ${data.result.couponsGenerated} single-use vouchers generated.`,
        );
        await refreshData();
        setSelectedCampaign((prev) =>
          prev ? { ...prev, status: "SCHEDULED" } : null,
        );
      } else {
        showToast(data.error || "Failed to schedule.", "err");
      }
    } catch (e: any) {
      showToast(e.message, "err");
    } finally {
      setIsDispatching(false);
    }
  };

  const handleUnschedule = async (campaignId: string) => {
    if (!confirm("Undo schedule and revert this campaign back to draft mode?"))
      return;
    try {
      const res = await fetch(`/api/admin/campaigns/${campaignId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "UNSCHEDULE" }),
      });
      const data = await res.json();
      if (data.success) {
        await refreshData();
        if (selectedCampaign && selectedCampaign.id === campaignId) {
          setSelectedCampaign({ ...selectedCampaign, status: "DRAFT" });
        }
        showToast("Campaign reverted to draft mode.");
      } else {
        showToast(data.error || "Failed to revert schedule.", "err");
      }
    } catch (e: any) {
      showToast("Error unscheduling campaign.", "err");
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this campaign? All generated vouchers will also be deleted.",
      )
    )
      return;
    try {
      const res = await fetch(`/api/admin/campaigns/${campaignId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await refreshData();
        if (selectedCampaign?.id === campaignId) {
          setView("DASHBOARD");
          setSelectedCampaign(null);
        }
        showToast("Campaign deleted successfully.");
      } else {
        showToast("Failed to delete campaign.", "err");
      }
    } catch {
      showToast("Network error.", "err");
    }
  };

  const handleSweep = async () => {
    setConfirmSweep(false);
    setIsCronRunning(true);
    try {
      const res = await fetch("/api/cron/campaign-automation");
      const data = await res.json();
      await refreshData();
      showToast(
        `Calendar sweep complete — ${data.triggeredActions || 0} actions executed.`,
      );
    } catch {
      showToast("Sweep failed.", "err");
    } finally {
      setIsCronRunning(false);
    }
  };

  const handleRevokeCoupon = async (couponId: string) => {
    if (!confirm("Revoke this coupon? It will become permanently unusable."))
      return;
    try {
      const res = await fetch(`/api/admin/campaigns/coupons/${couponId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setCouponsForCampaign((prev) => prev.filter((c) => c.id !== couponId));
        showToast("Coupon revoked.");
      } else {
        showToast("Failed to revoke.", "err");
      }
    } catch {
      showToast("Network error.", "err");
    }
  };

  // ── Derived data ───────────────────────────────────────────────────────────
  const upcomingTrigger = holidays.filter(
    (h) => h.daysRemaining >= 0 && h.daysRemaining <= 22,
  );

  const filteredCoupons = useMemo(() => {
    let list = couponsForCampaign;
    if (couponFilter === "REDEEMED") list = list.filter((c) => c.isRedeemed);
    if (couponFilter === "UNREDEEMED") list = list.filter((c) => !c.isRedeemed);
    if (couponSearch)
      list = list.filter(
        (c) =>
          c.uniqueCode.toLowerCase().includes(couponSearch.toLowerCase()) ||
          c.customer?.email
            ?.toLowerCase()
            .includes(couponSearch.toLowerCase()) ||
          c.customer?.firstName
            ?.toLowerCase()
            .includes(couponSearch.toLowerCase()),
      );
    return list;
  }, [couponsForCampaign, couponFilter, couponSearch]);

  const samplePromoCode =
    selectedCampaign?.segmentationRules?.promoCode ||
    selectedCampaign?.name.match(/([A-Z0-9_]{4,15})/i)?.[1] ||
    "PROMO_CODE";

  const discountLabelText =
    editDiscountType === "PERCENTAGE"
      ? `${editDiscount}% OFF`
      : editDiscountType === "FIXED_AMOUNT"
        ? `₹${editDiscount.toLocaleString("en-IN")} OFF`
        : "Free Delivery";

  const personalizedSubject = editSubject
    .replace(/\[AI Synced\]\s*/gi, "")
    .replace(/\{\{CUSTOMER_NAME\}\}/g, "Rahul")
    .replace(/\{\{COUPON_CODE\}\}/g, samplePromoCode)
    .replace(/\{\{DISCOUNT_VALUE\}\}/g, discountLabelText);

  const personalizedHtml = editBodyHtml
    .replace(/\[AI Synced\]\s*/gi, "")
    .replace(/\{\{CUSTOMER_NAME\}\}/g, "Rahul")
    .replace(/\{\{COUPON_CODE\}\}/g, samplePromoCode)
    .replace(/\{\{DISCOUNT_VALUE\}\}/g, discountLabelText);

  const personalizedWA = editWhatsappText
    .replace(/\[AI Synced\]\s*/gi, "")
    .replace(/\{\{CUSTOMER_NAME\}\}/g, "Rahul")
    .replace(/\{\{COUPON_CODE\}\}/g, samplePromoCode)
    .replace(/\{\{DISCOUNT_VALUE\}\}/g, discountLabelText);

  const swapFiltered = swapQuery
    ? catalogProducts.filter((p) =>
        p.name.toLowerCase().includes(swapQuery.toLowerCase()),
      )
    : catalogProducts;

  // ════════════════════════════════════════════════════════════════════════════
  // VIEW: COUPONS
  // ════════════════════════════════════════════════════════════════════════════
  if (view === "COUPONS" && selectedCampaign) {
    const redeemed = couponsForCampaign.filter((c) => c.isRedeemed).length;
    const total = couponsForCampaign.length;
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="premium-card p-5 flex flex-wrap items-center gap-4 justify-between rounded-lg">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setView("DASHBOARD")}
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
              <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
                Total Issued
              </div>
              <div className="font-serif text-[22px] text-primary tabular-nums">
                {total}
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
                Redeemed
              </div>
              <div
                className="font-serif text-[22px] tabular-nums"
                style={{ color: "#8cae7e" }}
              >
                {redeemed}
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
                Redemption Rate
              </div>
              <div className="font-serif text-[22px] text-accent tabular-nums">
                {total > 0 ? ((redeemed / total) * 100).toFixed(1) : "0.0"}%
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="premium-card flex flex-col overflow-hidden rounded-lg">
          <div className="p-4 border-b border-border flex flex-wrap gap-3 bg-surface-muted/40 items-center justify-between">
            <div className="flex-1 min-w-[220px] flex items-center gap-2 border border-border bg-background px-3 py-2 rounded-sm focus-within:border-accent transition-colors">
              <label htmlFor="coupon-search" className="sr-only">
                Search vouchers
              </label>
              <Search
                className="w-3.5 h-3.5 text-muted shrink-0"
                aria-hidden="true"
              />
              <input
                id="coupon-search"
                type="text"
                value={couponSearch}
                onChange={(e) => setCouponSearch(e.target.value)}
                placeholder="Search code, customer name, or email..."
                className="bg-transparent text-primary font-mono text-[12px] focus:outline-none w-full placeholder:text-muted/60"
              />
              {couponSearch && (
                <button
                  onClick={() => setCouponSearch("")}
                  className="text-muted hover:text-primary font-mono text-[10px] uppercase cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex gap-2">
              {(["ALL", "UNREDEEMED", "REDEEMED"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setCouponFilter(f)}
                  className={`font-mono text-[10px] uppercase tracking-[0.12em] px-3.5 py-2.5 border transition-colors rounded-sm cursor-pointer min-h-[44px] ${
                    couponFilter === f
                      ? "bg-accent text-background border-accent"
                      : "border-border text-muted hover:border-accent hover:text-primary bg-background"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="table-responsive">
            <table className="w-full text-left border-collapse">
              <caption className="sr-only">
                Dynamic voucher codes for {selectedCampaign.name}
              </caption>
              <thead className="border-b border-border bg-surface-muted/20">
                <tr>
                  {[
                    "Voucher Code",
                    "Customer",
                    "Discount",
                    "Status",
                    "Expires",
                    "Issued",
                    "",
                  ].map((h) => (
                    <th
                      key={h}
                      scope="col"
                      className="px-5 py-3 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {loadingCoupons && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-10 text-center text-muted font-mono text-[11px] uppercase tracking-widest"
                    >
                      Loading vouchers…
                    </td>
                  </tr>
                )}
                {!loadingCoupons && filteredCoupons.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-10 text-center text-muted font-mono text-[11px] uppercase tracking-widest"
                    >
                      No vouchers found.
                    </td>
                  </tr>
                )}
                {filteredCoupons.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-surface-muted/40 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-[13px] text-accent tracking-[0.12em] font-semibold">
                        {c.uniqueCode}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {c.customer ? (
                        <div>
                          <div className="font-serif text-[13px] text-primary">
                            {c.customer.firstName} {c.customer.lastName}
                          </div>
                          <div className="font-mono text-[10px] text-muted mt-0.5">
                            {c.customer.email}
                          </div>
                        </div>
                      ) : (
                        <span className="font-mono text-[11px] text-muted">
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[13px] text-primary tabular-nums">
                      {c.discountValue}%
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`status-pill ${c.isRedeemed ? "status-paid" : "status-active"}`}
                      >
                        <span className="dot" aria-hidden="true" />
                        {c.isRedeemed ? "Redeemed" : "Active"}
                      </span>
                    </td>
                    <td
                      className="px-5 py-3.5 font-mono text-[11px] text-muted tabular-nums"
                      suppressHydrationWarning
                    >
                      {formatDate(c.expiresAt, true)}
                    </td>
                    <td
                      className="px-5 py-3.5 font-mono text-[11px] text-muted tabular-nums"
                      suppressHydrationWarning
                    >
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
  // VIEW: EDITOR (Clean Split-Canvas Studio Layout)
  // ════════════════════════════════════════════════════════════════════════════
  if (view === "EDITOR" && selectedCampaign) {
    const isDraft = selectedCampaign.status === "DRAFT";
    const isLive = ["SCHEDULED", "ACTIVE"].includes(selectedCampaign.status);

    return (
      <div className="flex flex-col max-w-full overflow-hidden border border-border rounded-lg bg-background min-h-[700px]">
        {/* UNCLUTTERED TOPBAR HEADER */}
        <header className="flex items-center justify-between gap-4 px-6 py-3.5 border-b border-border bg-surface shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setView("DASHBOARD")}
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted hover:text-primary transition-colors cursor-pointer border-none bg-transparent p-0"
            >
              ← Back
            </button>
            <div className="w-px h-4 bg-border" aria-hidden="true" />

            <div className="min-w-0 flex items-center gap-2">
              <label htmlFor="edit-campaign-name" className="sr-only">
                Campaign Name
              </label>
              <input
                id="edit-campaign-name"
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Campaign Name..."
                className="font-serif text-[18px] text-primary bg-transparent border-b border-transparent hover:border-border focus:border-accent focus:outline-none px-1 py-0.5 transition-colors truncate max-w-[260px]"
              />
              <span className={statusPillClass(selectedCampaign.status)}>
                <span className="dot" aria-hidden="true" />
                {selectedCampaign.status}
              </span>
            </div>
          </div>

          {/* Clean Action Cluster */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRegenerateAI}
              disabled={isRegeneratingAI}
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent border border-accent/40 px-3.5 py-2 hover:bg-accent/10 transition-colors rounded-sm cursor-pointer disabled:opacity-50 min-h-[38px] flex items-center gap-1.5"
            >
              ✨ {isRegeneratingAI ? "Writing…" : "AI Generate"}
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted border border-border px-3.5 py-2 hover:bg-surface-muted hover:text-primary transition-colors bg-background rounded-sm cursor-pointer disabled:opacity-50 min-h-[38px]"
            >
              {isSaving ? "Saving…" : "💾 Save"}
            </button>

            {isDraft && (
              <button
                onClick={() => setConfirmScheduleModal(true)}
                disabled={isDispatching}
                className="font-mono text-[10px] uppercase tracking-[0.14em] bg-accent text-background px-4 py-2 hover:bg-accent-hover transition-colors rounded-sm cursor-pointer disabled:opacity-50 font-semibold min-h-[38px]"
              >
                {isDispatching ? (
                  "Scheduling…"
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Rocket className="w-3.5 h-3.5" /> Schedule →
                  </span>
                )}
              </button>
            )}

            {isLive && (
              <button
                onClick={() => handleUnschedule(selectedCampaign.id)}
                className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent border border-accent/40 px-3 py-2 hover:bg-accent/10 transition-colors bg-background rounded-sm cursor-pointer min-h-[38px]"
              >
                ↺ Undo
              </button>
            )}

            <button
              onClick={() => handleDeleteCampaign(selectedCampaign.id)}
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-red-400 border border-red-500/30 px-2.5 py-2 hover:bg-red-900/20 transition-colors bg-background rounded-sm cursor-pointer min-h-[38px]"
              title="Delete campaign"
            >
              🗑
            </button>
          </div>
        </header>

        {/* 2-COLUMN SPLIT CANVAS STUDIO (Left: Form Editor - 58%, Right: Live Preview - 42%) */}
        <div className="flex flex-col lg:flex-row flex-1 min-w-0">
          {/* LEFT COLUMN: FORM INPUTS (Width: 58% - Bigger than preview, no viewport height restriction at base) */}
          <div className="w-full lg:w-[58%] shrink-0 border-b lg:border-b-0 lg:border-r border-border bg-surface p-6 space-y-5">
            {/* 1. AUDIENCE & DISCOUNT SETUP */}
            <div className="p-5 border border-border/80 bg-background rounded-lg space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="font-sans text-[11px] uppercase tracking-[0.14em] text-accent font-bold">
                  1. Audience &amp; Offer
                </span>

                {/* Interactive Discount & Unit Selector */}
                <div className="flex items-center gap-2 border border-border/90 bg-surface px-3 py-1.5 rounded-md focus-within:border-accent transition-colors shadow-sm">
                  <label
                    htmlFor="edit-discount-input"
                    className="font-sans text-[11px] font-bold text-muted uppercase tracking-wider"
                  >
                    Offer:
                  </label>
                  <select
                    value={editDiscountType}
                    onChange={(e) => setEditDiscountType(e.target.value as any)}
                    className="bg-transparent text-accent font-sans text-[12px] font-bold focus:outline-none cursor-pointer"
                  >
                    <option
                      value="PERCENTAGE"
                      className="bg-background text-primary"
                    >
                      % OFF
                    </option>
                    <option
                      value="FIXED_AMOUNT"
                      className="bg-background text-primary"
                    >
                      ₹ OFF
                    </option>
                    <option
                      value="FREE_SHIPPING"
                      className="bg-background text-primary"
                    >
                      Free Shipping
                    </option>
                  </select>
                  {editDiscountType !== "FREE_SHIPPING" && (
                    <div className="flex items-center">
                      <span className="font-sans text-[14px] font-bold text-accent">
                        {editDiscountType === "FIXED_AMOUNT" ? "₹" : ""}
                      </span>
                      <input
                        id="edit-discount-input"
                        type="number"
                        value={editDiscount}
                        onChange={(e) =>
                          setEditDiscount(Number(e.target.value))
                        }
                        min={1}
                        className="w-16 bg-transparent text-accent font-sans text-[18px] font-bold text-center focus:outline-none tabular-nums"
                      />
                      <span className="font-sans text-[12px] font-bold text-accent">
                        {editDiscountType === "PERCENTAGE" ? "% OFF" : "OFF"}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "VIP", label: "VIP Buyers" },
                  { id: "LAPSED", label: "Lapsed (90d+)" },
                  { id: "ALL", label: "All Base" },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setEditSegment(s.id)}
                    className={`font-sans text-[12px] font-semibold py-2 px-2.5 border rounded-md transition-colors cursor-pointer text-center ${
                      editSegment === s.id
                        ? "bg-accent/15 border-accent text-accent font-bold shadow-sm"
                        : "border-border text-muted hover:border-accent/40 bg-surface"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. MESSAGE CONTENT */}
            <div className="p-5 border border-border/80 bg-background rounded-lg space-y-5">
              {/* Channel Selector Pills */}
              <div className="flex items-center justify-between border-b border-border/80 pb-3.5">
                <span className="font-sans text-[11px] uppercase tracking-[0.14em] text-accent font-bold">
                  2. Message Copy
                </span>
                <div className="flex items-center gap-1 bg-surface p-1 rounded-md border border-border">
                  <button
                    type="button"
                    onClick={() => setChannel("EMAIL")}
                    className={`font-sans text-[11px] font-semibold px-3 py-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                      channel === "EMAIL"
                        ? "bg-accent text-background shadow-sm"
                        : "text-muted hover:text-primary"
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" /> Email
                  </button>
                  <button
                    type="button"
                    onClick={() => setChannel("WHATSAPP")}
                    className={`font-sans text-[11px] font-semibold px-3 py-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                      channel === "WHATSAPP"
                        ? "bg-[#25D366] text-background shadow-sm"
                        : "text-muted hover:text-primary"
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                  </button>
                </div>
              </div>

              {/* Personalization Tokens Quick Chips */}
              <div className="flex items-center gap-2 flex-wrap bg-surface p-3 border border-border rounded-md">
                <span className="font-sans text-[10px] font-bold uppercase tracking-[0.1em] text-accent">
                  Insert Token:
                </span>
                {[
                  { token: "{{CUSTOMER_NAME}}", label: "First Name" },
                  { token: "{{COUPON_CODE}}", label: "Voucher Code" },
                  { token: "{{DISCOUNT_VALUE}}", label: "% Off" },
                ].map((t) => (
                  <button
                    key={t.token}
                    type="button"
                    onClick={() => {
                      if (channel === "EMAIL") {
                        setVisBodyText((prev) => prev + " " + t.token);
                      } else {
                        setEditWhatsappText((prev) => prev + " " + t.token);
                      }
                    }}
                    className="font-sans text-[11px] font-medium border border-border bg-background px-2.5 py-1 hover:border-accent hover:text-accent rounded-md transition-colors cursor-pointer shadow-xs"
                  >
                    + {t.label}
                  </button>
                ))}
              </div>

              {/* EMAIL FORM FIELDS */}
              {channel === "EMAIL" && (
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="e-sub"
                      className="font-sans text-[12px] font-semibold text-secondary block mb-1.5"
                    >
                      Subject Line
                    </label>
                    <input
                      id="e-sub"
                      type="text"
                      value={editSubject}
                      onChange={(e) => setEditSubject(e.target.value)}
                      placeholder="Email subject..."
                      className="w-full px-3.5 py-2.5 border border-border bg-surface text-primary font-sans text-[13px] focus:outline-none focus:border-accent rounded-md transition-colors"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="v-head"
                      className="font-sans text-[12px] font-semibold text-secondary block mb-1.5"
                    >
                      Main Headline
                    </label>
                    <input
                      id="v-head"
                      type="text"
                      value={visHeadline}
                      onChange={(e) => setVisHeadline(e.target.value)}
                      placeholder="e.g. Celebrate Diwali in Grandeur"
                      className="w-full px-3.5 py-2.5 border border-border bg-surface text-primary font-sans text-[13px] focus:outline-none focus:border-accent rounded-md transition-colors"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="v-body"
                      className="font-sans text-[12px] font-semibold text-secondary block mb-1.5"
                    >
                      Body Paragraphs (Plain English)
                    </label>
                    <textarea
                      id="v-body"
                      value={visBodyText}
                      onChange={(e) => setVisBodyText(e.target.value)}
                      rows={6}
                      placeholder="Main message copy..."
                      className="w-full p-3.5 border border-border bg-surface text-primary font-sans text-[13px] leading-relaxed focus:outline-none focus:border-accent rounded-md resize-y transition-colors"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="v-cta"
                      className="font-sans text-[12px] font-semibold text-secondary block mb-1.5"
                    >
                      CTA Button Text
                    </label>
                    <input
                      id="v-cta"
                      type="text"
                      value={visCtaText}
                      onChange={(e) => setVisCtaText(e.target.value)}
                      placeholder="e.g. Claim Your Exclusive Voucher"
                      className="w-full px-3.5 py-2.5 border border-border bg-surface text-primary font-sans text-[13px] focus:outline-none focus:border-accent rounded-md transition-colors"
                    />
                  </div>
                </div>
              )}

              {/* WHATSAPP FORM FIELDS */}
              {channel === "WHATSAPP" && (
                <div>
                  <label
                    htmlFor="wa-text"
                    className="font-sans text-[12px] font-semibold text-secondary block mb-1.5"
                  >
                    WhatsApp Message Text
                  </label>
                  <textarea
                    id="wa-text"
                    value={editWhatsappText}
                    onChange={(e) => setEditWhatsappText(e.target.value)}
                    rows={12}
                    placeholder="WhatsApp broadcast copy..."
                    className="w-full p-3.5 border border-border bg-surface text-primary font-sans text-[13px] leading-relaxed focus:outline-none focus:border-accent rounded-md resize-y transition-colors"
                  />
                </div>
              )}
            </div>

            {/* 3. FEATURED PRODUCTS */}
            <div className="p-5 border border-border/80 bg-background rounded-lg space-y-3">
              <span className="font-sans text-[11px] uppercase tracking-[0.14em] text-accent font-bold block">
                3. Featured Products
              </span>
              <div className="space-y-2">
                {editProducts.map((p, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-2 p-2 border border-border bg-surface rounded-sm"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {p.images?.[0] ? (
                        <img
                          src={p.images[0]}
                          alt={p.name}
                          className="w-8 h-8 object-cover rounded-sm shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-surface-muted rounded-sm shrink-0 flex items-center justify-center text-accent text-xs">
                          ✦
                        </div>
                      )}
                      <div className="min-w-0">
                        <div
                          className="font-serif text-[12px] text-primary truncate"
                          title={p.name}
                        >
                          {p.name}
                        </div>
                        <div className="font-mono text-[9.5px] text-accent tabular-nums">
                          ₹{(p.d2cPrice || 0).toLocaleString("en-IN")}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSwapIndex(idx);
                        setSwapQuery("");
                      }}
                      className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted border border-border px-2 py-1 hover:border-accent hover:text-primary transition-colors bg-background rounded-sm cursor-pointer shrink-0"
                    >
                      Swap
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: LIVE REAL-TIME PREVIEW CANVAS (Width: 42%) */}
          <div className="w-full lg:w-[42%] min-w-0 bg-background flex flex-col p-6 space-y-4">
            {/* Preview Header */}
            <div className="pb-3 border-b border-border flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent font-semibold">
                Live Campaign Preview
              </span>
              <span className="font-mono text-[10px] text-muted">
                Customer: Sample Customer ({samplePromoCode})
              </span>
            </div>

            {/* Interactive Preview Canvas */}
            <div className="flex-1 flex items-start justify-center pt-2">
              {channel === "EMAIL" ? (
                <div className="w-full max-w-[560px]">
                  <div className="mb-2.5 font-serif text-[13px] text-muted border-b border-border/60 pb-2">
                    Subject:{" "}
                    <strong className="text-primary">
                      {personalizedSubject || "(No subject entered)"}
                    </strong>
                  </div>
                  <div
                    className="border border-border rounded-lg overflow-hidden bg-white shadow-xl"
                    dangerouslySetInnerHTML={{ __html: personalizedHtml }}
                  />
                </div>
              ) : (
                <div className="w-full max-w-[360px] bg-[#0b141a] rounded-2xl p-5 border border-border/80 shadow-2xl">
                  <div className="bg-[#202c33] rounded-xl rounded-bl-none px-4 py-3">
                    <p className="text-[#e9edef] font-mono text-[11.5px] leading-[1.75] m-0 whitespace-pre-wrap">
                      {personalizedWA}
                    </p>
                    <div className="font-mono text-[8.5px] text-[#8696a0] mt-1.5 text-right">
                      Delivered ✓✓
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
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
                  <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent">
                    Points of Dispatch
                  </div>
                  <h2 className="font-serif text-[18px] text-primary font-normal m-0">
                    Confirm Campaign Dispatch
                  </h2>
                </div>
                <button
                  onClick={() => setConfirmScheduleModal(false)}
                  className="text-muted hover:text-primary font-mono text-[16px] cursor-pointer bg-transparent border-none"
                >
                  ✕
                </button>
              </div>

              <div className="p-5 space-y-3">
                <div className="p-3.5 border border-accent/30 bg-accent/5 rounded-sm space-y-2 font-mono text-[11px]">
                  <div className="flex justify-between text-primary">
                    <span className="text-muted uppercase">
                      Target Segment:
                    </span>
                    <span className="font-semibold text-accent">
                      {editSegment} Buyers
                    </span>
                  </div>
                  <div className="flex justify-between text-primary">
                    <span className="text-muted uppercase">
                      Voucher Discount:
                    </span>
                    <span className="font-semibold text-accent">
                      {editDiscount}% OFF
                    </span>
                  </div>
                  <div className="flex justify-between text-primary">
                    <span className="text-muted uppercase">
                      Voucher Format:
                    </span>
                    <span className="font-semibold">
                      8-Char Single-Use Alphanumeric
                    </span>
                  </div>
                </div>

                <p className="font-mono text-[11px] text-muted leading-relaxed m-0">
                  This will save all edits and batch-generate unique single-use
                  vouchers for all active customers in the{" "}
                  <strong>{editSegment}</strong> audience segment. Stage 1 email
                  &amp; WhatsApp dispatches will be activated.
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
                  {isDispatching ? (
                    "Generating Vouchers…"
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <Rocket className="w-3.5 h-3.5" /> Confirm & Issue
                      Vouchers
                    </span>
                  )}
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
                <h2 className="font-serif text-[16px] text-primary font-normal m-0">
                  Swap Product
                </h2>
                <button
                  onClick={() => setSwapIndex(null)}
                  className="text-muted hover:text-primary font-mono text-[16px] cursor-pointer bg-transparent border-none"
                >
                  ✕
                </button>
              </div>
              <div className="px-5 py-3 border-b border-border shrink-0">
                <div className="flex items-center gap-2 border border-border bg-background px-3 py-2 rounded-sm focus-within:border-accent transition-colors">
                  <label htmlFor="swap-search" className="sr-only">
                    Search catalog
                  </label>
                  <Search
                    className="w-3.5 h-3.5 text-muted shrink-0"
                    aria-hidden="true"
                  />
                  <input
                    id="swap-search"
                    type="text"
                    value={swapQuery}
                    onChange={(e) => setSwapQuery(e.target.value)}
                    placeholder="Search catalog…"
                    autoFocus
                    className="bg-transparent text-primary font-mono text-[12px] focus:outline-none w-full placeholder:text-muted/60"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {swapFiltered.map((p) => (
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
                    {p.images?.[0] ? (
                      <img
                        src={p.images[0]}
                        alt={p.name}
                        className="w-10 h-10 object-cover rounded-sm shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-surface-muted rounded-sm shrink-0 flex items-center justify-center text-accent text-xs">
                        ✦
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-serif text-[13px] text-primary truncate">
                        {p.name}
                      </div>
                      <div className="font-mono text-[10px] text-accent tabular-nums mt-0.5">
                        ₹{(p.d2cPrice || 0).toLocaleString("en-IN")}
                      </div>
                    </div>
                    <span className="font-mono text-[10px] text-accent shrink-0">
                      Select →
                    </span>
                  </button>
                ))}
                {swapFiltered.length === 0 && (
                  <p className="text-center font-mono text-[11px] text-muted py-8">
                    No products match "{swapQuery}"
                  </p>
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
    <div
      className="space-y-6 max-w-full overflow-hidden"
      suppressHydrationWarning
    >
      {/* Page Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 max-w-full">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent mb-1">
            Marketing Engine
          </div>
          <h1 className="font-serif text-[28px] md:text-[32px] font-normal text-primary tracking-wide m-0">
            Festival &amp; Custom Campaign Manager
          </h1>
          <p className="font-mono text-[12px] text-muted mt-1 m-0">
            Multi-channel marketing campaigns · Calendar triggers &amp; Custom
            Promotions · Per-customer unique vouchers
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
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
                type="button"
                onClick={handleSweep}
                disabled={isCronRunning}
                className="font-mono text-[10px] uppercase tracking-[0.12em] bg-accent text-background px-3 py-1.5 hover:bg-accent-hover transition-colors rounded-sm cursor-pointer disabled:opacity-50 min-h-[44px]"
              >
                {isCronRunning ? "Sweeping…" : "Confirm"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmSweep(false)}
                className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted border border-border px-2.5 py-1.5 hover:bg-surface-muted rounded-sm cursor-pointer bg-background min-h-[44px]"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmSweep(true)}
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted border border-border px-4 py-2.5 hover:bg-surface-muted hover:text-primary transition-colors rounded-sm cursor-pointer bg-background min-h-[44px]"
            >
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" /> Run 20-Day Sweep
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Promotion Email Sequences Synced Alert Banner */}
      {campaigns.filter(
        (c) =>
          c.emailSubject ||
          c.name.includes("Festive") ||
          c.name.includes("Sale"),
      ).length > 0 && (
        <div className="p-4 rounded border border-purple-500/30 bg-purple-500/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-300" />
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-purple-300">
                Promotion Email Sequences (
                {campaigns.filter((c) => c.emailSubject).length} Campaigns
                Ready)
              </h3>
            </div>
            <span className="text-[10px] font-mono uppercase bg-purple-500/20 text-purple-200 border border-purple-500/30 px-2 py-0.5 rounded">
              Synced with Promotions Engine
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
            {campaigns
              .filter((c) => c.emailSubject)
              .map((c) => (
                <div
                  key={c.id}
                  className="p-3 rounded bg-background/80 border border-border flex items-center justify-between gap-3 text-xs font-mono hover:border-purple-500/50 transition-colors"
                >
                  <div className="min-w-0 space-y-0.5">
                    <span className="text-[9px] uppercase text-purple-400 block truncate">
                      {c.name.replace(/\[AI Synced\]\s*/g, "")}
                    </span>
                    <p className="font-semibold text-primary truncate">
                      {c.emailSubject
                        ? c.emailSubject.replace(/\[AI Synced\]\s*/g, "")
                        : "No Subject"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openEditor(c)}
                    className="px-3 py-1.5 bg-purple-600 text-white rounded text-[10px] uppercase font-semibold hover:bg-purple-500 shrink-0 cursor-pointer"
                  >
                    View &amp; Send
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* KPI Row with Trend Context */}
      <section
        aria-label="Campaign metrics"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-full"
      >
        {[
          {
            label: "Total Dispatches",
            value: (analytics.totalSent || 0).toLocaleString(),
            sub:
              (analytics.totalSent || 0) > 0
                ? "Email + WhatsApp dispatches"
                : "No campaigns sent yet",
            color: undefined,
          },
          {
            label: "Avg Open Rate",
            value: `${analytics.overallOpenRate || "0.0"}%`,
            sub:
              (analytics.totalSent || 0) > 0
                ? "Live benchmark tracking"
                : "Updates live upon send",
            color: "var(--color-accent)",
          },
          {
            label: "Vouchers Redeemed",
            value: (analytics.totalRedeemed || 0).toLocaleString(),
            sub:
              (analytics.totalSent || 0) > 0
                ? "Single-use customer codes"
                : "Tracked upon checkout",
            color: "#8cae7e",
          },
          {
            label: "Attributed Revenue",
            value: `₹${(analytics.totalRevenue || 0).toLocaleString("en-IN")}`,
            sub:
              (analytics.totalSent || 0) > 0
                ? "Attributed festive sales"
                : "Measured via vouchers",
            color: "var(--color-accent)",
          },
        ].map((k) => (
          <div key={k.label} className="premium-card p-5 rounded-lg">
            <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted mb-2">
              {k.label}
            </div>
            <div
              className="font-serif text-[28px] font-normal leading-tight tabular-nums"
              style={{ color: k.color || "var(--color-primary)" }}
            >
              {k.value}
            </div>
            <div className="font-mono text-[10px] text-muted mt-1.5">
              {k.sub}
            </div>
          </div>
        ))}
      </section>

      {/* REQUEST 1 & 2: HORIZONTAL FESTIVAL CALENDAR STRIP (Placed right above All Campaigns) */}
      <section
        aria-labelledby="calendar-heading"
        className="premium-card p-5 rounded-lg flex flex-col space-y-4 max-w-full overflow-hidden"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent">
                Indian Calendar
              </div>
              <h2
                id="calendar-heading"
                className="font-serif text-[20px] font-normal text-primary m-0"
              >
                Upcoming Festivals &amp; Segment Triggers
              </h2>
            </div>
            <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted border border-border px-2 py-1 rounded-sm bg-background">
              Auto 20-Day Sweeps
            </span>
          </div>

          <div className="flex items-center gap-4">
            {[
              { color: "#c97e6a", label: "≤7 days" },
              { color: "var(--color-accent)", label: "≤20 days" },
              { color: "var(--color-muted)", label: "Upcoming" },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: l.color }}
                  aria-hidden="true"
                />
                <span className="font-mono text-[9px] text-muted">
                  {l.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Horizontal Scrollable Festival Cards */}
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
          {holidays.map((h) => {
            const festivalCampaigns = campaigns.filter(
              (c) => c.holiday?.id === h.id || c.holidayId === h.id,
            );
            const isPast = h.daysRemaining < 0;
            const urgColor = urgencyColor(h.daysRemaining);
            const isInTriggerZone =
              h.daysRemaining >= 0 && h.daysRemaining <= 22;

            return (
              <article
                key={h.id}
                className={`min-w-[280px] max-w-[320px] shrink-0 border rounded-sm p-3.5 flex flex-col justify-between space-y-3 transition-opacity ${
                  isPast
                    ? "opacity-40 bg-background"
                    : isInTriggerZone
                      ? "border-accent/40 bg-accent/5"
                      : "border-border bg-background"
                }`}
                aria-label={`${h.name}, ${h.daysRemaining < 0 ? "passed" : h.daysRemaining + " days away"}`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-serif text-[15px] font-normal text-primary">
                        {h.name}
                      </div>
                      <div
                        className="font-mono text-[10px] text-muted mt-0.5"
                        suppressHydrationWarning
                      >
                        {formatDate(h.date, true)}
                      </div>
                    </div>
                    <span
                      className="font-mono text-[12px] font-semibold tabular-nums px-2 py-0.5 border border-border rounded-sm bg-surface shrink-0"
                      style={{ color: urgColor }}
                      aria-label={
                        isPast ? "Passed" : `${h.daysRemaining} days remaining`
                      }
                    >
                      {isPast
                        ? "Passed"
                        : h.daysRemaining === 0
                          ? "Today"
                          : `${h.daysRemaining}d`}
                    </span>
                  </div>

                  {/* Existing Campaigns for this Festival */}
                  {festivalCampaigns.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-border/40 space-y-1">
                      <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted">
                        Created Drafts:
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {festivalCampaigns.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => openEditor(c)}
                            className="font-mono text-[9.5px] px-2 py-0.5 border border-accent/40 text-accent bg-accent/10 rounded-sm hover:bg-accent hover:text-background transition-colors cursor-pointer"
                            title={`Open draft: ${c.name}`}
                          >
                            ✓ {c.segmentationRules?.segment || "VIP"}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Multiple Campaign Segment Generation Chips */}
                {!isPast && (
                  <div className="pt-2 border-t border-border/40 space-y-1">
                    <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted">
                      Draft New Campaign:
                    </div>
                    <div className="flex gap-1.5">
                      {[
                        { id: "VIP", label: "+ VIP" },
                        { id: "LAPSED", label: "+ Lapsed" },
                        { id: "ALL", label: "+ All Base" },
                      ].map((seg) => (
                        <button
                          key={seg.id}
                          type="button"
                          onClick={() => handleDraftAI(h.id, seg.id)}
                          disabled={isDrafting === `${h.id}_${seg.id}`}
                          className="flex-1 font-mono text-[9px] uppercase tracking-[0.1em] py-1 px-1.5 border border-border rounded-sm text-muted hover:border-accent/50 hover:text-accent bg-surface transition-colors cursor-pointer text-center disabled:opacity-50"
                        >
                          {isDrafting === `${h.id}_${seg.id}` ? "…" : seg.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      {/* REQUEST 3: ALL CAMPAIGNS LIST (Clickable Rows) */}
      <section
        aria-labelledby="campaigns-heading"
        className="premium-card flex flex-col overflow-hidden rounded-lg"
      >
        <div className="px-5 py-4 border-b border-border flex flex-wrap items-center justify-between gap-3 bg-surface-muted/40 shrink-0">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent">
              Campaign Inbox
            </div>
            <h2
              id="campaigns-heading"
              className="font-serif text-[18px] font-normal text-primary m-0"
            >
              All Campaigns ({campaigns.length})
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {(["DRAFT", "SCHEDULED", "ACTIVE", "COMPLETED"] as const).map(
              (s) => {
                const count = campaigns.filter((c) => c.status === s).length;
                if (!count) return null;
                return (
                  <span key={s} className={statusPillClass(s)}>
                    <span className="dot" aria-hidden="true" />
                    {count} {s}
                  </span>
                );
              },
            )}
          </div>
        </div>

        {campaigns.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-16 text-center px-8">
            <span className="text-[36px] mb-3" aria-hidden="true">
              🪔
            </span>
            <div className="font-serif text-[18px] text-primary mb-2">
              No campaigns yet
            </div>
            <p className="font-mono text-[12px] text-muted max-w-[320px] leading-relaxed mb-4">
              Draft a campaign from the festival calendar above or click "+ New
              Campaign" to build a custom promotion.
            </p>
            <button
              type="button"
              onClick={() => setIsCustomModalOpen(true)}
              className="font-mono text-[10px] uppercase tracking-[0.14em] bg-accent text-background px-4 py-2 hover:bg-accent-hover transition-colors rounded-sm cursor-pointer font-semibold min-h-[44px]"
            >
              + Create Custom Campaign
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table (md and up) — CLICKABLE ROWS */}
            <div className="hidden md:block table-responsive flex-1">
              <table className="w-full text-left border-collapse">
                <caption className="sr-only">
                  E-commerce marketing campaigns
                </caption>
                <thead className="border-b border-border bg-surface-muted/20 sticky top-0">
                  <tr>
                    {[
                      "Campaign",
                      "Segment",
                      "Status",
                      "Dispatches",
                      "Redeemed",
                      "Revenue",
                      "Actions",
                    ].map((h, i) => (
                      <th
                        key={h}
                        scope="col"
                        className={`px-5 py-3 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal ${i >= 3 && i <= 5 ? "text-right" : ""}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {campaigns.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => openEditor(c)}
                      className="hover:bg-surface-muted/60 transition-colors cursor-pointer group"
                    >
                      <td className="px-5 py-4">
                        <div className="font-serif text-[14px] text-primary group-hover:text-accent transition-colors">
                          {c.name}
                        </div>
                        <div
                          className="font-mono text-[10px] text-muted mt-0.5"
                          suppressHydrationWarning
                        >
                          {c.holiday
                            ? `🪔 ${c.holiday.name} · `
                            : "✨ Standalone Campaign · "}
                          {formatDate(c.createdAt, false)}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted border border-border px-2 py-1 rounded-sm bg-background">
                          {c.segmentationRules?.segment || "VIP"}
                        </span>
                        <div className="font-mono text-[10px] text-accent mt-1">
                          {c.segmentationRules?.discountValue || 15}% OFF
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={statusPillClass(c.status)}>
                          <span className="dot" aria-hidden="true" />
                          {c.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono text-[13px] text-primary tabular-nums text-right">
                        {c.metricsSummary?.sent || 0}
                      </td>
                      <td
                        className="px-5 py-4 font-mono text-[13px] tabular-nums text-right"
                        style={{ color: "#8cae7e" }}
                      >
                        {c.metricsSummary?.redeemed || 0}
                      </td>
                      <td className="px-5 py-4 font-mono text-[13px] text-accent tabular-nums text-right">
                        ₹
                        {(c.metricsSummary?.revenue || 0).toLocaleString(
                          "en-IN",
                        )}
                      </td>
                      <td
                        className="px-5 py-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openCoupons(c);
                            }}
                            className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted border border-border px-2.5 py-1.5 hover:border-accent/40 hover:text-accent transition-colors bg-background rounded-sm cursor-pointer"
                            title={`Manage vouchers for ${c.name}`}
                          >
                            Vouchers
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditor(c);
                            }}
                            className="font-mono text-[10px] uppercase tracking-[0.1em] text-accent border border-accent/30 px-2.5 py-1.5 hover:border-accent hover:bg-accent/8 transition-colors bg-background rounded-sm cursor-pointer font-semibold"
                          >
                            Edit →
                          </button>

                          {["SCHEDULED", "ACTIVE"].includes(c.status) && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUnschedule(c.id);
                              }}
                              className="font-mono text-[10px] uppercase tracking-[0.1em] text-accent border border-accent/30 px-2 py-1.5 hover:bg-accent/10 transition-colors bg-background rounded-sm cursor-pointer"
                              title="Undo schedule & revert to draft"
                            >
                              ↺ Undo
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCampaign(c.id);
                            }}
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

            {/* Mobile Card List (< md viewports) — CLICKABLE CARDS */}
            <div className="md:hidden divide-y divide-border/40 overflow-y-auto">
              {campaigns.map((c) => (
                <article
                  key={c.id}
                  onClick={() => openEditor(c)}
                  className="p-4 space-y-3 bg-background/50 cursor-pointer hover:bg-surface-muted/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-serif text-[15px] text-primary font-normal">
                        {c.name}
                      </div>
                      <div className="font-mono text-[10px] text-muted mt-0.5">
                        {c.holiday
                          ? `🪔 ${c.holiday.name}`
                          : "✨ Standalone Campaign"}
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
                      <span className="text-primary font-semibold">
                        {c.segmentationRules?.segment || "VIP"} (
                        {c.segmentationRules?.discountValue || 15}% OFF)
                      </span>
                    </div>
                    <div>
                      <span className="text-muted">Revenue: </span>
                      <span className="text-accent font-semibold">
                        ₹
                        {(c.metricsSummary?.revenue || 0).toLocaleString(
                          "en-IN",
                        )}
                      </span>
                    </div>
                  </div>

                  <div
                    className="flex items-center justify-end gap-2 pt-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openCoupons(c);
                      }}
                      className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted border border-border px-3 py-2 hover:bg-surface-muted rounded-sm cursor-pointer min-h-[44px]"
                    >
                      Vouchers
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditor(c);
                      }}
                      className="font-mono text-[10px] uppercase tracking-[0.1em] bg-accent text-background px-3 py-2 hover:bg-accent-hover rounded-sm cursor-pointer font-semibold min-h-[44px]"
                    >
                      Edit →
                    </button>
                    {["SCHEDULED", "ACTIVE"].includes(c.status) && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUnschedule(c.id);
                        }}
                        className="font-mono text-[10px] uppercase tracking-[0.1em] text-accent border border-accent/40 px-3 py-2 hover:bg-accent/10 rounded-sm cursor-pointer min-h-[44px]"
                      >
                        ↺ Undo
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCampaign(c.id);
                      }}
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
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent">
                  Campaign Builder
                </div>
                <h2 className="font-serif text-[18px] text-primary font-normal m-0">
                  Create New Campaign
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomModalOpen(false)}
                className="text-muted hover:text-primary font-mono text-[16px] cursor-pointer bg-transparent border-none"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label
                  htmlFor="custom-name"
                  className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted block mb-1"
                >
                  Campaign Title / Name
                </label>
                <input
                  id="custom-name"
                  type="text"
                  value={newCustomName}
                  onChange={(e) => setNewCustomName(e.target.value)}
                  placeholder="e.g. Spring Luxury Chandelier Showcase"
                  className="w-full px-3 py-2 border border-border bg-background text-primary font-mono text-[12px] focus:outline-none focus:border-accent rounded-sm"
                  autoFocus
                />
              </div>

              <div>
                <label
                  htmlFor="custom-holiday"
                  className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted block mb-1"
                >
                  Associated Festival / Event (Optional)
                </label>
                <select
                  id="custom-holiday"
                  value={newCustomHolidayId}
                  onChange={(e) => setNewCustomHolidayId(e.target.value)}
                  className="w-full px-3 py-2 border border-border bg-background text-primary font-mono text-[12px] focus:outline-none focus:border-accent rounded-sm cursor-pointer"
                >
                  <option value="">None (Standalone Promotion)</option>
                  {holidays.map((h) => (
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
                    { id: "VIP", label: "VIP Buyers" },
                    { id: "LAPSED", label: "Lapsed (90d+)" },
                    { id: "ALL", label: "All Base" },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setNewCustomSegment(s.id)}
                      className={`font-mono text-[10px] uppercase tracking-[0.1em] py-2 px-2 border transition-colors rounded-sm cursor-pointer min-h-[44px] ${
                        newCustomSegment === s.id
                          ? "bg-accent text-background border-accent font-semibold"
                          : "border-border text-muted hover:border-accent/40 bg-background"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <div>
                <label
                  htmlFor="custom-discount"
                  className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted block mb-1"
                >
                  Voucher Discount Percentage
                </label>
                <div className="flex items-center gap-2 border border-border bg-background px-3 py-2 rounded-sm w-36">
                  <input
                    id="custom-discount"
                    type="number"
                    value={newCustomDiscount}
                    onChange={(e) =>
                      setNewCustomDiscount(Number(e.target.value))
                    }
                    min={5}
                    max={50}
                    className="w-12 bg-transparent text-accent font-serif text-[18px] focus:outline-none tabular-nums"
                  />
                  <span className="font-serif text-[16px] text-accent">
                    % OFF
                  </span>
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
                {isCreatingCustom ? "Creating…" : "Create & Edit Draft →"}
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
function ToastBar({ msg, type }: { msg: string; type: "ok" | "err" }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-6 right-6 z-[9999] px-4 py-3 rounded-sm border font-mono text-[12px] max-w-sm shadow-xl backdrop-blur-sm ${
        type === "err"
          ? "bg-red-900/20 border-red-600/40 text-red-300"
          : "bg-surface border-border text-primary"
      }`}
    >
      {msg}
    </div>
  );
}
