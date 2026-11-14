import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/ProductCard";
import SearchBarInput from "./SearchBarInput";
import { Search, ArrowRight, PackageX, Sparkles, Filter } from "lucide-react";

export const dynamic = "force-dynamic";

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    sort?: string;
    inStock?: string;
  }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q = "", sort = "featured", inStock } = await searchParams;
  const searchTerm = q.trim();

  let products: any[] = [];
  let categories: any[] = [];
  let spaces: any[] = [];

  if (searchTerm) {
    let orderByClause: any = { createdAt: "desc" };
    if (sort === "price-asc") orderByClause = { d2cPrice: "asc" };
    if (sort === "price-desc") orderByClause = { d2cPrice: "desc" };
    if (sort === "name-asc") orderByClause = { name: "asc" };

    const whereClause: any = {
      OR: [
        { name: { contains: searchTerm, mode: "insensitive" } },
        { sku: { contains: searchTerm, mode: "insensitive" } },
        { description: { contains: searchTerm, mode: "insensitive" } },
        { category: { name: { contains: searchTerm, mode: "insensitive" } } },
      ],
    };

    if (inStock === "true") {
      whereClause.stockQuantity = { gt: 0 };
    }

    const [dbProducts, dbCategories, dbSpaces] = await Promise.all([
      prisma.product.findMany({
        where: whereClause,
        orderBy: orderByClause,
        take: 40,
        include: {
          category: { select: { id: true, name: true, slug: true } },
        },
      }),
      prisma.category.findMany({
        where: {
          name: { contains: searchTerm, mode: "insensitive" },
        },
        take: 6,
      }),
      prisma.space.findMany({
        where: {
          name: { contains: searchTerm, mode: "insensitive" },
        },
        take: 6,
      }),
    ]);

    products = dbProducts;
    categories = dbCategories;
    spaces = dbSpaces;
  }

  // Fallback featured recommendations if no search results found
  const featuredProducts =
    products.length === 0 && searchTerm
      ? await prisma.product.findMany({
          take: 4,
          orderBy: { createdAt: "desc" },
          include: {
            category: { select: { id: true, name: true, slug: true } },
          },
        })
      : [];

  return (
    <main
      className="min-h-screen pt-24 pb-16 px-4 sm:px-8 lg:px-12 w-full max-w-7xl mx-auto"
      style={{ background: "var(--obsidian)" }}
    >
      {/* Search Header Banner */}
      <div className="mb-10 text-center max-w-2xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[rgba(196,160,90,0.1)] border border-[rgba(196,160,90,0.25)] text-xs font-mono text-[var(--gold)] uppercase tracking-widest">
          <Search size={14} /> Catalog Search
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-medium text-[var(--cream)]">
          {searchTerm ? (
            <>
              Search Results for{" "}
              <span className="text-[var(--gold)] italic">
                &ldquo;{searchTerm}&rdquo;
              </span>
            </>
          ) : (
            "Explore Luxury Catalog"
          )}
        </h1>
        <p className="text-sm text-[var(--text-muted)]">
          {searchTerm
            ? `Found ${products.length} product${
                products.length === 1 ? "" : "s"
              } matching your query.`
            : "Search through our handcrafted lighting, chandeliers, wall sconces, and architectural fixtures."}
        </p>

        {/* Client Interactive Search Input */}
        <div className="pt-2">
          <SearchBarInput initialQuery={searchTerm} />
        </div>
      </div>

      {/* Matching Categories or Spaces Pills */}
      {(categories.length > 0 || spaces.length > 0) && (
        <div className="mb-10 p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm">
          <div className="text-xs font-mono uppercase tracking-wider text-[var(--gold)] mb-3 font-semibold">
            Matching Collections &amp; Spaces
          </div>
          <div className="flex flex-wrap gap-2.5">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/collections?category=${c.slug}`}
                className="px-4 py-2 rounded-xl bg-[var(--surface2)] border border-[var(--border)] text-xs font-medium text-[var(--cream)] hover:text-[var(--gold)] hover:border-[var(--border-gold)] transition-colors flex items-center gap-1.5 text-decoration-none"
              >
                <span>{c.name}</span>
                <ArrowRight size={13} className="text-[var(--gold)]" />
              </Link>
            ))}
            {spaces.map((s) => (
              <Link
                key={s.id}
                href={`/spaces?space=${s.slug}`}
                className="px-4 py-2 rounded-xl bg-[var(--surface2)] border border-[var(--border)] text-xs font-medium text-[var(--cream)] hover:text-[var(--gold)] hover:border-[var(--border-gold)] transition-colors flex items-center gap-1.5 text-decoration-none"
              >
                <span>Space: {s.name}</span>
                <ArrowRight size={13} className="text-[var(--gold)]" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Main Results Grid */}
      {products.length > 0 ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[var(--border)] text-xs font-mono text-[var(--text-muted)]">
            <div>
              Showing{" "}
              <span className="text-[var(--cream)] font-bold">
                {products.length}
              </span>{" "}
              items
            </div>
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-[var(--gold)]" />
              <Link
                href={`/search?q=${encodeURIComponent(searchTerm)}&inStock=${
                  inStock === "true" ? "false" : "true"
                }`}
                className={`px-3 py-1 rounded-lg border text-xs font-mono transition-colors text-decoration-none ${
                  inStock === "true"
                    ? "bg-[var(--gold)] text-black border-[var(--gold)] font-bold"
                    : "border-[var(--border)] text-[var(--text-muted)] hover:text-white"
                }`}
              >
                In Stock Only
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      ) : searchTerm ? (
        /* Empty State */
        <div className="py-16 text-center bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-8 max-w-xl mx-auto shadow-xl">
          <div className="w-16 h-16 rounded-full bg-[rgba(196,160,90,0.1)] border border-[rgba(196,160,90,0.3)] flex items-center justify-center text-[var(--gold)] mx-auto mb-4">
            <PackageX size={28} />
          </div>
          <h3 className="text-xl font-serif text-[var(--cream)] font-medium mb-2">
            No matching products found
          </h3>
          <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto mb-6">
            We couldn&apos;t find any items matching &ldquo;{searchTerm}&rdquo;.
            Try checking for typos or using broader keywords like
            &ldquo;chandelier&rdquo;, &ldquo;sconce&rdquo;, or
            &ldquo;brass&rdquo;.
          </p>

          {featuredProducts.length > 0 && (
            <div className="pt-6 border-t border-[var(--border)] text-left">
              <div className="text-xs font-mono uppercase tracking-wider text-[var(--gold)] mb-4 flex items-center gap-1.5 font-semibold">
                <Sparkles size={14} /> Recommended Signature Pieces
              </div>
              <div className="grid grid-cols-2 gap-4">
                {featuredProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Default Empty Prompt */
        <div className="py-20 text-center text-[var(--text-muted)] text-sm font-mono">
          Type a product name, SKU code, or category in the search bar above to
          begin.
        </div>
      )}
    </main>
  );
}
