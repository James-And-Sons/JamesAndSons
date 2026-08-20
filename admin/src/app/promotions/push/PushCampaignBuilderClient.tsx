"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bell,
  Sparkles,
  Send,
  Upload,
  Link as LinkIcon,
  CheckCircle2,
  AlertTriangle,
  Users,
  Smartphone,
  Monitor,
  ToggleLeft,
  ToggleRight,
  ChevronLeft,
  RefreshCw,
  Image as ImageIcon,
} from "lucide-react";
import CloudinaryUpload from "@/components/CloudinaryUpload";
import { sendPushBroadcastAction } from "./actions";

interface StatsProps {
  totalSubscriptions: number;
  storefrontSubscriptions: number;
  adminSubscriptions: number;
}

export default function PushCampaignBuilderClient({
  stats,
}: {
  stats: StatsProps;
}) {
  const [activeTab, setActiveTab] = useState<"builder" | "automated">(
    "builder",
  );

  // Form State
  const [campaignName, setCampaignName] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("https://jamesandsons.in/collections");
  const [imageUrl, setImageUrl] = useState("");
  const [targetAudience, setTargetAudience] = useState<
    "ALL" | "STOREFRONT" | "ADMIN"
  >("ALL");

  // Automated Trigger Toggles
  const [autoNewProduct, setAutoNewProduct] = useState(true);
  const [autoPriceDrop, setAutoPriceDrop] = useState(true);

  // AI & Sending States
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiTone, setAiTone] = useState("luxury");
  const [showAiModal, setShowAiModal] = useState(false);

  const [isSending, setIsSending] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  // Character Limit Enforcers
  const MAX_TITLE = 50;
  const MAX_BODY = 120;

  const handleGenerateAICopy = async () => {
    if (!aiPrompt.trim()) return;
    setIsGeneratingAI(true);
    try {
      const res = await fetch("/api/admin/push/ai-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt, tone: aiTone }),
      });
      const data = await res.json();
      if (data.success) {
        setTitle(data.title);
        setBody(data.body);
        setShowAiModal(false);
      } else {
        alert(`AI Error: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Failed to generate AI copy: ${err.message}`);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSendBroadcast = async () => {
    if (!title.trim() || !body.trim()) {
      alert(
        "Please enter both a title and body message for the push notification.",
      );
      return;
    }

    if (
      !confirm(
        `Are you sure you want to broadcast this push notification to ${stats.totalSubscriptions} active subscriber device(s)?`,
      )
    ) {
      return;
    }

    setIsSending(true);
    setResultMessage(null);

    try {
      const res = await sendPushBroadcastAction({
        title,
        body,
        url,
        image: imageUrl,
        targetAudience,
      });

      if (res.success) {
        setResultMessage(`✅ ${res.message}`);
      } else {
        setResultMessage(`❌ ${res.error}`);
      }
    } catch (err: any) {
      setResultMessage(`❌ Error: ${err.message || err}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* ── Top Navigation & Back Link ──────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <Link
          href="/promotions"
          className="font-mono text-[11px] uppercase tracking-wider text-muted hover:text-accent flex items-center gap-1.5 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Campaigns</span>
        </Link>

        {/* Tab Selector */}
        <div className="flex items-center bg-surface border border-border rounded-sm p-1">
          <button
            onClick={() => setActiveTab("builder")}
            className={`px-4 py-1.5 font-mono text-[10px] uppercase tracking-wider rounded-xs transition-all ${
              activeTab === "builder"
                ? "bg-accent text-black font-semibold shadow-sm"
                : "text-muted hover:text-primary"
            }`}
          >
            Campaign Broadcast Builder
          </button>
          <button
            onClick={() => setActiveTab("automated")}
            className={`px-4 py-1.5 font-mono text-[10px] uppercase tracking-wider rounded-xs transition-all ${
              activeTab === "automated"
                ? "bg-accent text-black font-semibold shadow-sm"
                : "text-muted hover:text-primary"
            }`}
          >
            ⚡ Automated Event Triggers
          </button>
        </div>
      </div>

      {/* ── Stat Cards Header ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-surface border border-border rounded-sm">
          <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted mb-1 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-accent" />
            Total Push Subscribers
          </p>
          <p className="font-serif text-[26px] text-primary font-light">
            {stats.totalSubscriptions.toLocaleString()}
          </p>
        </div>
        <div className="p-4 bg-surface border border-border rounded-sm">
          <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted mb-1 flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-amber-400" />
            Storefront Customers
          </p>
          <p className="font-serif text-[26px] text-amber-400 font-light">
            {stats.storefrontSubscriptions.toLocaleString()}
          </p>
        </div>
        <div className="p-4 bg-surface border border-border rounded-sm">
          <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted mb-1 flex items-center gap-1.5">
            <Monitor className="w-3.5 h-3.5 text-emerald-400" />
            Admin Portal Devices
          </p>
          <p className="font-serif text-[26px] text-emerald-400 font-light">
            {stats.adminSubscriptions.toLocaleString()}
          </p>
        </div>
      </div>

      {resultMessage && (
        <div
          className={`p-4 rounded-sm border font-mono text-[12px] flex items-center gap-2 ${
            resultMessage.startsWith("✅")
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}
        >
          {resultMessage}
        </div>
      )}

      {/* ── TAB 1: BROADCAST BUILDER ───────────────────────────────────────── */}
      {activeTab === "builder" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Form (8 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Card 1: Content Composition */}
            <div className="bg-surface border border-border p-6 rounded-sm space-y-5">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <h2 className="font-serif text-[18px] text-primary font-light tracking-wide m-0 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-accent" />
                  Notification Composition
                </h2>
                <button
                  type="button"
                  onClick={() => setShowAiModal(!showAiModal)}
                  className="px-3 py-1.5 bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 transition-all font-mono text-[10px] uppercase tracking-wider rounded-xs flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Copywriter</span>
                </button>
              </div>

              {/* AI Modal Drawer */}
              {showAiModal && (
                <div className="p-4 bg-background border border-accent/30 rounded-sm space-y-3 animate-in fade-in">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-accent flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Gemini AI Copy Generator
                  </p>
                  <input
                    type="text"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="e.g. Flash sale on Murano Chandeliers, 20% off for 24 hours"
                    className="w-full bg-surface border border-border px-3 py-2 text-[12px] text-primary focus:outline-none focus:border-accent rounded-xs"
                  />
                  <div className="flex items-center justify-between">
                    <select
                      value={aiTone}
                      onChange={(e) => setAiTone(e.target.value)}
                      className="bg-surface border border-border text-[11px] text-muted px-2 py-1.5 rounded-xs focus:outline-none"
                    >
                      <option value="luxury">Luxury Concierge</option>
                      <option value="flash_sale">Urgent Flash Sale</option>
                      <option value="new_drop">New Drop Launch</option>
                      <option value="festive">Festive Celebration</option>
                    </select>
                    <button
                      type="button"
                      onClick={handleGenerateAICopy}
                      disabled={isGeneratingAI || !aiPrompt.trim()}
                      className="px-3 py-1.5 bg-accent text-black font-mono text-[10px] uppercase tracking-wider rounded-xs font-semibold flex items-center gap-1.5"
                    >
                      {isGeneratingAI ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <Sparkles className="w-3 h-3" />
                      )}
                      <span>
                        {isGeneratingAI ? "Generating..." : "Generate Text"}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* Title Field */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[11px] font-mono uppercase tracking-wider text-muted">
                  <label htmlFor="push-title">Notification Title *</label>
                  <span
                    className={
                      title.length > MAX_TITLE
                        ? "text-red-400 font-semibold"
                        : "text-muted"
                    }
                  >
                    {title.length}/{MAX_TITLE} chars
                  </span>
                </div>
                <input
                  id="push-title"
                  type="text"
                  maxLength={MAX_TITLE + 10}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="🪔 Luxury Lighting Drop: Flat 20% OFF"
                  className={`w-full bg-background border px-3.5 py-2.5 text-[13px] text-primary focus:outline-none rounded-xs transition-colors ${
                    title.length > MAX_TITLE
                      ? "border-red-500 focus:border-red-500"
                      : "border-border focus:border-accent"
                  }`}
                />
              </div>

              {/* Body Field */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[11px] font-mono uppercase tracking-wider text-muted">
                  <label htmlFor="push-body">Body Message *</label>
                  <span
                    className={
                      body.length > MAX_BODY
                        ? "text-red-400 font-semibold"
                        : "text-muted"
                    }
                  >
                    {body.length}/{MAX_BODY} chars
                  </span>
                </div>
                <textarea
                  id="push-body"
                  rows={3}
                  maxLength={MAX_BODY + 20}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Bespoke hand-blown Murano glass chandeliers are now live. Reserve yours with code LUXURY20."
                  className={`w-full bg-background border px-3.5 py-2.5 text-[13px] text-primary focus:outline-none rounded-xs transition-colors ${
                    body.length > MAX_BODY
                      ? "border-red-500 focus:border-red-500"
                      : "border-border focus:border-accent"
                  }`}
                />
              </div>

              {/* Destination URL */}
              <div className="space-y-1.5">
                <label
                  htmlFor="push-url"
                  className="block text-[11px] font-mono uppercase tracking-wider text-muted"
                >
                  Destination URL (On Click)
                </label>
                <div className="relative">
                  <LinkIcon className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    id="push-url"
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://jamesandsons.in/collections/chandeliers"
                    className="w-full bg-background border border-border pl-9 pr-3.5 py-2.5 text-[12px] text-primary focus:outline-none focus:border-accent rounded-xs"
                  />
                </div>
              </div>
            </div>

            {/* Card 2: Rich Hero Product Photo Upload */}
            <div className="bg-surface border border-border p-6 rounded-sm space-y-4">
              <h2 className="font-serif text-[18px] text-primary font-light tracking-wide m-0 flex items-center gap-2 border-b border-border/60 pb-3">
                <ImageIcon className="w-4 h-4 text-accent" />
                Hero Product Photo / Campaign Banner
              </h2>
              <p className="font-mono text-[10px] text-muted tracking-wider uppercase">
                Attaches a high-resolution hero photo displayed on Android
                Lockscreen, macOS Notification Center, and Windows Banners.
              </p>

              <CloudinaryUpload
                defaultImages={imageUrl ? [imageUrl] : []}
                onUpload={(urls: string[]) => setImageUrl(urls[0] || "")}
                multiple={false}
              />
            </div>

            {/* Card 3: Target Audience & Submit */}
            <div className="bg-surface border border-border p-6 rounded-sm space-y-5">
              <h2 className="font-serif text-[18px] text-primary font-light tracking-wide m-0 flex items-center gap-2 border-b border-border/60 pb-3">
                <Users className="w-4 h-4 text-accent" />
                Target Audience & Dispatch
              </h2>

              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setTargetAudience("ALL")}
                  className={`p-3 border text-left rounded-xs transition-all ${
                    targetAudience === "ALL"
                      ? "bg-accent/10 border-accent text-accent"
                      : "bg-background border-border text-muted"
                  }`}
                >
                  <p className="font-mono text-[11px] font-semibold uppercase">
                    All Devices
                  </p>
                  <p className="text-[10px] opacity-80 mt-0.5">
                    {stats.totalSubscriptions} subscribers
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setTargetAudience("STOREFRONT")}
                  className={`p-3 border text-left rounded-xs transition-all ${
                    targetAudience === "STOREFRONT"
                      ? "bg-accent/10 border-accent text-accent"
                      : "bg-background border-border text-muted"
                  }`}
                >
                  <p className="font-mono text-[11px] font-semibold uppercase">
                    Customers
                  </p>
                  <p className="text-[10px] opacity-80 mt-0.5">
                    {stats.storefrontSubscriptions} storefront
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setTargetAudience("ADMIN")}
                  className={`p-3 border text-left rounded-xs transition-all ${
                    targetAudience === "ADMIN"
                      ? "bg-accent/10 border-accent text-accent"
                      : "bg-background border-border text-muted"
                  }`}
                >
                  <p className="font-mono text-[11px] font-semibold uppercase">
                    Admin Only
                  </p>
                  <p className="text-[10px] opacity-80 mt-0.5">
                    {stats.adminSubscriptions} admin team
                  </p>
                </button>
              </div>

              <button
                type="button"
                onClick={handleSendBroadcast}
                disabled={isSending || !title.trim() || !body.trim()}
                className="w-full py-3.5 bg-accent hover:bg-[#d5b16b] text-black font-mono text-[11px] uppercase tracking-widest font-semibold rounded-xs transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
              >
                {isSending ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>
                  {isSending
                    ? "Broadcasting Push Notification..."
                    : "🚀 Broadcast Push Notification Now"}
                </span>
              </button>
            </div>
          </div>

          {/* Device Lockscreen Preview Panel (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="sticky top-6 bg-surface border border-border p-6 rounded-sm space-y-4">
              <h3 className="font-serif text-[18px] text-primary font-light tracking-wide m-0 flex items-center gap-2 border-b border-border/60 pb-3">
                <Smartphone className="w-4 h-4 text-accent" />
                Live Mobile Lockscreen Preview
              </h3>

              {/* Mobile Notification Mockup */}
              <div className="bg-[#141414] border border-[#C4A05A]/30 p-4 rounded-xl shadow-2xl text-white space-y-3 font-sans">
                <div className="flex items-center justify-between text-[11px] text-zinc-400">
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded-full bg-[#C4A05A] flex items-center justify-center text-[8px] text-black font-bold">
                      J
                    </div>
                    <span className="font-semibold text-white">
                      James & Sons
                    </span>
                  </div>
                  <span>now</span>
                </div>

                <div className="space-y-1">
                  <p className="font-semibold text-[13px] text-white leading-snug">
                    {title || "🪔 Luxury Lighting Drop: Flat 20% OFF"}
                  </p>
                  <p className="text-[12px] text-zinc-300 leading-normal">
                    {body ||
                      "Bespoke hand-blown Murano glass chandeliers are now live. Reserve yours."}
                  </p>
                </div>

                {imageUrl && (
                  <div className="w-full h-32 rounded-lg overflow-hidden border border-white/10 mt-2">
                    <img
                      src={imageUrl}
                      alt="Push Banner Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              <div className="p-3 bg-background border border-border rounded-sm space-y-1 font-mono text-[10px] text-muted">
                <p className="text-accent uppercase font-semibold">
                  Optimal Display Guidelines
                </p>
                <p>
                  • Titles &lt; 50 chars avoid lockscreen truncation on iOS &
                  Android.
                </p>
                <p>
                  • Body text &lt; 120 chars ensures complete message
                  readability.
                </p>
                <p>
                  • Hero photos expand automatically on Android & Windows
                  banners.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: AUTOMATED EVENT TRIGGERS ──────────────────────────────── */}
      {activeTab === "automated" && (
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="bg-surface border border-border p-6 rounded-sm space-y-6">
            <div>
              <h2 className="font-serif text-[22px] text-primary font-light tracking-wide m-0">
                ⚡ Automated System Push Triggers
              </h2>
              <p className="font-mono text-[10px] text-muted mt-1 uppercase tracking-wider">
                Configure automated push notifications that trigger instantly
                when catalog events occur in the admin panel.
              </p>
            </div>

            {/* Trigger 1: New Product Launch */}
            <div className="p-5 bg-background border border-border rounded-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent/10 border border-accent/30 text-accent rounded-xs">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-[16px] text-primary font-medium m-0">
                      New Product Addition Push Alert
                    </h3>
                    <p className="font-mono text-[10px] text-muted uppercase">
                      Automatically broadcasts a push notification with the
                      Product's Primary Hero Photo whenever a new product is
                      saved.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setAutoNewProduct(!autoNewProduct)}
                  className="text-accent hover:opacity-80 transition-opacity"
                >
                  {autoNewProduct ? (
                    <ToggleRight className="w-8 h-8 text-accent" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-muted" />
                  )}
                </button>
              </div>

              {autoNewProduct && (
                <div className="p-4 bg-surface border border-border rounded-xs space-y-2 font-mono text-[11px]">
                  <p className="text-accent font-semibold">
                    Default Automated Notification Payload:
                  </p>
                  <p className="text-primary">
                    • Title: ✨ New Drop: [Product Name]
                  </p>
                  <p className="text-muted">
                    • Body: Discover our new bespoke lighting piece for
                    ₹[Price].
                  </p>
                  <p className="text-muted">
                    • Image: Attached Product Hero Photo
                  </p>
                  <p className="text-muted">
                    • Target URL: /products/[product-slug]
                  </p>
                </div>
              )}
            </div>

            {/* Trigger 2: Price Drop Alert */}
            <div className="p-5 bg-background border border-border rounded-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xs">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-[16px] text-primary font-medium m-0">
                      Price Reduction Push Alert
                    </h3>
                    <p className="font-mono text-[10px] text-muted uppercase">
                      Fires automatically when a product price is reduced in the
                      admin panel.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setAutoPriceDrop(!autoPriceDrop)}
                  className="text-accent hover:opacity-80 transition-opacity"
                >
                  {autoPriceDrop ? (
                    <ToggleRight className="w-8 h-8 text-accent" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-muted" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
