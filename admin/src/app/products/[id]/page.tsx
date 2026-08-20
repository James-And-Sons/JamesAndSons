import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit3, Globe, Package } from "lucide-react";
import SeoHealthPanelContainer from "../components/seo/SeoHealthPanelContainer";
import { getProductPublicUrl } from "@james-andsons/seo";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin("seo");
  const params = await props.params;

  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: { category: true, variants: true, seoHealth: true },
  });

  if (!product) return notFound();

  const publicUrl = getProductPublicUrl(product.slug);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/products"
            className="p-2 border border-border rounded hover:bg-surface-muted transition-colors text-muted hover:text-primary"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-2xl font-medium text-primary">
                {product.name}
              </h1>
              <span className="font-mono text-xs px-2 py-0.5 bg-surface-muted border border-border rounded text-muted">
                {product.sku}
              </span>
            </div>
            <p className="text-xs font-mono text-muted mt-0.5 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5" /> {product.category.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-border rounded text-[12px] font-mono text-primary hover:bg-surface-muted transition-colors"
          >
            <Globe className="w-3.5 h-3.5" />
            Live Preview
          </a>
          <Link
            href={`/products/${product.id}/edit`}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded text-[12px] font-mono uppercase tracking-wider hover:opacity-90 transition-opacity"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Edit Product
          </Link>
        </div>
      </div>

      {/* Embedded Per-Product SEO & Health Panel */}
      <SeoHealthPanelContainer
        productId={product.id}
        title={product.name}
        description={product.description}
        slug={product.slug}
      />
    </div>
  );
}
