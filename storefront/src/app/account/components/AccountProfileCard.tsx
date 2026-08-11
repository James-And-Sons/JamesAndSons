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
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { updateProfileAction } from "../actions";

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
  const memberSince = dbUser?.createdAt
    ? new Date(dbUser.createdAt).toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
      })
    : null;

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
    <div className="relative bg-surface border border-border rounded-2xl overflow-hidden shadow-lg">
      {/* Gold gradient banner strip */}
      <div
        className="h-24 sm:h-28 w-full"
        style={{
          background:
            "linear-gradient(135deg, var(--gold) 0%, transparent 70%), var(--surface2)",
          opacity: 0.55,
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
        }}
      />

      <div className="relative px-6 pt-6 pb-6">
        {/* Top Row: Avatar + Actions */}
        <div className="flex items-start justify-between gap-4">
          {/* Avatar */}
          <div className="relative group flex-shrink-0 mt-1">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-gold/60 overflow-hidden bg-gold/20 flex items-center justify-center shadow-lg">
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
            {/* Upload overlay */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              title="Change profile picture"
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

          {/* Right actions */}
          <div className="flex items-center gap-2 mt-1">
            <ThemeToggle />
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded-lg text-textMuted hover:text-gold hover:border-gold/40 transition-colors"
              >
                <Edit3 size={12} />
                Edit
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  disabled={isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gold text-obsidian rounded-lg font-semibold hover:brightness-110 transition-all disabled:opacity-50"
                >
                  {isPending ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Check size={12} />
                  )}
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-1.5 px-2 py-1.5 text-xs border border-border rounded-lg text-textMuted hover:text-text transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
            )}
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="px-3 py-1.5 text-xs border border-border rounded-lg text-textMuted hover:text-red-400 hover:border-red-400/30 hover:bg-red-400/5 transition-colors"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>

        {/* Name & Details */}
        <div className="mt-4">
          {!isEditing ? (
            <>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-text">
                  {firstName} {lastName}
                </h2>
                {isB2B && (
                  <span className="px-2 py-0.5 text-[9px] uppercase font-mono font-bold bg-gold text-obsidian rounded">
                    B2B Trade Partner
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-textMuted mt-1">
                <span className="flex items-center gap-1.5">
                  <Mail size={11} className="text-gold/70" />
                  {email}
                </span>
                {phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone size={11} className="text-gold/70" />
                    {phone}
                  </span>
                )}
                {companyName && (
                  <span className="flex items-center gap-1.5 font-semibold text-gold">
                    <Building2 size={11} />
                    {companyName}
                  </span>
                )}
              </div>
              {memberSince && (
                <p className="text-[10px] font-mono text-textMuted mt-2 uppercase tracking-widest">
                  Member since {memberSince}
                </p>
              )}
            </>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-textMuted mb-1">
                  First Name
                </label>
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-gold/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-textMuted mb-1">
                  Last Name
                </label>
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-gold/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-textMuted mb-1">
                  Phone Number
                </label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9876543210"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-gold/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-textMuted mb-1">
                  Email Address
                </label>
                <input
                  value={email}
                  disabled
                  className="w-full bg-surface2 border border-border/50 rounded-lg px-3 py-2 text-sm text-textMuted cursor-not-allowed"
                />
              </div>
            </div>
          )}

          {saveMsg === "success" && (
            <div className="mt-3 text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
              <Check size={11} /> Profile updated successfully.
            </div>
          )}
          {saveMsg === "error" && (
            <div className="mt-3 text-[11px] font-mono text-red-400">
              Failed to save. Please try again.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
