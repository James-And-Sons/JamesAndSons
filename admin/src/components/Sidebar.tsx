"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logoutAction } from "@/app/actions";
import { useEffect, useState, useRef, memo } from "react";
import { useSidebar } from "@/lib/context/SidebarContext";
import SyncButton from "@/components/SyncButton";
import { BrandLogo, useTenantConfig } from "@james-andsons/ui";
import {
  LayoutDashboard,
  Package,
  MessageSquare,
  Grid3x3,
  BookMarked,
  Building2,
  FileText,
  BookOpen,
  Megaphone,
  Tag,
  BookCopy,
  Users,
  TicketCheck,
  Settings,
  Image,
  Truck,
  FileSpreadsheet,
  Mail,
  Bell,
  User,
  ArrowLeft,
  Radio,
  CreditCard,
  FileCheck,
  Download,
  RefreshCw,
} from "lucide-react";

// Persistent module-level cache to prevent flickering / unmounting resets
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
  const config = useTenantConfig();
  const pathname = usePathname();
  const router = useRouter();
  const { productFormState, orderDetailState, isPageDirty } = useSidebar();

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const isDirty = productFormState?.isDirty || isPageDirty;
    if (isDirty) {
      if (
        !confirm("You have unsaved changes. Are you sure you want to leave?")
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    }
  };
  const [openTickets, setOpenTickets] = useState<number | null>(null);
  const [openRfqs, setOpenRfqs] = useState<number | null>(null);
  const [openInquiries, setOpenInquiries] = useState<number | null>(null);
  const [categories, setCategories] = useState<
    { id: string; name: string; _count?: { products: number } }[]
  >([]);
  const [spaces, setSpaces] = useState<
    { id: string; name: string; _count?: { products: number } }[]
  >([]);
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

    // Fetch collections (categories)
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

    // Fetch spaces
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

  const navRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (navRef.current && cachedNavScrollTop > 0) {
      navRef.current.scrollTop = cachedNavScrollTop;
    }
  }, []);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [isDownloadingSidebar, setIsDownloadingSidebar] = useState(false);

  useEffect(() => {
    const handleStatus = (e: any) => {
      if (e.detail && typeof e.detail.downloading === "boolean") {
        setIsDownloadingSidebar(e.detail.downloading);
      }
    };
    if (typeof window !== "undefined") {
      window.addEventListener("jns:download-status", handleStatus);
      return () => {
        window.removeEventListener("jns:download-status", handleStatus);
      };
    }
  }, []);

  const renderLink = (
    name: string,
    href: string,
    badge?: number | null,
    Icon?: React.ComponentType<{
      size?: number;
      strokeWidth?: number;
      className?: string;
    }>,
  ) => {
    const isActive =
      href === "/"
        ? pathname === "/"
        : href === "/promotions"
          ? pathname === "/promotions" ||
            (pathname.startsWith("/promotions/") &&
              !pathname.startsWith("/promotions/push"))
          : (pathname === href || pathname.startsWith(href + "/")) &&
            !(href === "/products" && currentCategoryId) &&
            !(href === "/spaces" && currentManageId) &&
            !(href === "/collections" && currentCategoryId);

    const activeBadge = isMounted ? badge : null;

    return (
      <Link
        suppressHydrationWarning
        href={href}
        aria-current={isActive ? "page" : undefined}
        onClick={(e) => {
          handleNavClick(e);
          if (onClose) onClose();
        }}
        className={`
          group flex items-center justify-between px-4 py-3 font-mono text-[10px] tracking-[0.12em] uppercase transition-all duration-200 border relative overflow-hidden rounded-sm
          ${
            isActive
              ? "text-primary border-accent/40 bg-surface-muted font-semibold"
              : "text-muted border-transparent hover:text-accent hover:border-border hover:bg-surface-muted"
          }
        `}
      >
        <span className="group-hover:translate-x-1 transition-transform duration-200 flex items-center gap-2.5">
          {Icon ? (
            <Icon
              size={14}
              strokeWidth={isActive ? 2 : 1.5}
              className={
                isActive
                  ? "text-accent"
                  : "text-muted/70 group-hover:text-accent"
              }
              aria-hidden="true"
            />
          ) : isActive ? (
            <span
              className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"
              aria-hidden="true"
            ></span>
          ) : null}
          <span>{name}</span>
        </span>
        {activeBadge !== null &&
          activeBadge !== undefined &&
          activeBadge > 0 && (
            <span className="bg-[#f59e0b] text-black font-mono text-[9px] font-medium px-1.5 py-0.5 min-w-[20px] text-center rounded-sm">
              {activeBadge}
            </span>
          )}
      </Link>
    );
  };

  const renderDropdown = (
    name: string,
    dropdownKey: "collections" | "spaces",
    manageHref: string,
    subItems: { name: string; href: string; active: boolean }[],
  ) => {
    const isOpen = openDropdowns[dropdownKey];
    const toggle = () =>
      setOpenDropdowns((prev) => ({
        ...prev,
        [dropdownKey]: !prev[dropdownKey],
      }));
    const isGroupActive =
      pathname === manageHref ||
      pathname.startsWith(manageHref + "/") ||
      subItems.some((item) => item.active);

    return (
      <div className="space-y-1">
        <div
          className={`
          flex items-center justify-between font-mono text-[10px] tracking-[0.12em] uppercase transition-all duration-200 border rounded-sm relative overflow-hidden group
          ${
            isGroupActive
              ? "text-primary border-accent/30 bg-surface-muted/40 font-semibold"
              : "text-muted border-transparent hover:text-accent hover:border-border hover:bg-surface-muted"
          }
        `}
        >
          {/* Left Link Area: Clicking navigates to default view */}
          <Link
            href={manageHref}
            onClick={(e) => {
              handleNavClick(e);
              if (onClose) onClose();
            }}
            className="flex-1 px-4 py-3 flex items-center gap-2 hover:text-accent transition-colors"
          >
            {isGroupActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-accent/70"></span>
            )}
            <span>{name}</span>
          </Link>

          {/* Right Toggle Button: Clicking expands/collapses the dropdown */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggle();
            }}
            className="px-4 py-3 flex items-center justify-center border-l border-border/10 hover:text-accent transition-colors cursor-pointer"
            aria-label={`Toggle ${name} dropdown`}
          >
            <span
              className={`text-[12px] font-semibold transition-transform duration-300 ${isOpen ? "rotate-90 text-accent" : ""}`}
            >
              ›
            </span>
          </button>
        </div>

        <div
          className="overflow-hidden transition-all duration-300 ease-in-out pl-3 space-y-1 border-l border-border/50 ml-4"
          style={{
            maxHeight: isOpen ? `${(subItems.length + 1) * 38}px` : "0px",
            opacity: isOpen ? 1 : 0,
            pointerEvents: isOpen ? "auto" : "none",
          }}
        >
          <Link
            href={manageHref}
            onClick={(e) => {
              handleNavClick(e);
              if (onClose) onClose();
            }}
            className={`
              group flex items-center pl-4 py-2.5 font-mono text-[9px] tracking-[0.15em] uppercase transition-all duration-200 border-l hover:border-accent/40 relative rounded-sm
              ${
                pathname === manageHref && !subItems.some((i) => i.active)
                  ? "text-accent border-l-accent bg-surface-muted/20 font-semibold font-medium"
                  : "text-muted border-l-transparent hover:text-accent hover:bg-surface-muted"
              }
            `}
          >
            <span className="group-hover:translate-x-1 transition-transform duration-200">
              View All {name}
            </span>
          </Link>

          {subItems.map((item, idx) => (
            <Link
              key={idx}
              href={item.href}
              onClick={(e) => {
                handleNavClick(e);
                if (onClose) onClose();
              }}
              className={`
                group flex items-center pl-4 py-2.5 font-mono text-[9px] tracking-[0.15em] uppercase transition-all duration-200 border-l hover:border-accent/40 relative rounded-sm
                ${
                  item.active
                    ? "text-accent border-l-accent bg-surface-muted/20 font-semibold font-medium"
                    : "text-muted border-l-transparent hover:text-accent hover:bg-surface-muted"
                }
              `}
            >
              <span className="group-hover:translate-x-1 transition-transform duration-200 flex items-center gap-1.5">
                {item.active && (
                  <span className="w-1 h-1 rounded-full bg-accent animate-pulse"></span>
                )}
                {item.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    );
  };

  const renderCatalogDropdown = () => {
    const dropdownKey = "catalog";
    const isOpen = openDropdowns[dropdownKey];
    const toggle = () =>
      setOpenDropdowns((prev) => ({
        ...prev,
        [dropdownKey]: !prev[dropdownKey],
      }));
    const isGroupActive =
      pathname.startsWith("/products") || pathname === "/products/add";

    return (
      <div className="space-y-1">
        <div
          className={`
          flex items-center justify-between font-mono text-[10px] tracking-[0.12em] uppercase transition-all duration-200 border rounded-sm relative overflow-hidden group
          ${
            isGroupActive
              ? "text-primary border-accent/30 bg-surface-muted/40 font-semibold"
              : "text-muted border-transparent hover:border-border hover:bg-surface-muted"
          }
        `}
        >
          {/* Left Link Area: Clicking navigates to default view */}
          <Link
            href="/products"
            onClick={(e) => {
              handleNavClick(e);
              if (onClose) onClose();
            }}
            className="flex-1 px-4 py-3 flex items-center gap-2 hover:text-accent transition-colors"
          >
            {isGroupActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-accent/70"></span>
            )}
            <span>Catalog & Pricing</span>
          </Link>

          {/* Right Toggle Button: Clicking expands/collapses the dropdown */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggle();
            }}
            className="px-4 py-3 flex items-center justify-center border-l border-border/10 hover:text-accent transition-colors cursor-pointer"
            aria-label="Toggle Catalog dropdown"
          >
            <span
              className={`text-[12px] font-semibold transition-transform duration-300 ${isOpen ? "rotate-90 text-accent" : ""}`}
            >
              ›
            </span>
          </button>
        </div>

        <div
          className="overflow-hidden transition-all duration-300 ease-in-out pl-3 space-y-1 border-l border-border/50 ml-4"
          style={{
            maxHeight: isOpen ? "160px" : "0px",
            opacity: isOpen ? 1 : 0,
            pointerEvents: isOpen ? "auto" : "none",
          }}
        >
          {/* Search bar inside dropdown */}
          <div className="px-2 py-2">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search catalog..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    router.push(`/products?q=${encodeURIComponent(searchVal)}`);
                    if (onClose) onClose();
                  }
                }}
                className="w-full bg-background border border-border/80 hover:border-border/100 focus:border-accent px-3 py-2 text-[11px] font-mono text-primary focus:outline-none transition-colors placeholder:text-muted/50 rounded-sm"
              />
              {searchVal && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchVal("");
                    router.push("/products");
                  }}
                  className="absolute right-2.5 top-2 text-muted hover:text-accent font-mono text-[12px] cursor-pointer"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          <Link
            href="/products"
            onClick={(e) => {
              handleNavClick(e);
              if (onClose) onClose();
            }}
            className={`
              group flex items-center pl-4 py-2.5 font-mono text-[9px] tracking-[0.15em] uppercase transition-all duration-200 border-l hover:border-accent/40 relative rounded-sm
              ${
                pathname === "/products" && !searchVal
                  ? "text-accent border-l-accent bg-surface-muted/20 font-semibold font-medium"
                  : "text-muted border-l-transparent hover:text-accent hover:bg-surface-muted"
              }
            `}
          >
            <span className="group-hover:translate-x-1 transition-transform duration-200">
              View All
            </span>
          </Link>

          <Link
            href="/products/add"
            onClick={(e) => {
              handleNavClick(e);
              if (onClose) onClose();
            }}
            className={`
              group flex items-center pl-4 py-2.5 font-mono text-[9px] tracking-[0.15em] uppercase transition-all duration-200 border-l hover:border-accent/40 relative rounded-sm
              ${
                pathname === "/products/add"
                  ? "text-accent border-l-accent bg-surface-muted/20 font-semibold font-medium"
                  : "text-muted border-l-transparent hover:text-accent hover:bg-surface-muted"
              }
            `}
          >
            <span className="group-hover:translate-x-1 transition-transform duration-200">
              Add Product
            </span>
          </Link>
        </div>
      </div>
    );
  };

  const renderOrderFormOutline = () => {
    if (!orderDetailState) return null;
    const {
      orderId,
      orderNumber,
      status,
      totalAmount,
      customerName,
      itemCount,
      awbNumber,
      shiprocketLabelUrl,
      manifestUrl,
      shiprocketInvoiceUrl,
    } = orderDetailState;

    const navSections = [
      { id: "customer-info", label: "Customer Details", icon: User },
      { id: "fulfillment-studio", label: "Fulfillment Studio", icon: Truck },
      { id: "order-items", label: `Order Items (${itemCount})`, icon: Package },
      { id: "payment-summary", label: "Financial Summary", icon: CreditCard },
      { id: "compliance-documents", label: "Documents Studio", icon: FileText },
      { id: "live-tracking", label: "Live Tracking", icon: Radio },
    ];

    const scrollToSection = (id: string) => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    return (
      <div className="space-y-4">
        {/* Back Link */}
        <Link
          href="/orders"
          onClick={handleNavClick}
          className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted hover:text-accent transition-colors px-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>All Orders</span>
        </Link>

        {/* Order Header Summary Card */}
        <div className="bg-surface border border-border p-3.5 rounded-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[13px] font-bold text-primary">
              {orderNumber}
            </span>
            <span className="font-mono text-[9px] uppercase px-2 py-0.5 bg-amber-500/5 border border-amber-500/20 text-amber-400/90 font-bold rounded-xs">
              {status}
            </span>
          </div>
          {customerName && (
            <p className="font-serif text-[12px] text-muted truncate m-0">
              {customerName}
            </p>
          )}
          <div className="flex justify-between items-center pt-1.5 border-t border-border/60">
            <span className="font-mono text-[9px] text-muted uppercase">
              Total Value
            </span>
            <span className="font-mono text-[12px] font-bold text-accent">
              ₹{totalAmount.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* Section Jump Nav */}
        <div className="space-y-1">
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted px-2 py-1 m-0">
            Quick Jump Nav
          </p>
          {navSections.map((sec) => {
            const Icon = sec.icon;
            return (
              <button
                key={sec.id}
                onClick={() => scrollToSection(sec.id)}
                className="w-full text-left font-mono text-[11px] text-muted hover:text-accent hover:bg-accent/10 px-3 py-2 rounded-xs transition-colors flex items-center gap-2 cursor-pointer group"
              >
                <Icon className="w-3.5 h-3.5 text-muted group-hover:text-accent flex-shrink-0" />
                <span className="truncate">{sec.label}</span>
              </button>
            );
          })}
        </div>

        {/* Downloadable Documents List */}
        <div className="pt-2 border-t border-border space-y-1">
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted px-2 py-1 m-0">
            Download Documents
          </p>

          {/* Download All Button (triggers exact same PDF bundle download) */}
          <button
            type="button"
            disabled={isDownloadingSidebar}
            onClick={() => {
              if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("jns:download-all-docs"));
              }
            }}
            className="w-full text-left font-mono text-[9px] uppercase tracking-wider px-3 py-2 bg-accent text-black hover:bg-accent-hover font-bold rounded-xs transition-colors flex items-center justify-between mb-2 cursor-pointer shadow-sm disabled:opacity-60"
            title="Download all selected documents as a bundled package"
          >
            <span className="flex items-center gap-1.5">
              {isDownloadingSidebar ? (
                <RefreshCw className="w-3.5 h-3.5 text-black animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5 text-black" />
              )}
              <span>
                {isDownloadingSidebar
                  ? "Preparing Package..."
                  : "Download All Documents"}
              </span>
            </span>
          </button>

          {/* 1. GST Tax Invoice */}
          <a
            href={`/api/orders/${orderId}/invoice`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full text-left font-mono text-[10px] uppercase tracking-wider text-accent hover:text-accent-hover hover:bg-accent/10 px-3 py-1.5 rounded-xs transition-colors flex items-center justify-between group"
          >
            <span className="flex items-center gap-2 truncate">
              <FileText className="w-3.5 h-3.5 text-accent flex-shrink-0" />
              <span>GST Tax Invoice</span>
            </span>
            <span className="text-[10px]">↗</span>
          </a>

          {/* 2. Shipping Label */}
          {shiprocketLabelUrl ? (
            <a
              href={shiprocketLabelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full text-left font-mono text-[10px] uppercase tracking-wider text-accent hover:text-accent-hover hover:bg-accent/10 px-3 py-1.5 rounded-xs transition-colors flex items-center justify-between group"
            >
              <span className="flex items-center gap-2 truncate">
                <Tag className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                <span>Shipping Label</span>
              </span>
              <span className="text-[10px]">↗</span>
            </a>
          ) : (
            <button
              onClick={() => scrollToSection("compliance-documents")}
              className="w-full text-left font-mono text-[10px] uppercase tracking-wider text-muted hover:text-primary hover:bg-surface-muted px-3 py-1.5 rounded-xs transition-colors flex items-center justify-between group cursor-pointer"
            >
              <span className="flex items-center gap-2 truncate">
                <Tag className="w-3.5 h-3.5 text-muted flex-shrink-0" />
                <span>Shipping Label</span>
              </span>
              <span className="text-[9px] opacity-60">
                {awbNumber ? "Fetch" : "Pending"}
              </span>
            </button>
          )}

          {/* 3. Pickup Manifest */}
          {manifestUrl ? (
            <a
              href={manifestUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full text-left font-mono text-[10px] uppercase tracking-wider text-accent hover:text-accent-hover hover:bg-accent/10 px-3 py-1.5 rounded-xs transition-colors flex items-center justify-between group"
            >
              <span className="flex items-center gap-2 truncate">
                <Package className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                <span>Pickup Manifest</span>
              </span>
              <span className="text-[10px]">↗</span>
            </a>
          ) : (
            <button
              onClick={() => scrollToSection("compliance-documents")}
              className="w-full text-left font-mono text-[10px] uppercase tracking-wider text-muted hover:text-primary hover:bg-surface-muted px-3 py-1.5 rounded-xs transition-colors flex items-center justify-between group cursor-pointer"
            >
              <span className="flex items-center gap-2 truncate">
                <Package className="w-3.5 h-3.5 text-muted flex-shrink-0" />
                <span>Pickup Manifest</span>
              </span>
              <span className="text-[9px] opacity-60">
                {awbNumber ? "Fetch" : "Pending"}
              </span>
            </button>
          )}

          {/* 4. Courier Invoice */}
          {shiprocketInvoiceUrl ? (
            <a
              href={shiprocketInvoiceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full text-left font-mono text-[10px] uppercase tracking-wider text-accent hover:text-accent-hover hover:bg-accent/10 px-3 py-1.5 rounded-xs transition-colors flex items-center justify-between group"
            >
              <span className="flex items-center gap-2 truncate">
                <FileCheck className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                <span>Courier Invoice</span>
              </span>
              <span className="text-[10px]">↗</span>
            </a>
          ) : (
            <button
              onClick={() => scrollToSection("compliance-documents")}
              className="w-full text-left font-mono text-[10px] uppercase tracking-wider text-muted hover:text-primary hover:bg-surface-muted px-3 py-1.5 rounded-xs transition-colors flex items-center justify-between group cursor-pointer"
            >
              <span className="flex items-center gap-2 truncate">
                <FileCheck className="w-3.5 h-3.5 text-muted flex-shrink-0" />
                <span>Courier Invoice</span>
              </span>
              <span className="text-[9px] opacity-60">
                {awbNumber ? "Fetch" : "Pending"}
              </span>
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderProductFormOutline = () => {
    if (!productFormState) return null;
    const {
      mode,
      productId,
      productName,
      sku,
      isDirty,
      activeTab,
      setActiveTab,
      variants,
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
      openSections,
      setOpenSections,
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
      {
        id: "v_pricing",
        name: "Pricing Overrides",
        done: isVarPricingComplete,
      },
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
      setOpenSections((prev: any) => ({ ...prev, [sectionKey]: true }));
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
                className={`w-1.5 h-1.5 rounded-full ${isDirty ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`}
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
                onClick={() => setActiveTab("parent")}
                className={`text-left font-mono text-[12px] uppercase p-3 border transition-all rounded-sm cursor-pointer ${
                  activeTab === "parent"
                    ? "border-accent text-accent bg-accent/5 font-semibold"
                    : "border-border/50 text-muted hover:text-primary hover:border-accent/40 bg-background/30"
                }`}
              >
                Main Details
              </button>
              {variants.map((v, i) => (
                <div
                  key={i}
                  className="group relative flex items-center w-full"
                >
                  <button
                    type="button"
                    onClick={() => setActiveTab(i)}
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
                      removeVariant(i);
                      if (activeTab === i) setActiveTab("parent");
                      else if (typeof activeTab === "number" && activeTab > i)
                        setActiveTab(activeTab - 1);
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
                  addVariant();
                  setActiveTab(newIdx);
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
              {sections.map((sec) => (
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
          {productFormState.submitForm && (
            <button
              type="button"
              disabled={productFormState.saving}
              onClick={productFormState.submitForm}
              className={`w-full text-center block px-4 py-3 text-[10px] font-mono tracking-[0.15em] uppercase transition-all duration-200 rounded-sm cursor-pointer
                ${
                  productFormState.mode === "add" || productFormState.isDirty
                    ? "bg-accent text-black hover:bg-accent-hover font-bold shadow-md shadow-accent/15"
                    : "border border-border text-muted bg-background/50 hover:text-primary hover:border-muted font-normal"
                }
                disabled:opacity-50`}
            >
              {productFormState.saving
                ? "Saving..."
                : productFormState.mode === "add"
                  ? "✓ Save Product"
                  : "✓ Update Product"}
            </button>
          )}
        </div>
      </div>
    );
  };

  const handleLogout = async () => {
    await logoutAction();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        suppressHydrationWarning={true}
        className={`
        w-[260px] fixed inset-y-0 left-0 z-50 h-screen bg-surface flex flex-col border-r border-border shrink-0 transition-transform duration-300 lg:translate-x-0
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        <div className="h-[64px] flex flex-col justify-center px-8 border-b border-border relative overflow-hidden bg-background">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BrandLogo
                variant="light"
                className="logo-light-img h-14 w-auto z-10"
              />
              <BrandLogo
                variant="dark"
                className="logo-dark-img h-14 w-auto z-10"
              />
              <div>
                <h1 className="font-serif text-[16px] font-light tracking-[0.2em] text-accent-hover uppercase z-10 leading-none">
                  {config.brand.name}
                </h1>
                <p className="font-mono text-[8px] text-muted mt-1 uppercase tracking-[0.18em] z-10 leading-none">
                  Admin Portal
                </p>
              </div>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="lg:hidden p-2 text-muted hover:text-accent"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            )}
          </div>
        </div>

        <nav
          ref={navRef}
          onScroll={(e) => {
            cachedNavScrollTop = e.currentTarget.scrollTop;
          }}
          className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto"
        >
          {productFormState ? (
            renderProductFormOutline()
          ) : orderDetailState ? (
            renderOrderFormOutline()
          ) : (
            <>
              {renderLink("Dashboard", "/", null, LayoutDashboard)}
              {renderLink("Orders", "/orders", null, Package)}
              {renderLink(
                "Contact Inquiries",
                "/inquiries",
                openInquiries,
                Mail,
              )}
              {renderLink("Trade RFQs", "/rfqs", openRfqs, FileText)}

              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted pt-4 pb-1 px-3">
                Catalog
              </p>
              {renderCatalogDropdown()}

              {renderDropdown(
                "Categories",
                "collections",
                "/collections",
                categories.map((c) => ({
                  name: `${c.name} (${c._count?.products || 0})`,
                  href: `/collections?edit=${c.id}`,
                  active: currentEditCategoryId === c.id,
                })),
              )}

              {renderDropdown(
                "Spaces",
                "spaces",
                "/spaces",
                spaces.map((s) => ({
                  name: `${s.name} (${s._count?.products || 0})`,
                  href: `/spaces/${s.id}/edit`,
                  active: pathname === `/spaces/${s.id}/edit`,
                })),
              )}

              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted pt-4 pb-1 px-3">
                Business
              </p>
              {renderLink("B2B Workspace", "/b2b", null, Building2)}
              {renderLink(
                "Accounting & GST",
                "/accounting",
                null,
                FileSpreadsheet,
              )}
              {renderLink("Blog", "/blog", null, BookOpen)}
              {renderLink("Marketing", "/campaigns", null, Megaphone)}
              {renderLink("Push Campaigns", "/promotions/push", null, Bell)}
              {renderLink("Coupons", "/promotions", null, Tag)}
              {renderLink("Affiliates", "/affiliates", null, Users)}
              {renderLink("Tickets", "/tickets", openTickets, TicketCheck)}

              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted pt-4 pb-1 px-3">
                System
              </p>
              {renderLink("Customers", "/customers", null, Users)}
              {renderLink("Logistics", "/logistics", null, Truck)}
              {renderLink("Settings", "/account", null, Settings)}
            </>
          )}
        </nav>

        <div className="p-4 border-t border-border bg-background/50 space-y-1.5">
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2.5 text-[10px] font-mono tracking-[0.14em] uppercase text-[#C97E6A] bg-[#C97E6A]/10 border border-[#C97E6A]/30 hover:bg-[#C97E6A]/20 transition-all rounded-sm flex items-center justify-between cursor-pointer font-medium"
          >
            <span>Sign Out</span>
            <span aria-hidden="true">➔</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default memo(Sidebar);
