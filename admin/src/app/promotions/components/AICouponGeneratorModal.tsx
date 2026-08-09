"use client";

import React, { useState, useTransition } from "react";
import {
  Sparkles,
  X,
  Bot,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  Globe,
  Share2,
  Mail,
  Bell,
  Loader2,
  TrendingUp,
  ShieldCheck,
  Copy,
  Check,
  Megaphone,
} from "lucide-react";
import { AIPromotionResult } from "@/lib/services/aiPromotionService";

interface AICouponGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyToForm: (promoData: any) => void;
  onDirectLaunch: (promoData: any) => Promise<void>;
  onGenerateAI: (
    prompt: string,
    answers?: Record<string, string>,
  ) => Promise<AIPromotionResult>;
}

const AI_STRATEGY_PRESETS = [
  {
    label: "📈 Maximize AOV (₹25k+)",
    prompt:
      "Design a high-threshold discount to boost average order value above ₹25,000 for statement chandeliers and foyer lighting.",
  },
  {
    label: "⚡ Urgent Inventory Clearance",
    prompt:
      "Create a 48-hour flash clearance sale with ₹2,000 flat savings to clear slow-moving luxury floor lamps.",
  },
  {
    label: "🏛️ Architect Trade Privilege",
    prompt:
      "Create an exclusive B2B trade promotion offering 15% discount for verified architects and interior designers.",
  },
  {
    label: "🚚 Abandoned Cart Recovery",
    prompt:
      "Create a free white-glove shipping & installation waiver promo to recover abandoned checkout carts above ₹8,000.",
  },
];

