"use client";
import { useCartStore } from "@/store/cart";
import type { Product } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import { useWishlistStore } from "@/store/wishlist";
import { checkPincode, getSavedPincode } from "../actions";
import Image from "next/image";
import { AdaptiveImageFrame } from "@james-andsons/media";
import InquiryModal from "@/components/InquiryModal";

type Variant = {
  id: string;
  name: string;
  sku: string;
  d2cPrice: number | null;
  mrp: number | null;
  stockQuantity: number;
  images: string[];
  actualHeight?: number | null;
  actualWidth?: number | null;
  actualDepth?: number | null;
  dimensionUnit?: string | null;
  power?: string | null;
  voltage?: string | null;
  googleProductCategory?: string | null;
  color?: string | null;
  size?: string | null;
  material?: string | null;
  countryOfOrigin?: string | null;
  brand?: string | null;
  warranty?: string | null;
  materialAndFinish?: string[] | null;
  bulbType?: string[] | null;
  style?: string[] | null;
  specs?: any;
  weight?: number | null;
  length?: number | null;
  breadth?: number | null;
  height?: number | null;
  amazonFixtureForm?: string | null;
  amazonMountingType?: string | null;
};

export default function PDPClient({
  product,
  variants,
  isB2B,
}: {
  product: any;
  variants: Variant[];
  isB2B: boolean;
}) {
  const { addItem, items, updateQty, removeItem } = useCartStore();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});

  const mainBtnRef = useRef<HTMLDivElement>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);

  const lastWheelTimeRef = useRef<number>(0);
  const dragStartXRef = useRef<number | null>(null);

  const handleImageFrameWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!activeImages || activeImages.length <= 1) return;

    // Filter out micro-scroll drifts and unintentional touches
    const mainDelta =
      Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    if (Math.abs(mainDelta) < 20) return;

    const now = Date.now();
    // 450ms cooldown prevents trackpad inertial coasting from skipping multiple photos
    if (now - lastWheelTimeRef.current < 450) return;

    if (mainDelta > 0) {
      if (activeImg < activeImages.length - 1) {
        lastWheelTimeRef.current = now;
        setActiveImg((i) => i + 1);
      }
    } else if (mainDelta < 0) {
      if (activeImg > 0) {
        lastWheelTimeRef.current = now;
        setActiveImg((i) => i - 1);
      }
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragStartXRef.current = e.clientX;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (
      dragStartXRef.current === null ||
      !activeImages ||
      activeImages.length <= 1
    )
      return;
    const diffX = e.clientX - dragStartXRef.current;
    dragStartXRef.current = null;
    if (Math.abs(diffX) > 30) {
      if (diffX < 0 && activeImg < activeImages.length - 1) {
        setActiveImg((i) => i + 1);
      } else if (diffX > 0 && activeImg > 0) {
        setActiveImg((i) => i - 1);
      }
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const mainBtn = mainBtnRef.current;
      if (!mainBtn) return;

      const rect = mainBtn.getBoundingClientRect();
      const shouldShow = rect.bottom < 0;
      setShowStickyBar((prev) => (prev !== shouldShow ? shouldShow : prev));
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const ApproxBadge = ({ note }: { note?: string }) => {
    const [open, setOpen] = useState(false);
    return (
      <span style={{ position: "relative", display: "inline-block" }}>
        <button
          type="button"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          onClick={(e) => {
            e.stopPropagation();
            setOpen(!open);
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "14px",
            height: "14px",
            borderRadius: "50%",
            background: open
              ? "rgba(201,168,76,0.15)"
              : "rgba(255,255,255,0.06)",
            border: open
              ? "1px solid var(--gold)"
              : "1px solid rgba(255,255,255,0.2)",
            color: open ? "var(--gold)" : "var(--text-muted)",
            fontSize: "9px",
            fontFamily: "var(--font-mono)",
            fontWeight: 600,
            opacity: open ? 1 : 0.6,
            cursor: "help",
            marginLeft: "6px",
            verticalAlign: "middle",
            transition: "all 0.2s ease",
            padding: 0,
          }}
        >
          ?
        </button>
        {open && (
          <div
            style={{
              position: "absolute",
              bottom: "135%",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 1000,
              width: "200px",
              padding: "10px 12px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
              color: "var(--text-muted)",
              fontSize: "11px",
              fontFamily: "var(--font-body)",
              borderRadius: "8px",
              textAlign: "center",
              lineHeight: "1.4",
              pointerEvents: "none",
              whiteSpace: "normal",
              backdropFilter: "blur(10px)",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: "50%",
                transform: "translateX(-50%)",
                width: "0",
                height: "0",
                borderLeft: "6px solid transparent",
                borderRight: "6px solid transparent",
                borderTop: "6px solid var(--border)",
              }}
            />
            {note ||
              "Approximate value subject to hand-craftsmanship and manufacturing variances."}
          </div>
        )}
      </span>
    );
  };

  // Synthesize original/parent product option
  const parentOption: Variant = {
    id: "original",
    name: product.name,
    sku: product.sku,
    d2cPrice: product.d2cPrice,
    mrp: product.mrp,
    stockQuantity: product.stockQuantity,
    images: product.images || [],
    actualHeight: product.actualHeight,
    actualWidth: product.actualWidth,
    actualDepth: product.actualDepth,
    dimensionUnit: product.dimensionUnit,
    power: product.power,
    voltage: product.voltage,
    googleProductCategory: product.googleProductCategory,
    color: product.color,
    size: product.size,
    material: product.material,
    countryOfOrigin: product.countryOfOrigin,
    brand: product.brand,
    warranty: product.warranty,
    materialAndFinish: product.materialAndFinish,
    bulbType: product.bulbType,
    style: product.style,
    specs: product.specs,
    weight: product.weight,
    amazonFixtureForm: product.amazonFixtureForm,
    amazonMountingType: product.amazonMountingType,
  };

  const allOptions = variants.length > 0 ? [parentOption, ...variants] : [];
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(
    allOptions.length > 0 ? allOptions[0] : null,
  );
  const [pincode, setPincode] = useState("");
  const [pincodeError, setPincodeError] = useState("");
  const [shippingRes, setShippingRes] = useState<any>(null);
  const [checkingPincode, setCheckingPincode] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // Specifications & Reviews state
  const [showAllSpecs, setShowAllSpecs] = useState(false);
  const [reviewsExpanded, setReviewsExpanded] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewAuthor, setReviewAuthor] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [userReviews, setUserReviews] = useState<any[]>([]);

  // Parse description dynamically into narrative text and bullet highlight pointers
  const parseDescription = (desc: string) => {
    if (!desc) return { narrative: "", bullets: [] as string[] };
    const lines = desc.split("\n");
    const narrativeLines: string[] = [];
    const bullets: string[] = [];

    const cleanBulletText = (str: string) => {
      return str
        .trim()
        .replace(/^[.,:;\-\s]+/, "")
        .replace(/[.,:;\-\s]+$/, "");
    };

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      let cleanText = trimmed;
      let isBullet = false;

      if (/^[•\-\*]\s*/.test(trimmed)) {
        cleanText = trimmed.replace(/^[•\-\*]\s*/, "");
        isBullet = true;
      } else if (/^\d+[\.\)]\s*/.test(trimmed)) {
        cleanText = trimmed.replace(/^\d+[\.\)]\s*/, "");
        isBullet = true;
      }

      if (isBullet) {
        const finalCleanText = cleanBulletText(cleanText);
        if (finalCleanText) {
          bullets.push(finalCleanText);
        }
      } else {
        narrativeLines.push(trimmed);
      }
    }

    return {
      narrative: narrativeLines.join("\n\n"),
      bullets,
    };
  };

  const parsedDesc = parseDescription(product.description || "");
  // Merge bullets parsed from description text and the explicit product.bulletPoints
  const mergedBullets = [
    ...(parsedDesc.bullets || []),
    ...(product.bulletPoints || []).map((b: string) =>
      b
        .trim()
        .replace(/^[.,:;\-\s]+/, "")
        .replace(/[.,:;\-\s]+$/, ""),
    ),
  ].filter(Boolean);

  // Onsitego warranty states
  const [warranties, setWarranties] = useState<any[]>([]);
  const [selectedWarranty, setSelectedWarranty] = useState<any | null>(null);
  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);

  const handleSwipe = (endX: number) => {
    if (touchStartX === null) return;
    const diff = touchStartX - endX;
    if (Math.abs(diff) > 40) {
      if (diff > 0)
        setActiveImg((i) => Math.min(activeImages.length - 1, i + 1));
      else setActiveImg((i) => Math.max(0, i - 1));
    }
    setTouchStartX(null);
  };

  useEffect(() => {
    const loadPincode = async () => {
      const saved = await getSavedPincode();
      if (saved && saved.length === 6) {
        setPincode(saved);
        handleCheckPincode(saved);
      }
    };
    loadPincode();
  }, []);

  const displayPrice = selectedVariant?.d2cPrice ?? product.d2cPrice;
  const displayMrp = selectedVariant?.mrp ?? product.mrp;
  const availableStock =
    selectedVariant?.stockQuantity ?? product.stockQuantity;

  const currentVariantSku = selectedVariant?.sku || product.sku;
  const cartItem = items.find(
    (i) =>
      i.product.id === product.id &&
      i.product.sku === currentVariantSku &&
      (i.warranty?.planSku || null) ===
        (selectedWarranty?.onsitegoPlanSku || null),
  );

  const renderQtySelector = (item: any, customHeight = "48px") => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        background: "var(--surface2)",
        borderRadius: "8px",
        border: "1px solid var(--gold-pale)",
        padding: "2px 4px",
        height: customHeight,
        boxSizing: "border-box",
      }}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          updateQty(product.id, item.quantity - 1, item.warranty?.planSku);
        }}
        style={{
          width: "36px",
          height: "100%",
          background: "none",
          border: "none",
          color: "var(--gold)",
          fontSize: "18px",
          fontWeight: "bold",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        −
      </button>
      <span
        style={{
          fontSize: "14px",
          color: "var(--cream)",
          fontWeight: 600,
          padding: "0 8px",
          minWidth: "32px",
          textAlign: "center",
          fontFamily: "var(--font-mono)",
        }}
      >
        {item.quantity}
      </span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          updateQty(product.id, item.quantity + 1, item.warranty?.planSku);
        }}
        style={{
          width: "36px",
          height: "100%",
          background: "none",
          border: "none",
          color: "var(--gold)",
          fontSize: "18px",
          fontWeight: "bold",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        +
      </button>
    </div>
  );

  const hasDiscount = displayMrp && displayMrp > displayPrice;
  const discountPercent = hasDiscount
    ? Math.round(((displayMrp - displayPrice) / displayMrp) * 100)
    : 0;

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      typeof window.trackMetaEvent === "function"
    ) {
      window.trackMetaEvent("ViewContent", {
        content_name: product.name,
        content_ids: [product.sku],
        content_type: "product",
        value: displayPrice,
        currency: "INR",
      });
    }
  }, [product.sku, displayPrice]);

  // Fetch Onsitego plans whenever price changes
  useEffect(() => {
    const fetchWarranties = async () => {
      try {
        const res = await fetch(`/api/warranties?price=${displayPrice}`);
        if (res.ok) {
          const data = await res.json();
          setWarranties(data);
          setSelectedWarranty(null);
        }
      } catch (err) {
        console.error("Failed to load warranties:", err);
      }
    };
    fetchWarranties();
  }, [displayPrice]);

  const handleCheckPincode = async (code: string) => {
    const cleanCode = code ? code.replace(/\D/g, "") : "";
    if (!cleanCode || cleanCode.length !== 6) {
      setPincodeError("Please enter a valid 6-digit PIN code.");
      setShippingRes(null);
      return;
    }
    setPincodeError("");
    setCheckingPincode(true);
    try {
      const weight = product.weight || 0.5;
      const res = await checkPincode(cleanCode, weight, displayPrice);
      if (res && res.etd) {
        setShippingRes(res);
      } else {
        setShippingRes(null);
        setPincodeError(
          "Express delivery is currently unserviceable to this location.",
        );
      }
    } catch (err) {
      setShippingRes(null);
      setPincodeError(
        "Unable to verify PIN code serviceability. Please try again.",
      );
    } finally {
      setCheckingPincode(false);
    }
  };

  // Merge remastered images + amazon white-background images (remastered first, amazon after)
  const mergeImages = (
    primary: string[] | undefined,
    secondary: string[] | undefined,
  ) => {
    const p = primary || [];
    const s = (secondary || []).filter((url) => !p.includes(url));
    return [...p, ...s];
  };

  const activeImages = selectedVariant?.images?.length
    ? mergeImages(
        selectedVariant.images,
        (product as any).whiteBackgroundImages,
      )
    : mergeImages(product.images, (product as any).whiteBackgroundImages);

  const wishlistItems = useWishlistStore((state) => state.items);
  const isWishlisted = wishlistItems.some((i) => i.id === product.id);
  const { toggleItem } = useWishlistStore();

  const handleAddToCart = () => {
    if (qty > availableStock) return;

    const cartProduct = {
      ...product,
      id:
        selectedVariant && selectedVariant.id !== "original"
          ? selectedVariant.id
          : product.id,
      name:
        selectedVariant && selectedVariant.id !== "original"
          ? `${product.name} - ${selectedVariant.name}`
          : product.name,
      sku:
        selectedVariant && selectedVariant.id !== "original"
          ? selectedVariant.sku
          : product.sku,
      d2cPrice: displayPrice,
      mrp: displayMrp,
      images: activeImages,
    };

    const selectedWarrantyPayload = selectedWarranty
      ? {
          planSku: selectedWarranty.onsitegoPlanSku,
          planName: selectedWarranty.planName,
          price: selectedWarranty.planPriceD2c,
        }
      : null;

    addItem(cartProduct, qty, selectedWarrantyPayload);

    if (
      typeof window !== "undefined" &&
      typeof window.trackMetaEvent === "function"
    ) {
      window.trackMetaEvent("AddToCart", {
        content_name: cartProduct.name,
        content_ids: [cartProduct.sku],
        content_type: "product",
        value: displayPrice * qty,
        currency: "INR",
        contents: [
          {
            id: cartProduct.sku,
            quantity: qty,
            item_price: displayPrice,
          },
        ],
      });
    }

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleToggleWishlist = () => {
    if (!isWishlisted) {
      if (
        typeof window !== "undefined" &&
        typeof window.trackMetaEvent === "function"
      ) {
        window.trackMetaEvent("AddToWishlist", {
          content_name: product.name,
          content_ids: [product.sku],
          content_type: "product",
          value: displayPrice,
          currency: "INR",
        });
      }
    }
    toggleItem(product);
  };

  const renderWarrantySelector = () => {
    if (warranties.length === 0) return null;
    return (
      <div
        style={{
          padding: "20px 0",
          borderTop: "0.5px solid var(--border)",
          marginTop: "20px",
          marginBottom: "10px",
        }}
      >
        <div
          style={{
            fontSize: "10px",
            color: "var(--text-muted)",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            marginBottom: "12px",
          }}
        >
          Onsitego Extended Protection Plan
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {warranties.map((plan) => (
            <label
              key={plan.onsitegoPlanSku}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 16px",
                background:
                  selectedWarranty?.onsitegoPlanSku === plan.onsitegoPlanSku
                    ? "rgba(196,160,90,0.06)"
                    : "var(--surface)",
                border:
                  selectedWarranty?.onsitegoPlanSku === plan.onsitegoPlanSku
                    ? "1px solid rgba(196,160,90,0.3)"
                    : "0.5px solid var(--border)",
                borderRadius: "12px",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              <input
                type="radio"
                name="onsitego-plan"
                checked={
                  selectedWarranty?.onsitegoPlanSku === plan.onsitegoPlanSku
                }
                onChange={() => setSelectedWarranty(plan)}
                style={{ accentColor: "var(--gold)" }}
              />
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 500,
                    color: "var(--cream)",
                  }}
                >
                  {plan.planName}
                </div>
                <div
                  style={{
                    fontSize: "10px",
                    color: "var(--text-dim)",
                    marginTop: "2px",
                  }}
                >
                  100% Cashless Repairs & Zero Dep
                </div>
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--gold)",
                  fontWeight: 500,
                }}
              >
                +{formatPrice(plan.planPriceD2c)}
              </div>
            </label>
          ))}

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px 16px",
              background:
                selectedWarranty === null
                  ? "rgba(196,160,90,0.06)"
                  : "var(--surface)",
              border:
                selectedWarranty === null
                  ? "1px solid rgba(196,160,90,0.3)"
                  : "0.5px solid var(--border)",
              borderRadius: "12px",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            <input
              type="radio"
              name="onsitego-plan"
              checked={selectedWarranty === null}
              onChange={() => setSelectedWarranty(null)}
              style={{ accentColor: "var(--gold)" }}
            />
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 500,
                  color: "var(--text-muted)",
                }}
              >
                No Extended Protection
              </div>
            </div>
          </label>
        </div>
      </div>
    );
  };

  const isValidSpecVal = (val: any) => {
    if (val === null || val === undefined) return false;
    const str = String(val).trim().toLowerCase();
    if (!str) return false;
    const invalidFallbacks = [
      "n/a",
      "na",
      "none",
      "null",
      "undefined",
      "pending",
      "pending application",
      "standard",
      "estate metals",
      "led engine",
      "modern heritage",
      "0",
      "0.0",
      "0.0 kg",
      "0 kg",
    ];
    return !invalidFallbacks.includes(str);
  };

  const getDimensions = () => {
    const h = selectedVariant?.actualHeight ?? product.actualHeight;
    const w = selectedVariant?.actualWidth ?? product.actualWidth;
    const d = selectedVariant?.actualDepth ?? product.actualDepth;
    const unit =
      selectedVariant?.dimensionUnit ?? product.dimensionUnit ?? "INCH";
    const suffix = unit === "CM" ? " cm" : '"';

    if (h || w || d) {
      const parts = [];
      if (h) parts.push(`${h}${suffix} H`);
      if (w) parts.push(`${w}${suffix} W`);
      if (d) parts.push(`${d}${suffix} D`);
      return parts.join(" × ");
    }
    return isValidSpecVal(product.dimensions) ? product.dimensions : null;
  };

  const getPrioritizedSpecsList = () => {
    const dimVal = getDimensions();
    const isLedVal = selectedVariant
      ? (selectedVariant.specs?.isLed ?? product.isLed)
      : product.isLed;
    const cert = product.bisCertification;
    const isValidBis =
      cert &&
      cert.trim() !== "" &&
      ![
        "pending",
        "pending application",
        "null",
        "undefined",
        "n/a",
        "no",
        "none",
      ].includes(cert.trim().toLowerCase());

    const candidateSpecs = [
      // 1. Dimensions (Highest Priority)
      { key: "Dimensions", val: dimVal },
      // 2. Material & Finish
      {
        key: "Material & Finish",
        val:
          selectedVariant?.materialAndFinish &&
          selectedVariant.materialAndFinish.length > 0
            ? selectedVariant.materialAndFinish.join(", ")
            : product.materialAndFinish?.length > 0
              ? product.materialAndFinish.join(", ")
              : product.material || null,
      },
      {
        key: "Color / Finish",
        val: selectedVariant?.color || product.color || null,
      },
      // 3. Bulb & Light Source
      {
        key: "Bulb Type",
        val:
          selectedVariant?.bulbType && selectedVariant.bulbType.length > 0
            ? selectedVariant.bulbType.join(", ")
            : product.bulbType?.length > 0
              ? product.bulbType.join(", ")
              : null,
      },
      {
        key: "LED Technology",
        val: isLedVal ? "Integrated High-CRI LED Engine" : null,
      },
      {
        key: "Power / Wattage",
        val: selectedVariant?.power || product.power || null,
      },
      {
        key: "Voltage",
        val: selectedVariant?.voltage || product.voltage || null,
      },
      {
        key: "Luminous Efficacy",
        val: product.luminousEfficacy
          ? `${product.luminousEfficacy} lm/W`
          : null,
      },
      {
        key: "Color Rendering Index",
        val: product.cri ? `CRI > ${product.cri}` : null,
      },
      // 4. Installation & Mounting
      { key: "Fixture Form", val: product.amazonFixtureForm || null },
      {
        key: "Mounting Type",
        val:
          selectedVariant?.amazonMountingType ||
          product.amazonMountingType ||
          null,
      },
      { key: "Lighting Method", val: product.amazonLightingMethod || null },
      {
        key: "Weight",
        val:
          selectedVariant?.weight && selectedVariant.weight > 0
            ? `~ ${selectedVariant.weight} kg`
            : product.weight && product.weight > 0
              ? `~ ${product.weight} kg`
              : null,
      },
      // 5. Design & Style
      {
        key: "Design Style",
        val:
          selectedVariant?.style && selectedVariant.style.length > 0
            ? selectedVariant.style.join(", ")
            : product.style?.length > 0
              ? product.style.join(", ")
              : null,
      },
      {
        key: "Size Category",
        val: selectedVariant?.size || product.size || null,
      },
      // 6. Suited Spaces & Environment
      {
        key: "Suited Spaces",
        val:
          product.spaces && product.spaces.length > 0
            ? product.spaces.map((s: any) => s.name).join(", ")
            : null,
      },
      { key: "Water Resistance", val: product.amazonWaterResistance || null },
      {
        key: "Included Components",
        val: product.amazonIncludedComponents || null,
      },
      // 7. Brand & Provenance
      {
        key: "Brand",
        val: selectedVariant?.brand || product.brand || "James and Sons",
      },
      {
        key: "Country of Origin",
        val:
          selectedVariant?.countryOfOrigin ||
          product.countryOfOrigin ||
          "India",
      },
      {
        key: "Warranty",
        val:
          selectedVariant?.warranty &&
          !selectedVariant.warranty.includes("2 Year")
            ? selectedVariant.warranty
            : product.warranty && !product.warranty.includes("2 Year")
              ? product.warranty
              : "6 Months Manufacturer Warranty",
      },
      // 8. Compliance & Tax
      {
        key: "Compliance & Tax",
        val: `GST ${product.gstRate || 18}%`,
      },
      { key: "HSN Code", val: product.hsnCode || null },
    ];

    const finalSpecs: { key: string; val: string }[] = [];
    candidateSpecs.forEach((spec) => {
      if (isValidSpecVal(spec.val)) {
        finalSpecs.push({ key: spec.key, val: String(spec.val) });
      }
    });

    const parentSpecs =
      product.specs && typeof product.specs === "object" ? product.specs : {};
    const variantSpecs =
      selectedVariant?.specs && typeof selectedVariant.specs === "object"
        ? selectedVariant.specs
        : {};
    const mergedSpecs = { ...parentSpecs, ...variantSpecs };
    const standardKeys = new Set(
      candidateSpecs.map((s) => s.key.toLowerCase()),
    );
    Object.entries(mergedSpecs).forEach(([k, v]) => {
      if (!standardKeys.has(k.toLowerCase()) && isValidSpecVal(v)) {
        finalSpecs.push({ key: k, val: String(v) });
      }
    });

    return finalSpecs;
  };

  const prioritizedSpecs = getPrioritizedSpecsList();
  const visibleSpecs = showAllSpecs
    ? prioritizedSpecs
    : prioritizedSpecs.slice(0, 4);

  return (
    <>
      <div
        className="pdp-wrapper"
        style={{
          background: "var(--obsidian)",
          minHeight: "100vh",
          overflowX: "hidden",
          boxSizing: "border-box",
        }}
      >
        {/* ── MOBILE LAYOUT (md:hidden) ── */}
        <div
          className="md:hidden"
          style={{ width: "100%", paddingBottom: "90px" }}
        >
          {/* Product Image Gallery */}
          <div
            onClick={() => activeImages.length > 0 && setLightboxOpen(true)}
            onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
            onTouchEnd={(e) => handleSwipe(e.changedTouches[0].clientX)}
            style={{
              margin: "0 auto",
              position: "relative",
              width: "85%",
              borderRadius: "24px",
              border: "0.5px solid var(--border)",
              overflow: "hidden",
              cursor: activeImages.length > 0 ? "zoom-in" : "default",
            }}
          >
            {activeImages.length > 0 && activeImages[activeImg] ? (
              <AdaptiveImageFrame
                src={activeImages[activeImg]}
                alt={`${product.name} - view ${activeImg + 1}`}
                objectFit="cover"
                priority={activeImg === 0}
              />
            ) : (
              <div
                style={{
                  aspectRatio: "1/1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <i
                  className="ti ti-lamp"
                  style={{
                    fontSize: "48px",
                    color: "var(--gold)",
                    opacity: 0.3,
                  }}
                />
              </div>
            )}

            {activeImages.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImg((i) => Math.max(0, i - 1));
                  }}
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: "rgba(0,0,0,0.55)",
                    border: "none",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    opacity: activeImg === 0 ? 0.3 : 1,
                  }}
                >
                  <i
                    className="ti ti-chevron-left"
                    style={{ fontSize: "16px" }}
                  ></i>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImg((i) =>
                      Math.min(activeImages.length - 1, i + 1),
                    );
                  }}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: "rgba(0,0,0,0.55)",
                    border: "none",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    opacity: activeImg === activeImages.length - 1 ? 0.3 : 1,
                  }}
                >
                  <i
                    className="ti ti-chevron-right"
                    style={{ fontSize: "16px" }}
                  ></i>
                </button>
                <div
                  style={{
                    position: "absolute",
                    bottom: "14px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    display: "flex",
                    gap: "6px",
                  }}
                >
                  {activeImages.map((_: any, i: number) => (
                    <div
                      key={i}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveImg(i);
                      }}
                      style={{
                        width: i === activeImg ? "16px" : "6px",
                        height: "6px",
                        borderRadius: i === activeImg ? "3px" : "50%",
                        background:
                          i === activeImg
                            ? "var(--gold)"
                            : "rgba(255,255,255,0.5)",
                        transition: "all 0.3s ease",
                        cursor: "pointer",
                      }}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Product Info Header */}
          <div style={{ padding: "20px 24px 0" }}>
            <div
              style={{
                fontSize: "11px",
                color: "var(--gold)",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                marginBottom: "6px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <div
                style={{
                  width: "4px",
                  height: "4px",
                  background: "var(--gold)",
                  borderRadius: "50%",
                }}
              />
              {product.category?.name || "Exclusive Fixture"}
            </div>

            <h1
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "28px",
                color: "var(--cream)",
                lineHeight: 1.2,
                fontWeight: 300,
              }}
            >
              {selectedVariant?.name || product.name}
            </h1>

            {/* Rating Summary Header — Only shown if >= 50 reviews */}
            {userReviews.length >= 50 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginTop: "8px",
                }}
              >
                <div style={{ color: "#F59E0B", fontSize: "13px" }}>★★★★★</div>
                <span
                  style={{
                    fontSize: "12px",
                    color: "var(--cream)",
                    fontWeight: 600,
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  4.9
                </span>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                  ({userReviews.length} Client Reviews)
                </span>
              </div>
            )}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                marginTop: "10px",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  color: "var(--text-muted)",
                  letterSpacing: "0.06em",
                }}
              >
                SKU: {selectedVariant?.sku || product.sku}
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <div
                  style={{
                    width: "6px",
                    height: "6px",
                    background:
                      availableStock > 0 ? "var(--green)" : "var(--gold)",
                    borderRadius: "50%",
                  }}
                />
                <div
                  style={{
                    fontSize: "11px",
                    color: availableStock > 0 ? "var(--green)" : "var(--gold)",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  {availableStock > 0
                    ? `${availableStock} in stock`
                    : "Made to Order"}
                </div>
              </div>
            </div>

            {/* Urgency Pill */}
            {availableStock > 0 && availableStock <= 15 && (
              <div
                style={{
                  marginTop: "10px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "rgba(214,162,74,0.12)",
                  border: "1px solid rgba(214,162,74,0.3)",
                  padding: "4px 12px",
                  borderRadius: "20px",
                  color: "#D6A24A",
                  fontSize: "11px",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 600,
                }}
              >
                <span>
                  ⚡ Only {availableStock} Units Remaining — Ready to Ship
                </span>
              </div>
            )}
          </div>

          {/* Mobile Pricing Row */}
          <div
            style={{
              padding: "20px 24px 0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "11px",
                  color: "var(--text-muted)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginBottom: "4px",
                }}
              >
                {displayPrice ? "Price inclusive of taxes" : "Price on request"}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: "10px",
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: "34px",
                    color: "var(--gold-light)",
                    fontStyle: "italic",
                    fontWeight: 600,
                  }}
                >
                  {displayPrice ? formatPrice(displayPrice) : "₹ —"}
                </div>
                {hasDiscount && (
                  <>
                    <div
                      style={{
                        fontFamily: "var(--font-serif)",
                        fontSize: "18px",
                        color: "var(--text-muted)",
                        textDecoration: "line-through",
                        opacity: 0.6,
                      }}
                    >
                      {formatPrice(displayMrp)}
                    </div>
                    <div
                      style={{
                        background: "rgba(196,160,90,0.15)",
                        border: "1px solid rgba(196,160,90,0.4)",
                        color: "var(--gold-light)",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        fontSize: "10px",
                        fontFamily: "var(--font-mono)",
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                      }}
                    >
                      SAVE {discountPercent}%
                    </div>
                  </>
                )}
              </div>
              {isB2B && (
                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--gold)",
                    marginTop: "4px",
                    letterSpacing: "0.06em",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  GST {product.gstRate}% · B2B from{" "}
                  {formatPrice(product.b2bPrice)}
                </div>
              )}
            </div>
          </div>

          {/* Variant Selector */}
          {allOptions.length > 0 && (
            <div style={{ padding: "20px 24px 0" }}>
              <div
                style={{
                  fontSize: "10px",
                  color: "var(--text-muted)",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginBottom: "12px",
                }}
              >
                Select Finish
              </div>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {allOptions.map((v) => (
                  <div
                    key={v.id}
                    onClick={() => {
                      setSelectedVariant(v);
                      setActiveImg(0);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "10px 16px",
                      borderRadius: "24px",
                      border:
                        selectedVariant?.id === v.id
                          ? "1px solid rgba(196,160,90,0.4)"
                          : "0.5px solid var(--border)",
                      background:
                        selectedVariant?.id === v.id
                          ? "rgba(196,160,90,0.08)"
                          : "var(--surface)",
                      color:
                        selectedVariant?.id === v.id
                          ? "var(--gold-light)"
                          : "var(--text-muted)",
                      fontSize: "11px",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    <div
                      style={{
                        width: "10px",
                        height: "10px",
                        borderRadius: "50%",
                        background: v.name.toLowerCase().includes("gold")
                          ? "linear-gradient(135deg, #E2C97A, #C9A84C)"
                          : "linear-gradient(135deg, #D0D0D0, #A8A8A8)",
                      }}
                    />
                    {v.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quantity Row */}
          {!cartItem && (
            <div
              style={{
                padding: "20px 24px 0",
                display: "flex",
                alignItems: "center",
                gap: "16px",
              }}
            >
              <div
                style={{
                  fontSize: "10px",
                  color: "var(--text-muted)",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                Qty
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: "var(--surface)",
                  border: "0.5px solid var(--border)",
                  borderRadius: "14px",
                  overflow: "hidden",
                }}
              >
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  style={{
                    width: "40px",
                    height: "40px",
                    background: "transparent",
                    border: "none",
                    color: "var(--text-muted)",
                    fontSize: "18px",
                  }}
                >
                  −
                </button>
                <div
                  style={{
                    width: "36px",
                    textAlign: "center",
                    fontSize: "14px",
                    color: "var(--cream)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {qty}
                </div>
                <button
                  onClick={() =>
                    setQty((q) => Math.min(availableStock || 999, q + 1))
                  }
                  style={{
                    width: "40px",
                    height: "40px",
                    background: "transparent",
                    border: "none",
                    color: "var(--text-muted)",
                    fontSize: "18px",
                  }}
                >
                  +
                </button>
              </div>
              <div
                style={{
                  marginLeft: "auto",
                  fontSize: "11px",
                  color: "var(--text-muted)",
                  letterSpacing: "0.04em",
                }}
              >
                Total:{" "}
                <span style={{ color: "var(--gold-light)", fontSize: "13px" }}>
                  {formatPrice(displayPrice * qty)}
                </span>
              </div>
            </div>
          )}

          {/* Warranty Selector */}
          <div style={{ padding: "0 24px" }}>{renderWarrantySelector()}</div>

          {/* Primary Actions */}
          <div
            ref={mainBtnRef}
            style={{ padding: "24px 24px 0", display: "flex", gap: "12px" }}
          >
            {cartItem ? (
              <div style={{ flex: 1 }}>
                {renderQtySelector(cartItem, "54px")}
              </div>
            ) : (
              <button
                onClick={handleAddToCart}
                disabled={availableStock === 0}
                style={{
                  flex: 1,
                  height: "54px",
                  borderRadius: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  padding: "0 32px",
                  fontSize: "14px",
                  background: "var(--gold)",
                  color: "var(--obsidian)",
                  border: "none",
                  fontFamily: "var(--font-mono)",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 6px 20px rgba(196,160,90,0.25)",
                }}
              >
                <i
                  className="ti ti-shopping-bag-plus"
                  style={{ fontSize: "18px" }}
                ></i>
                {availableStock === 0 ? "Made to Order" : "Add to Cart"}
              </button>
            )}
            <button
              onClick={handleToggleWishlist}
              style={{
                background: "transparent",
                border: "none",
                padding: "0 8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <i
                className={isWishlisted ? "ti ti-heart-filled" : "ti ti-heart"}
                style={{
                  fontSize: "28px",
                  color: isWishlisted ? "var(--gold)" : "var(--text)",
                }}
              ></i>
            </button>
          </div>

          {/* Trust — Brand Highlights */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
              borderTop: "0.5px solid var(--border)",
              borderBottom: "0.5px solid var(--border)",
              padding: "20px 24px",
              margin: "24px 0 0",
            }}
          >
            {[
              { icon: "ti-award", label: "Heritage Craftsmanship" },
              { icon: "ti-truck-delivery", label: "Pan-India Delivery" },
              { icon: "ti-shield-check", label: "Authentic Product" },
              { icon: "ti-sparkles", label: "Curated Brilliance" },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  minHeight: "36px",
                }}
              >
                <i
                  className={`ti ${item.icon}`}
                  style={{
                    color: "var(--gold)",
                    fontSize: "16px",
                    flexShrink: 0,
                  }}
                ></i>
                <span
                  style={{
                    fontSize: "11px",
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    lineHeight: 1.2,
                  }}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          {/* Pincode Section */}
          <div
            style={{
              margin: "12px auto 0",
              maxWidth: "340px",
              width: "calc(100% - 40px)",
              background: "var(--surface)",
              border: "0.5px solid var(--border)",
              borderRadius: "12px",
              padding: "8px 12px",
            }}
          >
            <div
              style={{
                fontSize: "10px",
                color: "var(--gold)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: "6px",
              }}
            >
              Check Delivery Estimate
            </div>
            <div style={{ display: "flex", gap: "6px", alignItems: "stretch" }}>
              <input
                placeholder="Enter Pincode"
                maxLength={6}
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                style={{
                  flex: 1,
                  minWidth: 0,
                  background: "var(--obsidian)",
                  border: "0.5px solid var(--border)",
                  borderRadius: "6px",
                  padding: "6px 10px",
                  fontSize: "12px",
                  color: "var(--cream)",
                  outline: "none",
                }}
              />
              <button
                onClick={() => handleCheckPincode(pincode)}
                className="btn-outline"
                style={{
                  flexShrink: 0,
                  borderRadius: "6px",
                  padding: "0 10px",
                  fontSize: "11px",
                  whiteSpace: "nowrap",
                }}
              >
                {checkingPincode ? "..." : "Check"}
              </button>
            </div>
            {shippingRes && (
              <div
                style={{
                  marginTop: "8px",
                  fontSize: "12px",
                  color: "var(--green)",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <i className="ti ti-truck"></i> Expected Delivery by{" "}
                {shippingRes.etd}
              </div>
            )}
            {pincodeError && (
              <div
                style={{
                  marginTop: "8px",
                  fontSize: "11px",
                  color: "#f87171",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontFamily: "var(--font-mono)",
                }}
              >
                <i className="ti ti-alert-triangle"></i> {pincodeError}
              </div>
            )}
          </div>

          {/* Description Card */}
          {(parsedDesc.narrative || mergedBullets.length > 0) && (
            <div
              style={{
                margin: "16px 20px 0",
                background: "var(--surface)",
                border: "0.5px solid var(--border)",
                borderRadius: "20px",
                padding: "20px",
              }}
            >
              <div
                style={{
                  fontSize: "10px",
                  color: "var(--gold)",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  marginBottom: "12px",
                }}
              >
                Provenance &amp; Craftsmanship
              </div>
              {parsedDesc.narrative && (
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "15px",
                    color: "var(--text)",
                    lineHeight: 1.7,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {parsedDesc.narrative}
                </div>
              )}
              {mergedBullets.length > 0 && (
                <div style={{ marginTop: parsedDesc.narrative ? "20px" : "0" }}>
                  <div
                    style={{
                      fontSize: "10px",
                      color: "var(--gold-light)",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      marginBottom: "12px",
                    }}
                  >
                    Artisan Highlights
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    {mergedBullets.map((bp: string, idx: number) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          gap: "10px",
                          alignItems: "flex-start",
                          background: "rgba(255,255,255,0.02)",
                          border: "0.5px solid var(--border)",
                          borderRadius: "10px",
                          padding: "12px 14px",
                        }}
                      >
                        <i
                          className="ti ti-circle-check"
                          style={{
                            color: "var(--gold)",
                            fontSize: "15px",
                            marginTop: "2px",
                            flexShrink: 0,
                          }}
                        />
                        <span
                          style={{
                            fontSize: "14.5px",
                            color: "var(--cream)",
                            lineHeight: 1.5,
                            fontFamily: "var(--font-body)",
                          }}
                        >
                          {bp}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Collapsible Prioritized Technical Specs Card */}
          {prioritizedSpecs.length > 0 && (
            <div
              style={{
                margin: "12px 20px 0",
                background: "var(--surface)",
                border: "0.5px solid var(--border)",
                borderRadius: "20px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "16px 20px 12px",
                  fontSize: "10px",
                  color: "var(--gold)",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  borderBottom: "0.5px solid var(--border)",
                }}
              >
                Technical Specifications
              </div>
              <div style={{ padding: "0 20px" }}>
                {visibleSpecs.map((spec) => (
                  <div
                    key={spec.key}
                    style={{
                      display: "flex",
                      gap: "12px",
                      alignItems: "baseline",
                      padding: "14px 0",
                      borderBottom: "0.5px dashed rgba(255,255,255,0.05)",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "12px",
                        color: "var(--gold)",
                        textTransform: "uppercase",
                        flex: "0 0 120px",
                        fontWeight: 600,
                        letterSpacing: "0.05em",
                      }}
                    >
                      {spec.key}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "15px",
                        color: "var(--cream)",
                        flex: 1,
                      }}
                    >
                      {spec.key === "Weight" || spec.key === "Dimensions" ? (
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            flexWrap: "wrap",
                          }}
                        >
                          <span>{spec.val}</span>
                          <ApproxBadge
                            note={
                              spec.key === "Weight"
                                ? "Approximate net weight without bulbs or packaging. Subject to handcrafting variances."
                                : "Approximate dimensions. Subject to handcrafting and glassblowing variances."
                            }
                          />
                        </div>
                      ) : (
                        spec.val
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {prioritizedSpecs.length > 4 && (
                <button
                  type="button"
                  onClick={() => setShowAllSpecs(!showAllSpecs)}
                  style={{
                    width: "100%",
                    padding: "14px 20px",
                    background: "rgba(255,255,255,0.02)",
                    border: "none",
                    borderTop: "0.5px solid var(--border)",
                    color: "var(--gold)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.15em",
                    cursor: "pointer",
                  }}
                >
                  {showAllSpecs
                    ? "Show Fewer Specifications ▲"
                    : `View All ${prioritizedSpecs.length} Specifications ▼`}
                </button>
              )}
            </div>
          )}

          {/* Commercial Bulk Quote CTA Upgrade (Mobile - Below Specifications) */}
          <div style={{ margin: "16px 20px 0" }}>
            <button
              type="button"
              onClick={() => setInquiryModalOpen(true)}
              style={{
                width: "100%",
                padding: "14px 16px",
                background: "rgba(196,160,90,0.08)",
                border: "1px solid rgba(196,160,90,0.3)",
                borderRadius: "14px",
                color: "var(--gold)",
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "all 0.2s",
              }}
            >
              <i className="ti ti-building" style={{ fontSize: "16px" }}></i>
              <span>Request Bulk Quote</span>
            </button>
          </div>

          {/* Mobile Variant Comparison Table */}
          {allOptions.length > 1 && (
            <div
              style={{
                margin: "12px 20px 0",
                background: "var(--surface)",
                border: "0.5px solid var(--border)",
                borderRadius: "20px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "16px 20px 12px",
                  fontSize: "10px",
                  color: "var(--gold)",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  borderBottom: "0.5px solid var(--border)",
                }}
              >
                Compare Options
              </div>
              <div
                style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    textAlign: "left",
                    minWidth: "400px",
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        borderBottom: "0.5px solid var(--border)",
                        background: "rgba(255,255,255,0.02)",
                      }}
                    >
                      <th
                        style={{
                          padding: "10px 16px",
                          fontSize: "9px",
                          fontFamily: "var(--font-mono)",
                          color: "var(--text-muted)",
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                        }}
                      >
                        Option
                      </th>
                      <th
                        style={{
                          padding: "10px 16px",
                          fontSize: "9px",
                          fontFamily: "var(--font-mono)",
                          color: "var(--text-muted)",
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                        }}
                      >
                        Price
                      </th>
                      <th
                        style={{
                          padding: "10px 16px",
                          fontSize: "9px",
                          fontFamily: "var(--font-mono)",
                          color: "var(--text-muted)",
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                        }}
                      >
                        Specs
                      </th>
                      <th
                        style={{
                          padding: "10px 16px",
                          fontSize: "9px",
                          fontFamily: "var(--font-mono)",
                          color: "var(--text-muted)",
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                        }}
                      >
                        Dimensions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {allOptions.map((v) => {
                      const vPrice = v.d2cPrice || product.d2cPrice;
                      const isSelected = selectedVariant?.id === v.id;

                      const specParts = [];
                      const pwr = v.power || product.power;
                      const volt = v.voltage || product.voltage;
                      const col = v.color || product.color;
                      if (pwr) specParts.push(pwr);
                      if (volt) specParts.push(volt);
                      if (col) specParts.push(col);
                      const specSummary = specParts.join(" | ") || "Standard";

                      const vH = v.actualHeight ?? product.actualHeight;
                      const vW = v.actualWidth ?? product.actualWidth;
                      const vD = v.actualDepth ?? product.actualDepth;
                      const vUnit =
                        v.dimensionUnit ?? product.dimensionUnit ?? "INCH";
                      const vSuffix = vUnit === "CM" ? "cm" : '"';
                      const dimSummary =
                        vH || vW || vD
                          ? [
                              vH && `${vH}${vSuffix}`,
                              vW && `${vW}${vSuffix}`,
                              vD && `${vD}${vSuffix}`,
                            ]
                              .filter(Boolean)
                              .join(" × ")
                          : "Standard";

                      return (
                        <tr
                          key={v.id}
                          onClick={() => {
                            setSelectedVariant(v);
                            setActiveImg(0);
                          }}
                          style={{
                            borderBottom: "0.5px solid rgba(255,255,255,0.05)",
                            background: isSelected
                              ? "rgba(196,160,90,0.08)"
                              : "transparent",
                          }}
                        >
                          <td
                            style={{
                              padding: "12px 16px",
                              fontSize: "11px",
                              color: isSelected
                                ? "var(--gold-light)"
                                : "var(--cream)",
                              fontWeight: isSelected ? 500 : 300,
                            }}
                          >
                            {v.name}
                          </td>
                          <td
                            style={{
                              padding: "12px 16px",
                              fontSize: "12px",
                              color: "var(--cream)",
                              fontFamily: "var(--font-serif)",
                            }}
                          >
                            {formatPrice(vPrice)}
                          </td>
                          <td
                            style={{
                              padding: "12px 16px",
                              fontSize: "10px",
                              color: "var(--text-muted)",
                            }}
                          >
                            {specSummary}
                          </td>
                          <td
                            style={{
                              padding: "12px 16px",
                              fontSize: "10px",
                              color: "var(--text-muted)",
                            }}
                          >
                            {dimSummary}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Mobile Sticky Add to Cart Bar */}
          <div
            className="mobile-sticky-cart-bar"
            style={{
              transform: showStickyBar ? "translateY(0)" : "translateY(135%)",
              opacity: showStickyBar ? 1 : 0,
              transition:
                "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                maxWidth: "55%",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--text)",
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {selectedVariant?.name || product.name}
              </div>
              <div
                style={{
                  fontSize: "18px",
                  color: "var(--gold)",
                  fontFamily: "var(--font-serif)",
                  fontStyle: "italic",
                  marginTop: "2px",
                  lineHeight: 1,
                }}
              >
                {displayPrice ? formatPrice(displayPrice) : "₹ —"}
              </div>
            </div>
            {cartItem ? (
              renderQtySelector(cartItem, "38px")
            ) : (
              <button
                onClick={handleAddToCart}
                disabled={availableStock === 0}
                style={{
                  height: "38px",
                  padding: "0 20px",
                  background: "var(--gold)",
                  border: "none",
                  borderRadius: "6px",
                  color: "var(--obsidian)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "10.5px",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 4px 10px rgba(196,160,90,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                Add to Cart
              </button>
            )}
          </div>
        </div>

        {/* ── DESKTOP LAYOUT (hidden md:grid) ── */}
        <div
          className="hidden md:grid"
          style={{
            maxWidth: "1440px",
            margin: "0 auto",
            padding: "60px 4% 60px 4%",
            gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 0.8fr)",
            gap: "6%",
            minHeight: "100vh",
            boxSizing: "border-box",
          }}
        >
          {/* LEFT COLUMN: Gallery & Description */}
          <div
            className="pdp-gallery"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "32px",
              position: "static",
              height: "auto",
              overflow: "visible",
              background: "transparent",
            }}
          >
            <div
              style={{ display: "flex", flexDirection: "column", gap: "20px" }}
            >
              {activeImages.length > 0 ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                  }}
                >
                  {/* Main Active Image Container */}
                  <div
                    className="bg-[var(--surface2)] rounded-2xl border border-[var(--border)] overflow-hidden flex items-center justify-center relative cursor-zoom-in select-none"
                    style={{
                      width: "85%",
                      margin: "0 auto",
                      touchAction: "pan-y",
                    }}
                    onClick={() => setLightboxOpen(true)}
                    onWheel={handleImageFrameWheel}
                    onPointerDown={handlePointerDown}
                    onPointerUp={handlePointerUp}
                  >
                    {activeImages.length > 0 && activeImages[activeImg] ? (
                      <AdaptiveImageFrame
                        src={activeImages[activeImg]}
                        alt={`${product.name} - view ${activeImg + 1}`}
                        objectFit="cover"
                        priority={activeImg === 0}
                      />
                    ) : (
                      <div
                        style={{
                          aspectRatio: "1/1",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <i
                          className="ti ti-lamp"
                          style={{
                            fontSize: "48px",
                            color: "var(--gold)",
                            opacity: 0.3,
                          }}
                        />
                      </div>
                    )}

                    {/* Left & Right Chevron Arrows */}
                    {activeImages.length > 1 && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveImg((i) => Math.max(0, i - 1));
                          }}
                          style={{
                            position: "absolute",
                            left: "20px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            width: "44px",
                            height: "44px",
                            borderRadius: "50%",
                            background: "rgba(0,0,0,0.6)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            transition: "all 0.2s",
                            opacity: activeImg === 0 ? 0.3 : 1,
                            zIndex: 10,
                          }}
                          disabled={activeImg === 0}
                        >
                          <i
                            className="ti ti-chevron-left"
                            style={{ fontSize: "20px" }}
                          ></i>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveImg((i) =>
                              Math.min(activeImages.length - 1, i + 1),
                            );
                          }}
                          style={{
                            position: "absolute",
                            right: "20px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            width: "44px",
                            height: "44px",
                            borderRadius: "50%",
                            background: "rgba(0,0,0,0.6)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            transition: "all 0.2s",
                            opacity:
                              activeImg === activeImages.length - 1 ? 0.3 : 1,
                            zIndex: 10,
                          }}
                          disabled={activeImg === activeImages.length - 1}
                        >
                          <i
                            className="ti ti-chevron-right"
                            style={{ fontSize: "20px" }}
                          ></i>
                        </button>
                      </>
                    )}
                  </div>

                  {/* Thumbnails Row */}
                  {activeImages.length > 1 && (
                    <div
                      style={{
                        display: "flex",
                        gap: "12px",
                        overflowX: "auto",
                        padding: "6px 4px",
                        maxWidth: "100%",
                        scrollbarWidth: "none",
                        justifyContent:
                          activeImages.length > 5 ? "flex-start" : "center",
                      }}
                    >
                      {activeImages.map((img: string, idx: number) => (
                        <div
                          key={idx}
                          onClick={() => setActiveImg(idx)}
                          style={{
                            width: "80px",
                            height: "80px",
                            borderRadius: "12px",
                            border:
                              idx === activeImg
                                ? "2px solid var(--gold)"
                                : "1px solid var(--border)",
                            overflow: "hidden",
                            position: "relative",
                            cursor: "pointer",
                            opacity: idx === activeImg ? 1 : 0.6,
                            transition: "all 0.2s",
                          }}
                        >
                          <Image
                            src={img}
                            alt={`${product.name} thumbnail ${idx + 1}`}
                            fill
                            sizes="80px"
                            style={{ objectFit: "cover" }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-[var(--surface2)] rounded-2xl border border-[var(--border)] flex items-center justify-center min-h-[600px]">
                  <svg
                    width="120"
                    height="160"
                    viewBox="0 0 100 120"
                    stroke="var(--gold)"
                    fill="none"
                    opacity="0.3"
                  >
                    <path
                      d="M50 10 L50 40"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                    />
                    <path d="M20 70 Q50 30 80 70" strokeWidth="2" />
                    <circle
                      cx="50"
                      cy="95"
                      r="4"
                      fill="var(--gold-light)"
                      stroke="none"
                    />
                  </svg>
                </div>
              )}
            </div>

            {/* Description & Collapsible Specifications */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "32px",
                marginTop: "20px",
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: "var(--gold)",
                    marginBottom: "16px",
                  }}
                >
                  The Masterpiece
                </div>
                {parsedDesc.narrative && (
                  <div
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "16px",
                      color: "var(--text)",
                      lineHeight: 1.8,
                      whiteSpace: "pre-wrap",
                      marginBottom: "24px",
                    }}
                  >
                    {parsedDesc.narrative}
                  </div>
                )}
                {!parsedDesc.narrative && !product.description && (
                  <div
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "16px",
                      color: "var(--text)",
                      lineHeight: 1.8,
                      whiteSpace: "pre-wrap",
                      marginBottom: "24px",
                    }}
                  >
                    Discover the essence of luxury with this masterfully crafted
                    piece, designed to bring sustainable brilliance to your
                    grand spaces.
                  </div>
                )}
                {mergedBullets.length > 0 && (
                  <div style={{ marginTop: "20px" }}>
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "10px",
                        letterSpacing: "0.15em",
                        textTransform: "uppercase",
                        color: "var(--gold-light)",
                        marginBottom: "16px",
                      }}
                    >
                      Artisan Highlights
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(280px, 1fr))",
                        gap: "16px",
                      }}
                    >
                      {mergedBullets.map((bp: string, idx: number) => (
                        <div
                          key={idx}
                          style={{
                            display: "flex",
                            gap: "12px",
                            alignItems: "flex-start",
                            background: "var(--surface2)",
                            border: "1.5px solid var(--border)",
                            borderRadius: "14px",
                            padding: "14px 18px",
                          }}
                        >
                          <i
                            className="ti ti-circle-check"
                            style={{
                              color: "var(--gold)",
                              fontSize: "18px",
                              marginTop: "2px",
                              flexShrink: 0,
                            }}
                          />
                          <span
                            style={{
                              fontSize: "15.5px",
                              color: "var(--cream)",
                              lineHeight: 1.5,
                              fontFamily: "var(--font-body)",
                            }}
                          >
                            {bp}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {prioritizedSpecs.length > 0 && (
                <div
                  style={{
                    background: "var(--surface2)",
                    borderRadius: "16px",
                    border: "1px solid var(--border)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      padding: "20px 24px",
                      borderBottom: "1px solid var(--border)",
                      fontFamily: "var(--font-mono)",
                      fontSize: "11px",
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      color: "var(--text)",
                    }}
                  >
                    Specifications
                  </div>
                  <div style={{ padding: "8px 24px" }}>
                    {visibleSpecs.map((spec, sIdx, sArr) => (
                      <div
                        key={spec.key}
                        style={{
                          display: "flex",
                          alignItems: "baseline",
                          padding: "16px 0",
                          borderBottom:
                            sIdx === sArr.length - 1
                              ? "none"
                              : "1px dashed var(--border)",
                        }}
                      >
                        <div
                          style={{
                            flex: "0 0 160px",
                            fontFamily: "var(--font-body)",
                            fontSize: "12px",
                            color: "var(--gold)",
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                            fontWeight: 600,
                          }}
                        >
                          {spec.key}
                        </div>
                        <div
                          style={{
                            flex: 1,
                            fontFamily: "var(--font-body)",
                            fontSize: "15px",
                            color: "var(--cream)",
                          }}
                        >
                          {spec.key === "Weight" ||
                          spec.key === "Dimensions" ? (
                            <div
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                flexWrap: "wrap",
                              }}
                            >
                              <span>{spec.val}</span>
                              <ApproxBadge
                                note={
                                  spec.key === "Weight"
                                    ? "Approximate net weight without bulbs or packaging. Subject to handcrafting variances."
                                    : "Approximate dimensions. Subject to handcrafting and glassblowing variances."
                                }
                              />
                            </div>
                          ) : (
                            spec.val
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {prioritizedSpecs.length > 4 && (
                    <button
                      type="button"
                      onClick={() => setShowAllSpecs(!showAllSpecs)}
                      style={{
                        width: "100%",
                        padding: "16px 24px",
                        background: "rgba(255,255,255,0.02)",
                        border: "none",
                        borderTop: "1px solid var(--border)",
                        color: "var(--gold)",
                        fontFamily: "var(--font-mono)",
                        fontSize: "11px",
                        textTransform: "uppercase",
                        letterSpacing: "0.15em",
                        cursor: "pointer",
                      }}
                    >
                      {showAllSpecs
                        ? "Show Fewer Specifications ▲"
                        : `View All ${prioritizedSpecs.length} Specifications ▼`}
                    </button>
                  )}
                </div>
              )}

              {/* Commercial Bulk Quote CTA */}
              <div style={{ marginTop: "-12px" }}>
                <button
                  type="button"
                  onClick={() => setInquiryModalOpen(true)}
                  style={{
                    width: "100%",
                    padding: "16px",
                    background: "rgba(196,160,90,0.08)",
                    border: "1px solid rgba(196,160,90,0.3)",
                    borderRadius: "14px",
                    color: "var(--gold)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.15em",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    transition: "all 0.2s",
                  }}
                >
                  <i
                    className="ti ti-building"
                    style={{ fontSize: "18px" }}
                  ></i>
                  <span>Request Bulk Quote</span>
                </button>
              </div>

              {/* Desktop Variant Comparison Table */}
              {allOptions.length > 1 && (
                <div
                  style={{
                    background: "var(--surface2)",
                    borderRadius: "16px",
                    border: "1px solid var(--border)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      padding: "20px 24px",
                      borderBottom: "1px solid var(--border)",
                      fontFamily: "var(--font-mono)",
                      fontSize: "11px",
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      color: "var(--text)",
                    }}
                  >
                    Compare Variants
                  </div>
                  <div
                    style={{
                      overflowX: "auto",
                      WebkitOverflowScrolling: "touch",
                    }}
                  >
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        textAlign: "left",
                        minWidth: "400px",
                      }}
                    >
                      <thead>
                        <tr
                          style={{
                            borderBottom: "1px solid var(--border)",
                            background: "rgba(255,255,255,0.02)",
                          }}
                        >
                          <th
                            style={{
                              padding: "12px 16px",
                              fontSize: "9px",
                              fontFamily: "var(--font-mono)",
                              color: "var(--text-muted)",
                              textTransform: "uppercase",
                              letterSpacing: "0.1em",
                            }}
                          >
                            Variant
                          </th>
                          <th
                            style={{
                              padding: "12px 16px",
                              fontSize: "9px",
                              fontFamily: "var(--font-mono)",
                              color: "var(--text-muted)",
                              textTransform: "uppercase",
                              letterSpacing: "0.1em",
                            }}
                          >
                            Price
                          </th>
                          <th
                            style={{
                              padding: "12px 16px",
                              fontSize: "9px",
                              fontFamily: "var(--font-mono)",
                              color: "var(--text-muted)",
                              textTransform: "uppercase",
                              letterSpacing: "0.1em",
                            }}
                          >
                            Specs
                          </th>
                          <th
                            style={{
                              padding: "12px 16px",
                              fontSize: "9px",
                              fontFamily: "var(--font-mono)",
                              color: "var(--text-muted)",
                              textTransform: "uppercase",
                              letterSpacing: "0.1em",
                            }}
                          >
                            Dimensions
                          </th>
                          <th
                            style={{
                              padding: "12px 16px",
                              fontSize: "9px",
                              fontFamily: "var(--font-mono)",
                              color: "var(--text-muted)",
                              textTransform: "uppercase",
                              letterSpacing: "0.1em",
                            }}
                          >
                            Stock
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {allOptions.map((v) => {
                          const vPrice = v.d2cPrice || product.d2cPrice;
                          const isSelected = selectedVariant?.id === v.id;

                          const specParts = [];
                          const pwr = v.power || product.power;
                          const volt = v.voltage || product.voltage;
                          const col = v.color || product.color;
                          if (pwr) specParts.push(pwr);
                          if (volt) specParts.push(volt);
                          if (col) specParts.push(col);
                          const specSummary =
                            specParts.join(" | ") || "Standard";

                          const vH = v.actualHeight ?? product.actualHeight;
                          const vW = v.actualWidth ?? product.actualWidth;
                          const vD = v.actualDepth ?? product.actualDepth;
                          const vUnit =
                            v.dimensionUnit ?? product.dimensionUnit ?? "INCH";
                          const vSuffix = vUnit === "CM" ? "cm" : '"';
                          const dimSummary =
                            vH || vW || vD
                              ? [
                                  vH && `${vH}${vSuffix}`,
                                  vW && `${vW}${vSuffix}`,
                                  vD && `${vD}${vSuffix}`,
                                ]
                                  .filter(Boolean)
                                  .join(" × ")
                              : "Standard";

                          return (
                            <tr
                              key={v.id}
                              onClick={() => {
                                setSelectedVariant(v);
                                setActiveImg(0);
                              }}
                              style={{
                                borderBottom:
                                  "0.5px solid rgba(255,255,255,0.05)",
                                cursor: "pointer",
                                background: isSelected
                                  ? "rgba(196,160,90,0.08)"
                                  : "transparent",
                                transition: "background 0.2s",
                              }}
                            >
                              <td
                                style={{
                                  padding: "14px 16px",
                                  fontSize: "12px",
                                  color: isSelected
                                    ? "var(--gold-light)"
                                    : "var(--cream)",
                                  fontWeight: isSelected ? 500 : 300,
                                }}
                              >
                                {v.name}
                              </td>
                              <td
                                style={{
                                  padding: "14px 16px",
                                  fontSize: "13px",
                                  color: "var(--cream)",
                                  fontFamily: "var(--font-serif)",
                                }}
                              >
                                {formatPrice(vPrice)}
                              </td>
                              <td
                                style={{
                                  padding: "14px 16px",
                                  fontSize: "11px",
                                  color: "var(--text-muted)",
                                }}
                              >
                                {specSummary}
                              </td>
                              <td
                                style={{
                                  padding: "14px 16px",
                                  fontSize: "11px",
                                  color: "var(--text-muted)",
                                }}
                              >
                                {dimSummary}
                              </td>
                              <td
                                style={{
                                  padding: "14px 16px",
                                  fontSize: "11px",
                                  color:
                                    v.stockQuantity > 0
                                      ? "var(--green)"
                                      : "var(--gold)",
                                }}
                              >
                                {v.stockQuantity > 0
                                  ? "In Stock"
                                  : "Made to Order"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Info & Actions (Sticky) */}
          <div className="pdp-info" style={{ paddingTop: "0px" }}>
            <div
              style={{
                position: "sticky",
                top: "10px",
                display: "flex",
                flexDirection: "column",
                gap: "32px",
                marginTop: "-18px",
              }}
            >
              {/* Header Info */}
              <div>
                <div
                  className="pdp-breadcrumb"
                  style={{
                    marginBottom: "24px",
                    fontSize: "11px",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--text-dim)",
                  }}
                >
                  <Link
                    href="/"
                    style={{ color: "inherit", textDecoration: "none" }}
                  >
                    Home
                  </Link>
                  <span style={{ margin: "0 10px", opacity: 0.5 }}>/</span>
                  <Link
                    href="/collections"
                    style={{ color: "inherit", textDecoration: "none" }}
                  >
                    Collections
                  </Link>
                  <span style={{ margin: "0 10px", opacity: 0.5 }}>/</span>
                  <span style={{ color: "var(--gold-light)" }}>
                    {product.name}
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "12px",
                  }}
                >
                  <div
                    style={{
                      height: "1px",
                      width: "24px",
                      background: "var(--gold)",
                    }}
                  ></div>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "11px",
                      color: "var(--gold)",
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                    }}
                  >
                    {product.category?.name || "Exclusive Design"}
                  </div>
                </div>

                <h1
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: "48px",
                    color: "var(--cream)",
                    lineHeight: 1.1,
                    fontWeight: 300,
                    marginBottom: "12px",
                  }}
                >
                  {selectedVariant?.name || product.name}
                </h1>

                {/* Rating Summary Row — Only shown if >= 50 reviews */}
                {userReviews.length >= 50 && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      marginBottom: "16px",
                    }}
                  >
                    <div style={{ color: "#F59E0B", fontSize: "15px" }}>
                      ★★★★★
                    </div>
                    <span
                      style={{
                        fontSize: "13px",
                        color: "var(--cream)",
                        fontWeight: 600,
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      4.9
                    </span>
                    <span
                      style={{ fontSize: "12px", color: "var(--text-muted)" }}
                    >
                      ({userReviews.length} Client Testimonials)
                    </span>
                  </div>
                )}

                <div
                  style={{ display: "flex", alignItems: "center", gap: "20px" }}
                >
                  <div
                    style={{
                      fontSize: "11px",
                      color: "var(--text-muted)",
                      letterSpacing: "0.1em",
                    }}
                  >
                    SKU: {selectedVariant?.sku || product.sku}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <div
                      style={{
                        width: "6px",
                        height: "6px",
                        background:
                          availableStock > 0 ? "var(--green)" : "var(--gold)",
                        borderRadius: "50%",
                      }}
                    />
                    <div
                      style={{
                        fontSize: "11px",
                        color:
                          availableStock > 0 ? "var(--green)" : "var(--gold)",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                      }}
                    >
                      {availableStock > 0
                        ? `${availableStock} Units Available`
                        : "Crafted to Order"}
                    </div>
                  </div>
                </div>

                {/* Urgency Pill */}
                {availableStock > 0 && availableStock <= 15 && (
                  <div
                    style={{
                      marginTop: "12px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      background: "rgba(214,162,74,0.12)",
                      border: "1px solid rgba(214,162,74,0.3)",
                      padding: "6px 14px",
                      borderRadius: "20px",
                      color: "#D6A24A",
                      fontSize: "11px",
                      fontFamily: "var(--font-mono)",
                      fontWeight: 600,
                    }}
                  >
                    <span>
                      ⚡ Only {availableStock} Units Remaining — Ready for
                      Express Dispatch
                    </span>
                  </div>
                )}
              </div>

              {/* Pricing Section */}
              <div
                style={{
                  padding: "24px 0",
                  borderTop: "1px solid var(--border)",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: "16px",
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-serif)",
                      fontSize: "48px",
                      color: "var(--gold-light)",
                      fontStyle: "italic",
                      fontWeight: 600,
                    }}
                  >
                    {formatPrice(displayPrice)}
                  </div>
                  {hasDiscount && (
                    <>
                      <div
                        style={{
                          fontFamily: "var(--font-serif)",
                          fontSize: "24px",
                          color: "var(--text-muted)",
                          textDecoration: "line-through",
                          opacity: 0.6,
                        }}
                      >
                        {formatPrice(displayMrp)}
                      </div>
                      <div
                        style={{
                          background: "rgba(196,160,90,0.15)",
                          border: "1px solid rgba(196,160,90,0.4)",
                          color: "var(--gold-light)",
                          padding: "4px 10px",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontFamily: "var(--font-mono)",
                          fontWeight: 700,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                        }}
                      >
                        SAVE {discountPercent}%
                      </div>
                    </>
                  )}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    color: "var(--text-muted)",
                    marginTop: "8px",
                    letterSpacing: "0.05em",
                  }}
                >
                  {isB2B
                    ? `Inclusive of GST ${product.gstRate || 18}% · B2B pricing active`
                    : "Price inclusive of all taxes"}
                </div>
              </div>

              {/* Finish Selector */}
              {allOptions.length > 0 && (
                <div>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "10px",
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      color: "var(--text-muted)",
                      marginBottom: "16px",
                    }}
                  >
                    Available Finishes
                  </div>
                  <div
                    style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}
                  >
                    {allOptions.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => {
                          setSelectedVariant(v);
                          setActiveImg(0);
                        }}
                        style={{
                          padding: "12px 24px",
                          borderRadius: "30px",
                          cursor: "pointer",
                          fontFamily: "var(--font-mono)",
                          fontSize: "11px",
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                          background:
                            selectedVariant?.id === v.id
                              ? "var(--gold)"
                              : "var(--surface2)",
                          border: "1px solid var(--border)",
                          color:
                            selectedVariant?.id === v.id
                              ? "var(--obsidian)"
                              : "var(--text-muted)",
                          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                          fontWeight: selectedVariant?.id === v.id ? 600 : 400,
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                        }}
                      >
                        <div
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            background: v.name.toLowerCase().includes("gold")
                              ? "#E2C97A"
                              : "#D0D0D0",
                          }}
                        />
                        {v.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Warranty Selector */}
              {renderWarrantySelector()}

              {/* Actions Section */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "24px" }}
                >
                  {!cartItem && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        background: "var(--surface2)",
                        border: "1px solid var(--border)",
                        borderRadius: "12px",
                        overflow: "hidden",
                      }}
                    >
                      <button
                        onClick={() => setQty((q) => Math.max(1, q - 1))}
                        style={{
                          width: "50px",
                          height: "50px",
                          background: "transparent",
                          border: "none",
                          color: "var(--text-muted)",
                          fontSize: "20px",
                          cursor: "pointer",
                        }}
                      >
                        −
                      </button>
                      <div
                        style={{
                          width: "40px",
                          textAlign: "center",
                          fontSize: "16px",
                          color: "var(--cream)",
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        {qty}
                      </div>
                      <button
                        onClick={() =>
                          setQty((q) => Math.min(availableStock || 999, q + 1))
                        }
                        style={{
                          width: "50px",
                          height: "50px",
                          background: "transparent",
                          border: "none",
                          color: "var(--text-muted)",
                          fontSize: "20px",
                          cursor: "pointer",
                        }}
                      >
                        +
                      </button>
                    </div>
                  )}

                  {cartItem ? (
                    <div style={{ flex: 1 }}>
                      {renderQtySelector(cartItem, "54px")}
                    </div>
                  ) : (
                    <button
                      style={{
                        flex: 1,
                        height: "54px",
                        borderRadius: "12px",
                        padding: "0 40px",
                        fontSize: "14px",
                        whiteSpace: "nowrap",
                        background: "var(--gold)",
                        color: "var(--obsidian)",
                        border: "none",
                        fontFamily: "var(--font-mono)",
                        textTransform: "uppercase",
                        letterSpacing: "0.12em",
                        fontWeight: 700,
                        cursor: "pointer",
                        boxShadow: "0 6px 20px rgba(196,160,90,0.3)",
                      }}
                      onClick={handleAddToCart}
                      disabled={availableStock === 0}
                    >
                      {availableStock === 0
                        ? "Notify Availability"
                        : "Add to Cart"}
                    </button>
                  )}

                  <button
                    onClick={handleToggleWishlist}
                    style={{
                      background: "transparent",
                      border: "none",
                      padding: "0 8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      color: isWishlisted ? "var(--gold)" : "var(--text)",
                      transition: "all 0.3s",
                    }}
                  >
                    <i
                      className={
                        isWishlisted ? "ti ti-heart-filled" : "ti ti-heart"
                      }
                      style={{ fontSize: "28px" }}
                    ></i>
                  </button>
                </div>
              </div>

              {/* Details & Delivery */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    background: "var(--surface2)",
                    border: "1px solid var(--border)",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    maxWidth: "340px",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "10px",
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      color: "var(--gold)",
                      marginBottom: "8px",
                    }}
                  >
                    Delivery Estimate
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      alignItems: "center",
                    }}
                  >
                    <input
                      placeholder="Enter Pincode"
                      maxLength={6}
                      value={pincode}
                      onChange={(e) =>
                        setPincode(e.target.value.replace(/\D/g, ""))
                      }
                      style={{
                        flex: 1,
                        minWidth: 0,
                        height: "32px",
                        boxSizing: "border-box",
                        background: "var(--obsidian)",
                        border: "1px solid var(--border)",
                        color: "var(--cream)",
                        padding: "6px 10px",
                        fontFamily: "var(--font-mono)",
                        fontSize: "12px",
                        outline: "none",
                        borderRadius: "4px",
                      }}
                    />
                    <button
                      onClick={() => handleCheckPincode(pincode)}
                      disabled={pincode.length !== 6 || checkingPincode}
                      className="btn-outline"
                      style={{
                        padding: "0 12px",
                        fontSize: "10px",
                        height: "32px",
                        minHeight: "none",
                        boxSizing: "border-box",
                        borderRadius: "4px",
                      }}
                    >
                      {checkingPincode ? "..." : "Check"}
                    </button>
                  </div>
                  {shippingRes && (
                    <div
                      style={{
                        marginTop: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        color: "var(--green)",
                        fontSize: "12px",
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      <i className="ti ti-truck"></i> Expected Delivery to{" "}
                      {shippingRes.city} by {shippingRes.etd}
                    </div>
                  )}
                  {pincodeError && (
                    <div
                      style={{
                        marginTop: "10px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        color: "#f87171",
                        fontSize: "11px",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      <i className="ti ti-alert-triangle"></i> {pincodeError}
                    </div>
                  )}
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                  }}
                >
                  {[
                    { icon: "ti-award", label: "Heritage Craftsmanship" },
                    { icon: "ti-truck-delivery", label: "Pan-India Delivery" },
                    { icon: "ti-shield-check", label: "Authentic Product" },
                    { icon: "ti-sparkles", label: "Curated Brilliance" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "14px 16px",
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        borderRadius: "12px",
                        fontSize: "11px",
                        color: "var(--text-muted)",
                      }}
                    >
                      <i
                        className={`ti ${item.icon}`}
                        style={{
                          color: "var(--gold)",
                          fontSize: "16px",
                          flexShrink: 0,
                        }}
                      ></i>
                      <span style={{ lineHeight: 1.2 }}>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Reviews & Ratings Section */}
        <section
          style={{
            borderTop: "0.5px solid var(--border)",
            padding: "60px 4% 40px",
            maxWidth: "1440px",
            margin: "0 auto",
          }}
        >
          {/* Header Row — ALWAYS VISIBLE */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "32px",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  color: "var(--gold)",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  marginBottom: "6px",
                }}
              >
                Verified Client Testimonials
              </div>
              <h2
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "clamp(26px, 4vw, 36px)",
                  color: "var(--cream)",
                  fontWeight: 300,
                  margin: 0,
                }}
              >
                Estate <em>Reviews</em> &amp; Rating{" "}
                {userReviews.length > 0 ? `(${userReviews.length})` : ""}
              </h2>
            </div>
            {/* "+ Write a Review" Button — ALWAYS VISIBLE */}
            <button
              onClick={() => setReviewModalOpen(true)}
              style={{
                padding: "12px 24px",
                background: "rgba(196,160,90,0.1)",
                border: "1px solid rgba(196,160,90,0.4)",
                borderRadius: "30px",
                color: "var(--gold)",
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>+ Write a Review</span>
            </button>
          </div>

          {/* Section Body */}
          {userReviews.length > 0 ? (
            <>
              {/* Overall Score Summary */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: "24px",
                  marginBottom: "32px",
                }}
              >
                <div
                  style={{
                    background: "var(--surface2)",
                    border: "0.5px solid var(--border)",
                    borderRadius: "20px",
                    padding: "24px",
                    display: "flex",
                    alignItems: "center",
                    gap: "24px",
                  }}
                >
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontFamily: "var(--font-serif)",
                        fontSize: "48px",
                        color: "var(--gold-light)",
                        lineHeight: 1,
                      }}
                    >
                      5.0
                    </div>
                    <div
                      style={{
                        color: "#F59E0B",
                        fontSize: "14px",
                        marginTop: "4px",
                      }}
                    >
                      ★★★★★
                    </div>
                    <div
                      style={{
                        fontSize: "10px",
                        color: "var(--text-muted)",
                        marginTop: "4px",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {userReviews.length} Verified Rating
                      {userReviews.length > 1 ? "s" : ""}
                    </div>
                  </div>
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                      fontSize: "11px",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {[
                      { stars: "5 ★", pct: 100 },
                      { stars: "4 ★", pct: 0 },
                      { stars: "3 ★", pct: 0 },
                      { stars: "2 ★", pct: 0 },
                      { stars: "1 ★", pct: 0 },
                    ].map((r) => (
                      <div
                        key={r.stars}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <span
                          style={{ width: "24px", color: "var(--text-muted)" }}
                        >
                          {r.stars}
                        </span>
                        <div
                          style={{
                            flex: 1,
                            height: "4px",
                            background: "rgba(255,255,255,0.06)",
                            borderRadius: "2px",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${r.pct}%`,
                              height: "100%",
                              background: "var(--gold)",
                            }}
                          />
                        </div>
                        <span
                          style={{
                            width: "28px",
                            color: "var(--text-dim)",
                            textAlign: "right",
                          }}
                        >
                          {r.pct}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  style={{
                    background: "var(--surface2)",
                    border: "0.5px solid var(--border)",
                    borderRadius: "20px",
                    padding: "24px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    gap: "12px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--gold)",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    100% Satisfaction Standard
                  </div>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "var(--text-muted)",
                      lineHeight: 1.6,
                      margin: 0,
                    }}
                  >
                    Every James and Sons fixture undergoes 48-hour burn testing
                    and artisan quality inspection before dispatch to luxury
                    residences across India.
                  </p>
                </div>
              </div>

              {/* Reviews Grid */}
              {(() => {
                const visibleReviews =
                  userReviews.length > 4 && !reviewsExpanded
                    ? userReviews.slice(0, 4)
                    : userReviews;

                return (
                  <div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(320px, 1fr))",
                        gap: "20px",
                      }}
                    >
                      {visibleReviews.map((rev) => (
                        <div
                          key={rev.id}
                          style={{
                            background: "var(--surface)",
                            border: "0.5px solid var(--border)",
                            borderRadius: "20px",
                            padding: "24px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "12px",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <div style={{ color: "#F59E0B", fontSize: "13px" }}>
                              {"★".repeat(rev.rating)}
                            </div>
                            <div
                              style={{
                                fontSize: "10px",
                                color: "var(--text-dim)",
                                fontFamily: "var(--font-mono)",
                              }}
                            >
                              {rev.date}
                            </div>
                          </div>
                          <div
                            style={{
                              fontFamily: "var(--font-serif)",
                              fontSize: "16px",
                              color: "var(--cream)",
                              fontWeight: 400,
                            }}
                          >
                            {rev.title}
                          </div>
                          <p
                            style={{
                              fontSize: "13px",
                              color: "var(--text-muted)",
                              lineHeight: 1.6,
                              margin: 0,
                              flex: 1,
                            }}
                          >
                            "{rev.comment}"
                          </p>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              paddingTop: "12px",
                              borderTop: "0.5px dashed rgba(255,255,255,0.08)",
                            }}
                          >
                            <div
                              style={{
                                width: "28px",
                                height: "28px",
                                borderRadius: "50%",
                                background: "rgba(196,160,90,0.15)",
                                border: "1px solid rgba(196,160,90,0.3)",
                                color: "var(--gold)",
                                fontSize: "11px",
                                fontFamily: "var(--font-mono)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: 600,
                              }}
                            >
                              {rev.author[0]}
                            </div>
                            <div>
                              <div
                                style={{
                                  fontSize: "12px",
                                  color: "var(--cream)",
                                  fontWeight: 500,
                                }}
                              >
                                {rev.author}
                              </div>
                              <div
                                style={{
                                  fontSize: "10px",
                                  color: "var(--gold)",
                                  fontFamily: "var(--font-mono)",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                <i
                                  className="ti ti-circle-check-filled"
                                  style={{ fontSize: "11px" }}
                                ></i>{" "}
                                Verified Estate Buyer · {rev.location}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* View More Reviews Button — ONLY shown if userReviews.length > 4 */}
                    {userReviews.length > 4 && (
                      <div style={{ marginTop: "28px", textAlign: "center" }}>
                        <button
                          type="button"
                          onClick={() => setReviewsExpanded(!reviewsExpanded)}
                          style={{
                            padding: "14px 32px",
                            background: "rgba(196,160,90,0.08)",
                            border: "1px solid rgba(196,160,90,0.3)",
                            borderRadius: "30px",
                            color: "var(--gold)",
                            fontFamily: "var(--font-mono)",
                            fontSize: "11px",
                            textTransform: "uppercase",
                            letterSpacing: "0.15em",
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 0.2s",
                          }}
                        >
                          {reviewsExpanded
                            ? "Show Fewer Reviews ▲"
                            : `View More Reviews (${userReviews.length - 4} More) ▼`}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}
            </>
          ) : (
            /* Empty State if 0 reviews */
            <div
              style={{
                textAlign: "center",
                padding: "40px 20px",
                background: "var(--surface2)",
                borderRadius: "20px",
                border: "0.5px solid var(--border)",
              }}
            >
              <i
                className="ti ti-message-dots"
                style={{
                  fontSize: "36px",
                  color: "var(--gold)",
                  marginBottom: "12px",
                  display: "block",
                }}
              ></i>
              <div
                style={{
                  fontSize: "16px",
                  color: "var(--cream)",
                  fontFamily: "var(--font-serif)",
                  marginBottom: "6px",
                }}
              >
                Be the First to Review
              </div>
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--text-muted)",
                  maxWidth: "400px",
                  margin: "0 auto 20px",
                  lineHeight: 1.6,
                }}
              >
                Have you purchased or specified this fixture? Share your
                feedback regarding craftsmanship and illumination.
              </p>
              <button
                onClick={() => setReviewModalOpen(true)}
                style={{
                  padding: "12px 24px",
                  background: "var(--gold)",
                  border: "none",
                  borderRadius: "12px",
                  color: "var(--obsidian)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                + Write First Review
              </button>
            </div>
          )}
        </section>

        {/* Lightbox Overlay */}
        {lightboxOpen && (
          <div
            onClick={() => setLightboxOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9999,
              background: "rgba(0,0,0,0.95)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <button
              onClick={() => setLightboxOpen(false)}
              style={{
                position: "absolute",
                top: "20px",
                right: "20px",
                background: "rgba(255,255,255,0.1)",
                border: "none",
                color: "#fff",
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                fontSize: "20px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <i className="ti ti-x"></i>
            </button>
            <div
              onClick={(e) => e.stopPropagation()}
              onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
              onTouchEnd={(e) => handleSwipe(e.changedTouches[0].clientX)}
              style={{
                position: "relative",
                width: "100%",
                maxWidth: "800px",
                aspectRatio: "4/3",
                margin: "0 auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Image
                src={activeImages[activeImg]}
                alt={product.name}
                fill
                sizes="(max-width: 800px) 100vw, 800px"
                style={{ objectFit: "contain" }}
                priority
              />
              {activeImages.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImg((i) => Math.max(0, i - 1))}
                    style={{
                      position: "absolute",
                      left: "8px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      background: "rgba(255,255,255,0.15)",
                      border: "none",
                      color: "#fff",
                      fontSize: "20px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: activeImg === 0 ? 0.3 : 1,
                    }}
                  >
                    <i className="ti ti-chevron-left"></i>
                  </button>
                  <button
                    onClick={() =>
                      setActiveImg((i) =>
                        Math.min(activeImages.length - 1, i + 1),
                      )
                    }
                    style={{
                      position: "absolute",
                      right: "8px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      background: "rgba(255,255,255,0.15)",
                      border: "none",
                      color: "#fff",
                      fontSize: "20px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: activeImg === activeImages.length - 1 ? 0.3 : 1,
                    }}
                  >
                    <i className="ti ti-chevron-right"></i>
                  </button>
                  <div
                    style={{
                      position: "absolute",
                      bottom: "-32px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      display: "flex",
                      gap: "8px",
                    }}
                  >
                    {activeImages.map((_: any, idx: number) => (
                      <div
                        key={idx}
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background:
                            idx === activeImg
                              ? "var(--gold)"
                              : "rgba(255,255,255,0.2)",
                          transition: "all 0.3s ease",
                          transform:
                            idx === activeImg ? "scale(1.3)" : "scale(1)",
                        }}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Review Submission Modal */}
        {reviewModalOpen && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9999,
              background: "rgba(0,0,0,0.85)",
              backdropFilter: "blur(8px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
            }}
          >
            <div
              style={{
                background: "var(--obsidian)",
                border: "1px solid var(--border)",
                borderRadius: "24px",
                padding: "32px",
                maxWidth: "480px",
                width: "100%",
                position: "relative",
              }}
            >
              <button
                onClick={() => setReviewModalOpen(false)}
                style={{
                  position: "absolute",
                  top: "20px",
                  right: "20px",
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  fontSize: "20px",
                  cursor: "pointer",
                }}
              >
                ×
              </button>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  color: "var(--gold)",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  marginBottom: "8px",
                }}
              >
                Client Feedback
              </div>
              <h3
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "24px",
                  color: "var(--cream)",
                  marginBottom: "20px",
                }}
              >
                Write an Estate Review
              </h3>

              {reviewSubmitted ? (
                <div
                  style={{
                    padding: "24px 0",
                    textAlign: "center",
                    color: "var(--green)",
                  }}
                >
                  <i
                    className="ti ti-circle-check"
                    style={{
                      fontSize: "40px",
                      marginBottom: "12px",
                      display: "block",
                    }}
                  ></i>
                  <div
                    style={{
                      fontSize: "16px",
                      color: "var(--cream)",
                      fontFamily: "var(--font-serif)",
                      marginBottom: "4px",
                    }}
                  >
                    Thank You for Your Review
                  </div>
                  <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                    Your verified testimonial has been submitted for moderation.
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!reviewAuthor || !reviewComment) return;
                    setUserReviews((prev) => [
                      {
                        id: Date.now(),
                        author: reviewAuthor,
                        location: "Verified Buyer",
                        rating: reviewRating,
                        date: "Just now",
                        verified: true,
                        title: "Exceptional Lighting Fixture",
                        comment: reviewComment,
                      },
                      ...prev,
                    ]);
                    setReviewSubmitted(true);
                    setTimeout(() => {
                      setReviewSubmitted(false);
                      setReviewModalOpen(false);
                      setReviewAuthor("");
                      setReviewComment("");
                    }, 2000);
                  }}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                  }}
                >
                  <div>
                    <label
                      style={{
                        fontSize: "10px",
                        color: "var(--text-muted)",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        display: "block",
                        marginBottom: "6px",
                      }}
                    >
                      Your Rating
                    </label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setReviewRating(star)}
                          style={{
                            fontSize: "24px",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color:
                              star <= reviewRating
                                ? "#F59E0B"
                                : "rgba(255,255,255,0.2)",
                          }}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: "10px",
                        color: "var(--text-muted)",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        display: "block",
                        marginBottom: "6px",
                      }}
                    >
                      Your Name &amp; Title
                    </label>
                    <input
                      required
                      value={reviewAuthor}
                      onChange={(e) => setReviewAuthor(e.target.value)}
                      placeholder="e.g. Rajesh Kumar"
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        background: "var(--surface)",
                        border: "0.5px solid var(--border)",
                        borderRadius: "12px",
                        color: "var(--cream)",
                        outline: "none",
                        fontSize: "13px",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: "10px",
                        color: "var(--text-muted)",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        display: "block",
                        marginBottom: "6px",
                      }}
                    >
                      Your Review
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Share your experience regarding craftsmanship, lighting effect, or packaging..."
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        background: "var(--surface)",
                        border: "0.5px solid var(--border)",
                        borderRadius: "12px",
                        color: "var(--cream)",
                        outline: "none",
                        fontSize: "13px",
                      }}
                    />
                  </div>
                  <button
                    type="submit"
                    style={{
                      padding: "14px",
                      background: "var(--gold)",
                      border: "none",
                      borderRadius: "12px",
                      color: "var(--obsidian)",
                      fontFamily: "var(--font-mono)",
                      fontSize: "11px",
                      textTransform: "uppercase",
                      letterSpacing: "0.12em",
                      fontWeight: 700,
                      cursor: "pointer",
                      marginTop: "8px",
                    }}
                  >
                    Submit Review
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        <InquiryModal
          isOpen={inquiryModalOpen}
          onClose={() => setInquiryModalOpen(false)}
          product={{
            id:
              selectedVariant && selectedVariant.id !== "original"
                ? selectedVariant.id
                : product.id,
            name:
              selectedVariant && selectedVariant.id !== "original"
                ? `${product.name} - ${selectedVariant.name}`
                : product.name,
            sku:
              selectedVariant && selectedVariant.id !== "original"
                ? selectedVariant.sku
                : product.sku,
            d2cPrice: displayPrice,
            image: activeImages[0],
          }}
        />

        <style jsx>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
          @keyframes shimmer {
            0% {
              background-position: 200% 0;
            }
            100% {
              background-position: -200% 0;
            }
          }
          .shimmer-placeholder {
            background: linear-gradient(
              90deg,
              var(--surface) 25%,
              var(--surface2) 50%,
              var(--surface) 75%
            );
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite linear;
          }
        `}</style>
      </div>
    </>
  );
}
