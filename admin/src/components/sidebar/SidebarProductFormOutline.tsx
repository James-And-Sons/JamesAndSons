"use client";

import React from "react";
import Link from "next/link";
import SyncButton from "@/components/SyncButton";

interface SidebarProductFormOutlineProps {
  productFormState: any;
  onClose?: () => void;
}

export default function SidebarProductFormOutline({
  productFormState,
  onClose,
}: SidebarProductFormOutlineProps) {
  if (!productFormState) return null;

  const {
    mode,
    productId,
    productName,
    sku,
    isDirty,
    activeTab,
    setActiveTab,
    variants = [],
    addVariant,
    removeVariant,
    isBasicComplete,
    isPricingComplete,
    isSpecsComplete,
    isSeoComplete,
    isImagesComplete,
    isVarBasicComplete,
    isVarPricingComplete,
    isVarDimensionsComplete,
    isVarSpecsComplete,
    isVarPlatformComplete,
    isVarImagesComplete,
    setOpenSections,
    submitForm,
    saving,
  } = productFormState;

  const isParentMode = activeTab === "parent";

  const parentSections = [
    { id: "basic", name: "Basic Information", done: isBasicComplete },
    { id: "pricing", name: "Pricing & Inventory", done: isPricingComplete },
    { id: "specs", name: "Technical Specs", done: isSpecsComplete },
    { id: "seo", name: "Marketplace & SEO", done: isSeoComplete },
    { id: "images", name: "Product Images", done: isImagesComplete },
  ];

  const variantSections = [
    { id: "v_basic", name: "Variant Details", done: isVarBasicComplete },
    { id: "v_pricing", name: "Pricing Overrides", done: isVarPricingComplete },
    {
      id: "v_dimensions",
      name: "Dimensions Overrides",
      done: isVarDimensionsComplete,
    },
    { id: "v_specs", name: "Technical Specs", done: isVarSpecsComplete },
    {
      id: "v_platform",
      name: "Marketplace & SEO",
      done: isVarPlatformComplete,
    },
    { id: "v_images", name: "Variant Images", done: isVarImagesComplete },
  ];

  const sections = isParentMode ? parentSections : variantSections;

  const scrollToSection = (id: string, sectionKey: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    if (setOpenSections) {
      setOpenSections((prev: any) => ({ ...prev, [sectionKey]: true }));
    }
    if (onClose) onClose();
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isDirty) {
      if (
        !confirm("You have unsaved changes. Are you sure you want to leave?")
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    }
    if (onClose) onClose();
  };

  return (
    <div className="flex-1 flex flex-col justify-between min-h-[350px]">
      <div className="space-y-6">
        {/* Header */}
        <div className="pb-4 border-b border-border space-y-3">
          <div className="flex items-center gap-2">
            <Link
              href="/products"
              onClick={handleNavClick}
              className="flex-1 text-center block px-4 py-2.5 text-[10px] font-mono tracking-[0.15em] uppercase text-muted hover:text-red-400 hover:border-red-500/40 hover:bg-red-950/20 transition-colors border border-border bg-background/50 rounded-sm"
            >
              ← Exit
            </Link>
            <SyncButton
              productId={productId}
              label="Sync"
              className="flex-1 text-center block px-4 py-2.5 text-[10px] font-mono tracking-[0.15em] uppercase text-muted hover:text-accent hover:border-accent/40 transition-colors border border-border bg-background/50 rounded-sm cursor-pointer disabled:opacity-50"
            />
          </div>
          <h2
            className="font-serif text-[18px] text-primary font-medium tracking-wide truncate max-w-[200px]"
            title={productName}
          >
            {productName || "New Product"}
          </h2>
          <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-wider text-muted flex-wrap">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isDirty ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
              }`}
            ></span>
            <span>{mode === "add" ? "Adding" : "Editing"}</span>
            {sku && (
              <span className="font-mono text-[9px] text-muted border border-border px-1.5 py-0.5 rounded uppercase">
                {sku}
              </span>
            )}
          </div>
        </div>

        {/* Variant View Section */}
        <div className="space-y-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted font-semibold">
            Variant View
          </p>
          <div className="flex flex-col gap-1.5 max-h-[220px] overflow-y-auto pr-1">
            <button
              type="button"
              onClick={() => setActiveTab?.("parent")}
              className={`text-left font-mono text-[12px] uppercase p-3 border transition-all rounded-sm cursor-pointer ${
                activeTab === "parent"
                  ? "border-accent text-accent bg-accent/5 font-semibold"
                  : "border-border/50 text-muted hover:text-primary hover:border-accent/40 bg-background/30"
              }`}
            >
              Main Details
            </button>
            {variants.map((v: any, i: number) => (
              <div key={i} className="group relative flex items-center w-full">
                <button
                  type="button"
                  onClick={() => setActiveTab?.(i)}
                  className={`flex-1 text-left font-mono text-[12px] uppercase p-3 border transition-all rounded-l-sm cursor-pointer ${
                    activeTab === i
                      ? "border-accent border-r-transparent text-accent bg-accent/5 font-semibold"
                      : "border-border/50 border-r-transparent text-muted hover:text-primary hover:border-accent/40 bg-background/30"
                  }`}
                >
                  <span className="truncate max-w-[140px] block">
                    {v.name || `Variant ${i + 1}`}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    removeVariant?.(i);
                    if (activeTab === i) setActiveTab?.("parent");
                    else if (typeof activeTab === "number" && activeTab > i)
                      setActiveTab?.(activeTab - 1);
                  }}
                  className={`px-3 py-3 text-[13px] border border-l-transparent text-muted hover:text-red-400 bg-background/30 hover:bg-red-950/20 transition-all rounded-r-sm cursor-pointer ${
                    activeTab === i ? "border-accent" : "border-border/50"
                  }`}
                  title="Delete variant"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                const newIdx = variants.length;
                addVariant?.();
                setActiveTab?.(newIdx);
              }}
              className="p-3 font-mono text-[11px] uppercase tracking-wider text-accent border border-dashed border-accent/40 hover:border-accent hover:bg-accent/5 transition-all bg-background/20 text-center rounded-sm cursor-pointer font-medium"
            >
              + Add Variant
            </button>
          </div>
        </div>

        {/* Form Sections */}
        <div className="space-y-3 pt-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted font-semibold">
            {isParentMode ? "Product Sections" : "Variant Overrides"}
          </p>
          <ul className="border-l border-border/50 pl-0 list-none space-y-3 font-mono text-[11px]">
            {sections.map((sec: any) => (
              <li key={sec.id} className="relative pl-4">
                <span
                  className={`absolute left-[-3.5px] top-1.5 w-1.5 h-1.5 rounded-full ${
                    sec.done
                      ? "bg-emerald-500 shadow-sm shadow-emerald-500/30"
                      : "bg-transparent border border-muted"
                  }`}
                ></span>
                <button
                  type="button"
                  onClick={() => scrollToSection(sec.id, sec.id)}
                  className={`text-left uppercase tracking-wider hover:text-accent transition-colors cursor-pointer bg-transparent border-0 p-0 font-mono text-[11px] ${
                    sec.done ? "text-secondary/90 font-medium" : "text-muted"
                  }`}
                >
                  {sec.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Footer Link */}
      <div className="pt-4 border-t border-border mt-auto">
        {submitForm && (
          <button
            type="button"
            disabled={saving}
            onClick={submitForm}
            className={`w-full text-center block px-4 py-3 text-[10px] font-mono tracking-[0.15em] uppercase transition-all duration-200 rounded-sm cursor-pointer
              ${
                mode === "add" || isDirty
                  ? "bg-accent text-black hover:bg-accent-hover font-bold shadow-md shadow-accent/15"
                  : "border border-border text-muted bg-background/50 hover:text-primary hover:border-muted font-normal"
              }
              disabled:opacity-50`}
          >
            {saving
              ? "Saving..."
              : mode === "add"
                ? "✓ Save Product"
                : "✓ Update Product"}
          </button>
        )}
      </div>
    </div>
  );
}
