"use client";

import React from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { User, Building2, ShieldCheck, Mail, Phone } from "lucide-react";

interface AccountProfileCardProps {
  user: any;
  dbUser: any;
  isB2B: boolean;
}

export default function AccountProfileCard({
  user,
  dbUser,
  isB2B,
}: AccountProfileCardProps) {
  const meta = user.user_metadata || {};
  const firstName =
    dbUser?.firstName ||
    meta.first_name ||
    meta.name?.split(" ")[0] ||
    "Valued";
  const lastName =
    dbUser?.lastName ||
    meta.last_name ||
    meta.name?.split(" ")[1] ||
    "Customer";
  const email = dbUser?.email || user.email;
  const companyName = dbUser?.company?.name || meta.company_name;

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 shadow-md">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gold/20 text-gold flex items-center justify-center text-xl font-bold font-serif border border-gold/40">
            {firstName[0]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-serif font-bold text-text">
                {firstName} {lastName}
              </h2>
              {isB2B && (
                <span className="px-2 py-0.5 text-[10px] uppercase font-mono font-bold bg-gold text-obsidian rounded">
                  B2B Trade Partner
                </span>
              )}
            </div>
            <div className="text-xs text-textMuted flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1">
                <Mail size={12} /> {email}
              </span>
              {companyName && (
                <span className="flex items-center gap-1 font-semibold text-gold">
                  <Building2 size={12} /> {companyName}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="px-3 py-1.5 text-xs border border-border rounded text-textMuted hover:text-red-400 hover:bg-surface2 transition-colors"
            >
              Sign Out
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