export default function AICouponGeneratorModal({
  isOpen,
  onClose,
  onApplyToForm,
  onDirectLaunch,
  onGenerateAI,
}: AICouponGeneratorModalProps) {
  const [prompt, setPrompt] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [aiResult, setAiResult] = useState<AIPromotionResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLaunching, startTransition] = useTransition();
  const [copiedCopyKey, setCopiedCopyKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAnalyze = async (
    customPrompt?: string,
    customAnswers?: Record<string, string>,
  ) => {
    const targetPrompt = customPrompt || prompt;
    if (!targetPrompt.trim()) {
      alert("Please enter or select a promotion objective.");
      return;
    }
    setIsAnalyzing(true);
    try {
      const res = await onGenerateAI(targetPrompt, customAnswers || answers);
      setAiResult(res);
    } catch (err: any) {
      alert(`AI Generation error: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePresetSelect = (presetPrompt: string) => {
    setPrompt(presetPrompt);
    setAnswers({});
    handleAnalyze(presetPrompt, {});
  };

  const handleAnswerSelect = (questionId: string, answerValue: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answerValue }));
  };

  const handleApplyAnswersAndReanalyze = () => {
    handleAnalyze(prompt, answers);
  };

  const handleDirectLaunchClick = () => {
    if (!aiResult?.promotion) return;
    startTransition(async () => {
      await onDirectLaunch(aiResult.promotion);
      onClose();
    });
  };

  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCopyKey(key);
    setTimeout(() => setCopiedCopyKey(null), 2000);
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-sm max-w-4xl w-full p-6 space-y-6 max-h-[92vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-semibold tracking-wide text-primary flex items-center gap-2">
                AI Promotion & Profitability Architect
                <span className="text-[10px] font-mono uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded">
                  Gemini 1.5 Powered
                </span>
              </h2>
              <p className="text-xs font-mono text-muted">
                Describe campaign goals in plain English—AI configures rules,
                channels, ad copy & profit margins.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-primary transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* AI Quick Strategy Presets */}
        <div className="space-y-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted font-semibold">
            Quick AI Campaign Strategy Presets:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {AI_STRATEGY_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => handlePresetSelect(p.prompt)}
                disabled={isAnalyzing}
                className="p-2.5 text-left rounded border border-border/80 bg-background/50 hover:bg-surface hover:border-purple-500/40 text-xs font-mono transition-all text-primary hover:text-purple-300 disabled:opacity-50"
              >
                <div className="font-semibold">{p.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Prompt Input Box */}
        <div className="space-y-2">
          <label className="block font-mono text-[11px] uppercase tracking-wider text-muted font-medium">
            Custom Campaign Objective / Instruction
          </label>
          <textarea
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Create a 20% discount for luxury chandeliers above ₹15,000 for architects, auto-synced to Google Merchant Center (Merchant ID: 5828116888) and Meta Ads."
            className="w-full p-3 text-xs font-mono bg-background border border-border rounded-sm text-primary placeholder:text-muted focus:outline-none focus:border-purple-500 leading-relaxed"
          />

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={() => handleAnalyze()}
              disabled={isAnalyzing || !prompt.trim()}
              className="px-5 py-2 text-xs font-mono tracking-wider uppercase bg-purple-600 text-white font-semibold rounded-sm hover:bg-purple-500 shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Architecting
                  Offer...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" /> Analyze & Build Promotion
                </>
              )}
            </button>
          </div>
        </div>

        {/* Step A: AI Asks Clarifying Questions */}
        {aiResult?.needsClarification && aiResult.clarifyingQuestions && (
          <div className="p-4 rounded-sm border border-amber-500/30 bg-amber-500/10 space-y-4">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-amber-300">
                Interactive AI Clarifications Needed
              </h3>
            </div>
            <p className="text-xs text-muted font-mono">
              To build a margin-safe promotion tailored to your catalog, please
              select your preferences:
            </p>

            <div className="space-y-4">
              {aiResult.clarifyingQuestions.map((q) => (
                <div
                  key={q.id}
                  className="space-y-1.5 p-3 rounded bg-background/60 border border-border"
                >
                  <label className="block text-xs font-mono font-semibold text-primary">
                    {q.question}
                  </label>
                  {q.options ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                      {q.options.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleAnswerSelect(q.id, opt)}
                          className={`text-left p-2 rounded text-[11px] font-mono border transition-all cursor-pointer ${
                            answers[q.id] === opt
                              ? "bg-purple-500/20 border-purple-400 text-purple-300 font-semibold"
                              : "bg-surface/50 border-border/60 text-muted hover:border-purple-500/40 hover:text-primary"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={answers[q.id] || ""}
                      onChange={(e) => handleAnswerSelect(q.id, e.target.value)}
                      placeholder={q.placeholder || "Enter details..."}
                      className="w-full px-3 py-2 text-xs font-mono bg-background border border-border rounded text-primary"
                    />
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleApplyAnswersAndReanalyze}
              disabled={isAnalyzing}
              className="w-full py-2.5 px-4 text-xs font-mono uppercase tracking-wider bg-amber-500 text-black font-semibold rounded-sm hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowRight className="w-3.5 h-3.5" /> Re-Analyze with Selected
              Answers
            </button>
          </div>
        )}

        {/* Step B: Structured AI Generated Promotion Result */}
        {aiResult?.promotion && (
          <div className="space-y-5">
            {/* Offer Configuration Box */}
            <div className="p-4 rounded-sm border border-emerald-500/30 bg-emerald-500/10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-300">
                    AI Promotion Blueprint
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 uppercase bg-emerald-500/20 px-2.5 py-0.5 rounded border border-emerald-500/30">
                  Ready to Deploy
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
                <div className="p-3 rounded bg-background/70 border border-border space-y-1">
                  <span className="text-[10px] uppercase text-muted">
                    Generated Code
                  </span>
                  <p className="text-base font-bold text-accent">
                    {aiResult.promotion.code}
                  </p>
                  <p className="text-[10px] text-muted">
                    {aiResult.promotion.description}
                  </p>
                </div>

                <div className="p-3 rounded bg-background/70 border border-border space-y-1">
                  <span className="text-[10px] uppercase text-muted">
                    Discount Structure
                  </span>
                  <p className="font-bold text-primary">
                    {aiResult.promotion.type === "PERCENTAGE"
                      ? `${aiResult.promotion.value}% OFF`
                      : aiResult.promotion.type === "FIXED_AMOUNT"
                        ? formatCurrency(aiResult.promotion.value) + " OFF"
                        : "FREE SHIPPING"}
                  </p>
                  <p className="text-[10px] text-muted">
                    Min Spend:{" "}
                    {aiResult.promotion.minOrderAmount
                      ? formatCurrency(aiResult.promotion.minOrderAmount)
                      : "None"}
                  </p>
                </div>

                <div className="p-3 rounded bg-background/70 border border-border space-y-1">
                  <span className="text-[10px] uppercase text-muted">
                    Target Sync Outlets
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {aiResult.promotion.targetChannels.googleMerchant && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-amber-300 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded">
                        <Globe className="w-3 h-3" /> Google Merchant
                      </span>
                    )}
                    {aiResult.promotion.targetChannels.metaCommerce && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-blue-300 bg-blue-500/15 border border-blue-500/30 px-1.5 py-0.5 rounded">
                        <Share2 className="w-3 h-3" /> Meta
                      </span>
                    )}
                    {aiResult.promotion.targetChannels.emailBlast && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-purple-300 bg-purple-500/15 border border-purple-500/30 px-1.5 py-0.5 rounded">
                        <Mail className="w-3 h-3" /> Email
                      </span>
                    )}
                    {aiResult.promotion.targetChannels.webPush && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                        <Bell className="w-3 h-3" /> Push
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Profitability & Strategy Gauge */}
            {aiResult.promotion.profitability && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded border border-border bg-surface/50 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-semibold text-primary flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" /> Gross
                      Margin Safety
                    </span>
                    <span className="text-emerald-400 font-bold text-sm">
                      {aiResult.promotion.profitability.marginSafetyScore}% Safe
                    </span>
                  </div>
                  <div className="w-full bg-background rounded-full h-2 overflow-hidden border border-border">
                    <div
                      className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${aiResult.promotion.profitability.marginSafetyScore}%`,
                      }}
                    />
                  </div>
                  <p className="text-[11px] font-mono text-muted leading-tight">
                    Minimum spend limit is calculated to maintain positive
                    contribution margin on high-margin chandeliers.
                  </p>
                </div>

                <div className="p-4 rounded border border-border bg-surface/50 space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-semibold text-primary flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-accent" /> Projected
                      Target AOV
                    </span>
                    <span className="text-accent font-bold text-sm">
                      {formatCurrency(
                        aiResult.promotion.profitability.estimatedAOV,
                      )}
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-muted leading-tight pt-1">
                    Target Persona:{" "}
                    {aiResult.promotion.profitability.targetPersona}
                  </p>
                </div>
              </div>
            )}

            {/* AI Copywriting Assets Generator */}
            {aiResult.promotion.copywriting && (
              <div className="p-4 rounded border border-border bg-surface/40 space-y-3">
                <div className="flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-purple-400" />
                  <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-primary">
                    AI Copywriting & Ad Assets
                  </h4>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  {/* Ad Headline */}
                  <div className="p-2.5 rounded bg-background border border-border flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[9px] uppercase text-muted block">
                        Ad Headline
                      </span>
                      <span className="text-primary font-semibold">
                        {aiResult.promotion.copywriting.headline}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyText(
                          aiResult.promotion!.copywriting.headline,
                          "headline",
                        )
                      }
                      className="text-muted hover:text-accent p-1"
                      title="Copy"
                    >
                      {copiedCopyKey === "headline" ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Email Subject */}
                  <div className="p-2.5 rounded bg-background border border-border flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[9px] uppercase text-muted block">
                        Email Blast Subject Line
                      </span>
                      <span className="text-primary font-semibold">
                        {aiResult.promotion.copywriting.emailSubject}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyText(
                          aiResult.promotion!.copywriting.emailSubject,
                          "email",
                        )
                      }
                      className="text-muted hover:text-accent p-1"
                      title="Copy"
                    >
                      {copiedCopyKey === "email" ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Banner Text */}
                  <div className="p-2.5 rounded bg-background border border-border flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[9px] uppercase text-muted block">
                        Storefront Marquee Banner
                      </span>
                      <span className="text-primary font-semibold">
                        {aiResult.promotion.copywriting.bannerText}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyText(
                          aiResult.promotion!.copywriting.bannerText,
                          "banner",
                        )
                      }
                      className="text-muted hover:text-accent p-1"
                      title="Copy"
                    >
                      {copiedCopyKey === "banner" ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => {
                  onApplyToForm(aiResult.promotion);
                  onClose();
                }}
                className="px-4 py-2 text-xs font-mono tracking-wider uppercase border border-border bg-background hover:bg-surface text-primary rounded-sm transition-all"
              >
                Customize in Form
              </button>

              <button
                type="button"
                onClick={handleDirectLaunchClick}
                disabled={isLaunching}
                className="px-5 py-2 text-xs font-mono tracking-wider uppercase bg-accent text-accent-foreground font-semibold rounded-sm hover:brightness-110 shadow-sm transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {isLaunching ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />{" "}
                    Provisioning...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" /> Instant 1-Click Launch
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
