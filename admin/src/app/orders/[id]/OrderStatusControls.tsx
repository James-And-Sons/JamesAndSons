"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  updateOrderStatus,
  updateTrackingNumber,
  syncSingleAmazonOrderAction,
  resetAmazonOrderShipmentAction,
} from "../actions";
import {
  syncRazorpayPayment,
  trackShiprocketShipment,
  retryLogisticsSync,
  bookShiprocketPickupAction,
  getShiprocketLabelAction,
} from "./logistics-actions";

const STATUS_OPTIONS = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

// ─── Types ───────────────────────────────────────────────────────────────────

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

// ─── Main Component ──────────────────────────────────────────────────────────

export default function OrderStatusControls({
  orderId,
  currentStatus,
  razorpayOrderId,
  awbNumber,
  trackingNumber,
  fulfillmentError,
  channel,
  amazonOrderId,
  isAmazon: isAmazonProp,
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
  isAmazon?: boolean;
  orderItems?: OrderItem[];
  shippingAddress?: string | null;
  shippingCity?: string | null;
  shippingState?: string | null;
  shippingPincode?: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [tracking, setTracking] = useState("");
  const [awb, setAwb] = useState(awbNumber || "");
  const [showTracking, setShowTracking] = useState(false);
  const [trackingData, setTrackingData] = useState<any>(null);

  // Amazon Easy Ship state
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [isFetchingSlots, setIsFetchingSlots] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingResult, setBookingResult] = useState<any>(null);
  const [bookingError, setBookingError] = useState<string>("");

  // Shiprocket Fulfillment state
  const [isBookingPickup, setIsBookingPickup] = useState(false);
  const [shiprocketResult, setShiprocketResult] = useState<any>(null);
  const [shiprocketError, setShiprocketError] = useState("");
  const [shiprocketLabelUrl, setShiprocketLabelUrl] = useState("");
  const [isFetchingLabel, setIsFetchingLabel] = useState(false);

  // Package dimensions state
  const [pkgLength, setPkgLength] = useState(20);
  const [pkgWidth, setPkgWidth] = useState(20);
  const [pkgHeight, setPkgHeight] = useState(40);
  const [pkgWeight, setPkgWeight] = useState(1.0);

  // Amazon Self-Ship (MFN) Confirmation state
  const [manualCarrier, setManualCarrier] = useState("Shiprocket");
  const [manualAwb, setManualAwb] = useState(awbNumber || trackingNumber || "");
  const [isConfirmingAmzShipment, setIsConfirmingAmzShipment] = useState(false);
  const [amzConfirmResult, setAmzConfirmResult] = useState<string | null>(null);
  const [amzConfirmError, setAmzConfirmError] = useState<string | null>(null);
  const [showLogisticsPreview, setShowLogisticsPreview] = useState(false);

  const handleConfirmAmazonShipment = async (
    overrideAwb?: string,
    overrideCarrier?: string,
  ) => {
    const awbToSubmit = (overrideAwb || manualAwb).trim();
    const carrierToSubmit = overrideCarrier || manualCarrier || "Shiprocket";
    if (!awbToSubmit) {
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
            carrierCode: carrierToSubmit,
            carrierName: carrierToSubmit,
            trackingNumber: awbToSubmit,
          }),
        },
      );

      const data = await res.json();
      if (data.success || data.warning) {
        setAmzConfirmResult(
          data.message || `Confirmed on Amazon with AWB ${awbToSubmit}!`,
        );
        router.refresh();
      } else {
        setAmzConfirmError(
          data.error || data.message || "Failed to confirm shipment on Amazon.",
        );
      }
    } catch (err: any) {
      setAmzConfirmError(
        err.message || "Network error confirming Amazon shipment.",
      );
    } finally {
      setIsConfirmingAmzShipment(false);
    }
  };

  const isAmazon = Boolean(
    isAmazonProp || channel === "AMAZON" || amazonOrderId,
  );

  // Auto-calculate dimensions from order items on load
  useEffect(() => {
    if (!isAmazon || !orderItems || orderItems.length === 0) return;

    const calcWeight = orderItems.reduce(
      (sum, item) => sum + item.quantity * (item.product.weight || 0.5),
      0,
    );
    const calcLength = Math.max(
      ...orderItems.map((i) => i.product.length || 20),
      20,
    );
    const calcWidth = Math.max(
      ...orderItems.map((i) => i.product.breadth || 20),
      20,
    );
    const calcHeight = orderItems.reduce(
      (sum, item) => sum + item.quantity * (item.product.height || 10),
      0,
    );

    setPkgLength(Math.round(calcLength));
    setPkgWidth(Math.round(calcWidth));
    setPkgHeight(Math.round(calcHeight));
    setPkgWeight(Math.round(calcWeight * 100) / 100);
  }, [isAmazon, orderItems]);

  // Fetch available time slots on mount for Amazon orders
  useEffect(() => {
    if (!isAmazon) return;
    fetchTimeSlots();
  }, [isAmazon, orderId]);

  const fetchTimeSlots = async () => {
    setIsFetchingSlots(true);
    setBookingError("");
    try {
      const res = await fetch(`/api/orders/${orderId}/amazon-easy-ship`);
      const data = await res.json();
      if (data.timeSlots) {
        setTimeSlots(data.timeSlots);
        if (data.timeSlots[0]) setSelectedSlot(data.timeSlots[0]);
        // Sync auto-calculated dims from API
        if (data.packageDimensions) {
          setPkgLength(data.packageDimensions.length || pkgLength);
          setPkgWidth(data.packageDimensions.width || pkgWidth);
          setPkgHeight(data.packageDimensions.height || pkgHeight);
        }
        if (data.packageWeight) setPkgWeight(data.packageWeight);
      }
    } catch (err: any) {
      console.error("[FetchTimeSlots]", err);
    } finally {
      setIsFetchingSlots(false);
    }
  };

  const handleBookAmazonPickup = async () => {
    if (!selectedSlot) {
      setBookingError("Please select a pickup time slot.");
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
          packageLength: pkgLength,
          packageWidth: pkgWidth,
          packageHeight: pkgHeight,
          packageWeight: pkgWeight,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setBookingResult(data);
        // Open label in new tab immediately (synchronous, no popup blocker)
        window.open(`/api/orders/${orderId}/label`, "_blank");
      } else {
        setBookingError(data.error || "Booking failed. Please try again.");
      }
    } catch (err: any) {
      setBookingError(err.message || "Network error. Please try again.");
    } finally {
      setIsBooking(false);
    }
  };

  const handleStatusUpdate = (status: string) => {
    if (status === "SHIPPED") {
      setShowTracking(true);
      return;
    }
    startTransition(async () => {
      const result = await updateOrderStatus(orderId, status);
      if (!result.success) alert("Failed to update status: " + result.error);
    });
  };

  const handleTrackingSubmit = () => {
    startTransition(async () => {
      const result = await updateTrackingNumber(orderId, tracking, awb);
      if (!result.success) alert("Failed to update tracking: " + result.error);
      else setShowTracking(false);
    });
  };

  const handleSyncPayment = () => {
    if (!razorpayOrderId) return;
    startTransition(async () => {
      const result = await syncRazorpayPayment(orderId, razorpayOrderId);
      if (!result.success) alert("Sync failed: " + result.error);
      else alert("Payment status synced successfully!");
    });
  };

  const handleTrackRealtime = () => {
    const trackCode = trackingNumber || awbNumber;
    if (!trackCode) return;
    startTransition(async () => {
      const result = await trackShiprocketShipment(trackCode);
      if (!result.success) alert("Tracking failed: " + result.error);
      else setTrackingData(result.data);
    });
  };

  const handleBookShiprocketPickup = async () => {
    setIsBookingPickup(true);
    setShiprocketError("");
    try {
      const result = await bookShiprocketPickupAction(orderId);
      if (result.success) {
        setShiprocketResult(result);
        if (result.labelUrl) {
          setShiprocketLabelUrl(result.labelUrl);
          window.open(result.labelUrl, "_blank");
        }
      } else {
        setShiprocketError(result.error || "Pickup booking failed.");
      }
    } catch (err: any) {
      setShiprocketError(err.message || "Network error.");
    } finally {
      setIsBookingPickup(false);
    }
  };

  const handleFetchShiprocketLabel = async () => {
    setIsFetchingLabel(true);
    setShiprocketError("");
    try {
      const result = await getShiprocketLabelAction(orderId);
      if (result.success && result.labelUrl) {
        setShiprocketLabelUrl(result.labelUrl);
        window.open(result.labelUrl, "_blank");
      } else {
        setShiprocketError(result.error || "No label URL returned.");
      }
    } catch (err: any) {
      setShiprocketError(err.message || "Network error.");
    } finally {
      setIsFetchingLabel(false);
    }
  };

  // Format slot label for display
  const formatSlotLabel = (slot: TimeSlot): string => {
    if (slot.label) return slot.label;
    const start = new Date(slot.startTime);
    const end = new Date(slot.endTime);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const dayAfter = new Date(today);
    dayAfter.setDate(today.getDate() + 2);

    const dateLabel =
      start.toDateString() === today.toDateString()
        ? "Today"
        : start.toDateString() === tomorrow.toDateString()
          ? "Tomorrow"
          : start.toDateString() === dayAfter.toDateString()
            ? "Day After Tomorrow"
            : start.toLocaleDateString("en-IN", {
                weekday: "short",
                month: "short",
                day: "numeric",
              });

    const startTime = start.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    const endTime = end.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    return `${dateLabel} · ${startTime} – ${endTime}`;
  };

  return (
    <div
      style={{
        background: "var(--surface, #111)",
        border: "1px solid rgba(196,160,90,0.15)",
        borderRadius: "2px",
      }}
    >
      {/* ── Header ───────────────────────────────────────────────── */}
      <div
        style={{
          padding: "20px 24px",
          borderBottom: "1px solid rgba(196,160,90,0.1)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <p
            style={{
              fontFamily: "monospace",
              fontSize: "9px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: isAmazon ? "#c4a05a" : "#6b8dd6",
              margin: 0,
            }}
          >
            {isAmazon
              ? "▲ Amazon Easy Ship · Fulfillment Studio"
              : "▲ Shiprocket · Fulfillment Studio"}
          </p>
          <p
            style={{
              fontFamily: "monospace",
              fontSize: "8px",
              color: isAmazon
                ? "rgba(196,160,90,0.5)"
                : "rgba(107,141,214,0.5)",
              marginTop: "4px",
              margin: "4px 0 0",
              letterSpacing: "0.1em",
            }}
          >
            {isAmazon
              ? "Shiprocket bypassed · Amazon ATS handles delivery end-to-end"
              : "Auto-synced with Shiprocket on payment · Book pickup & download label without leaving admin"}
          </p>
        </div>

        {/* Razorpay sync for unpaid orders */}
        {!isAmazon && currentStatus === "PENDING" && razorpayOrderId && (
          <button
            onClick={handleSyncPayment}
            disabled={isPending}
            className="font-mono text-[8px] uppercase tracking-widest px-3 py-1 bg-[#2563eb] text-white hover:bg-[#1d4ed8] transition-colors disabled:opacity-50"
          >
            Sync Razorpay Payment
          </button>
        )}
      </div>

      {/* ── Shiprocket Fulfillment Studio (non-Amazon) ───────────── */}
      {!isAmazon && (
        <div style={{ padding: "24px" }}>
          {/* ── Sync error / retry section ── */}
          {(currentStatus === "PAID" || currentStatus === "PROCESSING") &&
            (!awbNumber || fulfillmentError) && (
              <div
                style={{
                  background: fulfillmentError
                    ? "rgba(248,113,113,0.06)"
                    : "rgba(107,141,214,0.06)",
                  border: `1px solid ${fulfillmentError ? "rgba(248,113,113,0.3)" : "rgba(107,141,214,0.2)"}`,
                  borderRadius: "2px",
                  padding: "16px 20px",
                  marginBottom: "20px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "16px",
                }}
              >
                <div>
                  <p
                    style={{
                      fontFamily: "monospace",
                      fontSize: "10px",
                      color: fulfillmentError ? "#f87171" : "#6b8dd6",
                      fontWeight: "bold",
                      letterSpacing: "0.1em",
                      margin: 0,
                    }}
                  >
                    {fulfillmentError
                      ? "⚠ Shiprocket Sync Error"
                      : "⏳ Awaiting Shiprocket Sync"}
                  </p>
                  {fulfillmentError && (
                    <p
                      style={{
                        fontFamily: "monospace",
                        fontSize: "10px",
                        color: "rgba(248,113,113,0.7)",
                        marginTop: "6px",
                        margin: "6px 0 0",
                        lineHeight: "1.5",
                      }}
                    >
                      {fulfillmentError}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => {
                    startTransition(async () => {
                      const result = await retryLogisticsSync(orderId);
                      if (!result.success)
                        setShiprocketError(
                          "Sync Failed: " + (result.error || "Unknown error"),
                        );
                    });
                  }}
                  disabled={isPending}
                  style={{
                    flexShrink: 0,
                    fontFamily: "monospace",
                    fontSize: "9px",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    padding: "8px 14px",
                    background: "rgba(107,141,214,0.15)",
                    border: "1px solid rgba(107,141,214,0.4)",
                    color: "#6b8dd6",
                    borderRadius: "2px",
                    cursor: isPending ? "not-allowed" : "pointer",
                    opacity: isPending ? 0.5 : 1,
                    whiteSpace: "nowrap",
                  }}
                >
                  {isPending ? "Syncing…" : "↻ Retry Shiprocket Sync"}
                </button>
              </div>
            )}

          {/* ── Synced — show AWB + actions ── */}
          {awbNumber && !isNaN(parseInt(awbNumber)) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
              {/* Shipment Info */}
              <div
                style={{
                  background: "rgba(107,141,214,0.04)",
                  border: "1px solid rgba(107,141,214,0.15)",
                  borderRadius: "2px",
                  padding: "16px",
                }}
              >
                <p
                  style={{
                    fontFamily: "monospace",
                    fontSize: "9px",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: "#6b8dd6",
                    margin: "0 0 14px",
                    borderBottom: "1px solid rgba(107,141,214,0.1)",
                    paddingBottom: "10px",
                  }}
                >
                  📦 Shiprocket Shipment
                </p>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontFamily: "monospace",
                        fontSize: "8px",
                        color: "var(--muted, #666)",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        margin: "0 0 2px",
                      }}
                    >
                      Shiprocket Shipment ID
                    </p>
                    <p
                      style={{
                        fontFamily: "monospace",
                        fontSize: "13px",
                        color: "#6b8dd6",
                        fontWeight: "600",
                        margin: 0,
                      }}
                    >
                      #{awbNumber}
                    </p>
                  </div>
                  {trackingNumber && (
                    <div>
                      <p
                        style={{
                          fontFamily: "monospace",
                          fontSize: "8px",
                          color: "var(--muted, #666)",
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                          margin: "0 0 2px",
                        }}
                      >
                        Courier AWB / Tracking
                      </p>
                      <p
                        style={{
                          fontFamily: "monospace",
                          fontSize: "12px",
                          color: "var(--primary, #fff)",
                          margin: 0,
                        }}
                      >
                        {trackingNumber}
                      </p>
                    </div>
                  )}
                  <a
                    href={`https://shiprocket.co/tracking/${trackingNumber || awbNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontFamily: "monospace",
                      fontSize: "9px",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "#6b8dd6",
                      textDecoration: "none",
                      marginTop: "4px",
                    }}
                  >
                    Track on Shiprocket ↗
                  </a>
                </div>
              </div>

              {/* Actions */}
              <div
                style={{
                  background: "rgba(107,141,214,0.04)",
                  border: "1px solid rgba(107,141,214,0.15)",
                  borderRadius: "2px",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <p
                  style={{
                    fontFamily: "monospace",
                    fontSize: "9px",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: "#6b8dd6",
                    margin: "0 0 4px",
                    borderBottom: "1px solid rgba(107,141,214,0.1)",
                    paddingBottom: "10px",
                  }}
                >
                  🚚 Actions & Compliance Documents
                </p>

                {/* Download GST Tax Invoice — Always available for valid orders */}
                <a
                  href={`${process.env.NEXT_PUBLIC_STOREFRONT_URL || "https://jamesandsons.in"}/api/orders/${orderId}/invoice`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    width: "100%",
                    padding: "9px 14px",
                    background: "rgba(107,141,214,0.1)",
                    border: "1px solid rgba(107,141,214,0.35)",
                    borderRadius: "2px",
                    fontFamily: "monospace",
                    fontSize: "9px",
                    fontWeight: "600",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "#6b8dd6",
                    textDecoration: "none",
                    textAlign: "center",
                    display: "block",
                    boxSizing: "border-box",
                  }}
                >
                  📄 Download Tax Invoice (PDF) ↗
                </a>

                {/* Allow pickup booking for any active pre-shipping order (PAID, PROCESSING, PENDING) */}
                {status !== "CANCELLED" &&
                  status !== "SHIPPED" &&
                  status !== "DELIVERED" &&
                  status !== "RETURNED" && (
                    <button
                      onClick={handleBookShiprocketPickup}
                      disabled={isBookingPickup}
                      style={{
                        width: "100%",
                        padding: "11px 14px",
                        background: isBookingPickup
                          ? "rgba(107,141,214,0.2)"
                          : "linear-gradient(135deg, #4c6ef5 0%, #7a9ff5 50%, #4c6ef5 100%)",
                        border: "none",
                        borderRadius: "2px",
                        fontFamily: "monospace",
                        fontSize: "10px",
                        fontWeight: "700",
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        color: isBookingPickup ? "#6b8dd6" : "#fff",
                        cursor: isBookingPickup ? "not-allowed" : "pointer",
                        transition: "all 0.2s",
                        boxShadow: isBookingPickup
                          ? "none"
                          : "0 2px 12px rgba(107,141,214,0.3)",
                      }}
                    >
                      {isBookingPickup
                        ? "Booking Pickup…"
                        : "Book Pickup & Print Label ↗"}
                    </button>
                  )}

                {/* Download Label if pickup already booked */}
                {awbNumber && status !== "CANCELLED" && (
                  <button
                    onClick={handleFetchShiprocketLabel}
                    disabled={isFetchingLabel}
                    style={{
                      width: "100%",
                      padding: "9px 14px",
                      background: "none",
                      border: "1px solid rgba(107,141,214,0.35)",
                      borderRadius: "2px",
                      fontFamily: "monospace",
                      fontSize: "9px",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "#6b8dd6",
                      cursor: isFetchingLabel ? "not-allowed" : "pointer",
                      opacity: isFetchingLabel ? 0.5 : 1,
                      transition: "all 0.15s",
                    }}
                  >
                    {isFetchingLabel
                      ? "Fetching Label…"
                      : "🏷️ Download Shipping Label ↗"}
                  </button>
                )}

                {/* Track Real-time */}
                {awbNumber && status !== "CANCELLED" && (
                  <button
                    onClick={handleTrackRealtime}
                    disabled={isPending}
                    style={{
                      width: "100%",
                      padding: "9px 14px",
                      background: "none",
                      border: "1px solid rgba(107,141,214,0.2)",
                      borderRadius: "2px",
                      fontFamily: "monospace",
                      fontSize: "9px",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "var(--muted, #666)",
                      cursor: isPending ? "not-allowed" : "pointer",
                      opacity: isPending ? 0.5 : 1,
                      transition: "all 0.15s",
                    }}
                  >
                    Track Real-time
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── Shiprocket error message ── */}
          {shiprocketError && (
            <div
              style={{
                background: "rgba(248,113,113,0.08)",
                border: "1px solid rgba(248,113,113,0.3)",
                borderRadius: "2px",
                padding: "12px 16px",
                marginBottom: "16px",
                fontFamily: "monospace",
                fontSize: "11px",
                color: "#f87171",
              }}
            >
              ⚠ {shiprocketError}
            </div>
          )}

          {/* ── Pickup booked success banner ── */}
          {shiprocketResult && (
            <div
              style={{
                background: "rgba(74,222,128,0.06)",
                border: "1px solid rgba(74,222,128,0.25)",
                borderRadius: "2px",
                padding: "14px 18px",
                marginBottom: "16px",
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
              }}
            >
              <span style={{ fontSize: "18px" }}>✅</span>
              <div>
                <p
                  style={{
                    fontFamily: "monospace",
                    fontSize: "10px",
                    color: "#4ade80",
                    fontWeight: "bold",
                    letterSpacing: "0.1em",
                    margin: 0,
                  }}
                >
                  SHIPROCKET PICKUP BOOKED
                </p>
                {shiprocketLabelUrl && (
                  <a
                    href={shiprocketLabelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-block",
                      fontFamily: "monospace",
                      fontSize: "9px",
                      color: "#4ade80",
                      textDecoration: "underline",
                      marginTop: "6px",
                    }}
                  >
                    Open Official Shiprocket Label PDF ↗
                  </a>
                )}
                {!shiprocketResult.labelUrl && (
                  <p
                    style={{
                      fontFamily: "monospace",
                      fontSize: "9px",
                      color: "rgba(74,222,128,0.6)",
                      marginTop: "4px",
                      margin: "4px 0 0",
                    }}
                  >
                    Label may take a few minutes to generate after pickup is
                    confirmed by Shiprocket.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Amazon Easy Ship Fulfillment Studio (Shown for active pre-shipping orders) ──────────────────── */}
      {isAmazon &&
        currentStatus !== "CANCELLED" &&
        currentStatus !== "SHIPPED" &&
        currentStatus !== "DELIVERED" &&
        currentStatus !== "RETURNED" && (
          <div style={{ padding: "24px" }}>
            {/* Success confirmation banner */}
            {bookingResult && (
              <div
                style={{
                  background: "rgba(74,222,128,0.06)",
                  border: "1px solid rgba(74,222,128,0.25)",
                  borderRadius: "2px",
                  padding: "16px 20px",
                  marginBottom: "20px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "14px",
                }}
              >
                <span style={{ fontSize: "20px" }}>✅</span>
                <div>
                  <p
                    style={{
                      fontFamily: "monospace",
                      fontSize: "11px",
                      color: "#4ade80",
                      fontWeight: "bold",
                      letterSpacing: "0.1em",
                      margin: 0,
                    }}
                  >
                    AMAZON ATS PICKUP BOOKED SUCCESSFULLY
                  </p>
                  <p
                    style={{
                      fontFamily: "monospace",
                      fontSize: "10px",
                      color: "rgba(74,222,128,0.7)",
                      marginTop: "4px",
                      margin: "4px 0 0",
                    }}
                  >
                    Package ID: {bookingResult.packageId} · Tracking:{" "}
                    {bookingResult.trackingNumber}
                  </p>
                  <p
                    style={{
                      fontFamily: "monospace",
                      fontSize: "10px",
                      color: "rgba(74,222,128,0.5)",
                      marginTop: "4px",
                      margin: "4px 0 0",
                    }}
                  >
                    Shipping label opened in a new tab for printing.
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
              {/* Package Calculator */}
              <div
                style={{
                  background: "rgba(196,160,90,0.04)",
                  border: "1px solid rgba(196,160,90,0.15)",
                  borderRadius: "2px",
                  padding: "16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: "1px solid rgba(196,160,90,0.1)",
                    paddingBottom: "10px",
                    marginBottom: "14px",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "monospace",
                      fontSize: "9px",
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      color: "#c4a05a",
                      margin: 0,
                    }}
                  >
                    📦 Package Specs
                  </p>
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: "8px",
                      color: "rgba(196,160,90,0.5)",
                      background: "rgba(196,160,90,0.08)",
                      padding: "2px 6px",
                      borderRadius: "2px",
                    }}
                  >
                    Auto-Calculated
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    {
                      label: "Length (cm)",
                      value: pkgLength,
                      setter: setPkgLength,
                    },
                    {
                      label: "Width (cm)",
                      value: pkgWidth,
                      setter: setPkgWidth,
                    },
                    {
                      label: "Height (cm)",
                      value: pkgHeight,
                      setter: setPkgHeight,
                    },
                    {
                      label: "Weight (kg)",
                      value: pkgWeight,
                      setter: setPkgWeight,
                      step: 0.1,
                      isGold: true,
                    },
                  ].map(({ label, value, setter, step, isGold }) => (
                    <div key={label}>
                      <label
                        style={{
                          display: "block",
                          fontFamily: "monospace",
                          fontSize: "8px",
                          letterSpacing: "0.12em",
                          textTransform: "uppercase",
                          color: "var(--muted, #666)",
                          marginBottom: "5px",
                        }}
                      >
                        {label}
                      </label>
                      <input
                        type="number"
                        value={value}
                        step={step || 1}
                        onChange={(e) =>
                          setter(parseFloat(e.target.value) || 0)
                        }
                        style={{
                          width: "100%",
                          boxSizing: "border-box",
                          background: "var(--background, #0a0a0a)",
                          border: `1px solid ${isGold ? "rgba(196,160,90,0.4)" : "var(--border, #222)"}`,
                          borderRadius: "2px",
                          padding: "7px 10px",
                          fontFamily: "monospace",
                          fontSize: "13px",
                          color: isGold ? "#c4a05a" : "var(--primary, #fff)",
                          fontWeight: isGold ? "700" : "400",
                          outline: "none",
                        }}
                      />
                    </div>
                  ))}
                </div>

                <p
                  style={{
                    fontFamily: "monospace",
                    fontSize: "9px",
                    color: "rgba(196,160,90,0.45)",
                    marginTop: "10px",
                    marginBottom: 0,
                    lineHeight: "1.5",
                  }}
                >
                  ↑ Computed from product catalogue dimensions × quantity.
                  Adjust if using a custom shipping box.
                </p>
              </div>

              {/* Time Slot Picker */}
              <div
                style={{
                  background: "rgba(196,160,90,0.04)",
                  border: "1px solid rgba(196,160,90,0.15)",
                  borderRadius: "2px",
                  padding: "16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: "1px solid rgba(196,160,90,0.1)",
                    paddingBottom: "10px",
                    marginBottom: "14px",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "monospace",
                      fontSize: "9px",
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      color: "#c4a05a",
                      margin: 0,
                    }}
                  >
                    🗓 Pickup Date &amp; Time Slot
                  </p>
                  {isFetchingSlots && (
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontSize: "8px",
                        color: "rgba(196,160,90,0.5)",
                      }}
                    >
                      Loading…
                    </span>
                  )}
                </div>

                {timeSlots.length > 0 ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                    {timeSlots.map((slot) => {
                      const isSelected = selectedSlot?.slotId === slot.slotId;
                      return (
                        <label
                          key={slot.slotId}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            padding: "10px 12px",
                            background: isSelected
                              ? "rgba(196,160,90,0.1)"
                              : "var(--background, #0a0a0a)",
                            border: `1px solid ${isSelected ? "rgba(196,160,90,0.5)" : "var(--border, #222)"}`,
                            borderRadius: "2px",
                            cursor: "pointer",
                            transition: "all 0.15s",
                          }}
                        >
                          <input
                            type="radio"
                            name="pickup-slot"
                            value={slot.slotId}
                            checked={isSelected}
                            onChange={() => setSelectedSlot(slot)}
                            style={{ accentColor: "#c4a05a" }}
                          />
                          <span
                            style={{
                              fontFamily: "monospace",
                              fontSize: "11px",
                              color: isSelected
                                ? "#c4a05a"
                                : "var(--secondary, #aaa)",
                              fontWeight: isSelected ? "600" : "400",
                            }}
                          >
                            {formatSlotLabel(slot)}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <div
                    style={{
                      padding: "20px",
                      textAlign: "center",
                      color: "var(--muted, #666)",
                      fontFamily: "monospace",
                      fontSize: "11px",
                    }}
                  >
                    {isFetchingSlots
                      ? "Fetching available slots..."
                      : "No slots available."}
                    {!isFetchingSlots && (
                      <button
                        onClick={fetchTimeSlots}
                        style={{
                          display: "block",
                          margin: "10px auto 0",
                          background: "none",
                          border: "1px solid rgba(196,160,90,0.3)",
                          color: "#c4a05a",
                          fontFamily: "monospace",
                          fontSize: "9px",
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          padding: "5px 12px",
                          cursor: "pointer",
                        }}
                      >
                        Refresh Slots
                      </button>
                    )}
                  </div>
                )}

                <p
                  style={{
                    fontFamily: "monospace",
                    fontSize: "9px",
                    color: "rgba(196,160,90,0.45)",
                    marginTop: "10px",
                    marginBottom: 0,
                    lineHeight: "1.5",
                  }}
                >
                  Pickup from: Aligarh Warehouse, Civil Lines, UP – 202001
                </p>
              </div>
            </div>

            {/* Error message */}
            {bookingError && (
              <div
                style={{
                  background: "rgba(248,113,113,0.08)",
                  border: "1px solid rgba(248,113,113,0.3)",
                  borderRadius: "2px",
                  padding: "12px 16px",
                  marginBottom: "16px",
                  fontFamily: "monospace",
                  fontSize: "11px",
                  color: "#f87171",
                }}
              >
                ⚠ {bookingError}
              </div>
            )}

            {/* PRIMARY ACTION BUTTON */}
            <button
              onClick={handleBookAmazonPickup}
              disabled={isBooking || !selectedSlot}
              style={{
                width: "100%",
                padding: "14px 24px",
                background: isBooking
                  ? "rgba(196,160,90,0.3)"
                  : "linear-gradient(135deg, #c4a05a 0%, #e8c87a 50%, #c4a05a 100%)",
                border: "none",
                borderRadius: "2px",
                fontFamily: "monospace",
                fontSize: "11px",
                fontWeight: "700",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: isBooking ? "#c4a05a" : "#0a0a0a",
                cursor: isBooking || !selectedSlot ? "not-allowed" : "pointer",
                opacity: !selectedSlot ? 0.6 : 1,
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                boxShadow: isBooking
                  ? "none"
                  : "0 2px 12px rgba(196,160,90,0.3)",
              }}
            >
              {isBooking ? (
                <>
                  <span
                    style={{
                      display: "inline-block",
                      width: "14px",
                      height: "14px",
                      border: "2px solid rgba(196,160,90,0.4)",
                      borderTopColor: "#c4a05a",
                      borderRadius: "50%",
                      animation: "spin 0.8s linear infinite",
                    }}
                  />
                  Booking ATS Pickup…
                </>
              ) : (
                <>
                  Book Amazon ATS Pickup &amp; Print Label{" "}
                  <span style={{ fontSize: "14px" }}>↗</span>
                </>
              )}
            </button>

            <p
              style={{
                fontFamily: "monospace",
                fontSize: "9px",
                color: "rgba(196,160,90,0.4)",
                textAlign: "center",
                marginTop: "10px",
                marginBottom: 0,
                letterSpacing: "0.08em",
              }}
            >
              Confirms ATS pickup for selected slot · Opens official Amazon Easy
              Ship Shipping Label &amp; Tax Invoice for printing
            </p>

            <style>{`
            @keyframes spin { to { transform: rotate(360deg); } }
          `}</style>

            {/* ── Amazon Self-Ship (MFN) & Shiprocket Fulfillment Studio ────────── */}
            <div
              style={{
                marginTop: "24px",
                paddingTop: "20px",
                borderTop: "1px dashed rgba(196,160,90,0.2)",
              }}
            >
              <div style={{ marginBottom: "14px" }}>
                <p
                  style={{
                    fontFamily: "monospace",
                    fontSize: "10px",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: "#6b8dd6",
                    margin: 0,
                  }}
                >
                  🚀 Amazon Self-Ship (MFN) &amp; Shiprocket Integration
                </p>
                <p
                  style={{
                    fontFamily: "monospace",
                    fontSize: "9px",
                    color: "var(--muted, #888)",
                    marginTop: "4px",
                  }}
                >
                  If this is a Self-Ship order, book via Shiprocket to
                  auto-transmit AWB tracking back to Amazon SP-API, or enter
                  tracking details manually.
                </p>
              </div>

              {/* Success / Warning banner */}
              {amzConfirmResult && (
                <div
                  style={{
                    background: "rgba(74,222,128,0.08)",
                    border: "1px solid rgba(74,222,128,0.3)",
                    borderRadius: "2px",
                    padding: "12px 16px",
                    marginBottom: "16px",
                    fontFamily: "monospace",
                    fontSize: "11px",
                    color: "#4ade80",
                  }}
                >
                  ✅ {amzConfirmResult}
                </div>
              )}

              {/* Error banner */}
              {amzConfirmError && (
                <div
                  style={{
                    background: "rgba(248,113,113,0.08)",
                    border: "1px solid rgba(248,113,113,0.3)",
                    borderRadius: "2px",
                    padding: "12px 16px",
                    marginBottom: "16px",
                    fontFamily: "monospace",
                    fontSize: "11px",
                    color: "#f87171",
                  }}
                >
                  ⚠ {amzConfirmError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Option A: 1-Click Shiprocket Booking + SP-API Sync */}
                <div
                  style={{
                    background: "rgba(107,141,214,0.04)",
                    border: "1px solid rgba(107,141,214,0.2)",
                    borderRadius: "2px",
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontFamily: "monospace",
                        fontSize: "9px",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "#6b8dd6",
                        margin: "0 0 6px",
                        fontWeight: "bold",
                      }}
                    >
                      Option A: 1-Click Shiprocket &amp; Amazon SP-API Sync
                    </p>
                    <p
                      style={{
                        fontFamily: "sans-serif",
                        fontSize: "12px",
                        color: "var(--muted, #aaa)",
                        lineHeight: "1.4",
                        margin: 0,
                      }}
                    >
                      Creates shipment on Shiprocket, assigns courier AWB, and
                      automatically pushes the Tracking ID to Amazon Seller
                      Central via SP-API.
                    </p>
                  </div>

                  <button
                    suppressHydrationWarning
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
                            if (awbToUse) {
                              const carrierToUse =
                                result.courierName ||
                                manualCarrier ||
                                "Delhivery";
                              await handleConfirmAmazonShipment(
                                awbToUse,
                                carrierToUse,
                              );
                            }
                          } else {
                            setAmzConfirmError(
                              "Shiprocket Booking Error: " +
                                (result.error || "Failed"),
                            );
                          }
                        });
                      } else {
                        setShowLogisticsPreview(true);
                      }
                    }}
                    disabled={isPending || isConfirmingAmzShipment}
                    style={{
                      marginTop: "16px",
                      width: "100%",
                      padding: "10px 14px",
                      background: "rgba(107,141,214,0.15)",
                      border: "1px solid rgba(107,141,214,0.4)",
                      color: "#6b8dd6",
                      fontFamily: "monospace",
                      fontSize: "10px",
                      fontWeight: "bold",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      borderRadius: "2px",
                      cursor:
                        isPending || isConfirmingAmzShipment
                          ? "not-allowed"
                          : "pointer",
                      opacity: isPending || isConfirmingAmzShipment ? 0.6 : 1,
                    }}
                  >
                    {isPending || isConfirmingAmzShipment
                      ? "Processing & Syncing…"
                      : fulfillmentError
                        ? "↻ Retry Fulfillment & Amazon Sync"
                        : awbNumber || trackingNumber
                          ? `⚡ Re-sync Amazon SP-API (AWB #${trackingNumber || awbNumber})`
                          : "🚀 Review Details & Book Shipment"}
                  </button>

                  {(awbNumber || trackingNumber) && (
                    <button
                      onClick={() => {
                        if (
                          confirm(
                            "Are you sure you want to cancel this Shiprocket shipment and request a wallet refund?",
                          )
                        ) {
                          startTransition(async () => {
                            const res =
                              await resetAmazonOrderShipmentAction(orderId);
                            if (res.success) {
                              setAmzConfirmResult(
                                res.message ||
                                  "Shipment reset! Wallet refund requested on Shiprocket.",
                              );
                              router.refresh();
                            } else {
                              setAmzConfirmError(
                                res.error || "Failed to reset shipment.",
                              );
                            }
                          });
                        }
                      }}
                      disabled={isPending}
                      style={{
                        marginTop: "8px",
                        width: "100%",
                        padding: "8px 12px",
                        background: "rgba(248,113,113,0.1)",
                        border: "1px solid rgba(248,113,113,0.3)",
                        color: "#f87171",
                        fontFamily: "monospace",
                        fontSize: "9px",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        borderRadius: "2px",
                        cursor: isPending ? "not-allowed" : "pointer",
                      }}
                    >
                      ↺ Cancel &amp; Reset Shipment (Refund Wallet)
                    </button>
                  )}
                </div>

                {/* Option B: Manual Amazon SP-API Shipment Confirmation */}
                <div
                  style={{
                    background: "rgba(196,160,90,0.04)",
                    border: "1px solid rgba(196,160,90,0.2)",
                    borderRadius: "2px",
                    padding: "16px",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "monospace",
                      fontSize: "9px",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "#c4a05a",
                      margin: "0 0 10px",
                      fontWeight: "bold",
                    }}
                  >
                    Option B: Manual Courier AWB to Amazon SP-API
                  </p>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    <div>
                      <label
                        style={{
                          display: "block",
                          fontFamily: "monospace",
                          fontSize: "8px",
                          color: "var(--muted, #888)",
                          textTransform: "uppercase",
                          marginBottom: "4px",
                        }}
                      >
                        Carrier Name
                      </label>
                      <input
                        type="text"
                        value={manualCarrier}
                        onChange={(e) => setManualCarrier(e.target.value)}
                        placeholder="e.g. Shiprocket, BlueDart, Delhivery, DTDC, India Post"
                        style={{
                          width: "100%",
                          background: "var(--background, #000)",
                          border: "1px solid var(--border, #333)",
                          color: "var(--primary, #fff)",
                          padding: "6px 10px",
                          fontFamily: "monospace",
                          fontSize: "12px",
                          borderRadius: "2px",
                        }}
                      />
                    </div>

                    <div>
                      <label
                        style={{
                          display: "block",
                          fontFamily: "monospace",
                          fontSize: "8px",
                          color: "var(--muted, #888)",
                          textTransform: "uppercase",
                          marginBottom: "4px",
                        }}
                      >
                        Tracking ID / AWB Number
                      </label>
                      <input
                        type="text"
                        value={manualAwb}
                        onChange={(e) => setManualAwb(e.target.value)}
                        placeholder="Enter AWB / Tracking number"
                        style={{
                          width: "100%",
                          background: "var(--background, #000)",
                          border: "1px solid var(--border, #333)",
                          color: "var(--primary, #fff)",
                          padding: "6px 10px",
                          fontFamily: "monospace",
                          fontSize: "12px",
                          borderRadius: "2px",
                        }}
                      />
                    </div>

                    <button
                      onClick={() => handleConfirmAmazonShipment()}
                      disabled={isConfirmingAmzShipment || !manualAwb.trim()}
                      style={{
                        marginTop: "4px",
                        width: "100%",
                        padding: "10px 14px",
                        background: "rgba(196,160,90,0.15)",
                        border: "1px solid rgba(196,160,90,0.4)",
                        color: "#c4a05a",
                        fontFamily: "monospace",
                        fontSize: "10px",
                        fontWeight: "bold",
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        borderRadius: "2px",
                        cursor:
                          isConfirmingAmzShipment || !manualAwb.trim()
                            ? "not-allowed"
                            : "pointer",
                        opacity:
                          isConfirmingAmzShipment || !manualAwb.trim()
                            ? 0.6
                            : 1,
                      }}
                    >
                      {isConfirmingAmzShipment
                        ? "Transmitting to Amazon SP-API…"
                        : "Confirm Shipment on Amazon (SP-API)"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* ── Order Status Controls (shown for all orders) ─────────── */}
      <div
        style={{
          padding: "20px 24px",
          borderTop: isAmazon ? "1px solid rgba(196,160,90,0.1)" : "none",
        }}
      >
        <p
          style={{
            fontFamily: "monospace",
            fontSize: "9px",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "var(--muted, #666)",
            marginBottom: "12px",
            marginTop: 0,
          }}
        >
          Update Order Status
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {STATUS_OPTIONS.map((status) => (
            <button
              key={status}
              onClick={() => handleStatusUpdate(status)}
              disabled={isPending || status === currentStatus}
              className={`font-mono text-[9px] uppercase tracking-[0.12em] px-4 py-2 border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                status === currentStatus
                  ? "border-accent text-accent bg-accent/10"
                  : status === "CANCELLED"
                    ? "border-[#f87171]/40 text-[#f87171]/70 hover:border-[#f87171] hover:text-[#f87171] hover:bg-[#f87171]/10"
                    : "border-border text-muted hover:border-accent hover:text-accent hover:bg-accent/05"
              }`}
            >
              {status === currentStatus ? "✓ " : ""}
              {status.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tracking number input (shown when SHIPPED is clicked) ── */}
      {showTracking && (
        <div
          style={{
            padding: "20px 24px",
            borderTop: "1px solid rgba(196,160,90,0.1)",
          }}
        >
          <p
            style={{
              fontFamily: "monospace",
              fontSize: "10px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--secondary, #aaa)",
              marginBottom: "16px",
              marginTop: 0,
            }}
          >
            Add Tracking Details (marks order as Shipped)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div>
              <label className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted block mb-1">
                Tracking Number
              </label>
              <input
                value={tracking}
                onChange={(e) => setTracking(e.target.value)}
                placeholder="e.g. 14786594834"
                className="w-full bg-background border border-border text-primary font-mono text-[12px] px-3 py-2 focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted block mb-1">
                AWB Number
              </label>
              <input
                value={awb}
                onChange={(e) => setAwb(e.target.value)}
                placeholder="e.g. DHLE1234567"
                className="w-full bg-background border border-border text-primary font-mono text-[12px] px-3 py-2 focus:outline-none focus:border-accent"
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={() => setShowTracking(false)}
              className="font-mono text-[9px] uppercase tracking-[0.12em] px-4 py-2 border border-border text-muted hover:text-primary transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleTrackingSubmit}
              disabled={isPending || !tracking}
              className="font-mono text-[9px] uppercase tracking-[0.12em] px-6 py-2 bg-accent text-obsidian hover:bg-[#d8b46e] transition-colors disabled:opacity-50"
            >
              {isPending ? "Saving..." : "Mark as Shipped →"}
            </button>
          </div>
        </div>
      )}

      {/* ── Real-time Tracking Data ──────────────────────────────── */}
      {trackingData && (
        <div
          style={{
            padding: "20px 24px",
            borderTop: "1px solid rgba(196,160,90,0.1)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            <p
              style={{
                fontFamily: "monospace",
                fontSize: "10px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--secondary, #aaa)",
                margin: 0,
              }}
            >
              Real-time Logistics Status
            </p>
            <button
              onClick={() => setTrackingData(null)}
              style={{
                fontFamily: "monospace",
                fontSize: "10px",
                color: "var(--muted, #666)",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
          <div
            style={{
              background: "rgba(0,0,0,0.3)",
              border: "1px solid var(--border, #222)",
              borderRadius: "2px",
              padding: "16px",
            }}
          >
            <div
              style={{ display: "flex", flexDirection: "column", gap: "14px" }}
            >
              {trackingData.shipment_track?.map((track: any, i: number) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: "16px",
                    borderLeft: "2px solid rgba(196,160,90,0.3)",
                    paddingLeft: "16px",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: "-5px",
                      top: "4px",
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: "#c4a05a",
                    }}
                  />
                  <div>
                    <p
                      style={{
                        fontFamily: "monospace",
                        fontSize: "11px",
                        color: "#c4a05a",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        margin: 0,
                      }}
                    >
                      {track.status}
                    </p>
                    <p
                      style={{
                        fontSize: "12px",
                        color: "var(--primary, #fff)",
                        margin: "4px 0 2px",
                      }}
                    >
                      {track.location}
                    </p>
                    <p
                      style={{
                        fontFamily: "monospace",
                        fontSize: "9px",
                        color: "var(--muted, #666)",
                        margin: 0,
                      }}
                    >
                      {track.date}
                    </p>
                  </div>
                </div>
              ))}
              {!trackingData.shipment_track && (
                <p
                  style={{
                    fontFamily: "monospace",
                    fontSize: "11px",
                    color: "var(--muted, #666)",
                    fontStyle: "italic",
                    margin: 0,
                  }}
                >
                  No tracking history found yet for AWB: {awbNumber}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── LOGISTICS PRE-BOOKING VERIFICATION MODAL ────────────────── */}
      {showLogisticsPreview && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#111",
              border: "1px solid rgba(107,141,214,0.3)",
              borderRadius: "4px",
              maxWidth: "600px",
              width: "100%",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.8)",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(107,141,214,0.08)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h3
                  style={{
                    fontFamily: "monospace",
                    fontSize: "12px",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "#6b8dd6",
                    margin: 0,
                    fontWeight: "bold",
                  }}
                >
                  🔍 Verify Shipment &amp; Pickup Details
                </h3>
                <p
                  style={{
                    fontFamily: "sans-serif",
                    fontSize: "11px",
                    color: "var(--muted, #aaa)",
                    margin: "2px 0 0",
                  }}
                >
                  Review courier partner, pickup schedule, and delivery details
                  before booking on Shiprocket.
                </p>
              </div>
              <button
                onClick={() => setShowLogisticsPreview(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#aaa",
                  fontSize: "18px",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            {/* Details Grid */}
            <div style={{ padding: "20px" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "14px",
                  marginBottom: "20px",
                }}
              >
                {/* 1. Earliest Pickup Schedule */}
                <div
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    padding: "12px",
                    borderRadius: "2px",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "monospace",
                      fontSize: "9px",
                      color: "#6b8dd6",
                      textTransform: "uppercase",
                      margin: "0 0 4px",
                      fontWeight: "bold",
                    }}
                  >
                    📅 Earliest Pickup Schedule
                  </p>
                  <p
                    style={{
                      fontFamily: "sans-serif",
                      fontSize: "13px",
                      color: "#fff",
                      fontWeight: "bold",
                      margin: 0,
                    }}
                  >
                    {new Date().getHours() >= 15
                      ? "Tomorrow Morning (Next-Day Slot)"
                      : "Today (Immediate Same-Day Slot)"}
                  </p>
                  <p
                    style={{
                      fontFamily: "monospace",
                      fontSize: "10px",
                      color: "#888",
                      margin: "2px 0 0",
                    }}
                  >
                    Cut-off logic: Auto-booked for earliest available courier
                    slot
                  </p>
                </div>

                {/* 2. Courier Partner */}
                <div
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    padding: "12px",
                    borderRadius: "2px",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "monospace",
                      fontSize: "9px",
                      color: "#6b8dd6",
                      textTransform: "uppercase",
                      margin: "0 0 4px",
                      fontWeight: "bold",
                    }}
                  >
                    🚚 Courier Selection
                  </p>
                  <p
                    style={{
                      fontFamily: "sans-serif",
                      fontSize: "13px",
                      color: "#4ade80",
                      fontWeight: "bold",
                      margin: 0,
                    }}
                  >
                    Delhivery / Best Serviceable Partner
                  </p>
                  <p
                    style={{
                      fontFamily: "monospace",
                      fontSize: "10px",
                      color: "#888",
                      margin: "2px 0 0",
                    }}
                  >
                    Auto-selected via Shiprocket Serviceability API
                  </p>
                </div>

                {/* 3. Pickup Origin */}
                <div
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    padding: "12px",
                    borderRadius: "2px",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "monospace",
                      fontSize: "9px",
                      color: "#aaa",
                      textTransform: "uppercase",
                      margin: "0 0 4px",
                      fontWeight: "bold",
                    }}
                  >
                    📍 Pickup Location
                  </p>
                  <p
                    style={{
                      fontFamily: "sans-serif",
                      fontSize: "12px",
                      color: "#ddd",
                      margin: 0,
                    }}
                  >
                    Primary / Home Warehouse (Pincode: 202001)
                  </p>
                </div>

                {/* 4. Delivery Destination */}
                <div
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    padding: "12px",
                    borderRadius: "2px",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "monospace",
                      fontSize: "9px",
                      color: "#aaa",
                      textTransform: "uppercase",
                      margin: "0 0 4px",
                      fontWeight: "bold",
                    }}
                  >
                    📦 Delivery Destination
                  </p>
                  <p
                    style={{
                      fontFamily: "sans-serif",
                      fontSize: "12px",
                      color: "#ddd",
                      margin: 0,
                    }}
                  >
                    {shippingCity || "City"}, {shippingState || "State"} -{" "}
                    {shippingPincode || "Pincode"}
                  </p>
                </div>
              </div>

              {/* Package Specifications */}
              <div
                style={{
                  background: "rgba(107,141,214,0.06)",
                  border: "1px solid rgba(107,141,214,0.2)",
                  padding: "12px 14px",
                  borderRadius: "2px",
                  marginBottom: "20px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: "10px",
                      color: "#aaa",
                    }}
                  >
                    PACKAGE SPECS: {pkgLength}cm × {pkgWidth}cm × {pkgHeight}
                    cm | {pkgWeight}kg
                  </span>
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: "10px",
                      color: "#4ade80",
                    }}
                  >
                    ⚡ AUTO AMAZON SP-API SYNC ENABLED
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  onClick={() => setShowLogisticsPreview(false)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#aaa",
                    fontFamily: "monospace",
                    fontSize: "10px",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    borderRadius: "2px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowLogisticsPreview(false);
                    startTransition(async () => {
                      const result = await retryLogisticsSync(orderId);
                      if (result.success) {
                        const awbToUse =
                          result.trackingNumber ||
                          result.awbNumber ||
                          trackingNumber ||
                          awbNumber;
                        if (awbToUse) {
                          const carrierToUse =
                            result.courierName || manualCarrier || "Delhivery";
                          await handleConfirmAmazonShipment(
                            awbToUse,
                            carrierToUse,
                          );
                        }
                      } else {
                        setAmzConfirmError(
                          "Shiprocket Booking Error: " +
                            (result.error || "Failed"),
                        );
                      }
                    });
                  }}
                  disabled={isPending || isConfirmingAmzShipment}
                  style={{
                    flex: 2,
                    padding: "12px",
                    background: "#6b8dd6",
                    border: "none",
                    color: "#000",
                    fontFamily: "monospace",
                    fontSize: "11px",
                    fontWeight: "bold",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    borderRadius: "2px",
                    cursor:
                      isPending || isConfirmingAmzShipment
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  {isPending || isConfirmingAmzShipment
                    ? "Booking & Syncing…"
                    : "🚀 Confirm & Book Shipment Now"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
