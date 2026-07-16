'use client';
import React, { createContext, useContext, useState } from 'react';

export interface ProductFormSidebarState {
  mode: 'add' | 'edit';
  productName: string;
  sku: string;
  isDirty: boolean;
  activeTab: 'parent' | number;
  setActiveTab: (tab: 'parent' | number) => void;
  variants: { name: string; sku: string }[];
  addVariant: () => void;
  removeVariant: (idx: number) => void;
  isBasicComplete: boolean;
  isPricingComplete: boolean;
  isSpecsComplete: boolean;
  isSeoComplete: boolean;
  isImagesComplete: boolean;
  isVarBasicComplete?: boolean;
  isVarPricingComplete?: boolean;
  isVarDimensionsComplete?: boolean;
  isVarSpecsComplete?: boolean;
  isVarPlatformComplete?: boolean;
  isVarImagesComplete?: boolean;
  openSections: {
    basic: boolean;
    pricing: boolean;
    specs: boolean;
    seo: boolean;
    images: boolean;
    v_basic: boolean;
    v_pricing: boolean;
    v_dimensions: boolean;
    v_specs: boolean;
    v_platform: boolean;
    v_images: boolean;
  };
  setOpenSections: (updater: (prev: any) => any) => void;
}

interface SidebarContextType {
  productFormState: ProductFormSidebarState | null;
  setProductFormState: (state: ProductFormSidebarState | null) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [productFormState, setProductFormState] = useState<ProductFormSidebarState | null>(null);

  return (
    <SidebarContext.Provider value={{ productFormState, setProductFormState }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}
