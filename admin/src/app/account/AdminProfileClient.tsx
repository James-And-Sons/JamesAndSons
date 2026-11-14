"use client";

import React, { useRef, useState, useTransition } from "react";
import Image from "next/image";
import {
  Camera,
  Loader2,
  Settings,
  Store,
  FileText,
  BookOpen,
  Search,
  Mail,
  Shield,
  User,
  Check,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@james-andsons/ui";
import PasskeyManagerCard from "@/components/PasskeyManagerCard";
import PWAInstallButton from "@/components/PWAInstallButton";
import PwaInstallHelper from "@/components/PwaInstallHelper";
import CaEmailSettingsForm from "./CaEmailSettingsForm";
import BrandSettingsForm from "./BrandSettingsForm";
import DocumentDownloadSettingsForm from "./DocumentDownloadSettingsForm";
import CataloguesClient from "../catalogues/CataloguesClient";
import { adminTogglePagePublishStatus } from "./config-actions";
import { updateAdminAvatarAction } from "./admin-profile-actions";

type SettingsTab = "general" | "brand" | "pages" | "catalogues";

interface PageItem {
  id: string;
  title: string;
  slug: string;
  content: string;
  isPublished: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AdminProfileClientProps {
  userEmail: string;
  userFullName: string;
  userAvatarUrl?: string | null;
  brandConfig: any;
  initialPages: PageItem[];
}

export default function AdminProfileClient({
  userEmail,
  userFullName,
  userAvatarUrl,
  brandConfig,
  initialPages,
}: AdminProfileClientProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [pages, setPages] = useState<PageItem[]>(initialPages);
  const [isPending, startTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "PUBLISHED" | "DRAFT"
  >("ALL");

  // Avatar state
  const [avatarUrl, setAvatarUrl] = useState(userAvatarUrl || null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarSaved, setAvatarSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initials = userFullName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    setAvatarSaved(false);

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
      await updateAdminAvatarAction(newUrl);
      setAvatarSaved(true);
      setTimeout(() => setAvatarSaved(false), 3000);
    } catch (err) {
      console.error("Admin avatar upload error:", err);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleTogglePublish = (pageId: string, currentStatus: boolean) => {
    startTransition(async () => {
      try {
        await adminTogglePagePublishStatus(pageId, currentStatus);
        setPages((prev) =>
          prev.map((p) =>
            p.id === pageId ? { ...p, isPublished: !currentStatus } : p,
          ),
        );
      } catch (err) {
        console.error("Failed to toggle publish status:", err);
      }
    });
  };

  const filteredPages = pages.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "PUBLISHED" && p.isPublished) ||
      (statusFilter === "DRAFT" && !p.isPublished);
    return matchesSearch && matchesStatus;
  });

  const SETTINGS_TABS: {
    id: SettingsTab;
    label: string;
    icon: React.ElementType;
  }[] = [
    { id: "general", label: "General Settings", icon: Settings },
    { id: "brand", label: "Brand & Storefront", icon: Store },
    { id: "pages", label: "Pages / CMS", icon: FileText },
    { id: "catalogues", label: "Catalogues", icon: BookOpen },
  ];

  return (
    <div className="space-y-6">
      {/* ─── Profile Hero Card ─── */}
      <div className="relative bg-surface border border-border rounded-sm overflow-hidden shadow-sm">
        {/* Accent top bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-accent via-accent/60 to-transparent" />

        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Avatar */}
            <div className="relative group flex-shrink-0">
              <div className="w-20 h-20 rounded-full border-2 border-accent/40 overflow-hidden bg-accent/10 flex items-center justify-center shadow-lg">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={userFullName}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                    sizes="80px"
                  />
                ) : (
                  <span className="text-xl font-serif font-bold text-accent">
                    {initials}
                  </span>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                title="Update profile picture"
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
              {avatarSaved && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                  <Check size={10} className="text-white" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="font-serif text-2xl font-normal text-primary truncate">
                  {userFullName}
                </h1>
                <span className="px-2 py-0.5 text-[9px] font-mono uppercase tracking-widest bg-accent/15 text-accent rounded border border-accent/25">
                  System Admin
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] font-mono text-muted">
                <span className="flex items-center gap-1.5">
                  <Mail size={11} />
                  {userEmail}
                </span>
                <span className="flex items-center gap-1.5">
                  <Shield size={11} />
                  Full Access
                </span>
              </div>
              <p className="text-[11px] text-muted mt-2 font-mono">
                Click the avatar to update your profile picture
              </p>
            </div>

            {/* Theme toggle on right */}
            <div className="flex-shrink-0">
              <ThemeToggle variant="admin" />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Settings Tabs ─── */}
      <div className="flex border-b border-border gap-1 shrink-0 overflow-x-auto scrollbar-none">
        {SETTINGS_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider pb-3 border-b-2 transition-all cursor-pointer min-h-[40px] px-3 whitespace-nowrap font-medium ${
                isActive
                  ? "border-accent text-accent font-semibold"
                  : "border-transparent text-muted hover:text-primary"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ─── General Settings ─── */}
      {activeTab === "general" && (
        <div className="space-y-6">
          {/* Appearance */}
          <div className="bg-surface border border-border shadow-sm p-8 rounded-sm">
            <h2 className="font-serif text-[20px] text-primary mb-2">
              Appearance & Theme
            </h2>
            <p className="font-body text-[13px] text-muted mb-6">
              Select your preferred workspace theme (System, Light, or Dark
              mode).
            </p>
            <div className="max-w-xs">
              <ThemeToggle variant="admin" />
            </div>
          </div>

          {/* Document preferences */}
          <DocumentDownloadSettingsForm />

          {/* PWA Install */}
          <PwaInstallHelper />

          {/* Biometric Passkeys */}
          <PasskeyManagerCard />

          {/* CA Email */}
          <CaEmailSettingsForm />

          {/* Profile info (read-only display) */}
          <div className="bg-surface border border-border shadow-sm p-8 rounded-sm">
            <h2 className="font-serif text-[20px] text-primary mb-6">
              Profile Information
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-2xl">
              <div className="space-y-2">
                <label className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted block">
                  Full Name
                </label>
                <input
                  type="text"
                  defaultValue={userFullName}
                  className="w-full bg-background border border-border px-4 py-3 text-primary font-body text-[14px] focus:outline-none focus:border-accent rounded-sm"
                  disabled
                />
              </div>
              <div className="space-y-2">
                <label className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted block">
                  Email Address
                </label>
                <input
                  type="email"
                  defaultValue={userEmail}
                  className="w-full bg-background border border-border px-4 py-3 text-primary font-body text-[14px] focus:outline-none focus:border-accent rounded-sm"
                  disabled
                />
              </div>
              <div className="space-y-2 lg:col-span-2">
                <label className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted block">
                  Role
                </label>
                <input
                  type="text"
                  defaultValue="System Administrator"
                  className="w-full bg-surface border border-border px-4 py-3 text-muted font-body text-[14px] cursor-not-allowed rounded-sm"
                  disabled
                />
              </div>
            </div>
          </div>

          {/* System Administration */}
          <div className="bg-surface border border-border shadow-sm p-8 rounded-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-serif text-[20px] text-primary">
                System Administration
              </h2>
            </div>
            <p className="font-body text-[13px] text-muted mb-6">
              Invite new staff members, assign roles, and revoke access for
              internal users.
            </p>
            <a
              href="/account/manage-admins"
              className="btn-outline inline-block text-center font-mono text-[10px] uppercase tracking-[0.1em] px-6 py-3 rounded-sm"
            >
              Manage Administrators →
            </a>
          </div>
        </div>
      )}

      {/* ─── Brand & Storefront ─── */}
      {activeTab === "brand" && (
        <BrandSettingsForm initialConfig={brandConfig} />
      )}

      {/* ─── Pages / CMS ─── */}
      {activeTab === "pages" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 bg-surface p-6 border border-border rounded-sm">
            <div>
              <h2 className="font-serif text-[24px] font-normal text-primary tracking-wide m-0">
                CMS Pages Management
              </h2>
              <p className="font-body text-muted text-[13px] mt-1 m-0">
                Create static informational pages like terms, about, or return
                policies.
              </p>
            </div>
            <Link
              href="/pages/new"
              className="font-mono text-[10px] uppercase tracking-[0.12em] bg-accent text-background px-5 py-2.5 hover:bg-accent-hover transition-colors rounded-sm cursor-pointer font-semibold shadow-lg shadow-accent/20"
            >
              + Create New Page
            </Link>
          </div>

          <div className="premium-card p-4 rounded-sm flex flex-wrap gap-4 items-center justify-between">
            <div className="flex-1 flex items-center gap-2 border border-border bg-background px-3 py-2.5 rounded-sm focus-within:border-accent min-w-[280px]">
              <Search className="w-3.5 h-3.5 text-muted shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search pages by title or slug..."
                className="bg-transparent text-primary font-mono text-[12px] focus:outline-none w-full placeholder:text-muted/60"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="text-muted hover:text-primary font-mono text-[10px] uppercase"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] uppercase tracking-wider text-muted">
                Status
              </span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2.5 border border-border bg-background text-secondary font-mono text-[11px] uppercase tracking-wider focus:outline-none focus:border-accent transition-colors cursor-pointer rounded-sm"
              >
                <option value="ALL">All States</option>
                <option value="PUBLISHED">Published</option>
                <option value="DRAFT">Draft</option>
              </select>
            </div>
          </div>

          <div className="premium-card flex flex-col overflow-hidden rounded-sm">
            {filteredPages.length === 0 ? (
              <div className="py-16 text-center">
                <FileText className="w-8 h-8 mx-auto mb-3 opacity-40 text-muted" />
                <h3 className="font-serif text-[16px] text-primary mb-1">
                  No Pages Found
                </h3>
                <p className="font-body text-muted text-[13px] max-w-sm mx-auto">
                  No pages matching the current filters.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/60 bg-surface-muted/40 font-mono text-[10px] uppercase tracking-wider text-muted">
                      <th className="px-8 py-4 font-semibold">Title</th>
                      <th className="px-8 py-4 font-semibold">Slug Mapping</th>
                      <th className="px-8 py-4 font-semibold">Visibility</th>
                      <th className="px-8 py-4 font-semibold">Last Updated</th>
                      <th className="px-8 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {filteredPages.map((page) => {
                      const storefrontUrl = `${brandConfig.storefrontUrl || "https://jamesandsons.in"}/${page.slug}`;
                      return (
                        <tr
                          key={page.id}
                          className="hover:bg-surface-muted/15 transition-colors"
                        >
                          <td className="px-8 py-5">
                            <Link href={`/pages/${page.id}`}>
                              <span className="font-serif text-[16px] text-primary hover:text-accent cursor-pointer transition-colors">
                                {page.title}
                              </span>
                            </Link>
                          </td>
                          <td className="px-8 py-5 font-mono text-[11px] text-muted">
                            /{page.slug}
                          </td>
                          <td className="px-8 py-5">
                            <button
                              type="button"
                              onClick={() =>
                                handleTogglePublish(page.id, page.isPublished)
                              }
                              disabled={isPending}
                              className={`font-mono text-[9px] uppercase tracking-wider border px-3 py-1 rounded-full cursor-pointer transition-colors ${
                                page.isPublished
                                  ? "text-emerald-400 border-emerald-400/30 bg-emerald-400/10 hover:bg-emerald-950/20"
                                  : "text-amber-500 border-amber-500/30 bg-amber-500/10 hover:bg-amber-950/20"
                              }`}
                            >
                              {page.isPublished ? "Published" : "Draft"}
                            </button>
                          </td>
                          <td className="px-8 py-5 font-mono text-[12px] text-secondary">
                            {new Date(page.updatedAt).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              },
                            )}
                          </td>
                          <td className="px-8 py-5 text-right">
                            <div className="flex justify-end items-center gap-4">
                              <Link
                                href={`/pages/${page.id}`}
                                className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted hover:text-primary transition-colors font-semibold"
                              >
                                Edit
                              </Link>
                              <a
                                href={storefrontUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="font-mono text-[10px] uppercase tracking-[0.1em] text-accent hover:text-white transition-colors"
                              >
                                View
                              </a>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Catalogues ─── */}
      {activeTab === "catalogues" && <CataloguesClient />}
    </div>
  );
}
