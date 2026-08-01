import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
import { formatPrice } from "@/lib/utils";
import PDPClient from "./PDPClient";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/utils/supabase/server";
import type { Metadata } from "next";

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const params = await props.params;

  let product = null;
  try {
    product = await prisma.product.findUnique({
      where: { slug: params.slug },
      select: {
        name: true,
        description: true,
        d2cPrice: true,
        images: true,
        whiteBackgroundImages: true,
        category: { select: { name: true } },
      },
    });
  } catch (error) {
    console.error(`Error fetching product metadata for ${params.slug}:`, error);
  }

  if (!product) return {};

  const title = `${product.name} | James & Sons`;
  const rawDesc =
    product.description ||
    `Discover ${product.name} at James & Sons. Luxury handcrafted lighting for grand architectural spaces.`;
  const description =
    rawDesc.length > 155 ? rawDesc.substring(0, 152) + "..." : rawDesc;

  let rawImg =
    product.images?.[0] ||
    product.whiteBackgroundImages?.[0] ||
    "https://jamesandsons.in/images/logo-dark.png";

  // Ensure full absolute HTTPS URL
  let imageUrl = rawImg;
  if (!imageUrl.startsWith("http://") && !imageUrl.startsWith("https://")) {
    imageUrl = `https://jamesandsons.in${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
  }

  // Optimize Cloudinary URLs specifically for WhatsApp & social link crawlers:
  // - 1200x630 dimension with crop fill
  // - JPEG format with auto quality (payload guaranteed < 300 KB for WhatsApp crawler)
  if (imageUrl.includes("res.cloudinary.com")) {
    if (imageUrl.includes("/upload/")) {
      imageUrl = imageUrl.replace(
        /\/upload\/(?:[^\/]+\/)?/,
        "/upload/f_jpg,q_auto:good,w_1200,h_630,c_fill/",
      );
    }
  }

  const pageUrl = `https://jamesandsons.in/products/${params.slug}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: "James & Sons",
      images: [
        {
          url: imageUrl,
          secureUrl: imageUrl,
          width: 1200,
          height: 630,
          alt: product.name,
          type: "image/jpeg",
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function ProductPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;

  // Determine B2B status
  let isB2B = false;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (user) {
      const meta = user.user_metadata || {};
      const dbUser = await prisma.user
        .findUnique({ where: { id: user.id } })
        .catch(() => null);
      isB2B =
        dbUser?.role === "B2B_BUYER" ||
        dbUser?.role === "B2B_APPROVER" ||
        meta.accountType === "business";
    }
  } catch (error) {
    console.error("Error checking B2B status on PDP:", error);
  }

  let product;
  try {
    product = await prisma.product.findUnique({
      where: { slug: params.slug },
      include: {
        category: true,
        spaces: true,
        variants: { orderBy: { createdAt: "asc" } },
      },
    });
  } catch (error) {
    console.error(`Error fetching product with slug ${params.slug}:`, error);
    product = null;
  }

  if (!product) return notFound();

  let related: any[] = [];
  try {
    related = await prisma.product.findMany({
      where: { categoryId: product.categoryId, id: { not: product.id } },
      take: 4,
    });
  } catch (error) {
    console.error("Error fetching related products:", error);
  }

  return (
    <>
      <main
        className="pdp-main pt-14 md:pt-16 min-h-screen"
        style={{ background: "var(--obsidian)" }}
      >
        <PDPClient
          product={product as any}
          variants={product.variants as any}
          isB2B={isB2B}
        />

        {/* Related Products */}
        {related.length > 0 && (
          <section
            className="section"
            style={{
              borderTop: "1px solid var(--border)",
              padding: "40px 0 0",
            }}
          >
            <div
              className="section-header"
              style={{ padding: "0 16px", marginBottom: "20px" }}
            >
              <div>
                <div className="section-label">From the Same Collection</div>
                <h2
                  className="section-title"
                  style={{ fontSize: "clamp(24px, 4vw, 32px)" }}
                >
                  You May Also <em>Love</em>
                </h2>
              </div>
              <Link href="/collections" className="link-all">
                View All →
              </Link>
            </div>

            {/* Mobile Scroll — Edge-to-Edge Experience */}
            <div
              className="flex md:hidden"
              style={{
                gap: "12px",
                overflowX: "auto",
                scrollSnapType: "x mandatory",
                WebkitOverflowScrolling: "touch",
                padding: "0 0 28px 16px",
                scrollbarWidth: "none",
              }}
            >
              {related.map((p: any) => (
                <Link
                  key={p.id}
                  href={`/products/${p.slug}`}
                  style={{
                    flexShrink: 0,
                    width: "56vw",
                    maxWidth: "220px",
                    textDecoration: "none",
                    scrollSnapAlign: "start",
                    display: "block",
                  }}
                >
                  <div
                    style={{
                      aspectRatio: "3/4",
                      borderRadius: "12px",
                      overflow: "hidden",
                      position: "relative",
                      marginBottom: "10px",
                      background: "var(--surface)",
                      border: "0.5px solid var(--border)",
                    }}
                  >
                    {p.images?.[0] ? (
                      <Image
                        src={p.images[0]}
                        alt={p.name}
                        fill
                        style={{ objectFit: "cover" }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <i
                          className="ti ti-lamp"
                          style={{
                            fontSize: "32px",
                            color: "var(--gold)",
                            opacity: 0.2,
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <div style={{ padding: "0 4px 4px" }}>
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: 500,
                        color: "var(--cream)",
                        lineHeight: 1.3,
                        marginBottom: "4px",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {p.name}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "var(--gold-light)",
                        opacity: 0.8,
                      }}
                    >
                      {formatPrice(p.d2cPrice)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Desktop Grid */}
            <div className="hidden md:block">
              <div className="product-grid" style={{ padding: "0 40px" }}>
                {related.map((p: any) => (
                  <Link
                    key={p.id}
                    href={`/products/${p.slug}`}
                    className="product-card"
                    style={{
                      display: "block",
                      textDecoration: "none",
                      color: "inherit",
                    }}
                  >
                    <div className="product-img">
                      <div className="product-img-bg" />
                      {p.images?.[0] ? (
                        <img
                          src={p.images[0]}
                          alt={p.name}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <svg
                          className="prod-chandelier-svg"
                          width="120"
                          height="160"
                          viewBox="0 0 100 120"
                          stroke="#C4A05A"
                          fill="none"
                        >
                          <path
                            d="M50 10 L50 40"
                            strokeWidth="1"
                            strokeDasharray="3 3"
                          />
                          <path
                            d="M20 70 Q50 30 80 70"
                            strokeWidth="2"
                            opacity="0.7"
                          />
                          <circle
                            cx="50"
                            cy="95"
                            r="4"
                            fill="#F5E9C8"
                            stroke="none"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="product-info">
                      <div className="product-name">{p.name}</div>
                      <div className="product-meta">
                        <div className="product-price">
                          {formatPrice(p.d2cPrice)}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </>
  );
}
