"use client";
import React, { createContext, useContext, useState } from "react";

export interface ProductFormSidebarState {
  mode: "add" | "edit";
  productId?: string;
  productName: string;
  sku: string;
  isDirty: boolean;
  activeTab: "parent" | number;
  setActiveTab: (tab: "parent" | number) => void;
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

export interface OrderDetailSidebarState {
  orderId: string;
  orderNumber: string;
  channel?: string | null;
  status: string;
  totalAmount: number;
  customerName?: string;
  itemCount: number;
  awbNumber?: string | null;
  amazonOrderId?: string | null;
  amazonFulfillmentType?: string | null;
  shiprocketLabelUrl?: string | null;
  manifestUrl?: string | null;
  shiprocketInvoiceUrl?: string | null;
}

interface SidebarContextType {
  productFormState: ProductFormSidebarState | null;
  setProductFormState: (state: ProductFormSidebarState | null) => void;
  orderDetailState: OrderDetailSidebarState | null;
  setOrderDetailState: (state: OrderDetailSidebarState | null) => void;
  isPageDirty: boolean;
  setIsPageDirty: (dirty: boolean) => void;
  isMobileNavOpen: boolean;
  setIsMobileNavOpen: (open: boolean) => void;
}

const defaultContextValue: SidebarContextType = {
  productFormState: null,
  setProductFormState: () => {},
  orderDetailState: null,
  setOrderDetailState: () => {},
  isPageDirty: false,
  setIsPageDirty: () => {},
  isMobileNavOpen: false,
  setIsMobileNavOpen: () => {},
};

const SidebarContext = createContext<SidebarContextType>(defaultContextValue);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [productFormState, setProductFormState] =
    useState<ProductFormSidebarState | null>(null);
  const [orderDetailState, setOrderDetailState] =
    useState<OrderDetailSidebarState | null>(null);
  const [isPageDirty, setIsPageDirty] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <SidebarContext.Provider
      value={{
        productFormState,
        setProductFormState,
        orderDetailState,
        setOrderDetailState,
        isPageDirty,
        setIsPageDirty,
        isMobileNavOpen,
        setIsMobileNavOpen,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  return context || defaultContextValue;
}
