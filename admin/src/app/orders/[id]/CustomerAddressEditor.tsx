"use client";

import { useState } from "react";
import {
  updateOrderCustomerAddressAction,
  aiParseCustomerAddressAction,
} from "./logistics-actions";
import {
  User,
  Zap,
  Download,
  CheckCircle2,
  AlertCircle,
  Clipboard,
  Sparkles,
  X,
} from "lucide-react";

export default function CustomerAddressEditor({
  orderId,
  initialName,
  initialEmail,
  initialPhone,
  initialAddress,
  initialCity,
  initialState,
  initialPincode,
  initialCompanyName,
  initialGstin,
  isAmazon,
  hasNoRecipient,
}: {
  orderId: string;
  initialName: string;
  initialEmail: string;
  initialPhone?: string | null;
  initialAddress: string;
  initialCity?: string | null;
  initialState?: string | null;
  initialPincode?: string | null;
  initialCompanyName?: string | null;
  initialGstin?: string | null;
  isAmazon?: boolean;
  /** Auto-opens the editor when true (new Amazon order with no saved recipient yet) */
  hasNoRecipient?: boolean;
}) {
  // Auto-open if no recipient saved yet (brand new Amazon order)
  const [isEditing, setIsEditing] = useState(hasNoRecipient ?? false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // page.tsx passes initialName already resolved from recipientName (never a placeholder)
  const [customerName, setCustomerName] = useState(initialName || "");

  // Strip placeholder emails — never pre-fill amazon-marketplace@ in the form
  const cleanInitialEmail =
    initialEmail &&
    !initialEmail.includes("amazon-marketplace") &&
    !initialEmail.startsWith("amazon-")
      ? initialEmail
      : "";
  const [customerEmail, setCustomerEmail] = useState(cleanInitialEmail);
  const [customerPhone, setCustomerPhone] = useState(initialPhone || "");
  const [address, setAddress] = useState(initialAddress);
  const [city, setCity] = useState(initialCity || "");
  const [state, setState] = useState(initialState || "");
  const [pincode, setPincode] = useState(initialPincode || "");
  const [companyName, setCompanyName] = useState(initialCompanyName || "");
  const [gstin, setGstin] = useState(initialGstin || "");
  const [rawPasteText, setRawPasteText] = useState("");
  const [aiParsing, setAiParsing] = useState(false);
  const [aiUsed, setAiUsed] = useState(false); // track if AI was used (for UI badge)

  const handleParseAndSaveAmazonAddress = async () => {
    if (!rawPasteText.trim()) return;
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    const lines = rawPasteText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    let parsedName = "";
    let parsedPhone = "";
    let addressLines: string[] = [];
    let parsedState = "";
    let parsedPincode = "";
    let parsedCity = "";

    for (const line of lines) {
      if (line.toLowerCase().startsWith("phone:")) {
        parsedPhone = line.replace(/phone:\s*/i, "").trim();
        continue;
      }
      if (line.toLowerCase().includes("contact buyer:")) {
        const contactBuyer = line.replace(/.*contact buyer:\s*/i, "").trim();
        if (contactBuyer) parsedName = contactBuyer;
        continue;
      }

      const pinMatch = line.match(/(.*),\s*([A-Za-z\s]+)\s+(\d{6})/);
      if (pinMatch) {
        parsedCity = pinMatch[1].trim();
        parsedState = pinMatch[2].trim();
        parsedPincode = pinMatch[3].trim();
        continue;
      }

      addressLines.push(line);
    }

    const finalAddress = addressLines.join(", ").trim();
    const finalCity = parsedCity || city;
    const finalState = parsedState || state;
    const finalPincode = parsedPincode || pincode;
    const finalName = parsedName || customerName;
    const finalPhone = parsedPhone || customerPhone;

    if (finalName) setCustomerName(finalName);
    if (finalPhone) setCustomerPhone(finalPhone);
    if (finalAddress) setAddress(finalAddress);
    if (finalCity) setCity(finalCity);
    if (finalState) setState(finalState);
    if (finalPincode) setPincode(finalPincode);

    const res = await updateOrderCustomerAddressAction(orderId, {
      customerName: finalName,
      customerEmail,
      customerPhone: finalPhone,
      shippingAddress: finalAddress,
      shippingCity: finalCity,
      shippingState: finalState,
      shippingPincode: finalPincode,
      companyName,
      gstin,
    });

    setSaving(false);
    if (res.success) {
      setSuccessMsg(
        aiUsed
          ? "Details extracted with AI assistance and saved!"
          : "Customer details imported and saved to database!",
      );
      setIsEditing(false);
    } else {
      setErrorMsg(res.error || "Failed to save imported details.");
    }
  };

  // Explicit AI parse (user clicked ✨ AI Parse)
  const handleAiParseOnly = async () => {
    if (!rawPasteText.trim()) return;
    setAiParsing(true);
    setErrorMsg("");
    const aiResult = await aiParseCustomerAddressAction(rawPasteText);
    setAiParsing(false);
    if (aiResult.success) {
      if (aiResult.name) setCustomerName(aiResult.name);
      if (aiResult.phone) setCustomerPhone(aiResult.phone);
      if (aiResult.address) setAddress(aiResult.address);
      if (aiResult.city) setCity(aiResult.city);
      if (aiResult.state) setState(aiResult.state);
      if (aiResult.pincode) setPincode(aiResult.pincode);
      setAiUsed(true);
      setSuccessMsg(
        "✨ AI extracted the details — please review below and save.",
      );
    } else {
      setErrorMsg("AI parse failed: " + aiResult.error);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    const res = await updateOrderCustomerAddressAction(orderId, {
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress: address,
      shippingCity: city,
      shippingState: state,
      shippingPincode: pincode,
      companyName,
      gstin,
    });

    setSaving(false);
    if (res.success) {
      setSuccessMsg("Customer & shipping details updated successfully!");
      setIsEditing(false);
    } else {
      setErrorMsg(res.error || "Failed to update customer details.");
    }
  };

  return (
    <div className="bg-surface border border-border rounded-sm p-5 space-y-4">
      <div className="flex flex-wrap justify-between items-center pb-3 border-b border-border gap-2">
        <div>
          <h3 className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent m-0 flex items-center gap-2">
            <User className="w-4 h-4 text-accent" />
            <span>Customer &amp; Shipping Information</span>
          </h3>
          {isAmazon && (
            <p className="font-sans text-[12px] text-accent/90 mt-1 m-0 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-accent flex-shrink-0" />
              <span>
                Amazon Order:{" "}
                <strong>
                  {hasNoRecipient
                    ? 'No customer details saved yet. Click "Import Customer Details" to add them.'
                    : 'Click "Import Customer Details" to update.'}
                </strong>
              </span>
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsEditing(!isEditing)}
          className={`font-mono text-[10px] uppercase tracking-wider px-4 py-2 rounded-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer ${
            isEditing
              ? "bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20"
              : "bg-accent text-[#0a0a0b] hover:bg-[#d4af37]"
          }`}
        >
          {isEditing ? (
            <>
              <X className="w-3.5 h-3.5" />
              <span>Close</span>
            </>
          ) : (
            <>
              <Download className="w-3.5 h-3.5" />
              <span>Import Customer Details</span>
            </>
          )}
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[11px] rounded-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 font-mono text-[11px] rounded-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ── 1-Click Amazon Raw Paste & Auto-Parse Box ── */}
      {isEditing && (
        <div className="p-4 bg-background/50 border border-accent/25 rounded-xs space-y-3 mb-4">
          <label className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-accent font-bold">
            <Clipboard className="w-3.5 h-3.5 text-accent" />
            <span>Paste Raw Amazon Seller Central Order Details Here</span>
          </label>
          <textarea
            rows={5}
            value={rawPasteText}
            onChange={(e) => setRawPasteText(e.target.value)}
            placeholder="Paste Raw Amazon Seller Central Order Details Here..."
            className="w-full bg-background border border-border text-primary font-mono text-[12px] p-3 focus:outline-none focus:border-accent rounded-xs mb-2"
          />
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleParseAndSaveAmazonAddress}
              disabled={saving || !rawPasteText.trim()}
              className="flex-1 font-mono text-[10px] uppercase tracking-wider py-2.5 px-4 bg-accent text-[#0a0a0b] hover:bg-[#d4af37] font-bold rounded-xs transition-colors disabled:opacity-50 cursor-pointer inline-flex items-center justify-center gap-1.5 min-w-[160px]"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{saving ? "Saving…" : "Extract & Save (1-Click)"}</span>
            </button>
            <button
              type="button"
              onClick={handleAiParseOnly}
              disabled={aiParsing || !rawPasteText.trim()}
              title="Uses AI to parse complex address formats (Gemini Flash, minimal tokens)"
              className={`font-mono text-[10px] uppercase tracking-wider py-2.5 px-3 border rounded-xs transition-colors disabled:opacity-50 cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap ${
                aiUsed
                  ? "bg-purple-500/15 border-purple-500/40 text-purple-300 font-bold"
                  : "bg-purple-500/10 border-purple-500/30 text-purple-300 hover:bg-purple-500/20"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {aiParsing
                  ? "AI Parsing…"
                  : aiUsed
                    ? "Re-parse with AI"
                    : "AI Parse"}
              </span>
            </button>
          </div>
          {aiUsed && (
            <p className="font-mono text-[10px] text-purple-300/80 mt-1.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>Fields pre-filled by AI — review below before saving</span>
            </p>
          )}
        </div>
      )}

      {!isEditing ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-wider text-muted mb-1">
              Full Name
            </p>
            <p className="font-serif text-[15px] text-primary font-semibold m-0">
              {customerName || (
                <span className="font-mono text-[11px] text-muted italic">
                  Not specified
                </span>
              )}
            </p>
          </div>

          <div>
            <p className="font-mono text-[11px] uppercase tracking-wider text-muted mb-1">
              Contact Email &amp; Phone
            </p>
            {customerEmail ? (
              <p className="font-mono text-[11px] text-primary m-0">
                ✉ {customerEmail}
              </p>
            ) : (
              <p className="font-mono text-[10px] text-muted italic m-0">
                No email on record
              </p>
            )}
            {customerPhone && (
              <p className="font-mono text-[11px] text-accent mt-0.5 m-0 font-semibold">
                📞 {customerPhone}
              </p>
            )}
          </div>

          <div>
            <p className="font-mono text-[11px] uppercase tracking-wider text-muted mb-1">
              Delivery Address &amp; State Code
            </p>
            <p className="font-sans text-[13px] text-primary whitespace-pre-line m-0 leading-relaxed font-medium">
              {address || (
                <span className="font-mono text-[11px] text-muted italic">
                  No address on record
                </span>
              )}
            </p>
            {(city || state || pincode) && (
              <p className="font-mono text-[11px] text-accent mt-1 m-0 font-bold">
                {[city, state].filter(Boolean).join(", ")} {pincode}
              </p>
            )}
          </div>

          {(gstin || companyName) && (
            <div className="col-span-full pt-2 border-t border-border/60">
              <p className="font-mono text-[9px] uppercase tracking-wider text-muted mb-0.5">
                Trade Account GST Details
              </p>
              <p className="font-mono text-[11px] text-emerald-400/90 font-semibold m-0">
                🏢 {companyName || "B2B Trade Account"}
              </p>
              {gstin && (
                <p className="font-mono text-[11px] text-emerald-400/90 m-0">
                  GSTIN: {gstin}
                </p>
              )}
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSave} className="grid grid-cols-1 gap-3 pt-2">
          <p className="font-mono text-[9px] uppercase tracking-wider text-accent font-bold m-0">
            Manual Field Editing
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-mono text-[8px] uppercase tracking-wider text-muted mb-1">
                Customer Full Name
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
                className="w-full bg-background border border-border text-primary font-sans text-[12px] px-3 py-2 focus:outline-none focus:border-accent rounded-xs"
              />
            </div>

            <div>
              <label className="block font-mono text-[8px] uppercase tracking-wider text-muted mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full bg-background border border-border text-primary font-sans text-[12px] px-3 py-2 focus:outline-none focus:border-accent rounded-xs"
              />
            </div>

            <div>
              <label className="block font-mono text-[8px] uppercase tracking-wider text-muted mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full bg-background border border-border text-primary font-sans text-[12px] px-3 py-2 focus:outline-none focus:border-accent rounded-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-mono text-[8px] uppercase tracking-wider text-muted mb-1">
              Shipping Street Address
            </label>
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              className="w-full bg-background border border-border text-primary font-sans text-[12px] px-3 py-2 focus:outline-none focus:border-accent rounded-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-mono text-[8px] uppercase tracking-wider text-muted mb-1">
                City
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-background border border-border text-primary font-sans text-[12px] px-3 py-2 focus:outline-none focus:border-accent rounded-xs"
              />
            </div>
            <div>
              <label className="block font-mono text-[8px] uppercase tracking-wider text-muted mb-1">
                State
              </label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full bg-background border border-border text-primary font-sans text-[12px] px-3 py-2 focus:outline-none focus:border-accent rounded-xs"
              />
            </div>
            <div>
              <label className="block font-mono text-[8px] uppercase tracking-wider text-muted mb-1">
                Pincode
              </label>
              <input
                type="text"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                className="w-full bg-background border border-border text-primary font-sans text-[12px] px-3 py-2 focus:outline-none focus:border-accent rounded-xs"
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="font-mono text-[10px] uppercase tracking-wider px-4 py-2 border border-border text-muted hover:text-primary rounded-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="font-mono text-[10px] uppercase tracking-wider px-6 py-2 bg-accent text-[#0a0a0b] hover:bg-[#d4af37] font-bold rounded-xs transition-colors disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save Details"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
