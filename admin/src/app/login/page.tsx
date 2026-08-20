"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { loginAction } from "./action";

function LoginForm() {
  const searchParams = useSearchParams();
  const urlMessage = searchParams.get("message");
  const redirectTo = searchParams.get("redirectTo") || "/";

  const [error, setError] = useState<string | null>(urlMessage || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (urlMessage) {
      setError(urlMessage);
    }
  }, [urlMessage]);

  async function handlePasskeySignIn() {
    setLoading(true);
    setError(null);
    try {
      const { createClient } = await import("@/utils/supabase/client");
      const supabase = createClient();
      const { error: passkeyErr } = await (
        supabase.auth.mfa.webauthn as any
      ).authenticate({});
      if (passkeyErr) {
        setError(passkeyErr.message || "Passkey sign-in failed");
        setLoading(false);
      } else {
        window.location.href = redirectTo;
      }
    } catch (err: any) {
      setError(err?.message || "Passkey sign-in cancelled");
      setLoading(false);
    }
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await loginAction(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0A0905] overflow-y-auto">
      {/* Background Ambience */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-[#C9A84C]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#C9A84C]/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative w-full max-w-[440px]">
        {/* Brand Header */}
        <div className="text-center mb-12">
          <h2 className="font-serif text-[32px] font-light text-[#F0E8D5] tracking-[0.2em] mb-2 uppercase">
            JAMES & SONS
          </h2>
          <div className="h-px w-12 bg-[#C9A84C]/40 mx-auto mb-4" />
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#C9A84C] opacity-80">
            Administrator Portal
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[#141209]/80 backdrop-blur-xl border border-[rgba(201,168,76,0.15)] rounded-2xl p-8 lg:p-10 shadow-2xl">
          <div className="mb-10">
            <h1 className="font-serif text-2xl text-[#F0E8D5] font-light mb-1">
              Welcome Back
            </h1>
            <p className="text-[13px] text-[#7A7060]">
              Secure entry for authorized personnel only.
            </p>
          </div>

          <form action={handleSubmit} className="space-y-6">
            <input type="hidden" name="redirectTo" value={redirectTo} />
            {error && (
              <div className="bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#ef4444] text-[12px] p-4 rounded-xl text-center">
                {error}
              </div>
            )}

            {/* Passkey Sign In Button */}
            <button
              type="button"
              onClick={handlePasskeySignIn}
              disabled={loading}
              className="w-full bg-[#1c1a11] border border-[#C9A84C]/40 text-[#C9A84C] font-mono text-[11px] uppercase tracking-[0.2em] py-4 rounded-xl hover:bg-[#C9A84C]/10 transition-all font-bold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>🔑</span> Sign in with Passkey / Face ID
            </button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[rgba(201,168,76,0.1)]"></div>
              </div>
              <div className="relative flex justify-center text-[9px] uppercase tracking-widest">
                <span className="bg-[#141209] px-3 text-[#7A7060]">
                  Or use Password
                </span>
              </div>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#C9A84C] block ml-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  className="w-full bg-[#0A0905] border border-[rgba(201,168,76,0.1)] rounded-xl px-5 py-4 text-[14px] text-[#F0E8D5] focus:outline-none focus:border-[#C9A84C] transition-all placeholder:text-[#3A3528]"
                  placeholder="Enter your email"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#C9A84C] block">
                    Password
                  </label>
                  <a
                    href="/forgot-password"
                    className="text-[10px] text-[#7A7060] hover:text-[#C9A84C] transition-colors"
                  >
                    Forgot?
                  </a>
                </div>
                <input
                  type="password"
                  name="password"
                  required
                  className="w-full bg-[#0A0905] border border-[rgba(201,168,76,0.1)] rounded-xl px-5 py-4 text-[14px] text-[#F0E8D5] focus:outline-none focus:border-[#C9A84C] transition-all placeholder:text-[#3A3528]"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#C9A84C] text-[#0A0905] font-mono text-[11px] uppercase tracking-[0.2em] py-4 rounded-xl hover:bg-[#E2C97A] transition-all font-bold disabled:opacity-50 active:scale-[0.98]"
            >
              {loading ? "Authenticating..." : "Access Dashboard"}
            </button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[rgba(201,168,76,0.1)]"></div>
              </div>
              <div className="relative flex justify-center text-[9px] uppercase tracking-widest">
                <span className="bg-[#141209] px-4 text-[#7A7060]">
                  Secure Entry
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                import("./social-actions").then((m) =>
                  m.signInWithSocial("google"),
                )
              }
              className="w-full bg-transparent border border-[rgba(255,255,255,0.05)] py-4 rounded-xl flex items-center justify-center gap-3 hover:bg-[rgba(255,255,255,0.02)] transition-all group"
            >
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                ></path>
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                ></path>
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  fill="#FBBC05"
                ></path>
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                ></path>
              </svg>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#F0E8D5] group-hover:text-[#C9A84C] transition-colors">
                Google Workspace
              </span>
            </button>
          </form>
        </div>

        <p className="text-center font-mono text-[9px] uppercase tracking-[0.2em] text-[#7A7060] mt-12 opacity-50">
          &copy; {new Date().getFullYear()} James & Sons Internal · Security
          Version 2.4.0
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0A0905] text-[#F0E8D5] font-mono text-[12px]">
          Loading Portal...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
