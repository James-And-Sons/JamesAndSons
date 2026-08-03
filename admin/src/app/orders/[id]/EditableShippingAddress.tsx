interface ShippingAddressProps {
  orderId: string;
  initialAddress: string;
  initialCity?: string | null;
  initialState?: string | null;
  initialPincode?: string | null;
  initialPhone?: string | null;
}

export default function EditableShippingAddress({
  initialAddress,
  initialCity = "",
  initialState = "",
  initialPincode = "",
  initialPhone = "",
}: ShippingAddressProps) {
  return (
    <div className="bg-surface border border-border p-6">
      <div className="flex justify-between items-center border-b border-border pb-2 mb-4">
        <h3 className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted m-0">
          Shipping Address
        </h3>
        <span className="font-mono text-[8px] uppercase tracking-widest text-muted">
          🔒 Verified
        </span>
      </div>

      <div className="space-y-1">
        <p className="font-body text-[13px] text-secondary leading-relaxed font-semibold">
          {initialAddress}
        </p>
        {(initialCity || initialState || initialPincode) && (
          <p className="font-mono text-[11px] text-muted">
            {[initialCity, initialState].filter(Boolean).join(", ")}{" "}
            {initialPincode ? `- ${initialPincode}` : ""}
          </p>
        )}
        {initialPhone && (
          <p className="font-mono text-[11px] text-muted">
            Phone: {initialPhone}
          </p>
        )}
      </div>
    </div>
  );
}
