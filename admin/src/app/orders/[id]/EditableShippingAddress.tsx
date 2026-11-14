"use client";

import { useState, useTransition } from "react";
import { updateOrderAddressAction } from "../actions";
import { Edit2, Check } from "lucide-react";

interface ShippingAddressProps {
  orderId: string;
  initialAddress: string;
  initialCity?: string | null;
  initialState?: string | null;
  initialPincode?: string | null;
  initialPhone?: string | null;
  status?: string;
}

export default function EditableShippingAddress({
  orderId,
  initialAddress,
  initialCity = "",
  initialState = "",
  initialPincode = "",
  initialPhone = "",
}: ShippingAddressProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [address, setAddress] = useState(initialAddress);
  const [city, setCity] = useState(initialCity || "");
  const [state, setState] = useState(initialState || "");
  const [pincode, setPincode] = useState(initialPincode || "");
  const [phone, setPhone] = useState(initialPhone || "");
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSave = () => {
    setIsEditing(false);
    setErrorMsg("");
    startTransition(async () => {
      const res = await updateOrderAddressAction(orderId, {
        shippingAddress: address,
        shippingCity: city,
        shippingState: state,
        shippingPincode: pincode,
        shippingPhone: phone,
      });

      if (res.success) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      } else {
        setErrorMsg(res.error || "Failed to update address");
      }
    });
  };

  return (
    <div className="bg-surface border border-border p-6 rounded-sm relative">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex justify-between items-center border-b border-border pb-3 mb-4">
        <h3 className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted m-0 flex items-center gap-2">
          <span>📍 Delivery Address</span>
          {savedSuccess && (
            <span className="text-emerald-400 font-bold text-[9px] flex items-center gap-1">
              <Check className="w-3 h-3" /> Saved
            </span>
          )}
        </h3>
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="font-mono text-[9px] uppercase tracking-wider px-2.5 py-1 bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 transition-all rounded-xs flex items-center gap-1 cursor-pointer"
            >
              <Edit2 className="w-3 h-3" />
              <span>Edit</span>
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={isPending}
              className="font-mono text-[9px] uppercase tracking-wider px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30 transition-all rounded-xs flex items-center gap-1 cursor-pointer"
            >
              <Check className="w-3 h-3" />
              <span>{isPending ? "Saving..." : "Save Address"}</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Error Banner ───────────────────────────────────────────── */}
      {errorMsg && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 font-mono text-[10px] rounded-xs">
          ⚠ {errorMsg}
        </div>
      )}

      {/* ── View Mode ──────────────────────────────────────────────── */}
      {!isEditing ? (
        <div className="space-y-1">
          <p className="font-body text-[13px] text-secondary leading-relaxed font-semibold">
            {address}
          </p>
          {(city || state || pincode) && (
            <p className="font-mono text-[11px] text-muted">
              {[city, state].filter(Boolean).join(", ")}{" "}
              {pincode ? `- ${pincode}` : ""}
            </p>
          )}
          {phone && (
            <p className="font-mono text-[11px] text-accent font-semibold">
              Phone: {phone}
            </p>
          )}
        </div>
      ) : (
        /* ── Edit Mode ──────────────────────────────────────────────── */
        <div className="space-y-3">
          <div>
            <label className="block font-mono text-[8px] text-muted uppercase tracking-wider mb-1">
              Street Address
            </label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
              className="w-full bg-background border border-border p-2 text-[12px] text-primary font-sans focus:outline-none focus:border-accent rounded-xs"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block font-mono text-[8px] text-muted uppercase tracking-wider mb-1">
                City
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-background border border-border p-2 text-[12px] text-primary font-mono focus:outline-none focus:border-accent rounded-xs"
              />
            </div>
            <div>
              <label className="block font-mono text-[8px] text-muted uppercase tracking-wider mb-1">
                State
              </label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full bg-background border border-border p-2 text-[12px] text-primary font-mono focus:outline-none focus:border-accent rounded-xs"
              />
            </div>
            <div>
              <label className="block font-mono text-[8px] text-muted uppercase tracking-wider mb-1">
                Pincode
              </label>
              <input
                type="text"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                className="w-full bg-background border border-border p-2 text-[12px] text-primary font-mono focus:outline-none focus:border-accent rounded-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-mono text-[8px] text-muted uppercase tracking-wider mb-1">
              Customer Phone Number
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 9567931371"
              className="w-full bg-background border border-border p-2 text-[12px] text-primary font-mono focus:outline-none focus:border-accent rounded-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setIsEditing(false)}
              className="font-mono text-[9px] uppercase tracking-wider px-3 py-1.5 border border-border text-muted hover:text-primary rounded-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isPending}
              className="font-mono text-[9px] uppercase tracking-wider px-4 py-1.5 bg-accent text-obsidian font-bold hover:bg-[#d8b46e] rounded-xs cursor-pointer"
            >
              {isPending ? "Saving..." : "Save Address Changes"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
