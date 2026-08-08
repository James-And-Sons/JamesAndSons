"use client";

/**
 * OrderStatusControls — Fulfillment Studio
 *
 * Renders the correct fulfillment UI based on order channel & type:
 * - Amazon Easy Ship: ATS time-slot picker + package spec editor
 * - Amazon Self-Ship (MFN): Shiprocket 1-Click booking + SP-API AWB sync (Option B collapsed)
 * - D2C / B2B: Shiprocket pickup booking + label download
 *
 * amazonFulfillmentType from DB drives which section shows:
 *   "EASY_SHIP" → Easy Ship section only
 *   "SELF_SHIP"  → Self-Ship section only
 *   null/unknown → Both sections with a toggle (edge case)
 */

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Package,
  Truck,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  FileText,
  ExternalLink,
  Zap,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Info,
  Download,
} from "lucide-react";
import {
  updateOrderStatus,
  updateTrackingNumber,
  syncSingleAmazonOrderAction,
  resetAmazonOrderShipmentAction,
  updateOrderFulfillmentTypeAction,
} from "../actions";
import { useSidebar } from "@/lib/context/SidebarContext";
import {
  syncRazorpayPayment,
  retryLogisticsSync,
  bookShiprocketPickupAction,
  getShiprocketLabelAction,
  getShiprocketDocumentUrlsAction,
  estimateShiprocketFreightAction,
} from "./logistics-actions";
import LogisticsPreviewModal from "./LogisticsPreviewModal";
import TrackingTimeline from "./TrackingTimeline";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];
const STATUS_COLORS: Record<string, string> = {
  PENDING: "border-border text-muted",
  PAID: "border-amber-500/20 text-amber-400/90",
  PROCESSING: "border-amber-500/20 text-amber-400/90",
  SHIPPED: "border-cyan-500/20 text-cyan-400/90",
  DELIVERED: "border-emerald-500/20 text-emerald-400/90",
  CANCELLED: "border-rose-500/20 text-rose-400/90",
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface TimeSlot {
  slotId: string;
  startTime: string;
  endTime: string;
  handoverMethod: string;
  label?: string;
}

interface OrderItem {
  id: string;
  quantity: number;
  product: {
    name: string;
    sku: string;
    weight?: number | null;
    length?: number | null;
    breadth?: number | null;
    height?: number | null;
  };
}

interface PackageDims {
  length: number;
  width: number;
  height: number;
  weight: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcDimsFromItems(items: OrderItem[]): PackageDims {
  if (!items || items.length === 0)
    return { length: 20, width: 20, height: 20, weight: 0.5 };
  return {
    length: Math.round(
      Math.max(...items.map((i) => i.product.length || 20), 20),
    ),
    width: Math.round(
      Math.max(...items.map((i) => i.product.breadth || 20), 20),
    ),
    height: Math.round(
      items.reduce((s, i) => s + i.quantity * (i.product.height || 10), 0),
    ),
    weight:
      Math.round(
        items.reduce((s, i) => s + i.quantity * (i.product.weight || 0.5), 0) *
          100,
      ) / 100,
  };
}

function formatSlot(slot: TimeSlot): string {
  if (slot.label) return slot.label;
  try {
    const start = new Date(slot.startTime);
    const end = new Date(slot.endTime);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const dayLabel =
      start.toDateString() === today.toDateString()
        ? "Today"
        : start.toDateString() === tomorrow.toDateString()
          ? "Tomorrow"
          : start.toLocaleDateString("en-IN", {
              weekday: "short",
              month: "short",
              day: "numeric",
            });
    const fmt = (d: Date) =>
      d.toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    return `${dayLabel} · ${fmt(start)} – ${fmt(end)}`;
  } catch {
    return slot.slotId;
  }
}

function todayPickupDate(): string {
  const d = new Date();
  if (d.getHours() >= 14) d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Collapsible info tooltip */
function InfoTip({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-4 h-4 rounded-full bg-muted/20 text-muted font-mono text-[9px] inline-flex items-center justify-center hover:bg-accent/20 hover:text-accent transition-colors cursor-pointer ml-1"
        title="More info"
      >
        ?
      </button>
      {open && (
        <div className="absolute z-20 left-0 mt-1 w-64 bg-surface border border-border rounded-xs p-3 shadow-xl text-[10px] font-sans text-secondary leading-relaxed">
          {children}
          <button
            onClick={() => setOpen(false)}
            className="block mt-2 font-mono text-[8px] text-muted hover:text-primary"
          >
            ✕ Close
          </button>
        </div>
      )}
    </span>
  );
}

/** Single PDF doc download card */
function DocCard({
  label,
  url,
  icon: Icon = FileText,
}: {
  label: string;
  url?: string | null;
  icon?: any;
}) {
  return (
    <div
      className={`flex flex-col gap-2 p-3 border rounded-xs ${url ? "border-border bg-background/50 hover:border-accent/40" : "border-border/40 bg-background/20 opacity-50"} transition-colors`}
    >
      <span className="font-mono text-[10px] uppercase tracking-wider text-muted flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5 text-accent" />
        <span>{label}</span>
      </span>
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-[10px] uppercase tracking-wider text-accent hover:text-accent-hover transition-colors flex items-center gap-1"
        >
          <span>Download PDF</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      ) : (
        <span className="font-mono text-[9px] text-muted/50">
          Not available yet
        </span>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function OrderStatusControls({
  orderId,
  currentStatus,
  razorpayOrderId,
  awbNumber,
  trackingNumber,
  fulfillmentError,
  channel,
  amazonOrderId,
  amazonOrderStatus,
  amazonFulfillmentType,
  orderItems,
  shippingAddress,
  shippingCity,
  shippingState,
  shippingPincode,
}: {
  orderId: string;
  currentStatus: string;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  awbNumber?: string | null;
  trackingNumber?: string | null;
  fulfillmentError?: string | null;
  channel?: string | null;
  amazonOrderId?: string | null;
  amazonOrderStatus?: string | null;
  amazonFulfillmentType?: string | null; // "EASY_SHIP" | "SELF_SHIP" | null
  isAmazon?: boolean;
  orderItems?: OrderItem[];
  shippingAddress?: string | null;
  shippingCity?: string | null;
  shippingState?: string | null;
  shippingPincode?: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Derived flags
  const isAmazon = channel === "AMAZON" || Boolean(amazonOrderId);
  const isEasyShip = isAmazon && amazonFulfillmentType === "EASY_SHIP";
  const isSelfShip =
    isAmazon &&
    (amazonFulfillmentType === "SELF_SHIP" || amazonFulfillmentType === null);
  // If type unknown (null and is Amazon), show both sections with a picker
  const fulfillmentTypeUnknown = isAmazon && amazonFulfillmentType === null;

  // Package dimensions (auto-calc from items, editable)
  const [dims, setDims] = useState<PackageDims>(() =>
    calcDimsFromItems(orderItems || []),
  );

  // Easy Ship state
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [isFetchingSlots, setIsFetchingSlots] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingResult, setBookingResult] = useState<any>(null);
  const [bookingError, setBookingError] = useState("");

  // Self-Ship / Shiprocket state
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isBookingPickup, setIsBookingPickup] = useState(false);
  const [shiprocketResult, setShiprocketResult] = useState<any>(null);
  const [shiprocketError, setShiprocketError] = useState("");
  const [shiprocketLabelUrl, setShiprocketLabelUrl] = useState("");
  const [pickupDate, setPickupDate] = useState(todayPickupDate);
  const [boxCount, setBoxCount] = useState(1);
  const [freightEstimate, setFreightEstimate] = useState<{
    rate: number;
    courierName: string;
    etd: string;
    availableCouriers?: Array<{ name: string; rate: number; etd: string }>;
  } | null>(null);

  // Option B (Manual AWB) toggle
  const [showOptionB, setShowOptionB] = useState(false);
  const [manualCarrier, setManualCarrier] = useState("Shiprocket");
  const [manualAwb, setManualAwb] = useState(awbNumber || trackingNumber || "");
  const [isConfirmingAmzShipment, setIsConfirmingAmzShipment] = useState(false);
  const [amzConfirmResult, setAmzConfirmResult] = useState<string | null>(null);
  const [amzConfirmError, setAmzConfirmError] = useState<string | null>(null);

  // Documents
  const [docLoading, setDocLoading] = useState(false);
  const [manifestUrl, setManifestUrl] = useState<string | null>(null);
  const [shiprocketInvoiceUrl, setShiprocketInvoiceUrl] = useState<
    string | null
  >(null);

  // Status update
  const [showTrackingInput, setShowTrackingInput] = useState(false);
  const [trackingInput, setTrackingInput] = useState("");
  const [awbInput, setAwbInput] = useState(awbNumber || "");

  // For fulfillment type unknown — user can manually set
  const [manualFulfillmentType, setManualFulfillmentType] = useState<
    "EASY_SHIP" | "SELF_SHIP" | null
  >(null);
  const effectiveFulfillmentType =
    manualFulfillmentType || amazonFulfillmentType;
  const showEasyShip = isAmazon && effectiveFulfillmentType === "EASY_SHIP";
  const showSelfShip =
    isAmazon &&
    (effectiveFulfillmentType === "SELF_SHIP" ||
      (fulfillmentTypeUnknown && !manualFulfillmentType));

  const handleSwitchFulfillmentType = (
    targetType: "EASY_SHIP" | "SELF_SHIP",
  ) => {
    setManualFulfillmentType(targetType);
    startTransition(async () => {
      const res = await updateOrderFulfillmentTypeAction(orderId, targetType);
      if (!res.success)
        setAmzConfirmError("Failed to update mode: " + res.error);
      else {
        setAmzConfirmResult(
          `Fulfillment mode changed to ${targetType === "EASY_SHIP" ? "Easy Ship" : "Self-Ship"}.`,
        );
        router.refresh();
      }
    });
  };

  // ── Auto-fetch Easy Ship time slots when applicable ──
  useEffect(() => {
    if (!showEasyShip || awbNumber || trackingNumber) return;
    if (
      currentStatus === "SHIPPED" ||
      currentStatus === "DELIVERED" ||
      currentStatus === "CANCELLED"
    )
      return;
    fetchTimeSlots();
  }, [showEasyShip, orderId]);

  // ── Auto-fetch doc URLs when AWB present ──
  useEffect(() => {
    if (awbNumber || trackingNumber) fetchDocUrls();
  }, [awbNumber, trackingNumber]);

  // ── Re-calc dims when orderItems change ──
  useEffect(() => {
    if (orderItems && orderItems.length > 0) {
      setDims(calcDimsFromItems(orderItems));
    }
  }, [orderItems?.length]);

  const fetchTimeSlots = async () => {
    setIsFetchingSlots(true);
    setBookingError("");
    try {
      const res = await fetch(`/api/orders/${orderId}/amazon-easy-ship`);
      const data = await res.json();
      if (data.timeSlots) {
        setTimeSlots(data.timeSlots);
        if (data.timeSlots[0]) setSelectedSlot(data.timeSlots[0]);
        if (data.packageDimensions) {
          setDims((d) => ({
            ...d,
            length: data.packageDimensions.length || d.length,
            width: data.packageDimensions.width || d.width,
            height: data.packageDimensions.height || d.height,
          }));
        }
        if (data.packageWeight)
          setDims((d) => ({ ...d, weight: data.packageWeight }));
      } else if (data.error) {
        setBookingError(data.error);
      }
    } catch (err: any) {
      setBookingError("Failed to fetch pickup slots");
    } finally {
      setIsFetchingSlots(false);
    }
  };

  const sidebar = useSidebar();

  const fetchDocUrls = async () => {
    setDocLoading(true);
    const res = await getShiprocketDocumentUrlsAction(orderId);
    if (res.success) {
      if (res.labelUrl) setShiprocketLabelUrl(res.labelUrl);
      if (res.manifestUrl) setManifestUrl(res.manifestUrl);
      if (res.invoiceUrl) setShiprocketInvoiceUrl(res.invoiceUrl);

      try {
        if (
          sidebar &&
          sidebar.orderDetailState &&
          typeof sidebar.setOrderDetailState === "function"
        ) {
          sidebar.setOrderDetailState({
            ...sidebar.orderDetailState,
            shiprocketLabelUrl:
              res.labelUrl || sidebar.orderDetailState.shiprocketLabelUrl,
            manifestUrl:
              res.manifestUrl || sidebar.orderDetailState.manifestUrl,
            shiprocketInvoiceUrl:
              res.invoiceUrl || sidebar.orderDetailState.shiprocketInvoiceUrl,
          });
        }
      } catch (e) {
        // Safe context fallback
      }
    }
    setDocLoading(false);
  };

  const [isDownloadingAll, setIsDownloadingAll] = useState(false);

  const handleDownloadAllDocs = async () => {
    setIsDownloadingAll(true);
    try {
      const link = document.createElement("a");
      link.href = `/api/orders/${orderId}/download-all-docs`;
      link.download = `Order_Documents_${orderId}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Error downloading document bundle:", err);
    } finally {
      setIsDownloadingAll(false);
    }
  };

  // ── Listen for custom download-all event from side panel / nav ──
  useEffect(() => {
    const handleDownloadEvent = () => {
      handleDownloadAllDocs();
    };
    if (typeof window !== "undefined") {
      window.addEventListener("jns:download-all-docs", handleDownloadEvent);
      return () => {
        window.removeEventListener(
          "jns:download-all-docs",
          handleDownloadEvent,
        );
      };
    }
  }, [shiprocketLabelUrl, manifestUrl, shiprocketInvoiceUrl, orderId]);

  const handleBookEasyShip = async () => {
    if (!selectedSlot) {
      setBookingError("Please select a pickup slot.");
      return;
    }
    setIsBooking(true);
    setBookingError("");
    try {
      const res = await fetch(`/api/orders/${orderId}/amazon-easy-ship`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId: selectedSlot.slotId,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
          packageLength: dims.length,
          packageWidth: dims.width,
          packageHeight: dims.height,
          packageWeight: dims.weight,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBookingResult(data);
        if (data.labelUrl) window.open(data.labelUrl, "_blank");
        router.refresh();
      } else {
        setBookingError(data.error || "Booking failed.");
      }
    } catch (err: any) {
      setBookingError(err.message || "Network error.");
    } finally {
      setIsBooking(false);
    }
  };

  const handleBookShiprocket = async (
    d: PackageDims,
    pd: string,
    bc: number,
    courierId?: number | null,
  ) => {
    setIsBookingPickup(true);
    setShiprocketError("");
    setShowPreviewModal(false);
    try {
      const result = await bookShiprocketPickupAction(
        orderId,
        pd,
        {
          length: d.length,
          width: d.width,
          height: d.height,
          weight: d.weight,
          boxCount: bc,
        },
        courierId,
      );
      if (result.success) {
        setShiprocketResult(result);
        if (result.amazonSynced) {
          setAmzConfirmResult(
            "⚡ Shipment booked & AWB auto-synced to Amazon SP-API!",
          );
        }
        if (result.labelUrl) {
          setShiprocketLabelUrl(result.labelUrl);
          window.open(result.labelUrl, "_blank");
        }
        router.refresh();
      } else {
        setShiprocketError(result.error || "Pickup booking failed.");
      }
    } catch (err: any) {
      setShiprocketError(err.message || "Network error.");
    } finally {
      setIsBookingPickup(false);
    }
  };

  const handleEstimateFreight = async (d: PackageDims) => {
    const res = await estimateShiprocketFreightAction(orderId, {
      deliveryPincode: shippingPincode || "110001",
      weight: d.weight,
      length: d.length,
      width: d.width,
      height: d.height,
    });
    if (res.success && res.rate) {
      setFreightEstimate({
        rate: res.rate,
        courierName: res.courierName || "Best Partner",
        etd: res.etd || "3-5 Days",
        availableCouriers: res.availableCouriers || [],
      });
    }
  };

  const handleConfirmAmazonShipment = async (
    overrideAwb?: string,
    overrideCarrier?: string,
  ) => {
    const awbToSend = (overrideAwb || manualAwb).trim();
    const carrierToSend = overrideCarrier || manualCarrier || "Shiprocket";
    if (!awbToSend) {
      setAmzConfirmError("Please enter a Tracking ID / AWB Number.");
      return;
    }
    setIsConfirmingAmzShipment(true);
    setAmzConfirmError(null);
    setAmzConfirmResult(null);
    try {
      const res = await fetch(
        `/api/orders/${orderId}/amazon-confirm-shipment`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            carrierCode: carrierToSend,
            carrierName: carrierToSend,
            trackingNumber: awbToSend,
          }),
        },
      );
      const data = await res.json();
      if (data.success || data.warning) {
        setAmzConfirmResult(
          data.message || `Confirmed on Amazon with AWB ${awbToSend}!`,
        );
        router.refresh();
      } else {
        setAmzConfirmError(
          data.error || data.message || "Failed to confirm shipment on Amazon.",
        );
      }
    } catch (err: any) {
      setAmzConfirmError(err.message || "Network error.");
    } finally {
      setIsConfirmingAmzShipment(false);
    }
  };

  const handleStatusUpdate = (status: string) => {
    if (status === "SHIPPED") {
      setShowTrackingInput(true);
      return;
    }
    startTransition(async () => {
      const result = await updateOrderStatus(orderId, status);
      if (!result.success) alert("Failed to update status: " + result.error);
    });
  };

  const handleTrackingSubmit = () => {
    startTransition(async () => {
      const result = await updateTrackingNumber(
        orderId,
        trackingInput,
        awbInput,
      );
      if (!result.success) alert("Failed to update tracking: " + result.error);
      else setShowTrackingInput(false);
    });
  };

  const trackCode = trackingNumber || awbNumber;
  const isShipped =
    currentStatus === "SHIPPED" || currentStatus === "DELIVERED";

  return (
    <div className="space-y-3">
      {/* ── FULFILLMENT TYPE PICKER (shown only when type is unknown) ── */}
      {fulfillmentTypeUnknown && !manualFulfillmentType && (
        <div className="bg-amber-500/5 border border-amber-500/25 rounded-sm p-4">
          <p className="font-mono text-[9px] uppercase tracking-widest text-amber-400 mb-3">
            ⚠ Amazon Order Type Not Detected
          </p>
          <p className="font-sans text-[12px] text-secondary mb-3">
            We could not auto-detect if this is an <strong>Easy Ship</strong>{" "}
            (Amazon ATS pickup) or <strong>Self-Ship</strong> (you book
            Shiprocket) order. Please select:
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handleSwitchFulfillmentType("EASY_SHIP")}
              className="flex-1 font-mono text-[9px] uppercase tracking-wider py-2.5 bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20 rounded-xs transition-colors"
            >
              📦 Easy Ship (Amazon picks up)
            </button>
            <button
              onClick={() => handleSwitchFulfillmentType("SELF_SHIP")}
              className="flex-1 font-mono text-[9px] uppercase tracking-wider py-2.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 rounded-xs transition-colors"
            >
              🚀 Self-Ship (I book Shiprocket)
            </button>
          </div>
        </div>
      )}

      {/* ── MAIN FULFILLMENT CARD ── */}
      <div className="bg-surface border border-border rounded-sm overflow-hidden">
        {/* Header Bar */}
        <div className="px-5 py-4 border-b border-border flex flex-wrap justify-between items-center gap-2">
          <div>
            <h3 className="font-mono text-[12px] sm:text-[13px] uppercase tracking-widest font-bold text-accent m-0">
              {isEasyShip
                ? "📦 Amazon Easy Ship — ATS Pickup"
                : isAmazon
                  ? "🚀 Amazon Self-Ship — Shiprocket + SP-API"
                  : "🚀 Shiprocket Fulfillment Studio"}
            </h3>
            <p className="font-mono text-[10px] sm:text-[11px] text-muted mt-1 m-0">
              {isEasyShip
                ? "Amazon ATS agent will pick up from your warehouse · Click slot to book"
                : isAmazon
                  ? "Book Shiprocket → AWB auto-pushed to Amazon SP-API"
                  : "Book courier pickup, print label, and mark as shipped"}
            </p>
          </div>
          {/* Razorpay sync */}
          {!isAmazon && currentStatus === "PENDING" && razorpayOrderId && (
            <button
              onClick={() =>
                startTransition(async () => {
                  const r = await syncRazorpayPayment(
                    orderId,
                    razorpayOrderId!,
                  );
                  if (!r.success) alert("Sync failed: " + r.error);
                  else alert("Payment synced!");
                })
              }
              disabled={isPending}
              className="font-mono text-[10px] sm:text-[11px] uppercase tracking-wider px-3 py-1.5 bg-surface border border-border text-muted hover:text-accent hover:border-accent/40 rounded-xs transition-colors disabled:opacity-50"
            >
              Sync Razorpay Payment
            </button>
          )}
          {isAmazon && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() =>
                  handleSwitchFulfillmentType(
                    showEasyShip ? "SELF_SHIP" : "EASY_SHIP",
                  )
                }
                disabled={isPending}
                title={`Click to manually correct mode to ${showEasyShip ? "Self-Ship" : "Easy Ship"}`}
                className="font-mono text-[10px] sm:text-[11px] uppercase tracking-wider px-3 py-1.5 bg-surface border border-border text-muted hover:text-accent hover:border-accent/40 rounded-xs transition-colors disabled:opacity-50"
              >
                🔄 Switch to{" "}
                {showEasyShip ? "Self-Ship (Shiprocket)" : "Easy Ship (ATS)"}
              </button>
              <button
                onClick={() =>
                  startTransition(async () => {
                    const r = await syncSingleAmazonOrderAction(
                      amazonOrderId || orderId,
                      orderId,
                    );
                    if (!r.success)
                      alert("Sync failed: " + (r.error || r.message));
                    else router.refresh();
                  })
                }
                disabled={isPending}
                className="font-mono text-[10px] sm:text-[11px] uppercase tracking-wider px-3 py-1.5 bg-surface border border-border text-muted hover:text-accent hover:border-accent/40 rounded-xs transition-colors disabled:opacity-50"
              >
                ↻ Re-sync from Amazon
              </button>
            </div>
          )}
        </div>

        {/* ── Fulfillment Error Banner ── */}
        {fulfillmentError && (
          <div className="px-5 py-3 bg-rose-500/5 border-b border-rose-500/20 font-mono text-[10px] text-rose-400">
            ⚠ {fulfillmentError}
          </div>
        )}

        {/* ── Success Messages ── */}
        {(amzConfirmResult ||
          shiprocketResult?.success ||
          bookingResult?.success) && (
          <div className="px-5 py-3 bg-emerald-500/5 border-b border-emerald-500/20 font-mono text-[10px] text-emerald-400/90">
            ✅{" "}
            {amzConfirmResult ||
              shiprocketResult?.message ||
              "Shipment booked successfully!"}
          </div>
        )}

        {/* ── Error Messages ── */}
        {(amzConfirmError || shiprocketError || bookingError) && (
          <div className="px-5 py-3 bg-rose-500/5 border-b border-rose-500/20 font-mono text-[10px] text-rose-400">
            ⚠ {amzConfirmError || shiprocketError || bookingError}
          </div>
        )}

        {/* ── ALREADY SHIPPED: Show shipment info ── */}
        {(awbNumber || trackingNumber) && (
          <div className="px-5 py-4 border-b border-border bg-surface">
            <div className="flex flex-wrap justify-between items-center gap-3">
              <div>
                <p className="font-mono text-[8px] uppercase tracking-wider text-muted mb-1">
                  Shipment Booked
                </p>
                <p className="font-mono text-[14px] text-accent font-semibold">
                  {trackCode}
                </p>
                {amazonOrderStatus && (
                  <p className="font-mono text-[9px] text-muted mt-0.5">
                    Amazon: {amazonOrderStatus}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {shiprocketLabelUrl && (
                  <a
                    href={shiprocketLabelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[8px] uppercase tracking-wider px-3 py-1.5 bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 rounded-xs transition-colors"
                  >
                    ↓ Label PDF
                  </a>
                )}
                {/* Reset shipment (for Amazon orders only) */}
                {isAmazon && (
                  <button
                    onClick={() => {
                      if (
                        confirm(
                          "Cancel this Shiprocket shipment and request wallet refund?",
                        )
                      ) {
                        startTransition(async () => {
                          const res =
                            await resetAmazonOrderShipmentAction(orderId);
                          if (res.success) {
                            setAmzConfirmResult(
                              res.message || "Shipment reset.",
                            );
                            router.refresh();
                          } else
                            setAmzConfirmError(
                              res.error || "Failed to reset shipment.",
                            );
                        });
                      }
                    }}
                    disabled={isPending}
                    className="font-mono text-[8px] uppercase tracking-wider px-3 py-1.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 rounded-xs transition-colors disabled:opacity-50"
                  >
                    ↺ Cancel & Reset
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── AMAZON EASY SHIP: Time-slot picker ── */}
        {showEasyShip && !isShipped && (
          <div className="p-5 border-b border-border space-y-4">
            {/* Package Dims — editable */}
            <div>
              <div className="flex items-center gap-1 mb-2">
                <span className="font-mono text-[9px] uppercase tracking-widest text-muted">
                  📦 Package Specs
                </span>
                <InfoTip>
                  These dimensions are auto-calculated from your product
                  database. Edit them if the actual package is different.
                </InfoTip>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(["length", "width", "height", "weight"] as const).map(
                  (field) => (
                    <div key={field}>
                      <label className="font-mono text-[8px] text-muted/70 uppercase block mb-1">
                        {field} {field === "weight" ? "(kg)" : "(cm)"}
                      </label>
                      <input
                        type="number"
                        min={field === "weight" ? 0.1 : 1}
                        step={field === "weight" ? 0.1 : 1}
                        value={dims[field]}
                        onChange={(e) =>
                          setDims((d) => ({
                            ...d,
                            [field]: parseFloat(e.target.value) || 0,
                          }))
                        }
                        className="w-full bg-background border border-border text-primary font-mono text-[12px] px-2 py-1.5 focus:outline-none focus:border-accent rounded-xs"
                      />
                    </div>
                  ),
                )}
              </div>
            </div>

            {/* Time Slots */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-muted">
                    📅 Pickup Slot
                  </span>
                  <InfoTip>
                    Amazon ATS agent will arrive at your warehouse during the
                    selected window.
                  </InfoTip>
                </div>
                <button
                  onClick={fetchTimeSlots}
                  disabled={isFetchingSlots}
                  className="font-mono text-[8px] uppercase tracking-wider px-2 py-1 border border-border text-muted hover:text-accent hover:border-accent/50 rounded-xs transition-colors disabled:opacity-50"
                >
                  {isFetchingSlots ? "Loading…" : "↻ Refresh Slots"}
                </button>
              </div>
              {isFetchingSlots ? (
                <div className="font-mono text-[10px] text-muted py-3">
                  Fetching available pickup slots from Amazon ATS…
                </div>
              ) : timeSlots.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot.slotId}
                      onClick={() => setSelectedSlot(slot)}
                      className={`text-left px-3 py-2.5 border rounded-xs font-mono text-[10px] transition-all ${
                        selectedSlot?.slotId === slot.slotId
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-border text-muted hover:border-accent/40 hover:text-secondary"
                      }`}
                    >
                      {formatSlot(slot)}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="font-mono text-[10px] text-muted py-3">
                  No slots loaded. Click "Refresh Slots".
                </div>
              )}
            </div>

            {/* Book Button */}
            <button
              onClick={handleBookEasyShip}
              disabled={
                isBooking || !selectedSlot || !!awbNumber || !!trackingNumber
              }
              className="w-full font-mono text-[10px] uppercase tracking-wider py-3 bg-accent text-[#0a0a0b] hover:bg-[#d4af37] rounded-xs transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isBooking
                ? "Booking Amazon Pickup…"
                : awbNumber || trackingNumber
                  ? "✓ Pickup Already Booked"
                  : "📦 Book Amazon ATS Pickup"}
            </button>
          </div>
        )}

        {/* ── AMAZON SELF-SHIP: Shiprocket + SP-API AWB ── */}
        {isSelfShip && showSelfShip && (
          <div className="p-5 border-b border-border space-y-4">
            {/* Option A: 1-Click Shiprocket */}
            <div className="p-4 bg-surface border border-accent/25 rounded-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-mono text-[10px] uppercase tracking-wider text-accent font-bold m-0 flex items-center gap-1.5">
                    <span>⚡</span> Option A: 1-Click Shiprocket &amp; Amazon
                    SP-API Sync
                  </h4>
                  <InfoTip>
                    Creates shipment on Shiprocket, assigns courier AWB, and
                    automatically pushes Tracking ID to Amazon SP-API.
                  </InfoTip>
                </div>
                <span className="font-mono text-[9px] text-accent bg-accent/10 px-2 py-0.5 border border-accent/20 rounded-xs">
                  📦 {dims.length}×{dims.width}×{dims.height}cm · {dims.weight}
                  kg
                </span>
              </div>
              <p className="font-sans text-[11px] text-muted m-0">
                Book shipment on Shiprocket, assign courier AWB, and
                automatically push Tracking ID back to Amazon SP-API.
              </p>
              <button
                type="button"
                onClick={() => {
                  if (awbNumber || trackingNumber) {
                    startTransition(async () => {
                      const result = await retryLogisticsSync(orderId);
                      if (result.success) {
                        const awbToUse =
                          result.trackingNumber ||
                          result.awbNumber ||
                          trackingNumber ||
                          awbNumber;
                        if (awbToUse)
                          await handleConfirmAmazonShipment(
                            awbToUse,
                            result.courierName || manualCarrier,
                          );
                      } else
                        setAmzConfirmError(
                          "Shiprocket Error: " + (result.error || "Failed"),
                        );
                    });
                  } else {
                    setShowPreviewModal(true);
                  }
                }}
                disabled={
                  isPending || isConfirmingAmzShipment || isBookingPickup
                }
                className="w-full font-mono text-[10px] uppercase tracking-[0.15em] py-3.5 bg-accent text-[#0a0a0b] hover:bg-[#d4af37] font-bold rounded-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending || isConfirmingAmzShipment || isBookingPickup
                  ? "Processing & Syncing…"
                  : fulfillmentError
                    ? "↻ Retry Fulfillment & Amazon Sync"
                    : awbNumber || trackingNumber
                      ? `⚡ Re-sync Amazon SP-API (${trackCode})`
                      : "🚀 Review Details & Book Shipment"}
              </button>
            </div>

            {/* Option B: Manual AWB — collapsed by default */}
            <div className="border border-border rounded-xs overflow-hidden">
              <button
                onClick={() => setShowOptionB((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/[0.02] transition-colors"
              >
                <span className="font-mono text-[9px] uppercase tracking-wider text-accent/70 font-bold">
                  Option B: Manual AWB Entry
                </span>
                <span className="font-mono text-[8px] text-muted">
                  {showOptionB ? "▲ Collapse" : "▼ Expand"}
                </span>
              </button>
              {showOptionB && (
                <div className="px-4 pb-4 space-y-3 border-t border-border bg-background/30">
                  <p className="font-sans text-[11px] text-muted pt-3">
                    Use only if already booked externally — manually pushes AWB
                    to Amazon SP-API.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="font-mono text-[8px] uppercase tracking-wider text-muted block mb-1">
                        Carrier Name
                      </label>
                      <input
                        type="text"
                        value={manualCarrier}
                        onChange={(e) => setManualCarrier(e.target.value)}
                        placeholder="e.g. Delhivery, BlueDart, DTDC"
                        className="w-full bg-background border border-border text-primary font-mono text-[12px] px-2.5 py-2 focus:outline-none focus:border-accent rounded-xs"
                      />
                    </div>
                    <div>
                      <label className="font-mono text-[8px] uppercase tracking-wider text-muted block mb-1">
                        AWB / Tracking Number
                      </label>
                      <input
                        type="text"
                        value={manualAwb}
                        onChange={(e) => setManualAwb(e.target.value)}
                        placeholder="Enter AWB number"
                        className="w-full bg-background border border-border text-primary font-mono text-[12px] px-2.5 py-2 focus:outline-none focus:border-accent rounded-xs"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => handleConfirmAmazonShipment()}
                    disabled={isConfirmingAmzShipment || !manualAwb.trim()}
                    className="w-full font-mono text-[9px] uppercase tracking-wider py-2.5 bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 rounded-xs transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isConfirmingAmzShipment
                      ? "Transmitting to Amazon…"
                      : "Confirm Shipment on Amazon (SP-API)"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── D2C / B2B Shiprocket ── */}
        {!isAmazon && (
          <div className="p-5 border-b border-border space-y-4">
            {/* Package dims */}
            <div>
              <div className="flex items-center gap-1 mb-2">
                <span className="font-mono text-[9px] uppercase tracking-widest text-muted">
                  📦 Package Specs
                </span>
                <InfoTip>
                  Auto-calculated from product dimensions. Edit before booking
                  if different.
                </InfoTip>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(["length", "width", "height", "weight"] as const).map(
                  (field) => (
                    <div key={field}>
                      <label className="font-mono text-[8px] text-muted/70 uppercase block mb-1">
                        {field} {field === "weight" ? "(kg)" : "(cm)"}
                      </label>
                      <input
                        type="number"
                        min={field === "weight" ? 0.1 : 1}
                        step={field === "weight" ? 0.1 : 1}
                        value={dims[field]}
                        onChange={(e) =>
                          setDims((d) => ({
                            ...d,
                            [field]: parseFloat(e.target.value) || 0,
                          }))
                        }
                        className="w-full bg-background border border-border text-primary font-mono text-[12px] px-2 py-1.5 focus:outline-none focus:border-accent rounded-xs"
                      />
                    </div>
                  ),
                )}
              </div>
            </div>

            {/* Pickup date */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-mono text-[8px] uppercase tracking-wider text-muted block mb-1">
                  Pickup Date
                </label>
                <input
                  type="date"
                  value={pickupDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setPickupDate(e.target.value)}
                  className="w-full bg-background border border-border text-primary font-mono text-[12px] px-2.5 py-2 focus:outline-none focus:border-accent rounded-xs"
                />
              </div>
              <div>
                <label className="font-mono text-[8px] uppercase tracking-wider text-muted block mb-1">
                  Boxes
                </label>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => setBoxCount((b) => Math.max(1, b - 1))}
                    className="w-7 h-7 border border-border rounded-xs font-mono text-base text-muted hover:text-primary"
                  >
                    −
                  </button>
                  <span className="font-mono text-[14px] text-primary font-bold w-6 text-center">
                    {boxCount}
                  </span>
                  <button
                    onClick={() => setBoxCount((b) => b + 1)}
                    className="w-7 h-7 border border-border rounded-xs font-mono text-base text-muted hover:text-primary"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Freight estimate */}
            {freightEstimate && (
              <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xs flex justify-between items-center">
                <div>
                  <p className="font-mono text-[8px] text-muted uppercase">
                    Courier
                  </p>
                  <p className="font-mono text-[11px] text-primary font-semibold">
                    {freightEstimate.courierName}
                  </p>
                </div>
                <div className="text-center">
                  <p className="font-mono text-[8px] text-muted uppercase">
                    ETD
                  </p>
                  <p className="font-mono text-[11px] text-accent">
                    {freightEstimate.etd}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-[8px] text-muted uppercase">
                    Shipping Cost
                  </p>
                  <p className="font-mono text-[16px] text-emerald-400 font-bold">
                    ₹{freightEstimate.rate}
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => handleEstimateFreight(dims)}
                className="font-mono text-[9px] uppercase tracking-wider px-4 py-2.5 bg-background border border-border text-muted hover:text-accent hover:border-accent/40 rounded-xs transition-colors"
              >
                💰 Estimate Cost
              </button>
              <button
                onClick={() => handleBookShiprocket(dims, pickupDate, boxCount)}
                disabled={isBookingPickup || isPending}
                className="flex-1 font-mono text-[10px] uppercase tracking-wider py-2.5 bg-accent text-[#0a0a0b] hover:bg-[#d4af37] rounded-xs transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isBookingPickup
                  ? "Booking Pickup…"
                  : awbNumber
                    ? "↻ Re-sync Label"
                    : "🚀 Book Shiprocket Pickup"}
              </button>
            </div>

            {shiprocketError && (
              <p className="font-mono text-[10px] text-red-400">
                ⚠ {shiprocketError}
              </p>
            )}
          </div>
        )}

        {/* ── ORDER STATUS CONTROLS ── */}
        <div className="px-5 py-4 border-b border-border">
          <p className="font-mono text-[8px] uppercase tracking-widest text-muted mb-3">
            Update Order Status
          </p>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((status) => (
              <button
                key={status}
                onClick={() => handleStatusUpdate(status)}
                disabled={isPending || status === currentStatus}
                className={`font-mono text-[8px] uppercase tracking-wider px-3 py-1.5 border rounded-xs transition-all disabled:cursor-not-allowed ${
                  status === currentStatus
                    ? `${STATUS_COLORS[status] || "border-accent text-accent"} bg-current/5 opacity-100 cursor-default`
                    : status === "CANCELLED"
                      ? "border-red-500/30 text-red-400/60 hover:border-red-500 hover:text-red-400 hover:bg-red-500/10"
                      : "border-border text-muted/60 hover:border-accent/60 hover:text-accent hover:bg-accent/5"
                } disabled:opacity-40`}
              >
                {status === currentStatus ? "✓ " : ""}
                {status.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* ── TRACKING INPUT (shown when SHIPPED clicked) ── */}
        {showTrackingInput && (
          <div className="px-5 py-4 border-b border-border space-y-3 bg-background/30">
            <p className="font-mono text-[9px] uppercase tracking-widest text-accent">
              Add Tracking (marks order as Shipped)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-mono text-[8px] uppercase tracking-wider text-muted block mb-1">
                  Tracking Number
                </label>
                <input
                  value={trackingInput}
                  onChange={(e) => setTrackingInput(e.target.value)}
                  placeholder="e.g. 14786594834"
                  className="w-full bg-background border border-border text-primary font-mono text-[12px] px-3 py-2 focus:outline-none focus:border-accent rounded-xs"
                />
              </div>
              <div>
                <label className="font-mono text-[8px] uppercase tracking-wider text-muted block mb-1">
                  AWB Number
                </label>
                <input
                  value={awbInput}
                  onChange={(e) => setAwbInput(e.target.value)}
                  placeholder="e.g. DHLE1234567"
                  className="w-full bg-background border border-border text-primary font-mono text-[12px] px-3 py-2 focus:outline-none focus:border-accent rounded-xs"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowTrackingInput(false)}
                className="font-mono text-[9px] uppercase tracking-wider px-4 py-2 border border-border text-muted hover:text-primary rounded-xs transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleTrackingSubmit}
                disabled={isPending || !trackingInput}
                className="font-mono text-[9px] uppercase tracking-wider px-6 py-2 bg-accent text-obsidian hover:bg-[#d8b46e] rounded-xs transition-colors font-bold disabled:opacity-50"
              >
                {isPending ? "Saving…" : "Mark as Shipped →"}
              </button>
            </div>
          </div>
        )}

        {/* ── DOCUMENTS PANEL ── */}
        <div id="compliance-documents" className="px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted m-0 flex items-center gap-2">
              <FileText className="w-4 h-4 text-accent" />
              <span>Compliance &amp; Shipping Documents</span>
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadAllDocs}
                disabled={isDownloadingAll}
                className="font-mono text-[10px] uppercase tracking-wider px-3 py-1 bg-accent/10 border border-accent/40 text-accent hover:bg-accent/20 rounded-xs transition-colors disabled:opacity-50 flex items-center gap-1.5 font-bold cursor-pointer"
                title="Download all available compliance & logistics PDFs in 1 click"
              >
                <Download
                  className={`w-3.5 h-3.5 ${isDownloadingAll ? "animate-bounce" : ""}`}
                />
                <span>
                  {isDownloadingAll
                    ? "Downloading All…"
                    : "Download All Documents"}
                </span>
              </button>

              <button
                onClick={fetchDocUrls}
                disabled={docLoading}
                className="font-mono text-[10px] uppercase tracking-wider px-2.5 py-1 border border-border text-muted hover:text-accent hover:border-accent/40 rounded-xs transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                <RefreshCw
                  className={`w-3 h-3 ${docLoading ? "animate-spin" : ""}`}
                />
                <span>{docLoading ? "Loading…" : "Refresh PDFs"}</span>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <DocCard
              label="Shipping Label"
              url={shiprocketLabelUrl}
              icon={FileText}
            />
            <DocCard label="Pickup Manifest" url={manifestUrl} icon={Package} />
            <DocCard
              label="GST Tax Invoice"
              url={`/api/orders/${orderId}/invoice`}
              icon={FileText}
            />
            <DocCard
              label="Shiprocket Invoice"
              url={shiprocketInvoiceUrl}
              icon={FileText}
            />
          </div>
        </div>
      </div>

      {/* ── LOGISTICS PREVIEW MODAL (Shiprocket) ── */}
      <LogisticsPreviewModal
        open={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        onConfirm={handleBookShiprocket}
        initialDims={dims}
        initialPickupDate={pickupDate}
        initialBoxCount={boxCount}
        shippingAddress={shippingAddress}
        shippingCity={shippingCity}
        shippingState={shippingState}
        shippingPincode={shippingPincode}
        isLoading={isBookingPickup}
        freightEstimate={freightEstimate}
        onEstimateFreight={handleEstimateFreight}
      />

      {/* ── LIVE TRACKING TIMELINE ── */}
      {trackCode && (
        <div id="live-tracking">
          <TrackingTimeline
            awbNumber={awbNumber}
            trackingNumber={trackingNumber}
          />
        </div>
      )}
    </div>
  );
}
