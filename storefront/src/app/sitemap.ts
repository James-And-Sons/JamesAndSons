import { MetadataRoute } from "next";
import { prisma } from "@james-andsons/db";

export const revalidate = 86400; // Revalidate sitemap daily (24 hours)

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_STOREFRONT_URL || "https://jamesandsons.in";
  const cleanBase = baseUrl.replace(/\/+$/, "");

  // 1. Static Pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${cleanBase}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${cleanBase}/products`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${cleanBase}/collections`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${cleanBase}/spaces`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${cleanBase}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${cleanBase}/b2b`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${cleanBase}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  // 2. Dynamic Product Pages
  let productPages: MetadataRoute.Sitemap = [];
  try {
    const products = await prisma.product.findMany({
      select: {
        slug: true,
        updatedAt: true,
      },
    });

    productPages = products.map((p) => ({
      url: `${cleanBase}/products/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    }));
  } catch (err) {
    console.error("Failed to fetch products for sitemap:", err);
  }

  // 3. Dynamic Category Pages
  let categoryPages: MetadataRoute.Sitemap = [];
  try {
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        slug: true,
      },
    });

    categoryPages = categories.map((c) => ({
      url: `${cleanBase}/collections/${c.slug || c.id}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    }));
  } catch (err) {
    console.error("Failed to fetch categories for sitemap:", err);
  }

  // 4. Dynamic Blog Post Pages
  let blogPages: MetadataRoute.Sitemap = [];
  try {
    const blogPosts = await prisma.blogPost.findMany({
      where: { isDraft: false },
      select: {
        slug: true,
        updatedAt: true,
      },
    });

    blogPages = blogPosts.map((b) => ({
      url: `${cleanBase}/blog/${b.slug}`,
      lastModified: b.updatedAt,
      changeFrequency: "monthly",
      priority: 0.6,
    }));
  } catch (err) {
    console.error("Failed to fetch blog posts for sitemap:", err);
  }

  return [...staticPages, ...productPages, ...categoryPages, ...blogPages];
}
