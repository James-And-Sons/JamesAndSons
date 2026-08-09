"use client";

import React, { useEffect, useState, useRef, memo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSidebar } from "@/lib/context/SidebarContext";
import SidebarHeader from "./sidebar/SidebarHeader";
import SidebarUserFooter from "./sidebar/SidebarUserFooter";
import SidebarProductFormOutline from "./sidebar/SidebarProductFormOutline";
import SidebarOrderFormOutline from "./sidebar/SidebarOrderFormOutline";
import SidebarPromotionOutline from "./sidebar/SidebarPromotionOutline";
import SidebarNavItem from "./sidebar/SidebarNavItem";
import SidebarDropdownGroup from "./sidebar/SidebarDropdownGroup";
import {
  LayoutDashboard,
  Package,
  Grid3x3,
  BookMarked,
  Building2,
  FileText,
  BookOpen,
  Megaphone,
  Tag,
  Users,
  TicketCheck,
  Truck,
  Mail,
  Bell,
  FileSpreadsheet,
  Settings,
  Sliders,
} from "lucide-react";

let cachedTickets: number | null = null;
let cachedRfqs: number | null = null;
let cachedInquiries: number | null = null;
let cachedCategories: {
  id: string;
  name: string;
  _count?: { products: number };
}[] = [];
let cachedSpaces: {
  id: string;
  name: string;
  _count?: { products: number };
}[] = [];
let cachedNavScrollTop = 0;

