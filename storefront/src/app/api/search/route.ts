import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() || "";

    if (!q || q.length < 2) {
      return NextResponse.json({
        products: [],
        categories: [],
        spaces: [],
        blogs: [],
      });
    }

    // Query Products, Categories, Spaces, and Blogs in parallel using correct Prisma schema fields
    const [products, categories, spaces, blogs] = await Promise.all([
      prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { sku: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            { category: { name: { contains: q, mode: "insensitive" } } },
          ],
        },
        take: 10,
        select: {
          id: true,
          name: true,
          slug: true,
          sku: true,
          images: true,
          mrp: true,
          d2cPrice: true,
          b2bPrice: true,
          stockQuantity: true,
          category: { select: { id: true, name: true, slug: true } },
        },
      }),

      prisma.category.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 4,
        select: {
          id: true,
          name: true,
          slug: true,
          image: true,
        },
      }),

      prisma.space.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 4,
        select: {
          id: true,
          name: true,
          slug: true,
          image: true,
        },
      }),

      prisma.blogPost.findMany({
        where: {
          isDraft: false,
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { excerpt: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 3,
        select: {
          id: true,
          title: true,
          slug: true,
          featuredImg: true,
          publishedAt: true,
        },
      }),
    ]);

    // Format products for frontend consumption
    const formattedProducts = products.map((p) => {
      const primaryImage =
        Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : null;
      return {
        id: p.id,
        name: p.name,
        slug: p.slug || p.id,
        sku: p.sku,
        price: p.d2cPrice || p.mrp || 0,
        mrp: p.mrp,
        imageUrl: primaryImage,
        categoryName: p.category?.name || "Catalog",
        inStock: (p.stockQuantity || 0) > 0,
        b2bPrice: p.b2bPrice,
      };
    });

    return NextResponse.json(
      {
        products: formattedProducts,
        categories: categories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          imageUrl: c.image,
          url: `/collections?category=${c.slug}`,
        })),
        spaces: spaces.map((s) => ({
          id: s.id,
          name: s.name,
          slug: s.slug,
          imageUrl: s.image,
          url: `/spaces?space=${s.slug}`,
        })),
        blogs: blogs.map((b) => ({
          id: b.id,
          title: b.title,
          slug: b.slug,
          imageUrl: b.featuredImg,
          url: `/blog/${b.slug}`,
        })),
      },
      {
        headers: {
          "Cache-Control": "public, max-age=60, s-maxage=120",
        },
      },
    );
  } catch (error: any) {
    console.error("Error in GET /api/search:", error);
    return NextResponse.json(
      { error: error.message || "Failed to search catalog" },
      { status: 500 },
    );
  }
}
