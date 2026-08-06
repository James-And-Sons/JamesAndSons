"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function PasskeyManagerCard() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [msg, setMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleRegisterPasskey = async () => {
    setIsRegistering(true);
    setMsg(null);

    try {
      const supabase = createClient();
      const { data, error } = await (
        supabase.auth as any
      ).mfa.webauthn.register({
        friendlyName: "Admin Passkey",
      });

      if (error) {
        setMsg({
          type: "error",
          text:
            error.message ||
            "Failed to register passkey. Please ensure device biometrics are supported.",
        });
      } else {
        setMsg({
          type: "success",
          text: "✅ Admin Passkey (Face ID / Touch ID) registered successfully! You can now log in without passwords.",
        });
      }
    } catch (err: any) {
      setMsg({
        type: "error",
        text: err?.message || "Passkey registration failed or cancelled",
      });
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="bg-surface border border-border shadow-sm p-8 rounded-sm space-y-4 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-[20px] text-primary font-light m-0">
            Passkeys & Biometric Security
          </h2>
          <p className="font-body text-[13px] text-muted mt-1 m-0">
            Secure your admin portal with Touch ID, Face ID, Windows Hello, or
            YubiKey hardware keys.
          </p>
        </div>
        <span className="text-2xl">🔑</span>
      </div>

      {msg && (
        <div
          className={`p-3 text-[12px] font-mono rounded-sm border ${
            msg.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}
        >
          {msg.text}
        </div>
      )}

      <div className="pt-2">
        <button
          onClick={handleRegisterPasskey}
          disabled={isRegistering}
          className="btn-primary font-mono text-[10px] uppercase tracking-widest px-5 py-2.5 flex items-center gap-2"
        >
          <span>
            {isRegistering
              ? "Registering..."
              : "+ Register Admin Passkey / Touch ID"}
          </span>
        </button>
      </div>
    </div>
  );
}