function Sidebar({
  isOpen,
  onClose,
}: {
  isOpen?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    productFormState,
    orderDetailState,
    promotionFormState,
    isPageDirty,
  } = useSidebar();
  const [openTickets, setOpenTickets] = useState<number | null>(cachedTickets);
  const [openRfqs, setOpenRfqs] = useState<number | null>(cachedRfqs);
  const [openInquiries, setOpenInquiries] = useState<number | null>(
    cachedInquiries,
  );
  const [categories, setCategories] = useState(cachedCategories);
  const [spaces, setSpaces] = useState(cachedSpaces);
  const [searchVal, setSearchVal] = useState("");
  const [currentCategoryId, setCurrentCategoryId] = useState<string | null>(
    null,
  );
  const [currentEditCategoryId, setCurrentEditCategoryId] = useState<
    string | null
  >(null);
  const [currentManageId, setCurrentManageId] = useState<string | null>(null);

  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({
    collections: false,
    spaces: false,
    catalog: false,
  });

  const navRef = useRef<HTMLElement | null>(null);

  if (pathname === "/login") return null;

  useEffect(() => {
    fetch("/api/tickets/count")
      .then((r) => r.json())
      .then((d) => {
        cachedTickets = d.count;
        setOpenTickets(d.count);
      })
      .catch(() => {});

    fetch("/api/rfqs/count")
      .then((r) => r.json())
      .then((d) => {
        cachedRfqs = d.count;
        setOpenRfqs(d.count);
      })
      .catch(() => {});

    fetch("/api/inquiries/count")
      .then((r) => r.json())
      .then((d) => {
        cachedInquiries = d.count;
        setOpenInquiries(d.count);
      })
      .catch(() => {});

    fetch("/api/collections")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const sorted = data.sort((a, b) => a.name.localeCompare(b.name));
          cachedCategories = sorted;
          setCategories(sorted);
        }
      })
      .catch(() => {});

    fetch("/api/spaces")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const sorted = data.sort((a, b) => a.name.localeCompare(b.name));
          cachedSpaces = sorted;
          setSpaces(sorted);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const q = params.get("q") || "";
      const catId = params.get("categoryId");
      const editId = params.get("edit");
      const manageId = params.get("manage");

      setSearchVal(q);
      setCurrentCategoryId(catId);
      setCurrentEditCategoryId(editId);
      setCurrentManageId(manageId);

      if (catId || editId) {
        setOpenDropdowns((prev) => ({ ...prev, collections: true }));
      }
      const isSpaceEditPage =
        pathname.startsWith("/spaces/") && pathname.endsWith("/edit");
      if (manageId || isSpaceEditPage) {
        setOpenDropdowns((prev) => ({ ...prev, spaces: true }));
      }
      if (pathname === "/products/add" || q) {
        setOpenDropdowns((prev) => ({ ...prev, catalog: true }));
      }
    }
  }, [pathname]);

  useEffect(() => {
    if (navRef.current && cachedNavScrollTop > 0) {
      navRef.current.scrollTop = cachedNavScrollTop;
    }
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isPageDirty) {
      if (
        !confirm("You have unsaved changes. Are you sure you want to leave?")
      ) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
    }
    if (onClose) onClose();
  };

  const catalogSubItems = [
    {
      name: "All Products",
      href: "/products",
      active: pathname === "/products",
    },
    {
      name: "Add New Product",
      href: "/products/add",
      active: pathname === "/products/add",
    },
  ];

  const categorySubItems = categories.map((c) => ({
    name: `${c.name} (${c._count?.products || 0})`,
    href: `/collections?edit=${c.id}`,
    active: currentEditCategoryId === c.id,
  }));

  const spaceSubItems = spaces.map((s) => ({
    name: `${s.name} (${s._count?.products || 0})`,
    href: `/spaces/${s.id}/edit`,
    active: pathname === `/spaces/${s.id}/edit`,
  }));

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        suppressHydrationWarning
        className={`
          w-[260px] fixed inset-y-0 left-0 z-50 h-screen bg-surface flex flex-col border-r border-border shrink-0 transition-transform duration-300 lg:translate-x-0
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <SidebarHeader onClose={onClose} />

        <nav
          ref={navRef}
          onScroll={(e) => {
            cachedNavScrollTop = e.currentTarget.scrollTop;
          }}
          className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto"
        >
          {productFormState ? (
            <SidebarProductFormOutline
              productFormState={productFormState}
              onClose={onClose}
            />
          ) : orderDetailState ? (
            <SidebarOrderFormOutline
              orderDetailState={orderDetailState}
              onClose={onClose}
            />
          ) : promotionFormState ? (
            <SidebarPromotionOutline
              promotionState={promotionFormState}
              onClose={onClose}
            />
          ) : (
            <>
              <SidebarNavItem
                name="Dashboard"
                href="/"
                icon={LayoutDashboard}
                isActive={pathname === "/"}
                onClick={handleNavClick}
              />
              <SidebarNavItem
                name="Orders"
                href="/orders"
                icon={Package}
                isActive={pathname.startsWith("/orders")}
                onClick={handleNavClick}
              />
              <SidebarNavItem
                name="Contact Inquiries"
                href="/inquiries"
                icon={Mail}
                badge={openInquiries}
                isActive={pathname.startsWith("/inquiries")}
                onClick={handleNavClick}
              />
              <SidebarNavItem
                name="Trade RFQs"
                href="/rfqs"
                icon={FileText}
                badge={openRfqs}
                isActive={pathname.startsWith("/rfqs")}
                onClick={handleNavClick}
              />

              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted pt-4 pb-1 px-3">
                Catalog
              </p>
              <SidebarDropdownGroup
                name="Products"
                icon={Package}
                manageHref="/products"
                isGroupActive={
                  pathname.startsWith("/products") ||
                  pathname === "/products/add"
                }
                isOpenDefault={openDropdowns.catalog}
                subItems={catalogSubItems}
                onNavClick={handleNavClick}
                showSearch
                searchVal={searchVal}
                onSearchChange={setSearchVal}
                onSearchSubmit={() => {
                  router.push(`/products?q=${encodeURIComponent(searchVal)}`);
                  if (onClose) onClose();
                }}
                onSearchClear={() => {
                  setSearchVal("");
                  router.push("/products");
                }}
              />

              {categories.length > 0 && (
                <SidebarDropdownGroup
                  name="Categories"
                  icon={Grid3x3}
                  manageHref="/collections"
                  isGroupActive={
                    pathname === "/collections" ||
                    categorySubItems.some((i) => i.active)
                  }
                  isOpenDefault={openDropdowns.collections}
                  subItems={categorySubItems}
                  onNavClick={handleNavClick}
                />
              )}

              {spaces.length > 0 && (
                <SidebarDropdownGroup
                  name="Spaces"
                  icon={BookMarked}
                  manageHref="/spaces"
                  isGroupActive={
                    pathname === "/spaces" ||
                    spaceSubItems.some((i) => i.active)
                  }
                  isOpenDefault={openDropdowns.spaces}
                  subItems={spaceSubItems}
                  onNavClick={handleNavClick}
                />
              )}

              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted pt-4 pb-1 px-3">
                Business
              </p>
              <SidebarNavItem
                name="B2B Workspace"
                href="/b2b"
                icon={Building2}
                isActive={pathname.startsWith("/b2b")}
                onClick={handleNavClick}
              />
              <SidebarNavItem
                name="Accounting & GST"
                href="/accounting"
                icon={FileSpreadsheet}
                isActive={pathname.startsWith("/accounting")}
                onClick={handleNavClick}
              />
              <SidebarNavItem
                name="Blog"
                href="/blog"
                icon={BookOpen}
                isActive={pathname.startsWith("/blog")}
                onClick={handleNavClick}
              />
              <SidebarNavItem
                name="Marketing"
                href="/campaigns"
                icon={Megaphone}
                isActive={pathname.startsWith("/campaigns")}
                onClick={handleNavClick}
              />
              <SidebarNavItem
                name="Push Campaigns"
                href="/promotions/push"
                icon={Bell}
                isActive={pathname.startsWith("/promotions/push")}
                onClick={handleNavClick}
              />
              <SidebarNavItem
                name="Promotions & Coupons"
                href="/promotions"
                icon={Tag}
                isActive={
                  pathname === "/promotions" ||
                  (pathname.startsWith("/promotions/") &&
                    !pathname.startsWith("/promotions/push"))
                }
                onClick={handleNavClick}
              />
              <SidebarNavItem
                name="Affiliates"
                href="/affiliates"
                icon={Users}
                isActive={pathname.startsWith("/affiliates")}
                onClick={handleNavClick}
              />
              <SidebarNavItem
                name="Tickets"
                href="/tickets"
                icon={TicketCheck}
                badge={openTickets}
                isActive={pathname.startsWith("/tickets")}
                onClick={handleNavClick}
              />

              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted pt-4 pb-1 px-3">
                System
              </p>
              <SidebarNavItem
                name="Customers"
                href="/customers"
                icon={Users}
                isActive={pathname.startsWith("/customers")}
                onClick={handleNavClick}
              />
              <SidebarNavItem
                name="Logistics"
                href="/logistics"
                icon={Truck}
                isActive={pathname.startsWith("/logistics")}
                onClick={handleNavClick}
              />
              <SidebarNavItem
                name="Settings"
                href="/account"
                icon={Settings}
                isActive={pathname.startsWith("/account")}
                onClick={handleNavClick}
              />
            </>
          )}
        </nav>

        <SidebarUserFooter />
      </aside>
    </>
  );
}

export default memo(Sidebar);
