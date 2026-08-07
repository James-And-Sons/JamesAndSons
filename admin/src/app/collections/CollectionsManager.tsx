"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { addProductToCollection, removeProductFromCollection } from "./actions";
import { useSidebar } from "@/lib/context/SidebarContext";
import CloudinaryUpload from "@/components/CloudinaryUpload";

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  technicalSubheading: string | null;
  hsnCode: string | null;
  gstRate: number | null;
  bisStandard: string | null;
  bisStatus: string | null;
  image: string | null;
  images: string[];
  baseShippingLimit: number | null;
  freeShippingThreshold: number | null;
  _count: { products: number };
  products: { id: string; name: string; images: string[] }[];
};

export default function CategoryManager({
  categories,
  allProducts,
}: {
  categories: Category[];
  allProducts: { id: string; name: string; sku: string; images: string[] }[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [managingProducts, setManagingProducts] = useState<Category | null>(
    null,
  );
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [technicalSubheading, setTechnicalSubheading] = useState("");
  const [hsnCode, setHsnCode] = useState("");
  const [gstRate, setGstRate] = useState<number>(18);
  const [bisStandard, setBisStandard] = useState("");
  const [bisStatus, setBisStatus] = useState("Pending Application");
  const [images, setImages] = useState<string[]>([]);
  const [baseShippingLimit, setBaseShippingLimit] = useState<number | "">("");
  const [freeShippingThreshold, setFreeShippingThreshold] = useState<
    number | ""
  >("");
  const [error, setError] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");

  const { setIsPageDirty } = useSidebar();

  // Accurate dirtiness check (comparing defaults so pristine forms are NOT marked dirty)
  const isDirty =
    showForm &&
    (editing === null
      ? name.trim() !== "" ||
        description.trim() !== "" ||
        technicalSubheading.trim() !== "" ||
        hsnCode.trim() !== "" ||
        gstRate !== 18 ||
        bisStandard.trim() !== "" ||
        bisStatus !== "Pending Application" ||
        images.length > 0 ||
        baseShippingLimit !== "" ||
        freeShippingThreshold !== ""
      : name !== editing.name ||
        description !== (editing.description || "") ||
        technicalSubheading !== (editing.technicalSubheading || "") ||
        hsnCode !== (editing.hsnCode || "") ||
        gstRate !== (editing.gstRate ?? 18) ||
        bisStandard !== (editing.bisStandard || "") ||
        bisStatus !== (editing.bisStatus || "Pending Application") ||
        baseShippingLimit !== (editing.baseShippingLimit ?? "") ||
        freeShippingThreshold !== (editing.freeShippingThreshold ?? "") ||
        JSON.stringify(images) !== JSON.stringify(editing.images || []));

  useEffect(() => {
    setIsPageDirty(isDirty);
    return () => setIsPageDirty(false);
  }, [isDirty, setIsPageDirty]);

  // Keep managingProducts updated when categories prop refreshes
  useEffect(() => {
    if (managingProducts) {
      const fresh = categories.find((c) => c.id === managingProducts.id);
      if (fresh) {
        setManagingProducts(fresh);
      }
    }
  }, [categories]);

  // Initial load check for search params (?edit=id or ?manage=id) when categories are loaded
  useEffect(() => {
    if (typeof window !== "undefined" && categories.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const manageId = params.get("manage");
      const editId = params.get("edit");

      if (manageId) {
        const cat = categories.find((c) => c.id === manageId);
        if (cat) {
          setManagingProducts(cat);
          setShowForm(false);
          setEditing(null);
        }
      } else if (editId) {
        const cat = categories.find((c) => c.id === editId);
        if (cat) {
          setEditing(cat);
          setName(cat.name);
          setDescription(cat.description || "");
          setTechnicalSubheading(cat.technicalSubheading || "");
          setHsnCode(cat.hsnCode || "");
          setGstRate(cat.gstRate ?? 18);
          setBisStandard(cat.bisStandard || "");
          setBisStatus(cat.bisStatus || "Pending Application");
          setImages(cat.images || []);
          setBaseShippingLimit(cat.baseShippingLimit ?? "");
          setFreeShippingThreshold(cat.freeShippingThreshold ?? "");
          setShowForm(true);
          setManagingProducts(null);
        }
      }
    }
  }, [categories]);

  const handleDiscard = () => {
    try {
      if (typeof window !== "undefined") {
        window.history.replaceState({}, "", "/collections");
      }
    } catch {}
    setShowForm(false);
    setEditing(null);
    setError("");
  };

  const openAdd = () => {
    try {
      if (typeof window !== "undefined") {
        window.history.replaceState({}, "", "/collections");
      }
    } catch {}
    setEditing(null);
    setName("");
    setDescription("");
    setTechnicalSubheading("");
    setHsnCode("");
    setGstRate(18);
    setBisStandard("");
    setBisStatus("Pending Application");
    setImages([]);
    setBaseShippingLimit("");
    setFreeShippingThreshold("");
    setShowForm(true);
    setManagingProducts(null);
    setError("");
  };

  const openEdit = (cat: Category) => {
    try {
      if (typeof window !== "undefined") {
        window.history.replaceState({}, "", `/collections?edit=${cat.id}`);
      }
    } catch {}
    setEditing(cat);
    setName(cat.name);
    setDescription(cat.description || "");
    setTechnicalSubheading(cat.technicalSubheading || "");
    setHsnCode(cat.hsnCode || "");
    setGstRate(cat.gstRate ?? 18);
    setBisStandard(cat.bisStandard || "");
    setBisStatus(cat.bisStatus || "Pending Application");
    setImages(cat.images || []);
    setBaseShippingLimit(cat.baseShippingLimit ?? "");
    setFreeShippingThreshold(cat.freeShippingThreshold ?? "");
    setShowForm(true);
    setManagingProducts(null);
    setError("");
  };

  const openManage = (cat: Category) => {
    try {
      if (typeof window !== "undefined") {
        window.history.replaceState({}, "", `/collections?manage=${cat.id}`);
      }
    } catch {}
    setManagingProducts(cat);
    setShowForm(false);
    setEditing(null);
    setError("");
  };

  const handleSave = () => {
    if (!name.trim()) {
      setError("Category Name is required");
      return;
    }
    setError("");
    startTransition(async () => {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
      const method = editing ? "PUT" : "POST";
      const url = editing
        ? `/api/collections/${editing.id}`
        : "/api/collections";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug,
          description: description.trim(),
          technicalSubheading: technicalSubheading.trim(),
          hsnCode: hsnCode.trim(),
          gstRate: parseFloat(String(gstRate)) || 18,
          bisStandard: bisStandard.trim(),
          bisStatus,
          baseShippingLimit:
            baseShippingLimit !== ""
              ? parseFloat(String(baseShippingLimit))
              : null,
          freeShippingThreshold:
            freeShippingThreshold !== ""
              ? parseFloat(String(freeShippingThreshold))
              : null,
          image: images[0] || null,
          images,
        }),
      });
      if (!res.ok) {
        const errorText = await res.text();
        setError(errorText || "Failed to save category");
        return;
      }
      if (typeof window !== "undefined") {
        window.history.replaceState({}, "", "/collections");
      }
      setShowForm(false);
      setEditing(null);
      router.refresh();
    });
  };

  const handleDelete = (id: string, productCount: number) => {
    if (productCount > 0) {
      alert(`Cannot delete: ${productCount} product(s) use this category.`);
      return;
    }
    if (!confirm("Delete this category?")) return;
    startTransition(async () => {
      const res = await fetch(`/api/collections/${id}`, { method: "DELETE" });
      if (!res.ok) {
        alert(await res.text());
        return;
      }
      if (typeof window !== "undefined") {
        window.history.replaceState({}, "", "/collections");
      }
      router.refresh();
    });
  };

  const handleRowClick = (e: React.MouseEvent, cat: Category) => {
    const target = e.target as HTMLElement;
    const isInteractive =
      target.tagName === "A" ||
      target.tagName === "BUTTON" ||
      target.tagName === "INPUT" ||
      target.tagName === "SELECT" ||
      target.tagName === "TEXTAREA" ||
      target.closest("a") ||
      target.closest("button");

    if (!isInteractive) {
      openEdit(cat);
    }
  };

  const handleAddProduct = async () => {
    if (!managingProducts || !selectedProductId) return;
    setError("");
    startTransition(async () => {
      const res = await addProductToCollection(
        managingProducts.id,
        selectedProductId,
      );
      if (res.success) {
        setSelectedProductId("");
        router.refresh();
      } else {
        setError(res.error || "Failed to add product to category");
      }
    });
  };

  const handleRemoveProduct = async (productId: string) => {
    if (!managingProducts) return;
    setError("");
    startTransition(async () => {
      const res = await removeProductFromCollection(
        managingProducts.id,
        productId,
      );
      if (res.success) {
        router.refresh();
      } else {
        setError(res.error || "Failed to remove product from category");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          {error && (
            <div className="p-3 mb-2 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 font-mono text-[11px]">
              ⚠️ {error}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="btn-primary font-mono text-[10px] uppercase tracking-[0.12em] px-8 py-3 shadow-lg shadow-accent/20 cursor-pointer"
        >
          + Create New Category
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-surface border border-accent/30 rounded-lg w-full max-w-[640px] flex flex-col overflow-hidden max-h-[90vh] shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div>
                <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-accent">
                  {editing ? "Edit Details" : "Create New"}
                </div>
                <h2 className="font-serif text-[20px] text-primary font-normal m-0">
                  {editing ? "Edit Category" : "Create New Category"}
                </h2>
              </div>
              <button
                type="button"
                onClick={handleDiscard}
                className="text-muted hover:text-primary font-mono text-[16px] cursor-pointer bg-transparent border-none focus:outline-none"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5 overflow-y-auto">
              {error && (
                <p className="text-red-400 font-mono text-[11px] m-0">
                  ⚠️ {error}
                </p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted block mb-1">
                    Category Name *
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-background border border-border px-4 py-3 text-[13px] font-body text-primary focus:outline-none focus:border-accent transition-colors"
                    placeholder="e.g. Chandeliers"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted block mb-1">
                    Technical Subheading
                  </label>
                  <input
                    value={technicalSubheading}
                    onChange={(e) => setTechnicalSubheading(e.target.value)}
                    className="w-full bg-background border border-border px-4 py-3 text-[13px] font-body text-primary focus:outline-none focus:border-accent transition-colors"
                    placeholder="e.g. Chandelier / Pendant (LED)"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted block mb-1">
                    8-Digit HSN Code
                  </label>
                  <input
                    value={hsnCode}
                    onChange={(e) => setHsnCode(e.target.value)}
                    className="w-full bg-background border border-border px-4 py-3 text-[13px] font-body text-primary focus:outline-none focus:border-accent transition-colors"
                    placeholder="e.g. 94051100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted block mb-1">
                    GST Rate (%)
                  </label>
                  <select
                    value={gstRate}
                    onChange={(e) => setGstRate(parseFloat(e.target.value))}
                    className="w-full bg-background border border-border px-4 py-3 text-[13px] font-body text-primary focus:outline-none focus:border-accent transition-colors cursor-pointer"
                  >
                    <option value={5}>5%</option>
                    <option value={12}>12%</option>
                    <option value={18}>18%</option>
                    <option value={28}>28%</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted block mb-1">
                    Applicable BIS Standard
                  </label>
                  <input
                    value={bisStandard}
                    onChange={(e) => setBisStandard(e.target.value)}
                    className="w-full bg-background border border-border px-4 py-3 text-[13px] font-body text-primary focus:outline-none focus:border-accent transition-colors"
                    placeholder="e.g. IS 10322 (Part 5 / Sec 1)"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted block mb-1">
                    BIS Status
                  </label>
                  <select
                    value={bisStatus}
                    onChange={(e) => setBisStatus(e.target.value)}
                    className="w-full bg-background border border-border px-4 py-3 text-[13px] font-body text-primary focus:outline-none focus:border-accent transition-colors cursor-pointer"
                  >
                    <option value="Pending Application">
                      Pending Application
                    </option>
                    <option value="Approved">Approved</option>
                    <option value="Not Available">Not Available</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted block mb-1">
                    Base Shipping Included (₹)
                  </label>
                  <input
                    type="number"
                    value={baseShippingLimit}
                    onChange={(e) =>
                      setBaseShippingLimit(
                        e.target.value !== "" ? parseFloat(e.target.value) : "",
                      )
                    }
                    className="w-full bg-background border border-border px-4 py-3 text-[13px] font-body text-primary focus:outline-none focus:border-accent transition-colors"
                    placeholder="e.g. 280 (Default fallback if empty)"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted block mb-1">
                    Free Shipping Threshold (₹)
                  </label>
                  <input
                    type="number"
                    value={freeShippingThreshold}
                    onChange={(e) =>
                      setFreeShippingThreshold(
                        e.target.value !== "" ? parseFloat(e.target.value) : "",
                      )
                    }
                    className="w-full bg-background border border-border px-4 py-3 text-[13px] font-body text-primary focus:outline-none focus:border-accent transition-colors"
                    placeholder="e.g. 380 (Default fallback if empty)"
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted block mb-1">
                    Description (Optional)
                  </label>
                  <input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-background border border-border px-4 py-3 text-[13px] font-body text-primary focus:outline-none focus:border-accent transition-colors"
                    placeholder="Brief summary of this category"
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted block mb-2">
                    Category Cover Photos (Multiple)
                  </label>
                  <CloudinaryUpload
                    onUpload={(urls) => setImages(urls)}
                    defaultImages={images}
                    multiple={true}
                    label="Add Category Cover Photo"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border bg-surface-muted/40 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleDiscard}
                className="font-mono text-[9px] uppercase tracking-widest text-muted border border-border px-6 py-2.5 hover:text-primary transition-colors bg-background rounded-sm cursor-pointer"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isPending}
                className="px-6 py-2.5 font-mono text-[9px] uppercase tracking-widest bg-accent text-black hover:bg-accent-hover transition-colors font-bold disabled:opacity-50 rounded-sm cursor-pointer"
              >
                {isPending ? "Processing..." : "Save Category"}
              </button>
            </div>
          </div>
        </div>
      )}

      {managingProducts && (
        <div className="premium-card p-8 space-y-6 shadow-xl border-accent/30 bg-surface/90 backdrop-blur">
          <div className="flex justify-between items-center border-b border-border/40 pb-4">
            <h3 className="font-serif text-[22px] text-primary font-light">
              Products in{" "}
              <span className="text-accent underline underline-offset-8">
                {managingProducts.name}
              </span>
            </h3>
            <button
              type="button"
              onClick={() => {
                setManagingProducts(null);
                if (typeof window !== "undefined")
                  window.history.replaceState({}, "", "/collections");
              }}
              className="font-mono text-[9px] uppercase tracking-widest text-muted hover:text-primary border border-border px-4 py-2 hover:bg-surface-muted transition-colors cursor-pointer"
            >
              Close Manager
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex gap-3 items-end bg-background/50 p-4 border border-border">
              <div className="flex-1">
                <label className="font-mono text-[10px] uppercase tracking-widest text-muted block mb-1">
                  Add Product to Category
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full bg-background border border-border px-4 py-3 text-[14px] font-body text-primary focus:outline-none focus:border-accent cursor-pointer"
                >
                  <option value="">Select a product...</option>
                  {allProducts
                    .filter(
                      (p) =>
                        !(
                          categories.find((c) => c.id === managingProducts.id)
                            ?.products || []
                        ).some((cp) => cp.id === p.id),
                    )
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku})
                      </option>
                    ))}
                </select>
              </div>
              <button
                type="button"
                onClick={handleAddProduct}
                disabled={!selectedProductId || isPending}
                className="px-6 py-2.5 font-mono text-[9px] uppercase tracking-widest bg-accent text-black hover:bg-accent-hover transition-colors font-bold disabled:opacity-50 cursor-pointer"
              >
                {isPending ? "Adding..." : "Add"}
              </button>
            </div>

            <div className="premium-card overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-[#16161a] border-b border-border">
                  <tr>
                    <th className="px-6 py-3.5 font-mono text-[9px] uppercase tracking-widest text-muted">
                      Product Name
                    </th>
                    <th className="px-6 py-3.5 font-mono text-[9px] uppercase tracking-widest text-muted text-right">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {(
                    categories.find((c) => c.id === managingProducts.id)
                      ?.products || []
                  ).map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-background/30 transition-colors"
                    >
                      <td className="px-6 py-4 font-body text-[13px] text-primary">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-background border border-border flex items-center justify-center font-mono text-[7px] text-muted overflow-hidden">
                            {p.images && p.images.length > 0 ? (
                              <img
                                src={p.images[0]}
                                alt={p.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              "IMG"
                            )}
                          </div>
                          {p.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveProduct(p.id)}
                          disabled={isPending}
                          className="font-mono text-[9px] uppercase text-rose-400 hover:text-rose-500 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!(
                    categories.find((c) => c.id === managingProducts.id)
                      ?.products || []
                  ).length && (
                    <tr>
                      <td
                        colSpan={2}
                        className="px-6 py-8 text-center font-mono text-[10px] text-muted uppercase tracking-widest"
                      >
                        No products in this category
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="premium-card overflow-hidden">
        <table className="w-full text-left">
          <thead className="border-b border-border bg-surface-muted/30">
            <tr>
              <th className="px-6 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal">
                Category Info
              </th>
              <th className="px-6 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal">
                Tax &amp; Compliance
              </th>
              <th className="px-6 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal text-right">
                Products
              </th>
              <th className="px-6 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {categories.map((cat) => (
              <tr
                key={cat.id}
                onClick={(e) => handleRowClick(e, cat)}
                className="hover:bg-surface-muted/50 transition-colors cursor-pointer"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {cat.image ? (
                      <div className="relative w-12 h-12 border border-border overflow-hidden bg-background flex-shrink-0">
                        <img
                          src={cat.image}
                          alt={cat.name}
                          className="object-cover w-full h-full"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 border border-dashed border-border/60 flex items-center justify-center text-muted font-mono text-[9px] bg-background flex-shrink-0">
                        No Img
                      </div>
                    )}
                    <div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(cat);
                        }}
                        className="font-serif text-[17px] text-primary hover:text-accent transition-colors text-left bg-transparent border-none p-0 cursor-pointer block font-normal"
                      >
                        {cat.name}
                      </button>
                      <div className="font-mono text-[10px] text-muted">
                        {cat.slug}
                      </div>
                      {cat.technicalSubheading && (
                        <div className="font-mono text-[10px] text-accent mt-1">
                          {cat.technicalSubheading}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 space-y-1">
                  <div className="flex items-center gap-2 font-mono text-[11px] text-secondary">
                    <span>HSN:</span>
                    <span className="text-primary font-semibold">
                      {cat.hsnCode || "—"}
                    </span>
                    <span>|</span>
                    <span>GST:</span>
                    <span className="text-primary font-semibold">
                      {cat.gstRate !== null && cat.gstRate !== undefined
                        ? `${cat.gstRate}%`
                        : "—"}
                    </span>
                  </div>
                  {(cat.bisStandard || cat.bisStatus) && (
                    <div className="flex items-center gap-2 mt-1">
                      {cat.bisStandard && (
                        <span
                          className="font-mono text-[10px] text-muted tracking-wide max-w-[200px] truncate"
                          title={cat.bisStandard}
                        >
                          {cat.bisStandard}
                        </span>
                      )}
                      {cat.bisStatus && (
                        <span
                          className={`font-mono text-[9px] uppercase px-1.5 py-0.5 rounded-sm border ${
                            cat.bisStatus.toLowerCase().includes("pending")
                              ? "border-amber-500/30 text-amber-400 bg-amber-500/5"
                              : cat.bisStatus.toLowerCase().includes("approved")
                                ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/5"
                                : "border-border text-muted bg-surface-muted/20"
                          }`}
                        >
                          {cat.bisStatus}
                        </span>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 font-mono text-[13px] text-right text-secondary tabular-nums">
                  {cat._count?.products || 0} Designs
                </td>
                <td className="px-6 py-4 text-right flex gap-4 justify-end items-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openManage(cat);
                    }}
                    className="font-mono text-[9px] uppercase tracking-[0.1em] text-accent hover:text-white transition-colors cursor-pointer"
                  >
                    Products
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEdit(cat);
                    }}
                    className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted hover:text-white transition-colors cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(cat.id, cat._count?.products || 0);
                    }}
                    className="font-mono text-[9px] uppercase tracking-[0.1em] text-rose-400 hover:text-rose-500 transition-colors cursor-pointer"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-12 text-center font-mono text-[11px] text-muted uppercase tracking-widest"
                >
                  No categories yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
