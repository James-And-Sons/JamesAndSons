'use client';
import React, { createContext, useContext, useState } from 'react';

export interface ProductFormSidebarState {
  mode: 'add' | 'edit';
  productId?: string;
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
  submitForm?: () => void;
  saving?: boolean;
}

interface SidebarContextType {
  productFormState: ProductFormSidebarState | null;
  setProductFormState: (state: ProductFormSidebarState | null) => void;
  isPageDirty: boolean;
  setIsPageDirty: (dirty: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [productFormState, setProductFormState] = useState<ProductFormSidebarState | null>(null);
  const [isPageDirty, setIsPageDirty] = useState(false);

  return (
    <SidebarContext.Provider value={{ productFormState, setProductFormState, isPageDirty, setIsPageDirty }}>
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
