"use client";

import { useState, useTransition } from "react";
import { updateOrderAddressAction } from "../actions";
import { Edit2, Sparkles, Check, AlertTriangle, X } from "lucide-react";

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
  const [showImporter, setShowImporter] = useState(false);
  const [rawAmazonText, setRawAmazonText] = useState("");
  const [isPending, startTransition] = useTransition();

  const [address, setAddress] = useState(initialAddress);
  const [city, setCity] = useState(initialCity || "");
  const [state, setState] = useState(initialState || "");
  const [pincode, setPincode] = useState(initialPincode || "");
  const [phone, setPhone] = useState(initialPhone || "");
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const isIncompleteAmazonAddress =
    address.includes("Amazon Marketplace") || !address || address.length < 10;

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

  const handleSmartImport = () => {
    if (!rawAmazonText.trim()) return;

    let name = "";
    let addressLines: string[] = [];
    let extractedCity = "";
    let extractedState = "";
    let extractedPincode = "";
    let extractedPhone = "";

    const lines = rawAmazonText
      .split("\n")
      .map((l) => l.trim())
      .filter(
        (l) =>
          l &&
          !l.toLowerCase().startsWith("ship to") &&
          !l.toLowerCase().startsWith("contact buyer:"),
      );

    for (const line of lines) {
      // Extract Phone
      const phoneMatch = line.match(/(?:phone\s*:\s*)?([0-9]{10,12})/i);
      if (phoneMatch && !extractedPhone) {
        extractedPhone = phoneMatch[1];
        continue;
      }

      // Extract City, State, Pincode
      const pincodeMatch = line.match(
        /([A-Z\s]+)\s+([A-Z\s]+)\s+[\-–]?\s*(\d{6})/i,
      );
      if (pincodeMatch) {
        const parts = line.split(",");
        if (parts.length >= 2) {
          extractedCity = parts[0].trim();
          const statePin = parts[1].trim().match(/([A-Z\s]+)\s+(\d{6})/i);
          if (statePin) {
            extractedState = statePin[1].trim();
            extractedPincode = statePin[2].trim();
          }
        } else {
          extractedPincode = pincodeMatch[3];
        }
        continue;
      }

      if (!name) {
        name = line;
      } else {
        addressLines.push(line);
      }
    }

    const fullStreet = [name, ...addressLines].filter(Boolean).join(", ");
    if (fullStreet) setAddress(fullStreet);
    if (extractedCity) setCity(extractedCity);
    if (extractedState) setState(extractedState);
    if (extractedPincode) setPincode(extractedPincode);
    if (extractedPhone) setPhone(extractedPhone);

    setShowImporter(false);
    setIsEditing(true);
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
          <button
            onClick={() => setShowImporter(true)}
            className="font-mono text-[9px] uppercase tracking-wider px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-all rounded-xs flex items-center gap-1 cursor-pointer"
          >
            <Sparkles className="w-3 h-3" />
            <span>Import Amazon Details</span>
          </button>

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

      {/* ── Incomplete Amazon Address Warning Banner ────────────────── */}
      {isIncompleteAmazonAddress && !isEditing && (
        <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-mono text-[10px] text-amber-300 font-bold uppercase tracking-wider m-0">
              Incomplete Street Address Detected
            </p>
            <p className="font-sans text-[12px] text-amber-200/80 m-0">
              Amazon SP-API provided partial address due to PII protection.
              Click{" "}
              <button
                onClick={() => setShowImporter(true)}
                className="underline font-bold text-amber-300 hover:text-white cursor-pointer"
              >
                Import Amazon Details
              </button>{" "}
              to paste the full address from Seller Central before booking
              Shiprocket!
            </p>
          </div>
        </div>
      )}

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
              Street Address / Customer Name
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

      {/* ── Smart Amazon Seller Central Importer Modal ─────────────── */}
      {showImporter && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border p-6 max-w-lg w-full rounded-sm space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="font-mono text-[11px] uppercase tracking-wider text-amber-400 font-bold m-0 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>Smart Amazon Address Importer</span>
              </h3>
              <button
                onClick={() => setShowImporter(false)}
                className="text-muted hover:text-primary cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="font-sans text-[12px] text-secondary leading-relaxed m-0">
              Copy the{" "}
              <span className="font-bold text-amber-300">"Ship to"</span> text
              block from your Amazon Seller Central order page and paste it
              below. Our parser will extract the customer name, street address,
              pincode, and phone number automatically!
            </p>

            <textarea
              rows={6}
              value={rawAmazonText}
              onChange={(e) => setRawAmazonText(e.target.value)}
              placeholder={`Example text copied from Amazon Seller Central:

Hymavathiamma
Sanatanapuram P O, Kalarcode, Alleppey
PUNNAPARA, KERALA 688003
Contact Buyer: Sajeeve
Phone: 9567931371`}
              className="w-full bg-background border border-border p-3 text-[12px] text-primary font-mono focus:outline-none focus:border-amber-400 rounded-xs"
            />

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button
                onClick={() => setShowImporter(false)}
                className="font-mono text-[10px] uppercase tracking-wider px-4 py-2 border border-border text-muted hover:text-primary rounded-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSmartImport}
                disabled={!rawAmazonText.trim()}
                className="font-mono text-[10px] uppercase tracking-wider px-5 py-2 bg-amber-500 text-obsidian font-bold hover:bg-amber-400 rounded-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Parse &amp; Import Address</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
