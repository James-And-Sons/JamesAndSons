"use client";

import { useState, useEffect } from "react";

export default function CaEmailSettingsForm() {
  const [caEmail, setCaEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [msg, setMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/accounting/ca-email")
      .then((res) => res.json())
      .then((data) => {
        if (data.caEmail) setCaEmail(data.caEmail);
      })
      .catch((err) => console.error(err));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMsg(null);

    try {
      const res = await fetch("/api/accounting/ca-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caEmail }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg({
          type: "success",
          text: `CA Email updated to ${data.caEmail}. Quarterly GST reports will be sent here.`,
        });
      } else {
        setMsg({
          type: "error",
          text: data.error || "Failed to save CA Email",
        });
      }
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Network error" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-surface border border-border shadow-sm p-8 rounded-sm space-y-4">
      <div>
        <h2 className="font-serif text-[20px] text-primary m-0">
          Chartered Accountant (CA) Email Settings
        </h2>
        <p className="font-body text-[13px] text-muted mt-1">
          Automated GST Quarterly reports are compiled on tax filing dates and
          dispatched to{" "}
          <strong className="text-primary">accounts@jamesandsons.in</strong> and
          your designated CA email.
        </p>
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

      <form
        onSubmit={handleSave}
        className="flex flex-col sm:flex-row gap-3 max-w-xl"
      >
        <input
          type="email"
          required
          placeholder="e.g. ca.firm@taxconsultants.com"
          value={caEmail}
          onChange={(e) => setCaEmail(e.target.value)}
          className="flex-1 bg-background border border-border px-4 py-2.5 text-[14px] text-primary font-mono focus:outline-none focus:border-accent rounded-sm"
        />
        <button
          type="submit"
          disabled={isSaving}
          className="btn-primary font-mono text-[10px] uppercase tracking-widest px-6 py-2.5 disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save CA Email ↗"}
        </button>
      </form>
    </div>
  );
}
