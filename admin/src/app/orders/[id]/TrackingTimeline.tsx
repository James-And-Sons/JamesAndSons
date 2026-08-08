"use client";

import { useState } from "react";
import {
  Radio,
  MapPin,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

interface TrackingActivity {
  date?: string;
  activity?: string;
  description?: string;
  location?: string;
  sr_status?: number;
  sr_status_label?: string;
}

interface TrackingData {
  shipment_status?: string;
  current_status?: string;
  etd?: string;
  awb_code?: string;
  courier_name?: string;
  shipment_track_activities?: TrackingActivity[];
}

interface TrackingTimelineProps {
  awbNumber?: string | null;
  trackingNumber?: string | null;
  initialData?: TrackingData | null;
}

const STATUS_COLORS: Record<number, string> = {
  1: "#6b8dd6", // Order Created
  2: "#f59e0b", // Pickup Scheduled
  3: "#f59e0b", // Picked Up
  4: "#a855f7", // In Transit
  5: "#22c55e", // Out for Delivery
  6: "#22c55e", // Delivered
  7: "#ef4444", // Cancelled
  8: "#ef4444", // RTO
  9: "#ef4444", // Undelivered
  10: "#f97316", // Shipment Delayed
};

function formatActivityDate(dateStr?: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return dateStr;
  }
}

export default function TrackingTimeline({
  awbNumber,
  trackingNumber,
  initialData,
}: TrackingTimelineProps) {
  const [trackingData, setTrackingData] = useState<TrackingData | null>(
    initialData || null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(false);

  const trackCode = awbNumber || trackingNumber;
  if (!trackCode) return null;

  const handleFetch = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/orders/track?awb=${encodeURIComponent(trackCode)}`,
      );
      const data = await res.json();
      if (data.success && data.data) {
        setTrackingData(data.data);
        setExpanded(true);
      } else {
        setError(data.error || "Unable to fetch tracking info");
      }
    } catch (e: any) {
      setError("Network error fetching tracking");
    } finally {
      setLoading(false);
    }
  };

  const activities = trackingData?.shipment_track_activities || [];
  const currentStatus =
    trackingData?.shipment_status || trackingData?.current_status;
  const courierName = trackingData?.courier_name;

  const carrierTrackUrl = courierName?.toLowerCase().includes("delhivery")
    ? `https://www.delhivery.com/track/package/${trackCode}`
    : courierName?.toLowerCase().includes("bluedart")
      ? `https://www.bluedart.com/tracking`
      : courierName?.toLowerCase().includes("dtdc")
        ? `https://www.dtdc.in/trace.asp`
        : `https://shiprocket.in/tracking/${trackCode}`;

  return (
    <div className="bg-surface border border-border rounded-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted flex items-center gap-1.5">
            <Radio className="w-4 h-4 text-accent" />
            <span>Live Tracking</span>
          </span>
          {trackCode && (
            <span className="font-mono text-[11px] text-accent font-semibold">
              {trackCode}
            </span>
          )}
          {currentStatus && (
            <span className="font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 bg-emerald-500/5 border border-emerald-500/20 text-emerald-400/90 rounded-xs font-semibold">
              {currentStatus}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {courierName && (
            <a
              href={carrierTrackUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[9px] uppercase tracking-wider px-2.5 py-1 bg-surface border border-border text-muted hover:text-accent hover:border-accent/40 rounded-xs transition-colors flex items-center gap-1"
            >
              <span>Track on {courierName}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          <button
            onClick={
              expanded
                ? () => setExpanded(false)
                : trackingData
                  ? () => setExpanded(true)
                  : handleFetch
            }
            disabled={loading}
            className="font-mono text-[9px] uppercase tracking-wider px-2.5 py-1 bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 rounded-xs transition-colors disabled:opacity-50 flex items-center gap-1"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Fetching…</span>
              </>
            ) : expanded ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span>Hide</span>
              </>
            ) : trackingData ? (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span>Show History</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3 h-3" />
                <span>Load Tracking</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/20 font-mono text-[10px] text-red-400 flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* ETD */}
      {trackingData?.etd && (
        <div className="px-4 py-2 bg-amber-500/5 border-b border-border">
          <span className="font-mono text-[10px] text-muted uppercase tracking-wider">
            Expected Delivery:{" "}
          </span>
          <span className="font-mono text-[11px] text-amber-400 font-bold">
            {trackingData.etd}
          </span>
        </div>
      )}

      {/* Timeline */}
      {expanded && activities.length > 0 && (
        <div className="p-4 space-y-0">
          {activities.map((act, i) => (
            <div key={i} className="flex gap-3 relative">
              {/* Line connector */}
              {i < activities.length - 1 && (
                <div className="absolute left-[9px] top-5 bottom-0 w-px bg-border" />
              )}
              {/* Dot */}
              <div
                className="w-[18px] h-[18px] rounded-full border-2 flex-shrink-0 mt-0.5 relative z-10"
                style={{
                  borderColor:
                    i === 0
                      ? STATUS_COLORS[act.sr_status ?? 0] || "#c4a05a"
                      : "#333",
                  background:
                    i === 0
                      ? (STATUS_COLORS[act.sr_status ?? 0] || "#c4a05a") + "30"
                      : "#111",
                }}
              />
              {/* Content */}
              <div className={`pb-4 flex-1 ${i === 0 ? "" : "opacity-70"}`}>
                <p className="font-mono text-[11px] text-primary font-semibold m-0 leading-tight">
                  {act.sr_status_label || act.activity || act.description}
                </p>
                {act.location && (
                  <p className="font-mono text-[10px] text-muted m-0 mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-muted" />
                    <span>{act.location}</span>
                  </p>
                )}
                {act.date && (
                  <p className="font-mono text-[9px] text-muted/60 m-0 mt-0.5">
                    {formatActivityDate(act.date)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {expanded && activities.length === 0 && (
        <div className="px-4 py-6 text-center font-mono text-[10px] text-muted">
          No tracking events yet. Shipment may be pending pickup.
        </div>
      )}
    </div>
  );
}
