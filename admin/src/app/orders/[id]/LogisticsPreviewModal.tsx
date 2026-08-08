"use client";

import { useState, useEffect } from "react";
import {
  Search,
  MapPin,
  Package,
  Calendar,
  Zap,
  Sun,
  CalendarDays,
  Truck,
  CreditCard,
  X,
  Plus,
  Minus,
  CheckCircle2,
  Clock,
} from "lucide-react";

interface PackageDims {
  length: number;
  width: number;
  height: number;
  weight: number;
}

export interface CourierOption {
  id?: number;
  name: string;
  rate: number;
  etd: string;
}

interface LogisticsPreviewModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (
    dims: PackageDims,
    pickupDate: string,
    boxCount: number,
    selectedCourierId?: number | null,
  ) => void;
  initialDims: PackageDims;
  initialPickupDate: string;
  initialBoxCount: number;
  shippingAddress?: string | null;
  shippingCity?: string | null;
  shippingState?: string | null;
  shippingPincode?: string | null;
  isLoading?: boolean;
  freightEstimate?: {
    rate: number;
    courierName: string;
    etd: string;
    courierId?: number;
    availableCouriers?: CourierOption[];
  } | null;
  onEstimateFreight?: (dims: PackageDims) => Promise<void>;
}

export default function LogisticsPreviewModal({
  open,
  onClose,
  onConfirm,
  initialDims,
  initialPickupDate,
  initialBoxCount,
  shippingAddress,
  shippingCity,
  shippingState,
  shippingPincode,
  isLoading = false,
  freightEstimate,
  onEstimateFreight,
}: LogisticsPreviewModalProps) {
  const [dims, setDims] = useState<PackageDims>(initialDims);
  const [pickupDate, setPickupDate] = useState(initialPickupDate);
  const [boxCount, setBoxCount] = useState(initialBoxCount);
  const [estimating, setEstimating] = useState(false);
  const [scheduleSlot, setScheduleSlot] = useState<
    "EARLIEST" | "TOMORROW" | "CUSTOM"
  >("EARLIEST");
  const [timeWindow, setTimeWindow] = useState<
    "MORNING" | "AFTERNOON" | "EVENING"
  >("MORNING");

  const [selectedCourier, setSelectedCourier] = useState<CourierOption | null>(
    null,
  );

  // Keep internal state in sync with props when opened & auto-fetch live courier rates
  useEffect(() => {
    if (open) {
      setDims(initialDims);
      setPickupDate(initialPickupDate);
      setBoxCount(initialBoxCount);
      setSelectedCourier(null);
      if (onEstimateFreight && !freightEstimate) {
        setEstimating(true);
        onEstimateFreight(initialDims).finally(() => setEstimating(false));
      }
    }
  }, [open]);

  // When freightEstimate updates, sync selected courier if not user-selected
  useEffect(() => {
    if (freightEstimate && !selectedCourier) {
      setSelectedCourier({
        id: freightEstimate.courierId,
        name: freightEstimate.courierName,
        rate: freightEstimate.rate,
        etd: freightEstimate.etd,
      });
    }
  }, [freightEstimate]);

  if (!open) return null;

  const todayStr = new Date().toISOString().split("T")[0];
  const tomorrowObj = new Date();
  tomorrowObj.setDate(tomorrowObj.getDate() + 1);
  const tomorrowStr = tomorrowObj.toISOString().split("T")[0];

  const handleEstimate = async () => {
    if (!onEstimateFreight) return;
    setEstimating(true);
    await onEstimateFreight(dims);
    setEstimating(false);
  };

  const handleSlotSelect = (slot: "EARLIEST" | "TOMORROW" | "CUSTOM") => {
    setScheduleSlot(slot);
    if (slot === "EARLIEST") {
      const now = new Date();
      if (now.getHours() >= 15) setPickupDate(tomorrowStr);
      else setPickupDate(todayStr);
    } else if (slot === "TOMORROW") {
      setPickupDate(tomorrowStr);
    }
  };

  const activeCourierName =
    selectedCourier?.name ||
    freightEstimate?.courierName ||
    "Recommended Partner";
  const activeRate = selectedCourier?.rate ?? freightEstimate?.rate ?? 0;
  const activeEtd = selectedCourier?.etd || freightEstimate?.etd || "3-5 Days";

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 transition-opacity"
      />

      {/* Modal Container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 pointer-events-none">
        <div className="bg-[#111111] border border-border rounded-xs w-full max-w-xl max-h-[92vh] flex flex-col pointer-events-auto shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden">
          {/* Header */}
          <div className="flex justify-between items-center px-6 py-4 border-b border-border bg-surface">
            <div>
              <h3 className="font-mono text-[12px] uppercase tracking-[0.2em] text-[#c4a05a] font-bold m-0 flex items-center gap-2">
                <Search className="w-4 h-4 text-accent" />
                <span>Verify Shipment &amp; Pickup Details</span>
              </h3>
              <p className="font-sans text-[11px] text-muted mt-1 m-0">
                Review courier partner, pickup schedule, and package specs
                before booking on Shiprocket.
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center text-muted hover:text-white border border-border hover:border-accent/40 rounded-xs transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 text-left">
            {/* 1. Pickup & Delivery Route */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Pickup Location */}
              <div className="p-3 bg-surface border border-border rounded-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-accent font-semibold flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Pickup Location</span>
                  </span>
                  <span className="font-mono text-[8px] text-emerald-400/90 bg-emerald-500/10 px-1.5 py-0.5 rounded-xs border border-emerald-500/20">
                    Primary Warehouse
                  </span>
                </div>
                <p className="font-sans text-[11px] text-primary font-medium m-0">
                  James &amp; Sons Operations
                </p>
                <p className="font-mono text-[9px] text-muted m-0">
                  3/28 CNI Church Compound, Civil Lines, Aligarh, UP - 202001
                </p>
              </div>

              {/* Delivery Destination */}
              <div className="p-3 bg-surface border border-border rounded-xs space-y-1">
                <span className="font-mono text-[9px] uppercase tracking-wider text-accent font-semibold block flex items-center gap-1">
                  <Package className="w-3.5 h-3.5" />
                  <span>Delivery Destination</span>
                </span>
                <p className="font-sans text-[11px] text-primary font-medium m-0 truncate">
                  {[shippingCity?.toUpperCase(), shippingState?.toUpperCase()]
                    .filter(Boolean)
                    .join(", ") || "D2C Customer"}
                </p>
                <p className="font-mono text-[9px] text-muted m-0">
                  Pincode:{" "}
                  <strong className="text-primary">
                    {shippingPincode || "N/A"}
                  </strong>
                  {shippingAddress && (
                    <span className="block truncate opacity-80">
                      {shippingAddress}
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* 2. Earliest Pickup Schedule */}
            <div className="space-y-2">
              <label className="font-mono text-[10px] uppercase tracking-widest text-accent font-bold block flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Pickup Schedule Slot</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleSlotSelect("EARLIEST")}
                  className={`p-3 text-left border rounded-xs font-mono text-[10px] transition-all cursor-pointer ${
                    scheduleSlot === "EARLIEST"
                      ? "border-accent bg-accent/10 text-accent font-bold"
                      : "border-border bg-surface text-muted hover:border-accent/30 hover:text-primary"
                  }`}
                >
                  <span className="block font-bold text-[10px] flex items-center gap-1">
                    <Zap className="w-3 h-3 text-accent" />
                    <span>Earliest Available</span>
                  </span>
                  <span className="block text-[8px] opacity-75 mt-0.5">
                    Auto Cut-off Slot
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSlotSelect("TOMORROW")}
                  className={`p-3 text-left border rounded-xs font-mono text-[10px] transition-all cursor-pointer ${
                    scheduleSlot === "TOMORROW"
                      ? "border-accent bg-accent/10 text-accent font-bold"
                      : "border-border bg-surface text-muted hover:border-accent/30 hover:text-primary"
                  }`}
                >
                  <span className="block font-bold text-[10px] flex items-center gap-1">
                    <Sun className="w-3 h-3 text-accent" />
                    <span>Tomorrow Slot</span>
                  </span>
                  <span className="block text-[8px] opacity-75 mt-0.5">
                    Next Morning
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSlotSelect("CUSTOM")}
                  className={`p-3 text-left border rounded-xs font-mono text-[10px] transition-all cursor-pointer ${
                    scheduleSlot === "CUSTOM"
                      ? "border-accent bg-accent/10 text-accent font-bold"
                      : "border-border bg-surface text-muted hover:border-accent/30 hover:text-primary"
                  }`}
                >
                  <span className="block font-bold text-[10px] flex items-center gap-1">
                    <CalendarDays className="w-3 h-3 text-accent" />
                    <span>Select Custom Date</span>
                  </span>
                  <span className="block text-[8px] opacity-75 mt-0.5">
                    Pick specific date
                  </span>
                </button>
              </div>

              {scheduleSlot === "CUSTOM" && (
                <div className="pt-2">
                  <input
                    type="date"
                    value={pickupDate}
                    min={todayStr}
                    onChange={(e) => setPickupDate(e.target.value)}
                    className="w-full bg-black border border-accent/40 text-primary font-mono text-[12px] px-3 py-2 focus:outline-none rounded-xs"
                  />
                </div>
              )}

              {/* Pickup Time Window Selection */}
              <div className="pt-2 space-y-1.5">
                <span className="font-mono text-[9px] uppercase tracking-wider text-muted block flex items-center gap-1">
                  <Clock className="w-3 h-3 text-accent" />
                  <span>Pickup Time Window</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTimeWindow("MORNING")}
                    className={`p-2.5 border rounded-xs font-mono text-[9px] text-center transition-all cursor-pointer ${
                      timeWindow === "MORNING"
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold ring-1 ring-emerald-500/40"
                        : "border-border bg-surface text-muted hover:border-accent/30 hover:text-primary"
                    }`}
                  >
                    <span className="block font-bold text-[10px]">
                      10:00 AM - 1:00 PM
                    </span>
                    <span className="text-[8px] opacity-75">
                      Morning Window
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTimeWindow("AFTERNOON")}
                    className={`p-2.5 border rounded-xs font-mono text-[9px] text-center transition-all cursor-pointer ${
                      timeWindow === "AFTERNOON"
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold ring-1 ring-emerald-500/40"
                        : "border-border bg-surface text-muted hover:border-accent/30 hover:text-primary"
                    }`}
                  >
                    <span className="block font-bold text-[10px]">
                      1:00 PM - 4:00 PM
                    </span>
                    <span className="text-[8px] opacity-75">
                      Afternoon Window
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTimeWindow("EVENING")}
                    className={`p-2.5 border rounded-xs font-mono text-[9px] text-center transition-all cursor-pointer ${
                      timeWindow === "EVENING"
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold ring-1 ring-emerald-500/40"
                        : "border-border bg-surface text-muted hover:border-accent/30 hover:text-primary"
                    }`}
                  >
                    <span className="block font-bold text-[10px]">
                      4:00 PM - 7:00 PM
                    </span>
                    <span className="text-[8px] opacity-75">
                      Evening Window
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* 3. Package Specs & Dimensions */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="font-mono text-[10px] uppercase tracking-widest text-accent font-bold flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5" />
                  <span>Package Dimensions &amp; Weight</span>
                </label>
                <span className="font-mono text-[9px] text-muted">
                  Total Volumetric:{" "}
                  <strong className="text-accent font-bold">
                    {((dims.length * dims.width * dims.height) / 5000).toFixed(
                      2,
                    )}{" "}
                    kg
                  </strong>
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-surface p-3 border border-border rounded-xs">
                {(["length", "width", "height", "weight"] as const).map(
                  (field) => (
                    <div key={field} className="space-y-1">
                      <label className="font-mono text-[8px] text-muted uppercase block">
                        {field} ({field === "weight" ? "kg" : "cm"})
                      </label>
                      <div className="flex items-center border border-border bg-black rounded-xs overflow-hidden">
                        <input
                          type="number"
                          min={field === "weight" ? 0.1 : 1}
                          step={field === "weight" ? 0.1 : 1}
                          value={dims[field]}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            const updated = { ...dims, [field]: val };
                            setDims(updated);
                          }}
                          className="w-full bg-transparent text-primary font-mono text-[12px] px-2 py-1.5 focus:outline-none"
                        />
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>

            {/* 4. Number of Boxes */}
            <div className="flex items-center justify-between p-3 bg-surface border border-border rounded-xs">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-primary font-bold block flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-accent" />
                  <span>Box Count</span>
                </span>
                <span className="font-sans text-[10px] text-muted block mt-0.5">
                  Split into multiple physical packages if needed
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setBoxCount((b) => Math.max(1, b - 1))}
                  className="w-8 h-8 flex items-center justify-center bg-black border border-border hover:border-accent/40 text-primary rounded-xs font-mono text-base cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono text-[16px] text-accent font-bold w-6 text-center">
                  {boxCount}
                </span>
                <button
                  type="button"
                  onClick={() => setBoxCount((b) => b + 1)}
                  className="w-8 h-8 flex items-center justify-center bg-black border border-border hover:border-accent/40 text-primary rounded-xs font-mono text-base cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 5. Interactive Courier Partner Selection */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="font-mono text-[10px] uppercase tracking-widest text-[#c4a05a] font-bold flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5" />
                  <span>Select Delivery Partner &amp; Shipping Rate</span>
                </label>
                {onEstimateFreight && (
                  <button
                    type="button"
                    onClick={handleEstimate}
                    disabled={estimating}
                    className="font-mono text-[9px] uppercase tracking-wider px-2.5 py-1 bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 rounded-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
                  >
                    <CreditCard className="w-3 h-3" />
                    <span>
                      {estimating ? "Refreshing Rates…" : "Refresh Rates"}
                    </span>
                  </button>
                )}
              </div>

              {estimating ? (
                <div className="p-4 bg-surface border border-border rounded-xs text-left font-mono text-[10px] text-accent flex items-center gap-2">
                  <Truck className="w-4 h-4 animate-bounce text-accent" />
                  <span>
                    Fetching live courier partner rates &amp; ETDs from
                    Shiprocket API…
                  </span>
                </div>
              ) : freightEstimate ? (
                <div className="space-y-2">
                  {/* Selected Courier Summary Banner */}
                  <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xs flex flex-wrap justify-between items-center gap-3">
                    <div>
                      <span className="font-mono text-[8px] text-muted uppercase block">
                        Selected Courier Partner
                      </span>
                      <span className="font-mono text-[13px] text-emerald-400 font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>{activeCourierName}</span>
                      </span>
                    </div>
                    <div className="text-center">
                      <span className="font-mono text-[8px] text-muted uppercase block">
                        Est. Delivery
                      </span>
                      <span className="font-mono text-[11px] text-accent font-bold">
                        {activeEtd}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-[8px] text-muted uppercase block">
                        Freight Charge
                      </span>
                      <span className="font-mono text-[18px] text-emerald-400 font-bold">
                        ₹{activeRate}
                      </span>
                    </div>
                  </div>

                  {/* Clickable Courier Options Grid */}
                  {freightEstimate.availableCouriers &&
                    freightEstimate.availableCouriers.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="font-mono text-[8px] uppercase tracking-wider text-muted block">
                          Click to select delivery partner (
                          {freightEstimate.availableCouriers.length} Available)
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {freightEstimate.availableCouriers.map((c, idx) => {
                            const isSelected =
                              (selectedCourier?.id &&
                                c.id === selectedCourier.id) ||
                              (!selectedCourier &&
                                c.name === freightEstimate.courierName) ||
                              selectedCourier?.name === c.name;

                            return (
                              <button
                                type="button"
                                key={c.id || idx}
                                onClick={() => setSelectedCourier(c)}
                                className={`p-3 border rounded-xs font-mono text-[10px] flex items-center justify-between transition-all cursor-pointer text-left ${
                                  isSelected
                                    ? "border-emerald-500 bg-emerald-500/10 text-primary ring-1 ring-emerald-500/50 shadow-sm"
                                    : "border-border bg-surface text-muted hover:border-accent/40 hover:text-primary"
                                }`}
                              >
                                <div>
                                  <span className="font-bold text-primary flex items-center gap-1">
                                    {isSelected && (
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                                    )}
                                    <span>{c.name}</span>
                                  </span>
                                  <span className="text-[9px] text-muted block mt-0.5">
                                    ETD: {c.etd}
                                  </span>
                                </div>
                                <span
                                  className={`font-bold ${
                                    isSelected
                                      ? "text-emerald-400 text-[13px]"
                                      : "text-accent"
                                  }`}
                                >
                                  ₹{c.rate}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                </div>
              ) : (
                <div className="p-3 bg-surface border border-border rounded-xs text-left font-mono text-[10px] text-muted flex items-center justify-between">
                  <span>
                    Auto-selected via Shiprocket Serviceability API (Delhivery /
                    BlueDart / Xpressbees)
                  </span>
                  <button
                    type="button"
                    onClick={handleEstimate}
                    className="text-accent underline font-bold cursor-pointer"
                  >
                    Check Live Rates ↗
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 sm:p-5 border-t border-border bg-[#0a0a0a] flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:flex-1 font-mono text-[11px] uppercase tracking-wider py-3.5 border border-border text-muted hover:text-white hover:border-border/80 rounded-xs transition-colors cursor-pointer min-h-[44px] flex items-center justify-center"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() =>
                onConfirm(dims, pickupDate, boxCount, selectedCourier?.id)
              }
              disabled={isLoading}
              className="w-full sm:flex-[2] font-mono text-[11px] sm:text-[12px] uppercase tracking-[0.12em] py-3.5 bg-accent text-[#0a0a0b] hover:bg-[#d4af37] font-bold rounded-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 min-h-[44px]"
            >
              <Truck className="w-4 h-4 flex-shrink-0" />
              <span>
                {isLoading
                  ? "Booking Shiprocket…"
                  : `Book ${activeCourierName} (₹${activeRate})`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
