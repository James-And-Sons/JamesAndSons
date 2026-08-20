import { prisma } from "@/lib/prisma";
import NewBlogFormClient from "./NewBlogFormClient";

export const dynamic = "force-dynamic";

export default async function NewBlogPostPage() {
  const rawProducts = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      sku: true,
      category: { select: { name: true } },
      d2cPrice: true,
      images: true,
      whiteBackgroundImages: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  const products = rawProducts.map((p) => ({
    ...p,
    collection: p.category?.name || "Catalog Item",
  }));

  return <NewBlogFormClient products={products} />;
}
