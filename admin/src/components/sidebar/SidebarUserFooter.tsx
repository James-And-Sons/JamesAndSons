"use client";

import React, { useEffect, useState } from "react";
import { logoutAction } from "@/app/actions";
import { createClient } from "@/utils/supabase/client";
import { LogOut, User, ShieldCheck } from "lucide-react";

export default function SidebarUserFooter() {
  const [userEmail, setUserEmail] = useState<string>("admin@jamesandsons.in");
  const [userName, setUserName] = useState<string>("Store Administrator");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        if (data.user.email) setUserEmail(data.user.email);
        const name =
          data.user.user_metadata?.full_name || data.user.user_metadata?.name;
        if (name) setUserName(name);
      }
    });
  }, []);

  const handleLogout = async () => {
    await logoutAction();
  };

  const initial = (userName || userEmail || "A")[0].toUpperCase();

  return (
    <div className="p-3.5 border-t border-border bg-surface/80 backdrop-blur-md space-y-3 shrink-0">
      {/* User Info Card */}
      <div className="flex items-center gap-3 px-1 py-1">
        <div className="w-9 h-9 rounded-full bg-accent/15 border border-accent/40 text-accent font-serif font-bold text-sm flex items-center justify-center shrink-0 shadow-sm">
          {initial}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h4 className="font-serif text-xs font-semibold text-primary truncate">
              {userName}
            </h4>
            <ShieldCheck size={12} className="text-accent shrink-0" />
          </div>
          <p className="font-mono text-[9px] text-muted truncate">
            {userEmail}
          </p>
        </div>
      </div>

      {/* Premium Sign Out Button */}
      <button
        type="button"
        onClick={handleLogout}
        className="w-full px-3 py-2 text-[10px] font-mono tracking-[0.14em] uppercase text-[#C97E6A] bg-[#C97E6A]/10 border border-[#C97E6A]/30 hover:bg-[#C97E6A]/20 transition-all rounded-sm flex items-center justify-between cursor-pointer font-medium group"
      >
        <span className="flex items-center gap-2">
          <LogOut
            size={13}
            className="text-[#C97E6A] group-hover:-translate-x-0.5 transition-transform"
          />
          <span>Sign Out</span>
        </span>
        <span
          className="group-hover:translate-x-0.5 transition-transform"
          aria-hidden="true"
        >
          ➔
        </span>
      </button>
    </div>
  );
}
