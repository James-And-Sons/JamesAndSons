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
  const memberYear = dbUser?.createdAt
    ? new Date(dbUser.createdAt).getFullYear()
    : new Date().getFullYear();

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

      // Save to DB
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

  const displayName = `${firstName} ${lastName}`.trim();
  const initials = `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase();

  return (
    <div
      className="relative p-5 sm:p-8 rounded-[24px] border border-border overflow-hidden shadow-xl"
      style={{
        background:
          "linear-gradient(150deg, #1a160a 0%, #0d0b06 100%), var(--surface)",
      }}
    >
      {/* Ambient Radial Glow Effect */}
      <div
        className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(201,168,76,0.15) 0%, transparent 70%)",
        }}
      />

      <div className="relative flex flex-col gap-5">
        {/* Top Section: Avatar & Details */}
        <div className="flex items-center gap-4">
          <div className="relative group flex-shrink-0">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[rgba(196,160,90,0.13)] border-[1.5px] border-[rgba(196,160,90,0.35)] flex items-center justify-center font-serif text-xl font-bold text-[var(--gold-light)] overflow-hidden shadow-md">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={displayName}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                  sizes="64px"
                />
              ) : (
                initials
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              title="Upload Profile Picture"
            >
              {uploadingAvatar ? (
                <Loader2 size={16} className="text-white animate-spin" />
              ) : (
                <Camera size={16} className="text-white" />
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

          <div className="min-w-0 flex-1">
            {!isEditing ? (
              <>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-2xl font-serif font-medium text-[var(--cream)] truncate">
                    {displayName}
                  </h2>
                </div>
                <div className="text-xs text-[var(--text-muted)] flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 font-mono truncate">
                  <span className="truncate">{email}</span>
                  {phone && <span>• {phone}</span>}
                  {companyName && (
                    <span className="text-[var(--gold)] flex items-center gap-1 font-semibold">
                      <Building2 size={12} /> {companyName}
                    </span>
                  )}
                </div>
              </>
            ) : null}

            {/* Member Status Pill */}
            {!isEditing && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--green)] shrink-0" />
                <div className="text-[10px] sm:text-[11px] font-mono text-[var(--green)] tracking-wider uppercase truncate">
                  {isB2B ? "B2B Trade Partner" : "Personal Account"} · Member
                  since {memberYear}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Control Toolbar: Wraps Naturally on Mobile without Overflow */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--border)]/40">
          <div className="overflow-x-auto max-w-full">
            <ThemeToggle />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wider border border-[var(--border)] rounded-lg text-[var(--text-muted)] hover:text-[var(--gold)] hover:border-[var(--border-gold)] transition-colors cursor-pointer"
              >
                <Edit3 size={13} />
                Edit
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  disabled={isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wider bg-[var(--gold)] text-black rounded-lg font-bold hover:brightness-110 transition-all disabled:opacity-50 cursor-pointer"
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
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono uppercase border border-[var(--border)] rounded-lg text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer"
                >
                  <X size={13} />
                </button>
              </div>
            )}
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="px-3 py-1.5 text-xs font-mono uppercase tracking-wider border border-[var(--border)] rounded-lg text-[var(--text-muted)] hover:text-red-400 hover:bg-[var(--surface2)] transition-colors cursor-pointer"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Inline Edit Form */}
      {isEditing && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-[var(--border)]">
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] mb-1">
              First Name
            </label>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--cream)] focus:outline-none focus:border-[var(--gold)]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] mb-1">
              Last Name
            </label>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--cream)] focus:outline-none focus:border-[var(--gold)]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] mb-1">
              Phone Number
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="9876543210"
              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--cream)] focus:outline-none focus:border-[var(--gold)]"
            />
          </div>
        </div>
      )}

      {saveMsg === "success" && (
        <div className="mt-3 text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
          <Check size={12} /> Profile updated successfully.
        </div>
      )}
      {saveMsg === "error" && (
        <div className="mt-3 text-[11px] font-mono text-red-400">
          Failed to save profile changes.
        </div>
      )}
    </div>
  );
}
