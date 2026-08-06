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
      const { data, error } = await supabase.auth.addPasskey();

      if (error) {
        setMsg({
          type: "error",
          text: error.message || "Failed to register passkey",
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
    <div className="bg-[#0a0a0b] border border-[#C97E6A]/30 p-6 rounded-sm space-y-3 font-sans text-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔑</span>
          <div>
            <h3 className="font-serif text-[18px] text-white font-medium m-0">
              Biometric Passkeys
            </h3>
            <p className="font-mono text-[11px] text-gray-400 m-0">
              Sign in instantly using Touch ID, Face ID, or your device security
              key.
            </p>
          </div>
        </div>
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

      <button
        onClick={handleRegisterPasskey}
        disabled={isRegistering}
        className="w-full py-2.5 bg-gradient-to-r from-[#C97E6A] to-[#b36754] text-white font-mono text-[10px] uppercase tracking-widest font-bold rounded-xs shadow hover:brightness-110 transition-all cursor-pointer disabled:opacity-50"
      >
        {isRegistering
          ? "Prompting Biometrics..."
          : "+ Add Touch ID / Face ID Passkey"}
      </button>
    </div>
  );
}
