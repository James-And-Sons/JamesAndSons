"use client";

import { useState, useTransition } from "react";
import { updateOrderAddressAction } from "../actions";

interface EditableShippingAddressProps {
  orderId: string;
  initialAddress: string;
  initialCity?: string | null;
  initialState?: string | null;
  initialPincode?: string | null;
  initialPhone?: string | null;
}

export default function EditableShippingAddress({
  orderId,
  initialAddress,
  initialCity = "",
  initialState = "",
  initialPincode = "",
  initialPhone = "",
}: EditableShippingAddressProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [address, setAddress] = useState(initialAddress);
  const [city, setCity] = useState(initialCity || "");
  const [state, setState] = useState(initialState || "");
  const [pincode, setPincode] = useState(initialPincode || "");
  const [phone, setPhone] = useState(initialPhone || "");

  const handleSave = () => {
    startTransition(async () => {
      const res = await updateOrderAddressAction(orderId, {
        shippingAddress: address,
        shippingCity: city,
        shippingState: state,
        shippingPincode: pincode,
        shippingPhone: phone,
      });

      if (res.success) {
        setIsEditing(false);
        alert(
          "✅ Shipping Address updated successfully! Printable label updated.",
        );
      } else {
        alert("Failed to update address: " + (res.error || "Unknown error"));
      }
    });
  };

  return (
    <div className="bg-surface border border-border p-6">
      <div className="flex justify-between items-center border-b border-border pb-2 mb-4">
        <h3 className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted m-0">
          Shipping Address
        </h3>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="font-mono text-[8px] uppercase tracking-widest text-accent hover:underline focus:outline-none"
        >
          {isEditing ? "Cancel" : "✏️ Edit Address"}
        </button>
      </div>

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
            <p className="font-mono text-[11px] text-muted">Phone: {phone}</p>
          )}
        </div>
      ) : (
        <div className="space-y-3 text-left">
          <div>
            <label className="block font-mono text-[8px] uppercase text-muted mb-1">
              Street / House No. &amp; Building Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-background border border-border px-2.5 py-1.5 text-[12px] font-body text-primary rounded focus:border-accent outline-none"
              placeholder="e.g. 123 Panchwati Road, Opposite City Park"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-mono text-[8px] uppercase text-muted mb-1">
                City
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-background border border-border px-2.5 py-1.5 text-[12px] font-mono text-primary rounded focus:border-accent outline-none"
                placeholder="Udaipur"
              />
            </div>
            <div>
              <label className="block font-mono text-[8px] uppercase text-muted mb-1">
                State
              </label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full bg-background border border-border px-2.5 py-1.5 text-[12px] font-mono text-primary rounded focus:border-accent outline-none"
                placeholder="Rajasthan"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-mono text-[8px] uppercase text-muted mb-1">
                Pincode
              </label>
              <input
                type="text"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                className="w-full bg-background border border-border px-2.5 py-1.5 text-[12px] font-mono text-primary rounded focus:border-accent outline-none"
                placeholder="313001"
              />
            </div>
            <div>
              <label className="block font-mono text-[8px] uppercase text-muted mb-1">
                Phone
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-background border border-border px-2.5 py-1.5 text-[12px] font-mono text-primary rounded focus:border-accent outline-none"
                placeholder="9810098100"
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={isPending}
            className="w-full font-mono text-[9px] uppercase tracking-widest px-3 py-2 bg-accent text-black hover:bg-accent/90 transition-colors disabled:opacity-50 font-bold"
          >
            {isPending ? "Saving Address..." : "Save Shipping Address"}
          </button>
        </div>
      )}
    </div>
  );
}
