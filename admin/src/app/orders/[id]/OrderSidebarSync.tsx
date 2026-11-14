"use client";

import { useEffect } from "react";
import {
  useSidebar,
  OrderDetailSidebarState,
} from "@/lib/context/SidebarContext";

export default function OrderSidebarSync(props: OrderDetailSidebarState) {
  const sidebar = useSidebar();

  useEffect(() => {
    try {
      if (sidebar && typeof sidebar.setOrderDetailState === "function") {
        sidebar.setOrderDetailState(props);
      }
    } catch (e) {
      // Ignore during dev server HMR transitions
    }

    return () => {
      try {
        if (sidebar && typeof sidebar.setOrderDetailState === "function") {
          sidebar.setOrderDetailState(null);
        }
      } catch (e) {
        // Ignore during dev server HMR transitions
      }
    };
  }, [
    props.orderId,
    props.status,
    props.totalAmount,
    props.customerName,
    props.itemCount,
    sidebar,
  ]);

  return null;
}
