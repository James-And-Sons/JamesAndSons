"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login, signup } from "./actions";
import { signInWithSocial } from "./social-actions";
import AuthTabs from "./components/AuthTabs";
import {
  KeyRound,
  Lock,
  Mail,
  Building2,
  UserCheck,
  ShieldCheck,
} from "lucide-react";

type Props = {
  searchParams: { message?: string; next?: string };
  referer?: string;
};

export default function ClientLoginPage({ searchParams, referer }: Props) {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [accountType, setAccountType] = useState<"personal" | "business">(
    "personal",
  );
  const [localError, setLocalError] = useState<string | null>(null);
  const [localSuccess, setLocalSuccess] = useState<string | null>(
    searchParams.message || null,
  );
  const [loading, setLoading] = useState(false);

  // Form Field States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [gstin, setGstin] = useState("");

  let nextUrl = searchParams.next || "/";
  const authPages = ["/login", "/forgot-password", "/update-password", "/auth"];
  if (authPages.some((page) => nextUrl.includes(page))) {
    nextUrl = "/";
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setLocalError(null);
    setLocalSuccess(null);

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);
    formData.append("next", nextUrl);

    if (isLogin) {
      const res = await login(formData);
      if (res?.error) {
        setLocalError(res.error);
        setLoading(false);
      } else {
        router.push(nextUrl);
      }
    } else {
      formData.append("firstName", firstName);
      formData.append("lastName", lastName);
      formData.append("accountType", accountType);
      if (accountType === "business") {
        formData.append("companyName", companyName);
        formData.append("gstin", gstin);
      }
      const res = await signup(formData);
      if (res?.error) {
        setLocalError(res.error);
        setLoading(false);
      } else if (res?.success) {
        setLocalSuccess(
          "Account created successfully! Please check your email to verify.",
        );
        setLoading(false);
      } else {
        router.push(nextUrl);
      }
    }
  };

  return (
    <div className="min-h-screen py-16 px-4 bg-background flex items-center justify-center">
      <div className="w-full max-w-md bg-surface border border-border rounded-2xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-serif font-bold text-text">
            {isLogin ? "Welcome Back" : "Join Our Ecosystem"}
          </h1>
          <p className="text-xs text-textMuted">
            {isLogin
              ? "Access your saved quotes, orders, and trade privileges."
              : "Register for D2C shopping or B2B enterprise trade discounts."}
          </p>
        </div>

        <AuthTabs
          isLogin={isLogin}
          accountType={accountType}
          setIsLogin={setIsLogin}
          setAccountType={setAccountType}
        />

        {localError && (
          <div className="p-3 bg-red-950/50 border border-red-800 text-red-300 text-xs rounded-lg text-center font-medium">
            {localError}
          </div>
        )}

        {localSuccess && (
          <div className="p-3 bg-emerald-950/50 border border-emerald-800 text-emerald-300 text-xs rounded-lg text-center font-medium">
            {localSuccess}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-textMuted mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded text-text text-sm focus:outline-none focus:border-gold"
                />
              </div>
              <div>
                <label className="block text-xs text-textMuted mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded text-text text-sm focus:outline-none focus:border-gold"
                />
              </div>
            </div>
          )}

          {!isLogin && accountType === "business" && (
            <>
              <div>
                <label className="block text-xs text-textMuted mb-1">
                  Company / Firm Name
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded text-text text-sm focus:outline-none focus:border-gold"
                />
              </div>
              <div>
                <label className="block text-xs text-textMuted mb-1">
                  GSTIN Number (Optional)
                </label>
                <input
                  type="text"
                  placeholder="27AAAAA0000A1Z5"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded text-text text-sm font-mono focus:outline-none focus:border-gold uppercase"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs text-textMuted mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded text-text text-sm focus:outline-none focus:border-gold"
            />
          </div>

          <div>
            <label className="block text-xs text-textMuted mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded text-text text-sm focus:outline-none focus:border-gold"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gold text-obsidian font-semibold rounded-lg hover:brightness-110 transition-all text-sm shadow-md"
          >
            {loading
              ? "Processing..."
              : isLogin
                ? "Sign In to Account"
                : "Complete Registration"}
          </button>
        </form>
      </div>
    </div>
  );
}
