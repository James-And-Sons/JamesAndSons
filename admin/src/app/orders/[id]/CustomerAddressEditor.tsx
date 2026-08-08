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

  const [customerName, setCustomerName] = useState(initialName);
  const [customerEmail, setCustomerEmail] = useState(initialEmail);
  const [customerPhone, setCustomerPhone] = useState(initialPhone || "");
  const [address, setAddress] = useState(initialAddress);
  const [city, setCity] = useState(initialCity || "");
  const [state, setState] = useState(initialState || "");
  const [pincode, setPincode] = useState(initialPincode || "");
  const [companyName, setCompanyName] = useState(initialCompanyName || "");
  const [gstin, setGstin] = useState(initialGstin || "");

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
        border: "1px solid rgba(196,160,90,0.2)",
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
          borderBottom: "1px solid rgba(196,160,90,0.1)",
          paddingBottom: "10px",
        }}
      >
        <div>
          <h3
            style={{
              fontFamily: "monospace",
              fontSize: "10px",
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
              ⚠ Amazon Restricted PII: Manual inputs entered here automatically
              override placeholders on Tax Invoices &amp; Shipping Labels.
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsEditing(!isEditing)}
          style={{
            background: isEditing
              ? "rgba(248,113,113,0.1)"
              : "rgba(196,160,90,0.15)",
            border: `1px solid ${isEditing ? "rgba(248,113,113,0.3)" : "rgba(196,160,90,0.3)"}`,
            color: isEditing ? "#f87171" : "#c4a05a",
            fontFamily: "monospace",
            fontSize: "9px",
            fontWeight: "bold",
            padding: "6px 12px",
            borderRadius: "2px",
            cursor: "pointer",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          {isEditing ? "✕ Cancel" : "✏ Edit Customer & Address"}
        </button>
      </div>

      {successMsg && (
        <div
          style={{
            background: "rgba(74,222,128,0.08)",
            border: "1px solid rgba(74,222,128,0.3)",
            color: "#4ade80",
            padding: "8px 12px",
            borderRadius: "2px",
            fontFamily: "monospace",
            fontSize: "10px",
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
            padding: "8px 12px",
            borderRadius: "2px",
            fontFamily: "monospace",
            fontSize: "10px",
            marginBottom: "12px",
          }}
        >
          ⚠ {errorMsg}
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
                State (e.g. Kerala, UP)
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
