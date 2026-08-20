"use client";

import React, { useState, useEffect, useTransition } from "react";
import { X, Sparkles, CheckCircle2 } from "lucide-react";
import { useSidebar } from "@/lib/context/SidebarContext";
import { Coupon, Affiliate, CouponType } from "../types";
import PromotionBasicSection from "./PromotionBasicSection";
import PromotionRulesSection from "./PromotionRulesSection";
import PromotionScheduleSection from "./PromotionScheduleSection";
import PromotionChannelsSection from "./PromotionChannelsSection";

interface PromotionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  coupon: Coupon | null; // Null if creating new promo
  affiliates: Affiliate[];
  onSubmit: (formData: any) => Promise<void>;
}

export default function PromotionFormModal({
  isOpen,
  onClose,
  coupon,
  affiliates,
  onSubmit,
}: PromotionFormModalProps) {
  const { setPromotionFormState } = useSidebar();
  const [isPending, startTransition] = useTransition();

  // Form Fields State
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<CouponType>("PERCENTAGE");
  const [value, setValue] = useState("");
  const [minOrderAmount, setMinOrderAmount] = useState("");
  const [maxDiscountCap, setMaxDiscountCap] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [usageLimitPerUser, setUsageLimitPerUser] = useState("1");
  const [startsAt, setStartsAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [affiliateId, setAffiliateId] = useState("");
  const [activeSection, setActiveSection] = useState("promo-basic");

  // Channels Selection
  const [targetChannels, setTargetChannels] = useState({
    googleMerchant: true,
    metaCommerce: true,
    emailBlast: false,
    webPush: false,
  });

  // Populate when editing or opening modal
  useEffect(() => {
    if (coupon) {
      setCode(coupon.code || "");
      setDescription(coupon.description || "");
      setType(coupon.type || "PERCENTAGE");
      setValue(coupon.value !== undefined ? String(coupon.value) : "");
      setMinOrderAmount(
        coupon.minOrderAmount ? String(coupon.minOrderAmount) : "",
      );
      setMaxDiscountCap(
        coupon.maxDiscountCap ? String(coupon.maxDiscountCap) : "",
      );
      setUsageLimit(coupon.usageLimit ? String(coupon.usageLimit) : "");
      setUsageLimitPerUser(
        coupon.usageLimitPerUser ? String(coupon.usageLimitPerUser) : "1",
      );
      setStartsAt(
        coupon.startsAt
          ? new Date(coupon.startsAt).toISOString().slice(0, 16)
          : "",
      );
      setExpiresAt(
        coupon.expiresAt
          ? new Date(coupon.expiresAt).toISOString().slice(0, 16)
          : "",
      );
      setAffiliateId(coupon.affiliateId || "");

      const sources = (coupon.source || "internal").split(",");
      setTargetChannels({
        googleMerchant:
          sources.includes("google_merchant") || sources.includes("all"),
        metaCommerce: sources.includes("meta") || sources.includes("all"),
        emailBlast: sources.includes("email") || sources.includes("all"),
        webPush: sources.includes("push") || sources.includes("all"),
      });
    } else {
      setCode("");
      setDescription("");
      setType("PERCENTAGE");
      setValue("20");
      setMinOrderAmount("");
      setMaxDiscountCap("");
      setUsageLimit("");
      setUsageLimitPerUser("1");
      setStartsAt("");
      setExpiresAt("");
      setAffiliateId("");
      setTargetChannels({
        googleMerchant: true,
        metaCommerce: true,
        emailBlast: false,
        webPush: false,
      });
    }
  }, [coupon, isOpen]);

  // Sync state with Dynamic Sidepanel Outline
  useEffect(() => {
    if (isOpen) {
      setPromotionFormState({
        mode: coupon ? "edit" : "add",
        promoId: coupon?.id,
        code,
        description,
        type,
        value: Number(value) || 0,
        status: coupon?.status || "ACTIVE",
        isDirty: true,
        isBasicComplete: Boolean(
          code && (type === "FREE_SHIPPING" || Number(value) > 0),
        ),
        isRulesComplete: true,
        isScheduleComplete: true,
        isChannelsComplete: true,
        activeSection,
        setActiveSection,
        targetChannels,
        submitForm: handleFormSubmit,
        saving: isPending,
      });
    } else {
      setPromotionFormState(null);
    }
  }, [
    isOpen,
    coupon,
    code,
    description,
    type,
    value,
    activeSection,
    targetChannels,
    isPending,
  ]);

  const handleGenerateRandomCode = () => {
    const randomCode = `JNS${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    setCode(randomCode);
  };

  const handleFormSubmit = () => {
    if (!code) {
      alert("Please enter a valid promotion code.");
      return;
    }

    startTransition(async () => {
      const sources: string[] = [];
      if (targetChannels.googleMerchant) sources.push("google_merchant");
      if (targetChannels.metaCommerce) sources.push("meta");
      if (targetChannels.emailBlast) sources.push("email");
      if (targetChannels.webPush) sources.push("push");
      if (sources.length === 0) sources.push("internal");

      const payload = {
        id: coupon?.id,
        code,
        description,
        type,
        value: type === "FREE_SHIPPING" ? 0 : Number(value),
        minOrderAmount: minOrderAmount ? Number(minOrderAmount) : undefined,
        maxDiscountCap: maxDiscountCap ? Number(maxDiscountCap) : undefined,
        usageLimit: usageLimit ? Number(usageLimit) : undefined,
        usageLimitPerUser: usageLimitPerUser ? Number(usageLimitPerUser) : 1,
        startsAt: startsAt ? new Date(startsAt) : undefined,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        source: sources.join(","),
        affiliateId: affiliateId || undefined,
      };

      await onSubmit(payload);
      onClose();
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-sm max-w-4xl w-full p-6 space-y-6 max-h-[92vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            <div>
              <h2 className="font-serif text-lg font-semibold tracking-wide text-primary">
                {coupon
                  ? `Edit Promotion: ${coupon.code}`
                  : "Create New Custom Promotion"}
              </h2>
              <p className="text-xs font-mono text-muted">
                Configure discount rules, attribution, and multi-channel
                broadcast parameters.
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

        {/* Modular Sections */}
        <div className="space-y-5">
          <PromotionBasicSection
            code={code}
            setCode={setCode}
            description={description}
            setDescription={setDescription}
            type={type}
            setType={setType}
            value={value}
            setValue={setValue}
            onGenerateCode={handleGenerateRandomCode}
          />

          <PromotionRulesSection
            minOrderAmount={minOrderAmount}
            setMinOrderAmount={setMinOrderAmount}
            maxDiscountCap={maxDiscountCap}
            setMaxDiscountCap={setMaxDiscountCap}
            usageLimit={usageLimit}
            setUsageLimit={setUsageLimit}
            usageLimitPerUser={usageLimitPerUser}
            setUsageLimitPerUser={setUsageLimitPerUser}
            affiliateId={affiliateId}
            setAffiliateId={setAffiliateId}
            affiliates={affiliates}
            isPercentageType={type === "PERCENTAGE"}
          />

          <PromotionScheduleSection
            startsAt={startsAt}
            setStartsAt={setStartsAt}
            expiresAt={expiresAt}
            setExpiresAt={setExpiresAt}
          />

          <PromotionChannelsSection
            targetChannels={targetChannels}
            setTargetChannels={setTargetChannels}
          />
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2 text-xs font-mono tracking-wider uppercase border border-border text-muted hover:text-primary rounded-sm transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleFormSubmit}
            disabled={isPending}
            className="px-5 py-2 text-xs font-mono tracking-wider uppercase bg-accent text-accent-foreground font-semibold rounded-sm hover:brightness-110 shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {isPending
              ? "Saving Promotion..."
              : coupon
                ? "Update Promotion"
                : "Save & Launch Promotion"}
          </button>
        </div>
      </div>
    </div>
  );
}
