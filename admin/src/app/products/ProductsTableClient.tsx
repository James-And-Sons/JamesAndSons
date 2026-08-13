"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import ActionDropdown from "@/components/ActionDropdown";
import SyncButton from "@/components/SyncButton";
import ClickableRow from "@/components/ClickableRow";

interface ProductItem {
  id: string;
  name: string;
  sku: string;
  d2cPrice: number;
  b2bPrice: number;
  stockQuantity: number;
  images: string[];
  whiteBackgroundImages?: string[];
  createdAt: Date;
  updatedAt: Date;
  categoryId: string | null;
  category: { id: string; name: string } | null;
  slug: string;
}

interface CategoryItem {
  id: string;
  name: string;
}

export default function ProductsTableClient({
  products: initialProducts,
  categories,
}: {
  products: ProductItem[];
  categories: CategoryItem[];
}) {
  const searchParams = useSearchParams();
  const [productsList, setProductsList] =
    useState<ProductItem[]>(initialProducts);
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("categoryId") || "ALL",
  );
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [chipFilter, setChipFilter] = useState<
    "ALL" | "LOW_STOCK" | "ANOMALY" | "OUT_OF_STOCK"
  >("ALL");
  const [isFlipkartModalOpen, setIsFlipkartModalOpen] = useState(false);
  const [flipkartExportFilter, setFlipkartExportFilter] = useState<
    "unlisted" | "all"
  >("unlisted");

  useEffect(() => {
    setProductsList(initialProducts);
  }, [initialProducts]);

  useEffect(() => {
    setSearchTerm(searchParams.get("q") || "");
    setSelectedCategory(searchParams.get("categoryId") || "ALL");
  }, [searchParams]);

  // Calculate stats for the top summary strip
  const stats = useMemo(() => {
    let active = 0;
    let lowStock = 0;
    let anomaly = 0;
    let outOfStock = 0;

    productsList.forEach((p) => {
      if (p.stockQuantity > 0) active++;
      if (p.stockQuantity > 0 && p.stockQuantity < 5) lowStock++;
      if (p.stockQuantity <= 0) outOfStock++;
      if (p.b2bPrice > p.d2cPrice || p.d2cPrice < 600) anomaly++;
    });

    return {
      active,
      lowStock,
      anomaly,
      outOfStock,
      total: productsList.length,
    };
  }, [productsList]);

  // Filter products based on search term, category, status, and active chip
  const filteredProducts = useMemo(() => {
    return productsList.filter((p) => {
      // 1. Search filter
      const query = searchTerm.toLowerCase();
      const matchesSearch =
        !query ||
        p.name.toLowerCase().includes(query) ||
        p.sku.toLowerCase().includes(query) ||
        (p.category?.name && p.category.name.toLowerCase().includes(query));

      // 2. Category filter
      const matchesCategory =
        selectedCategory === "ALL" || p.categoryId === selectedCategory;

      // 3. Status filter
      let matchesStatus = true;
      if (selectedStatus === "ACTIVE") matchesStatus = p.stockQuantity > 0;
      if (selectedStatus === "OUT_OF_STOCK")
        matchesStatus = p.stockQuantity <= 0;

      // 4. Quick Chip filter
      let matchesChip = true;
      if (chipFilter === "LOW_STOCK")
        matchesChip = p.stockQuantity > 0 && p.stockQuantity < 5;
      if (chipFilter === "ANOMALY")
        matchesChip = p.b2bPrice > p.d2cPrice || p.d2cPrice < 600;
      if (chipFilter === "OUT_OF_STOCK") matchesChip = p.stockQuantity <= 0;

      return matchesSearch && matchesCategory && matchesStatus && matchesChip;
    });
  }, [productsList, searchTerm, selectedCategory, selectedStatus, chipFilter]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedStatus, chipFilter]);

  // Derive paginated products based on current page and items per page
  const paginatedProducts = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center gap-4 premium-card p-6 rounded-lg">
        <h1 className="font-serif text-[28px] font-normal text-primary tracking-wide m-0 lg:hidden">
          Catalog &amp; Pricing
        </h1>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center gap-3 w-full">
          {/* Add Product - leftmost */}
          <Link
            href="/products/add"
            className="btn-primary font-mono text-[10px] uppercase tracking-[0.14em] px-6 py-2.5 shadow-lg shadow-accent/20 flex items-center gap-1.5"
          >
            <span aria-hidden="true">+</span>
            <span>Add Product</span>
          </Link>

          {/* Other action buttons - right aligned */}
          <div className="flex items-center gap-3 ml-auto">
            {/* Export Feeds Dropdown */}
            <div className="relative group flex items-center z-20">
              <button
                type="button"
                className="font-mono text-[10px] uppercase tracking-[0.14em] text-secondary border border-border px-4 py-2.5 hover:bg-surface-muted hover:text-primary transition-colors bg-background flex items-center gap-1.5 rounded-sm cursor-pointer"
                aria-label="Export feeds menu"
              >
                <span>Export Feeds</span>
                <span aria-hidden="true">▾</span>
              </button>
              <div className="absolute right-0 top-full mt-1 hidden group-hover:block bg-surface border border-border py-2 w-48 shadow-xl rounded-sm">
                <a
                  href="/api/admin/export/google"
                  download="google_merchant_feed.xml"
                  className="block px-4 py-2 text-[10px] font-mono uppercase tracking-wider text-secondary hover:bg-surface-muted hover:text-primary transition-colors"
                >
                  Google Merchant Feed
                </a>
                <a
                  href="/api/admin/export/pinterest"
                  download="pinterest_feed.csv"
                  className="block px-4 py-2 text-[10px] font-mono uppercase tracking-wider text-secondary hover:bg-surface-muted hover:text-primary border-t border-border/40 transition-colors"
                >
                  Pinterest Feed
                </a>
                <a
                  href="/api/admin/export/meta"
                  download="meta_feed.csv"
                  className="block px-4 py-2 text-[10px] font-mono uppercase tracking-wider text-secondary hover:bg-surface-muted hover:text-primary border-t border-border/40 transition-colors"
                >
                  Meta Feed
                </a>
                <a
                  href="/api/admin/export/amazon"
                  download="amazon_listing_feed.xlsm"
                  className="block px-4 py-2 text-[10px] font-mono uppercase tracking-wider text-secondary hover:bg-surface-muted hover:text-primary border-t border-border/40 transition-colors"
                >
                  Amazon Feed
                </a>
                <button
                  type="button"
                  onClick={() => setIsFlipkartModalOpen(true)}
                  className="w-full text-left block px-4 py-2 text-[10px] font-mono uppercase tracking-wider text-secondary hover:bg-surface-muted hover:text-primary border-t border-border/40 transition-colors cursor-pointer"
                >
                  Flipkart Feed
                </button>
                <a
                  href="/api/admin/export/indiamart"
                  download="indiamart_catalog.csv"
                  className="block px-4 py-2 text-[10px] font-mono uppercase tracking-wider text-secondary hover:bg-surface-muted hover:text-primary border-t border-border/40 transition-colors"
                >
                  IndiaMART Feed
                </a>
              </div>
            </div>

            <Link
              href="/products/import"
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-secondary border border-border px-4 py-2.5 hover:bg-surface-muted hover:text-primary transition-colors bg-background rounded-sm flex items-center"
            >
              Import CSV
            </Link>
            <SyncButton label="Sync All" />
          </div>
        </div>
      </div>

      {/* Summary Health Strip */}
      <section
        aria-label="Catalog summary"
        className="grid grid-cols-2 lg:grid-cols-3 gap-3"
      >
        {stats.lowStock > 0 && (
          <button
            onClick={() => setChipFilter("LOW_STOCK")}
            className={`text-left p-4 rounded-lg border transition-all cursor-pointer ${
              chipFilter === "LOW_STOCK"
                ? "bg-[#D6A24A]/15 border-[#D6A24A]"
                : "bg-surface border-[#D6A24A]/40 hover:border-[#D6A24A]"
            }`}
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#D6A24A] font-semibold block mb-1">
              Low Stock
            </span>
            <div className="font-serif text-[26px] font-normal text-[#D6A24A] leading-none">
              {stats.lowStock}
            </div>
            <span className="font-mono text-[10px] text-[#D6A24A]/80 mt-1.5 block">
              below 5 units in inventory
            </span>
          </button>
        )}

        {stats.anomaly > 0 && (
          <button
            onClick={() => setChipFilter("ANOMALY")}
            className={`text-left p-4 rounded-lg border transition-all cursor-pointer ${
              chipFilter === "ANOMALY"
                ? "bg-[#C97E6A]/20 border-[#C97E6A]"
                : "bg-surface border-[#C97E6A]/40 hover:border-[#C97E6A]"
            }`}
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#C97E6A] font-semibold block mb-1">
              Price Anomalies
            </span>
            <div className="font-serif text-[26px] font-normal text-[#C97E6A] leading-none">
              {stats.anomaly}
            </div>
            <span className="font-mono text-[10px] text-[#C97E6A]/80 mt-1.5 block">
              B2B &gt; D2C or price &lt; ₹600
            </span>
          </button>
        )}

        {stats.outOfStock > 0 && (
          <button
            onClick={() => setChipFilter("OUT_OF_STOCK")}
            className={`text-left p-4 rounded-lg border transition-all cursor-pointer ${
              chipFilter === "OUT_OF_STOCK"
                ? "bg-surface-muted/60 border-primary"
                : "bg-surface border-border hover:border-border-strong"
            }`}
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted block mb-1">
              Out of Stock
            </span>
            <div className="font-serif text-[26px] font-normal text-secondary leading-none">
              {stats.outOfStock}
            </div>
            <span className="font-mono text-[10px] text-muted mt-1.5 block">
              0 units available
            </span>
          </button>
        )}
      </section>

      {/* Main Table & Filter Container */}
      <div className="premium-card flex flex-col overflow-hidden rounded-lg">
        {/* Controls: Search and Filters */}
        <div className="p-4 md:p-6 border-b border-border flex flex-wrap gap-4 bg-surface-muted/40 items-center justify-between">
          <div className="flex-1 min-w-[260px] flex items-center gap-2 border border-border bg-background px-3.5 py-2 rounded-sm focus-within:border-accent">
            <Search
              className="w-3.5 h-3.5 text-muted shrink-0"
              aria-hidden="true"
            />
            <label htmlFor="productSearchInput" className="sr-only">
              Search products by name or SKU
            </label>
            <input
              id="productSearchInput"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Product Name, SKU, or Category..."
              className="bg-transparent text-primary font-mono text-[12px] focus:outline-none focus-visible:outline-none w-full placeholder:text-muted/60"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="text-muted hover:text-primary font-mono text-[10px] uppercase cursor-pointer"
                aria-label="Clear search query"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div>
              <label htmlFor="categorySelectFilter" className="sr-only">
                Filter by Category
              </label>
              <select
                id="categorySelectFilter"
                value={selectedCategory}
                aria-label="Filter by Category"
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-border bg-background text-secondary font-mono text-[11px] uppercase tracking-wider focus:outline-none focus:border-accent transition-colors cursor-pointer rounded-sm"
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="statusSelectFilter" className="sr-only">
                Filter by Status
              </label>
              <select
                id="statusSelectFilter"
                value={selectedStatus}
                aria-label="Filter by Status"
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-border bg-background text-secondary font-mono text-[11px] uppercase tracking-wider focus:outline-none focus:border-accent transition-colors cursor-pointer rounded-sm"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="OUT_OF_STOCK">Out of Stock</option>
              </select>
            </div>
          </div>

          {/* Quick Filter Chips */}
          <div className="w-full flex items-center gap-2 pt-2 border-t border-border/30">
            <span className="font-mono text-[9px] uppercase tracking-widest text-muted">
              Quick Triage:
            </span>
            <button
              onClick={() => setChipFilter("ALL")}
              className={`px-3 py-1 rounded-full font-mono text-[10px] uppercase tracking-wider transition-all cursor-pointer ${
                chipFilter === "ALL"
                  ? "bg-accent/20 text-accent border border-accent/40 font-semibold"
                  : "bg-surface-muted text-muted border border-border hover:text-primary"
              }`}
            >
              All ({stats.total})
            </button>
            <button
              onClick={() => setChipFilter("LOW_STOCK")}
              className={`px-3 py-1 rounded-full font-mono text-[10px] uppercase tracking-wider transition-all cursor-pointer ${
                chipFilter === "LOW_STOCK"
                  ? "bg-[#D6A24A]/20 text-[#D6A24A] border border-[#D6A24A]/40 font-semibold"
                  : "bg-surface-muted text-muted border border-border hover:text-primary"
              }`}
            >
              Low Stock ({stats.lowStock})
            </button>
            <button
              onClick={() => setChipFilter("ANOMALY")}
              className={`px-3 py-1 rounded-full font-mono text-[10px] uppercase tracking-wider transition-all cursor-pointer ${
                chipFilter === "ANOMALY"
                  ? "bg-[#C97E6A]/20 text-[#C97E6A] border border-[#C97E6A]/40 font-semibold"
                  : "bg-surface-muted text-muted border border-border hover:text-primary"
              }`}
            >
              Price Anomaly ({stats.anomaly})
            </button>
            <button
              onClick={() => setChipFilter("OUT_OF_STOCK")}
              className={`px-3 py-1 rounded-full font-mono text-[10px] uppercase tracking-wider transition-all cursor-pointer ${
                chipFilter === "OUT_OF_STOCK"
                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/40 font-semibold"
                  : "bg-surface-muted text-muted border border-border hover:text-primary"
              }`}
            >
              Out of Stock ({stats.outOfStock})
            </button>
            <div className="flex items-center gap-2 md:ml-auto">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded text-[10px] font-mono ${currentPage === 1 ? "bg-surface text-muted cursor-not-allowed" : "bg-accent text-black hover:bg-accent-hover"} transition-colors`}
              >
                Prev
              </button>
              <span className="font-mono text-[10px]">
                Page {currentPage} of{" "}
                {Math.ceil(filteredProducts.length / itemsPerPage)}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((p) =>
                    Math.min(
                      p + 1,
                      Math.ceil(filteredProducts.length / itemsPerPage),
                    ),
                  )
                }
                disabled={
                  currentPage >=
                  Math.ceil(filteredProducts.length / itemsPerPage)
                }
                className={`px-3 py-1 rounded text-[10px] font-mono ${currentPage >= Math.ceil(filteredProducts.length / itemsPerPage) ? "bg-surface text-muted cursor-not-allowed" : "bg-accent text-black hover:bg-accent-hover"} transition-colors`}
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Table View (Visible on desktop: md:block) */}
        <div className="hidden md:block table-responsive flex-1">
          <table className="w-full text-left border-collapse">
            <caption className="sr-only">
              Product catalog with pricing, stock, and sync status
            </caption>
            <thead className="border-b border-border bg-surface-muted/20">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3.5 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal"
                >
                  Product
                </th>
                <th
                  scope="col"
                  className="px-6 py-3.5 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal"
                >
                  SKU
                </th>
                <th
                  scope="col"
                  className="px-6 py-3.5 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal text-right"
                >
                  D2C Price
                </th>
                <th
                  scope="col"
                  className="px-6 py-3.5 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal text-right"
                >
                  B2B Base Price
                </th>
                <th
                  scope="col"
                  className="px-6 py-3.5 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal text-right"
                >
                  Stock
                </th>
                <th
                  scope="col"
                  className="px-6 py-3.5 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3.5 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal text-right"
                >
                  Direct Action &amp; Sync
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {paginatedProducts.map((product) => {
                const isOutOfStock = product.stockQuantity <= 0;
                const isLowStock =
                  product.stockQuantity > 0 && product.stockQuantity < 5;
                const isAnomaly =
                  product.b2bPrice > product.d2cPrice || product.d2cPrice < 600;

                const rowBgClass = isAnomaly
                  ? "bg-[#C97E6A]/10 border-l-2 border-l-[#C97E6A] hover:bg-[#C97E6A]/20"
                  : "hover:bg-surface-muted/40";

                return (
                  <ClickableRow
                    key={product.id}
                    href={`/products/${product.id}/edit`}
                    className={`transition-colors ${rowBgClass}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3.5">
                        <div className="relative w-10 h-12 bg-background border border-border flex items-center justify-center font-mono text-[8px] text-muted tracking-widest text-center shrink-0 overflow-hidden rounded-sm">
                          {product.images?.[0] ||
                          product.whiteBackgroundImages?.[0] ? (
                            <img
                              src={
                                product.images?.[0] ||
                                product.whiteBackgroundImages?.[0]
                              }
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            "IMG"
                          )}
                        </div>
                        <div>
                          <div className="font-serif text-[16px] text-primary flex items-center gap-2">
                            <Link
                              href={`/products/${product.id}/edit`}
                              className="hover:text-accent font-serif text-[16px] text-primary"
                            >
                              {product.name}
                            </Link>
                            {isAnomaly && (
                              <span
                                className="text-[10px] font-mono text-[#C97E6A] bg-[#C97E6A]/15 border border-[#C97E6A]/30 px-1.5 py-0.5 rounded"
                                title="Price Anomaly: B2B > D2C or price < ₹600"
                              >
                                ⚠️ Anomaly
                              </span>
                            )}
                          </div>
                          <div className="font-mono text-[9px] text-muted mt-0.5 tracking-wider uppercase">
                            {product.category?.name || "Uncategorized"}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 font-mono text-[12px] text-secondary">
                      {product.sku}
                    </td>

                    <td
                      className={`px-6 py-4 font-mono text-[13px] text-right tabular-nums ${isAnomaly ? "text-[#C97E6A] font-bold" : "text-emerald-400"}`}
                    >
                      ₹{product.d2cPrice.toLocaleString("en-IN")}
                    </td>

                    <td className="px-6 py-4 font-mono text-[13px] text-secondary text-right tabular-nums">
                      ₹{product.b2bPrice.toLocaleString("en-IN")}
                    </td>

                    <td
                      className={`px-6 py-4 font-mono text-[13px] text-right tabular-nums ${isOutOfStock ? "text-rose-500 font-bold" : isLowStock ? "text-[#D6A24A] font-semibold" : "text-primary"}`}
                    >
                      {product.stockQuantity}
                      {isLowStock && (
                        <span className="block text-[9px] text-[#D6A24A] font-mono">
                          Low Stock
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      {isOutOfStock ? (
                        <span className="status-pill status-pending">
                          <span className="dot" aria-hidden="true" />
                          <span>Out of Stock</span>
                        </span>
                      ) : (
                        <span className="status-pill status-paid">
                          <span className="dot" aria-hidden="true" />
                          <span>Active</span>
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Direct Action: EDIT */}
                        <Link
                          href={`/products/${product.id}/edit`}
                          className="px-3 py-1.5 border border-accent/40 text-accent hover:bg-accent/15 transition-all font-mono text-[10px] uppercase tracking-wider rounded-sm font-semibold flex items-center gap-1 cursor-pointer no-underline"
                          aria-label={`Edit ${product.name}`}
                        >
                          <span aria-hidden="true">✏️</span>
                          <span>Edit</span>
                        </Link>

                        {/* Secondary Options */}
                        <ActionDropdown
                          productId={product.id}
                          sku={product.sku}
                          slug={product.slug}
                        />
                      </div>
                    </td>
                  </ClickableRow>
                );
              })}

              {filteredProducts.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-muted font-mono text-[11px] uppercase tracking-widest"
                  >
                    No matching products found in catalog.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Stacked Card View (Visible on mobile: md:hidden) */}
        <div className="block md:hidden p-4 space-y-3">
          {filteredProducts.map((product) => {
            const isOutOfStock = product.stockQuantity <= 0;
            const isLowStock =
              product.stockQuantity > 0 && product.stockQuantity < 5;
            const isAnomaly =
              product.b2bPrice > product.d2cPrice || product.d2cPrice < 600;

            return (
              <div
                key={product.id}
                className={`p-4 border rounded-lg space-y-3 ${isAnomaly ? "bg-[#C97E6A]/15 border-[#C97E6A]" : "bg-surface border-border"}`}
              >
                {/* Top: Image + Name + SKU */}
                <div className="flex items-start gap-3">
                  <div className="relative w-12 h-14 bg-background border border-border flex items-center justify-center font-mono text-[9px] text-muted shrink-0 overflow-hidden rounded-sm">
                    {product.images?.[0] ||
                    product.whiteBackgroundImages?.[0] ? (
                      <img
                        src={
                          product.images?.[0] ||
                          product.whiteBackgroundImages?.[0]
                        }
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      "IMG"
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-serif text-[16px] text-primary m-0 truncate">
                      {product.name}
                    </h2>
                    <p className="font-mono text-[11px] text-muted m-0 mt-0.5">
                      SKU: {product.sku} ·{" "}
                      {product.category?.name || "Uncategorized"}
                    </p>
                    {isAnomaly && (
                      <span className="inline-block text-[9px] font-mono text-[#C97E6A] bg-[#C97E6A]/20 border border-[#C97E6A]/40 px-1.5 py-0.5 rounded mt-1">
                        ⚠️ Price Anomaly
                      </span>
                    )}
                  </div>
                </div>

                {/* Grid: Pricing & Stock Chips */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/40 font-mono text-center">
                  <div className="bg-surface-muted/50 p-2 rounded-sm border border-border/30">
                    <span className="text-[9px] text-muted uppercase tracking-wider block">
                      D2C Price
                    </span>
                    <span className="text-[12px] text-primary font-semibold">
                      ₹{product.d2cPrice.toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="bg-surface-muted/50 p-2 rounded-sm border border-border/30">
                    <span className="text-[9px] text-muted uppercase tracking-wider block">
                      B2B Base
                    </span>
                    <span
                      className={`text-[12px] font-semibold ${isAnomaly ? "text-[#C97E6A]" : "text-emerald-400"}`}
                    >
                      ₹{product.b2bPrice.toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="bg-surface-muted/50 p-2 rounded-sm border border-border/30">
                    <span className="text-[9px] text-muted uppercase tracking-wider block">
                      Stock
                    </span>
                    <span
                      className={`text-[12px] font-semibold ${isOutOfStock ? "text-rose-500" : isLowStock ? "text-[#D6A24A]" : "text-primary"}`}
                    >
                      {product.stockQuantity}
                    </span>
                  </div>
                </div>

                {/* Bottom Actions Bar */}
                <div className="flex items-center justify-between pt-2 border-t border-border/40 gap-2">
                  <div>
                    {isOutOfStock ? (
                      <span className="status-pill status-pending">
                        <span className="dot" aria-hidden="true" />
                        <span>Out of Stock</span>
                      </span>
                    ) : (
                      <span className="status-pill status-paid">
                        <span className="dot" aria-hidden="true" />
                        <span>Active</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/products/${product.id}/edit`}
                      className="px-4 py-2 bg-accent text-black hover:bg-accent-hover font-mono text-[10px] uppercase tracking-wider rounded-sm font-bold cursor-pointer no-underline min-h-[44px] flex items-center"
                    >
                      Edit Product
                    </Link>
                    <ActionDropdown
                      productId={product.id}
                      sku={product.sku}
                      slug={product.slug}
                    />
                  </div>
                </div>
              </div>
            );
          })}

          {filteredProducts.length === 0 && (
            <div className="p-8 text-center text-muted font-mono text-[11px] uppercase tracking-widest bg-surface border border-border rounded-lg">
              No matching products found.
            </div>
          )}
        </div>

        {/* Table Footer / Pagination */}
        <div className="p-4 md:p-6 border-t border-border flex justify-between items-center bg-background/50">
          <span className="font-mono text-[11px] tracking-wider text-muted">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of{" "}
            {filteredProducts.length} catalog items
          </span>
          <div className="flex gap-2">
            <button
              className="px-4 py-2 border border-border text-[10px] font-mono tracking-widest uppercase text-muted bg-background disabled:opacity-50 min-h-[36px] rounded-sm cursor-pointer disabled:cursor-not-allowed hover:text-primary transition-colors"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              aria-label="Previous page"
            >
              Prev
            </button>
            <button
              className="px-4 py-2 border border-border text-[10px] font-mono tracking-widest uppercase text-muted bg-background disabled:opacity-50 min-h-[36px] rounded-sm cursor-pointer disabled:cursor-not-allowed hover:text-primary transition-colors"
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages || totalPages === 0}
              aria-label="Next page"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Flipkart Feed Export Modal */}
      {isFlipkartModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-surface border border-border w-full max-w-md p-6 rounded-md shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block" />
                <h3 className="font-mono text-xs uppercase tracking-[0.14em] text-primary font-bold">
                  Export Flipkart Bulk Feed
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFlipkartModalOpen(false)}
                className="text-secondary hover:text-primary text-sm font-mono p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-secondary leading-relaxed">
              Generate a formatted bulk listing template for Flipkart Seller Hub
              upload. Choose whether you want to export only unlisted SKUs or
              your full product catalog.
            </p>

            {/* Switch / Toggle Options */}
            <div className="space-y-3 bg-surface-muted p-4 rounded-sm border border-border/50">
              <label className="text-[10px] font-mono uppercase tracking-wider text-secondary font-semibold block mb-1">
                Products Scope:
              </label>

              <label className="flex items-center justify-between cursor-pointer group py-1">
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="flipkartFilter"
                    checked={flipkartExportFilter === "unlisted"}
                    onChange={() => setFlipkartExportFilter("unlisted")}
                    className="accent-primary h-4 w-4 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-medium text-primary block">
                      Only Unlisted Products
                    </span>
                    <span className="text-[10px] text-secondary">
                      Products needing creation on Flipkart Seller Hub
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded border border-yellow-500/20 font-bold">
                  Recommended
                </span>
              </label>

              <div className="border-t border-border/30 my-2" />

              <label className="flex items-center justify-between cursor-pointer group py-1">
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="flipkartFilter"
                    checked={flipkartExportFilter === "all"}
                    onChange={() => setFlipkartExportFilter("all")}
                    className="accent-primary h-4 w-4 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-medium text-primary block">
                      All Products
                    </span>
                    <span className="text-[10px] text-secondary">
                      Export full store catalog
                    </span>
                  </div>
                </div>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsFlipkartModalOpen(false)}
                className="font-mono text-[10px] uppercase tracking-wider text-secondary hover:text-primary px-4 py-2 border border-border rounded-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <a
                href={`/api/admin/export/flipkart?filter=${flipkartExportFilter}`}
                download={`flipkart_listing_feed_${flipkartExportFilter}.xls`}
                onClick={() => setIsFlipkartModalOpen(false)}
                className="font-mono text-[10px] uppercase tracking-wider bg-primary text-primary-foreground font-bold px-4 py-2 rounded-sm hover:opacity-90 transition-opacity flex items-center gap-2"
              >
                <span>Download Feed</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
