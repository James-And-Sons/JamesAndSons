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
        friendlyName: "Customer Passkey",
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
          text: "✅ Passkey registered successfully! You can now log in using Face ID or Touch ID.",
        });
      }
    } catch (err: any) {
      setMsg({
        type: "error",
        text: err?.message || "Passkey registration cancelled or unsupported",
      });
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="space-y-4 font-sans">
      {msg && (
        <div
          className={`p-3.5 text-xs font-mono rounded-xl border ${
            msg.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}
        >
          {msg.text}
        </div>
      )}

      <button
        onClick={handleRegisterPasskey}
        disabled={isRegistering}
        className="w-full py-3 bg-gradient-to-r from-gold to-gold-light text-obsidian font-mono text-xs uppercase tracking-wider font-bold rounded-xl shadow-md hover:brightness-110 transition-all cursor-pointer disabled:opacity-50"
      >
        {isRegistering
          ? "Prompting Biometrics..."
          : "+ Register Touch ID / Face ID Passkey"}
      </button>
    </div>
  );
}
