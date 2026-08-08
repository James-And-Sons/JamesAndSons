"use client";

import { useState } from "react";
import { updateOrderCustomerAddressAction } from "./logistics-actions";

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
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const cleanInitialName =
    initialName && !initialName.includes("Amazon Marketplace")
      ? initialName
      : "Amazon Buyer";

  const [customerName, setCustomerName] = useState(cleanInitialName);
  const [customerEmail, setCustomerEmail] = useState(initialEmail);
  const [customerPhone, setCustomerPhone] = useState(initialPhone || "");
  const [address, setAddress] = useState(initialAddress);
  const [city, setCity] = useState(initialCity || "");
  const [state, setState] = useState(initialState || "");
  const [pincode, setPincode] = useState(initialPincode || "");
  const [companyName, setCompanyName] = useState(initialCompanyName || "");
  const [gstin, setGstin] = useState(initialGstin || "");
  const [rawPasteText, setRawPasteText] = useState("");

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

    if (!parsedName && addressLines.length > 0) {
      if (addressLines.length >= 2) {
        parsedName = `${addressLines[0]} ${addressLines[1]}`;
        addressLines = addressLines.slice(2);
      } else {
        parsedName = addressLines[0];
        addressLines = [];
      }
    }

    const finalName = parsedName || customerName;
    const finalPhone = parsedPhone || customerPhone;
    const finalAddress =
      addressLines.length > 0 ? addressLines.join(", ") : address;
    const finalCity = parsedCity || city;
    const finalState = parsedState || state;
    const finalPincode = parsedPincode || pincode;

    setCustomerName(finalName);
    setCustomerPhone(finalPhone);
    setAddress(finalAddress);
    setCity(finalCity);
    setState(finalState);
    setPincode(finalPincode);

    // Save directly to DB in 1 click!
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
        "Amazon details imported and saved to database successfully!",
      );
      setIsEditing(false);
    } else {
      setErrorMsg(res.error || "Failed to save imported details.");
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
    <div
      style={{
        background: "var(--surface, #111)",
        border: "1px solid rgba(196,160,90,0.25)",
        borderRadius: "2px",
        padding: "20px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "14px",
          borderBottom: "1px solid rgba(196,160,90,0.15)",
          paddingBottom: "10px",
        }}
      >
        <div>
          <h3
            style={{
              fontFamily: "monospace",
              fontSize: "11px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#c4a05a",
              margin: 0,
            }}
          >
            👤 Customer &amp; Shipping Information Studio
          </h3>
          {isAmazon && (
            <p
              style={{
                fontFamily: "sans-serif",
                fontSize: "11px",
                color: "rgba(245,158,11,0.9)",
                margin: "4px 0 0",
              }}
            >
              ⚡ Amazon Order: Click <strong>"Import Amazon Details"</strong>{" "}
              below to paste and auto-fill customer info &amp; address!
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsEditing(!isEditing)}
          style={{
            background: isEditing
              ? "rgba(248,113,113,0.12)"
              : "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
            border: isEditing ? "1px solid rgba(248,113,113,0.4)" : "none",
            color: isEditing ? "#f87171" : "#000",
            fontFamily: "monospace",
            fontSize: "10px",
            fontWeight: "bold",
            padding: "8px 16px",
            borderRadius: "2px",
            cursor: "pointer",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            boxShadow: isEditing ? "none" : "0 2px 10px rgba(245,158,11,0.25)",
          }}
        >
          {isEditing ? "✕ Close Studio" : "📥 Import Amazon Details"}
        </button>
      </div>

      {successMsg && (
        <div
          style={{
            background: "rgba(74,222,128,0.08)",
            border: "1px solid rgba(74,222,128,0.3)",
            color: "#4ade80",
            padding: "10px 14px",
            borderRadius: "2px",
            fontFamily: "monospace",
            fontSize: "11px",
            marginBottom: "12px",
          }}
        >
          ✅ {successMsg}
        </div>
      )}

      {errorMsg && (
        <div
          style={{
            background: "rgba(248,113,113,0.08)",
            border: "1px solid rgba(248,113,113,0.3)",
            color: "#f87171",
            padding: "10px 14px",
            borderRadius: "2px",
            fontFamily: "monospace",
            fontSize: "11px",
            marginBottom: "12px",
          }}
        >
          ⚠ {errorMsg}
        </div>
      )}

      {/* ── 1-Click Amazon Raw Paste & Auto-Parse Box ── */}
      {isEditing && (
        <div
          style={{
            background: "rgba(245,158,11,0.06)",
            border: "1px solid rgba(245,158,11,0.3)",
            borderRadius: "2px",
            padding: "16px",
            marginBottom: "16px",
          }}
        >
          <label
            style={{
              display: "block",
              fontFamily: "monospace",
              fontSize: "9px",
              color: "#f59e0b",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              marginBottom: "6px",
              fontWeight: "bold",
            }}
          >
            📋 Paste Raw Amazon Seller Central Order Details Here
          </label>
          <textarea
            rows={5}
            value={rawPasteText}
            onChange={(e) => setRawPasteText(e.target.value)}
            placeholder={`Paste raw Amazon text here:\n\nHymavathiamma\nHymavath\nSanatanapuram P O, Kalarcode, Alleppey\nPUNNAPARA, KERALA 688003\nContact Buyer:\tSajeeve\nPhone:\t9567931371`}
            style={{
              width: "100%",
              padding: "10px",
              background: "#000",
              border: "1px solid rgba(245,158,11,0.4)",
              borderRadius: "2px",
              color: "#fff",
              fontFamily: "monospace",
              fontSize: "11px",
              marginBottom: "10px",
            }}
          />
          <button
            type="button"
            onClick={handleParseAndSaveAmazonAddress}
            disabled={saving || !rawPasteText.trim()}
            style={{
              background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
              border: "none",
              color: "#000",
              fontFamily: "monospace",
              fontSize: "10px",
              fontWeight: "bold",
              padding: "8px 18px",
              borderRadius: "2px",
              cursor:
                saving || !rawPasteText.trim() ? "not-allowed" : "pointer",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              opacity: saving || !rawPasteText.trim() ? 0.6 : 1,
            }}
          >
            {saving
              ? "Saving to Database…"
              : "⚡ Auto-Extract & Save to Database (1-Click)"}
          </button>
        </div>
      )}

      {!isEditing ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "14px",
          }}
        >
          <div>
            <p
              style={{
                fontFamily: "monospace",
                fontSize: "8px",
                color: "var(--muted, #888)",
                textTransform: "uppercase",
                margin: "0 0 2px",
              }}
            >
              Full Name
            </p>
            <p
              style={{
                fontFamily: "sans-serif",
                fontSize: "14px",
                color: "#fff",
                fontWeight: "600",
                margin: 0,
              }}
            >
              {customerName}
            </p>
          </div>

          <div>
            <p
              style={{
                fontFamily: "monospace",
                fontSize: "8px",
                color: "var(--muted, #888)",
                textTransform: "uppercase",
                margin: "0 0 2px",
              }}
            >
              Contact Email &amp; Phone
            </p>
            <p
              style={{
                fontFamily: "monospace",
                fontSize: "11px",
                color: "#ccc",
                margin: 0,
              }}
            >
              ✉ {customerEmail}
            </p>
            {customerPhone && (
              <p
                style={{
                  fontFamily: "monospace",
                  fontSize: "11px",
                  color: "#ccc",
                  margin: "2px 0 0",
                }}
              >
                📞 {customerPhone}
              </p>
            )}
          </div>

          <div>
            <p
              style={{
                fontFamily: "monospace",
                fontSize: "8px",
                color: "var(--muted, #888)",
                textTransform: "uppercase",
                margin: "0 0 2px",
              }}
            >
              Delivery Address &amp; State Code
            </p>
            <p
              style={{
                fontFamily: "sans-serif",
                fontSize: "11px",
                color: "#ddd",
                whiteSpace: "pre-line",
                margin: 0,
              }}
            >
              {address}
            </p>
            {(city || state || pincode) && (
              <p
                style={{
                  fontFamily: "monospace",
                  fontSize: "10px",
                  color: "#c4a05a",
                  marginTop: "4px",
                  margin: "4px 0 0",
                }}
              >
                {city} {state} {pincode}
              </p>
            )}
          </div>

          {(gstin || companyName) && (
            <div>
              <p
                style={{
                  fontFamily: "monospace",
                  fontSize: "8px",
                  color: "var(--muted, #888)",
                  textTransform: "uppercase",
                  margin: "0 0 2px",
                }}
              >
                Trade Account GST Details
              </p>
              <p
                style={{
                  fontFamily: "monospace",
                  fontSize: "11px",
                  color: "#4ade80",
                  margin: 0,
                }}
              >
                🏢 {companyName || "B2B Trade Account"}
              </p>
              {gstin && (
                <p
                  style={{
                    fontFamily: "monospace",
                    fontSize: "11px",
                    color: "#4ade80",
                    margin: "2px 0 0",
                  }}
                >
                  GSTIN: {gstin}
                </p>
              )}
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSave} style={{ display: "grid", gap: "12px" }}>
          <p
            style={{
              fontFamily: "monospace",
              fontSize: "9px",
              color: "#c4a05a",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              margin: "0 0 4px",
            }}
          >
            Manual Field Editing
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "10px",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontFamily: "monospace",
                  fontSize: "8px",
                  color: "#c4a05a",
                  textTransform: "uppercase",
                  marginBottom: "4px",
                }}
              >
                Customer Full Name
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  background: "#000",
                  border: "1px solid rgba(196,160,90,0.3)",
                  borderRadius: "2px",
                  color: "#fff",
                  fontFamily: "sans-serif",
                  fontSize: "12px",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontFamily: "monospace",
                  fontSize: "8px",
                  color: "#c4a05a",
                  textTransform: "uppercase",
                  marginBottom: "4px",
                }}
              >
                Email Address
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  background: "#000",
                  border: "1px solid rgba(196,160,90,0.3)",
                  borderRadius: "2px",
                  color: "#fff",
                  fontFamily: "monospace",
                  fontSize: "12px",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontFamily: "monospace",
                  fontSize: "8px",
                  color: "#c4a05a",
                  textTransform: "uppercase",
                  marginBottom: "4px",
                }}
              >
                Phone Number
              </label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  background: "#000",
                  border: "1px solid rgba(196,160,90,0.3)",
                  borderRadius: "2px",
                  color: "#fff",
                  fontFamily: "monospace",
                  fontSize: "12px",
                }}
              />
            </div>
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontFamily: "monospace",
                fontSize: "8px",
                color: "#c4a05a",
                textTransform: "uppercase",
                marginBottom: "4px",
              }}
            >
              Shipping / Delivery Address
            </label>
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "8px 10px",
                background: "#000",
                border: "1px solid rgba(196,160,90,0.3)",
                borderRadius: "2px",
                color: "#fff",
                fontFamily: "sans-serif",
                fontSize: "12px",
              }}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "10px",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontFamily: "monospace",
                  fontSize: "8px",
                  color: "#c4a05a",
                  textTransform: "uppercase",
                  marginBottom: "4px",
                }}
              >
                City
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  background: "#000",
                  border: "1px solid rgba(196,160,90,0.3)",
                  borderRadius: "2px",
                  color: "#fff",
                  fontFamily: "sans-serif",
                  fontSize: "12px",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontFamily: "monospace",
                  fontSize: "8px",
                  color: "#c4a05a",
                  textTransform: "uppercase",
                  marginBottom: "4px",
                }}
              >
                State (e.g. KERALA, UTTAR PRADESH)
              </label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  background: "#000",
                  border: "1px solid rgba(196,160,90,0.3)",
                  borderRadius: "2px",
                  color: "#fff",
                  fontFamily: "sans-serif",
                  fontSize: "12px",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontFamily: "monospace",
                  fontSize: "8px",
                  color: "#c4a05a",
                  textTransform: "uppercase",
                  marginBottom: "4px",
                }}
              >
                Pincode (6 digits)
              </label>
              <input
                type="text"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  background: "#000",
                  border: "1px solid rgba(196,160,90,0.3)",
                  borderRadius: "2px",
                  color: "#fff",
                  fontFamily: "monospace",
                  fontSize: "12px",
                }}
              />
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontFamily: "monospace",
                  fontSize: "8px",
                  color: "#c4a05a",
                  textTransform: "uppercase",
                  marginBottom: "4px",
                }}
              >
                Trade Account / Company Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  background: "#000",
                  border: "1px solid rgba(196,160,90,0.3)",
                  borderRadius: "2px",
                  color: "#fff",
                  fontFamily: "sans-serif",
                  fontSize: "12px",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontFamily: "monospace",
                  fontSize: "8px",
                  color: "#c4a05a",
                  textTransform: "uppercase",
                  marginBottom: "4px",
                }}
              >
                Recipient GSTIN (15 characters)
              </label>
              <input
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  background: "#000",
                  border: "1px solid rgba(196,160,90,0.3)",
                  borderRadius: "2px",
                  color: "#fff",
                  fontFamily: "monospace",
                  fontSize: "12px",
                }}
              />
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: "4px",
            }}
          >
            <button
              type="submit"
              disabled={saving}
              style={{
                background: "linear-gradient(135deg, #c4a05a 0%, #d4af37 100%)",
                border: "none",
                color: "#000",
                fontFamily: "monospace",
                fontSize: "10px",
                fontWeight: "bold",
                padding: "8px 18px",
                borderRadius: "2px",
                cursor: saving ? "not-allowed" : "pointer",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving
                ? "Saving Overrides…"
                : "Save Customer & Address Overrides"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
