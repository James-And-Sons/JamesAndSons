"use client";

import React from "react";

interface AuthTabsProps {
  isLogin: boolean;
  accountType: "personal" | "business";
  setIsLogin: (val: boolean) => void;
  setAccountType: (val: "personal" | "business") => void;
}

export default function AuthTabs({
  isLogin,
  accountType,
  setIsLogin,
  setAccountType,
}: AuthTabsProps) {
  return (
    <div className="space-y-4 mb-6">
      {/* Login vs Signup Switcher */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setIsLogin(true)}
          className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 ${
            isLogin
              ? "border-gold text-gold font-serif text-base"
              : "border-transparent text-textMuted hover:text-text"
          }`}
        >
          Sign In
        </button>
        <button
          onClick={() => setIsLogin(false)}
          className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 ${
            !isLogin
              ? "border-gold text-gold font-serif text-base"
              : "border-transparent text-textMuted hover:text-text"
          }`}
        >
          Create Account
        </button>
      </div>

      {/* Account Type Switcher (Only during Register) */}
      {!isLogin && (
        <div className="grid grid-cols-2 gap-3 bg-surface2/60 p-1.5 rounded-lg border border-border">
          <button
            type="button"
            onClick={() => setAccountType("personal")}
            className={`py-2 text-xs font-semibold rounded-md transition-all ${
              accountType === "personal"
                ? "bg-gold text-obsidian shadow-sm font-bold"
                : "text-textMuted hover:text-text"
            }`}
          >
            Personal (D2C)
          </button>
          <button
            type="button"
            onClick={() => setAccountType("business")}
            className={`py-2 text-xs font-semibold rounded-md transition-all ${
              accountType === "business"
                ? "bg-gold text-obsidian shadow-sm font-bold"
                : "text-textMuted hover:text-text"
            }`}
          >
            B2B Trade & Corporate
          </button>
        </div>
      )}
    </div>
  );
}
