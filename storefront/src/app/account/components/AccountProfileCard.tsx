"use client";

import React, { useRef, useState, useTransition } from "react";
import Image from "next/image";
import {
  Camera,
  Check,
  X,
  Building2,
  Mail,
  Phone,
  Edit3,
  Loader2,
  Package,
  MapPin,
  Ticket,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { updateProfileAction } from "../actions";

interface AccountProfileCardProps {
  user: any;
  dbUser: any;
  isB2B: boolean;
  totalOrderCount: number;
  addressCount: number;
  ticketCount: number;
}

export default function AccountProfileCard({
  user,
  dbUser,
  isB2B,
  totalOrderCount,
  addressCount,
  ticketCount,
}: AccountProfileCardProps) {
  const meta = user.user_metadata || {};
  const [firstName, setFirstName] = useState(
    dbUser?.firstName ||
      meta.first_name ||
      meta.name?.split(" ")[0] ||
      "Valued",
  );
  const [lastName, setLastName] = useState(
    dbUser?.lastName ||
      meta.last_name ||
      meta.name?.split(" ")[1] ||
      "Customer",
  );
  const [phone, setPhone] = useState(dbUser?.phone || meta.phone || "");
  const [avatarUrl, setAvatarUrl] = useState(dbUser?.avatarUrl || null);
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saveMsg, setSaveMsg] = useState<"success" | "error" | null>(null);

  const email = dbUser?.email || user.email;
  const companyName = dbUser?.company?.name || meta.company_name;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);

    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
      const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY!;
      const uploadPreset =
        process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default";
      const timestamp = Math.floor(Date.now() / 1000);

      const paramsToSign = { timestamp, upload_preset: uploadPreset };
      const sigRes = await fetch("/api/sign-cloudinary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paramsToSign }),
      });
      const { signature } = await sigRes.json();

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", apiKey);
      formData.append("timestamp", timestamp.toString());
      formData.append("signature", signature);
      formData.append("upload_preset", uploadPreset);

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: "POST", body: formData },
      );
      const data = await uploadRes.json();
      const newUrl = data.secure_url as string;
      setAvatarUrl(newUrl);

      // Persist to DB immediately
      await updateProfileAction({ avatarUrl: newUrl });
    } catch (err) {
      console.error("Avatar upload error:", err);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = () => {
    startTransition(async () => {
      const res = await updateProfileAction({ firstName, lastName, phone });
      if (res.success) {
        setSaveMsg("success");
        setIsEditing(false);
        setTimeout(() => setSaveMsg(null), 3000);
      } else {
        setSaveMsg("error");
      }
    });
  };

  const handleCancel = () => {
    setFirstName(dbUser?.firstName || meta.first_name || "Valued");
    setLastName(dbUser?.lastName || meta.last_name || "Customer");
    setPhone(dbUser?.phone || "");
    setIsEditing(false);
    setSaveMsg(null);
  };

  const initials = `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase();

  return (
    <div className="relative bg-surface/90 border border-border/50 rounded-3xl p-6 sm:p-8 md:p-10 shadow-lg shadow-black/5 transition-all duration-300">
      {/* Soft Ambient Header Backdrop */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        {/* User Identity & Avatar */}
        <div className="flex items-center gap-5 sm:gap-6">
          <div className="relative group flex-shrink-0">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-gold/30 overflow-hidden bg-surface2 flex items-center justify-center shadow-md">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={`${firstName} ${lastName}`}
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                  sizes="96px"
                />
              ) : (
                <span className="text-2xl font-serif font-bold text-gold">
                  {initials}
                </span>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer"
              title="Upload Profile Picture"
            >
              {uploadingAvatar ? (
                <Loader2 size={18} className="text-white animate-spin" />
              ) : (
                <Camera size={18} className="text-white" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>

          <div>
            {!isEditing ? (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-serif font-medium text-text tracking-wide">
                    {firstName} {lastName}
                  </h1>
                  {isB2B && (
                    <span className="px-2.5 py-0.5 text-[10px] uppercase font-mono font-bold bg-gold/15 text-gold border border-gold/30 rounded-full">
                      B2B Trade Partner
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-textMuted mt-2 font-mono">
                  <span className="flex items-center gap-1.5">
                    <Mail size={13} className="text-gold/70" />
                    {email}
                  </span>
                  {phone && (
                    <span className="flex items-center gap-1.5">
                      <Phone size={13} className="text-gold/70" />
                      {phone}
                    </span>
                  )}
                  {companyName && (
                    <span className="flex items-center gap-1.5 font-semibold text-gold">
                      <Building2 size={13} />
                      {companyName}
                    </span>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>

        {/* Action Controls & Theme Toggle */}
        <div className="flex items-center gap-3 self-end md:self-center">
          <ThemeToggle />
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 text-xs font-mono uppercase tracking-wider border border-border rounded-xl text-textMuted hover:text-gold hover:border-gold/40 transition-all duration-300"
            >
              <Edit3 size={13} />
              Edit Profile
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                disabled={isPending}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-mono uppercase tracking-wider bg-gold text-obsidian rounded-xl font-semibold hover:brightness-110 transition-all duration-300 disabled:opacity-50"
              >
                {isPending ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Check size={13} />
                )}
                Save
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-mono uppercase tracking-wider border border-border rounded-xl text-textMuted hover:text-text transition-colors"
              >
                <X size={13} />
              </button>
            </div>
          )}
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="px-4 py-2 text-xs font-mono uppercase tracking-wider border border-border rounded-xl text-textMuted hover:text-red-400 hover:border-red-400/30 hover:bg-red-400/5 transition-all duration-300"
            >
              Sign Out
            </button>
          </form>
        </div>
      </div>

      {/* Inline Edit Form */}
      {isEditing && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-border/40">
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-textMuted mb-1.5">
              First Name
            </label>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full bg-background/80 border border-border/60 rounded-xl px-4 py-2.5 text-sm text-text focus:outline-none focus:border-gold/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-textMuted mb-1.5">
              Last Name
            </label>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full bg-background/80 border border-border/60 rounded-xl px-4 py-2.5 text-sm text-text focus:outline-none focus:border-gold/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-textMuted mb-1.5">
              Phone Number
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="9876543210"
              className="w-full bg-background/80 border border-border/60 rounded-xl px-4 py-2.5 text-sm text-text focus:outline-none focus:border-gold/50 transition-colors"
            />
          </div>
        </div>
      )}

      {saveMsg === "success" && (
        <div className="mt-4 text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
          <Check size={12} /> Profile saved successfully.
        </div>
      )}
      {saveMsg === "error" && (
        <div className="mt-4 text-[11px] font-mono text-red-400">
          Failed to save changes.
        </div>
      )}

      {/* Integrated Soft Summary Badges Strip */}
      <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-6 pt-6 border-t border-border/40 text-xs font-mono text-textMuted">
        <span className="flex items-center gap-2 bg-surface2/60 px-4 py-1.5 rounded-full border border-border/40">
          <Package size={14} className="text-gold" />
          <strong className="text-text font-bold">
            {totalOrderCount}
          </strong>{" "}
          Orders
        </span>
        <span className="flex items-center gap-2 bg-surface2/60 px-4 py-1.5 rounded-full border border-border/40">
          <MapPin size={14} className="text-gold" />
          <strong className="text-text font-bold">{addressCount}</strong>{" "}
          Addresses
        </span>
        <span className="flex items-center gap-2 bg-surface2/60 px-4 py-1.5 rounded-full border border-border/40">
          <Ticket size={14} className="text-gold" />
          <strong className="text-text font-bold">{ticketCount}</strong> Support
          Tickets
        </span>
      </div>
    </div>
  );
}
