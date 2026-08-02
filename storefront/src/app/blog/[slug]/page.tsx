import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import BlogContentRenderer from "@/components/BlogContentRenderer";
import { formatPrice } from "@/lib/utils";
import { AdaptiveImageFrame } from "@james-andsons/media";

export const dynamic = "force-dynamic";

interface BlogPostPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  let post = null;
  try {
    post = await prisma.blogPost.findUnique({
      where: { slug },
    });
  } catch (error) {
    console.error(`Metadata fetch error:`, error);
  }

  if (!post) return {};

  const title = post.metaTitle || `${post.title} | James & Sons`;
  const description = post.metaDesc || post.excerpt || undefined;

  let rawImg =
    post.featuredImg || "https://jamesandsons.in/images/logo-dark.png";
  let imageUrl = rawImg;
  if (!imageUrl.startsWith("http://") && !imageUrl.startsWith("https://")) {
    imageUrl = `https://jamesandsons.in${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
  }

  if (
    imageUrl.includes("res.cloudinary.com") &&
    imageUrl.includes("/upload/")
  ) {
    imageUrl = imageUrl.replace(
      /\/upload\/(?:[^\/]+\/)?/,
      "/upload/f_jpg,q_auto:good,w_1200,h_630,c_fill/",
    );
  }

  const pageUrl = `https://jamesandsons.in/blog/${slug}`;

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
          alt: post.title,
          type: "image/jpeg",
        },
      ],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  let post: any = null;
  try {
    post = await prisma.blogPost.findUnique({
      where: { slug },
      include: { author: true },
    });
  } catch (error) {
    console.error(`Error fetching blog post ${slug}:`, error);
  }

  if (!post || post.isDraft) {
    notFound();
  }

  // Extract all referenced product slugs from shortcodes & image tags
  const matchedSlugs = Array.from(
    (post.content || "").matchAll(
      /\[product:([a-zA-Z0-9-]+)\]|#(?:product:)?([a-zA-Z0-9-]+)/gi,
    ),
  )
    .map((m: any) => (m[1] || m[2]).toLowerCase())
    .filter(Boolean);

  let referencedProducts: any[] = [];
  try {
    if (matchedSlugs.length > 0) {
      referencedProducts = await prisma.product.findMany({
        where: {
          slug: { in: matchedSlugs },
        },
      });
    } else {
      // Fallback: fetch top 3 published products for shoppable recommendations
      referencedProducts = await prisma.product.findMany({
        take: 3,
        orderBy: { createdAt: "desc" },
      });
    }
  } catch (err) {
    console.error("Error fetching blog products:", err);
  }

  const productsMap: Record<string, any> = {};
  referencedProducts.forEach((p) => {
    productsMap[p.slug.toLowerCase()] = p;
  });

  // Parse FAQs & Citations arrays
  const faqs = Array.isArray(post.faq) ? post.faq : [];
  const citations = Array.isArray(post.citations) ? post.citations : [];

  // Assemble dynamic JSON-LD Schema lists
  const schemaList: any[] = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      description: post.metaDesc || post.excerpt || post.title,
      datePublished: post.createdAt,
      dateModified: post.updatedAt,
      author: {
        "@type": "Person",
        name: `${post.author.firstName} ${post.author.lastName}`,
      },
      publisher: {
        "@type": "Organization",
        name: "James & Sons",
        logo: {
          "@type": "ImageObject",
          url: "https://jamesandsons.in/logo.png",
        },
      },
    },
  ];

  if (faqs.length > 0) {
    schemaList.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f: any) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: f.a,
        },
      })),
    });
  }

  return (
    <>
      <main style={{ minHeight: "100vh", background: "var(--obsidian)" }}>
        {/* Inject JSON-LD Schema markup */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaList) }}
        />

        {/* Mobile Layout */}
        <article className="md:hidden" style={{ paddingBottom: "60px" }}>
          <div className="mobile-section-intro" style={{ paddingBottom: "0" }}>
            <div style={{ width: "100%" }}>
              <div style={{ marginBottom: "16px" }}>
                <Link
                  href="/blog"
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "10px",
                    color: "var(--gold)",
                    textDecoration: "none",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  <i className="ti ti-arrow-left"></i> Archive
                </Link>
              </div>
              <div className="section-label" style={{ marginBottom: "4px" }}>
                {new Date(post.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
              <h1
                className="section-title"
                style={{ fontSize: "24px", lineHeight: 1.2 }}
              >
                {post.title}
              </h1>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginTop: "16px",
                }}
              >
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: "var(--surface2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "0.5px solid var(--border)",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "10px",
                      color: "var(--gold)",
                    }}
                  >
                    {post.author.firstName[0]}
                  </span>
                </div>
                <span
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "12px",
                    color: "var(--text-muted)",
                  }}
                >
                  {post.author.firstName} {post.author.lastName}
                </span>
              </div>
            </div>
          </div>

          {post.featuredImg && (
            <div
              style={{
                margin: "24px 24px 32px",
                aspectRatio: "16/9",
                borderRadius: "16px",
                border: "0.5px solid var(--border)",
                overflow: "hidden",
                position: "relative",
              }}
            >
              <img
                src={post.featuredImg}
                alt={post.title}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          )}

          <div style={{ padding: "0 24px" }}>
            {/* GEO Key Takeaway Box */}
            {post.geoTakeaway && (
              <div
                style={{
                  background: "rgba(197, 160, 89, 0.04)",
                  border: "1px solid rgba(197, 160, 89, 0.2)",
                  borderRadius: "12px",
                  padding: "16px",
                  marginBottom: "28px",
                  backdropFilter: "blur(4px)",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "9px",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    color: "var(--gold)",
                    marginBottom: "6px",
                  }}
                >
                  Key Takeaway
                </div>
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "13px",
                    lineHeight: 1.5,
                    color: "var(--cream)",
                    margin: 0,
                    opacity: 0.9,
                  }}
                >
                  {post.geoTakeaway}
                </p>
              </div>
            )}

            <BlogContentRenderer
              content={post.content}
              productsMap={productsMap}
              featuredImg={post.featuredImg}
            />

            {/* Q&A Accordion (FAQs) */}
            {faqs.length > 0 && (
              <div
                style={{
                  marginTop: "48px",
                  paddingTop: "32px",
                  borderTop: "0.5px solid var(--border)",
                }}
              >
                <h3
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: "18px",
                    fontWeight: 300,
                    color: "var(--gold-light)",
                    marginBottom: "16px",
                  }}
                >
                  Key Questions Answered
                </h3>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  {faqs.map((faq: any, idx: number) => (
                    <div
                      key={idx}
                      style={{
                        background: "var(--surface2)",
                        border: "0.5px solid var(--border)",
                        borderRadius: "10px",
                        padding: "16px",
                      }}
                    >
                      <h4
                        style={{
                          fontFamily: "var(--font-serif)",
                          fontSize: "14px",
                          fontWeight: 400,
                          color: "var(--cream)",
                          marginBottom: "8px",
                          marginTop: 0,
                          lineHeight: 1.3,
                        }}
                      >
                        {faq.q}
                      </h4>
                      <p
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: "13px",
                          lineHeight: 1.5,
                          color: "var(--text-muted)",
                          margin: 0,
                        }}
                      >
                        {faq.a}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Citations references */}
            {citations.length > 0 && (
              <div
                style={{
                  marginTop: "36px",
                  paddingTop: "20px",
                  borderTop: "0.5px solid var(--border)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "9px",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--text-dim)",
                  }}
                >
                  Verified References
                </span>
                <ul
                  style={{
                    listStyleType: "none",
                    padding: 0,
                    margin: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  {citations.map((cite: any, idx: number) => (
                    <li key={idx}>
                      <a
                        href={cite.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "11px",
                          color: "var(--gold)",
                          textDecoration: "underline",
                          textUnderlineOffset: "3px",
                        }}
                      >
                        {cite.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <footer
            style={{
              marginTop: "60px",
              padding: "40px 24px 0",
              borderTop: "0.5px solid var(--border)",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <p
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "18px",
                  color: "var(--cream)",
                  fontStyle: "italic",
                  marginBottom: "24px",
                  lineHeight: 1.4,
                }}
              >
                "A curation of brilliance for grand spaces."
              </p>
              <Link
                href="/collections"
                className="btn-primary"
                style={{
                  display: "block",
                  textDecoration: "none",
                  padding: "16px",
                  borderRadius: "12px",
                }}
              >
                Explore Collections
              </Link>
            </div>
          </footer>
        </article>

        {/* Desktop Layout */}
        <article
          className="hidden md:block"
          style={{
            maxWidth: "800px",
            margin: "0 auto",
            padding: "100px 20px 60px",
          }}
        >
          <div style={{ marginBottom: "40px" }}>
            <Link
              href="/blog"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                color: "var(--text-muted)",
                textDecoration: "none",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              ← Return to Archive
            </Link>
          </div>

          <header style={{ marginBottom: "40px" }}>
            <div className="section-label" style={{ marginBottom: "20px" }}>
              {new Date(post.createdAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </div>
            <h1
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "clamp(32px, 5vw, 48px)",
                fontWeight: 300,
                color: "var(--cream)",
                lineHeight: 1.2,
                marginBottom: "24px",
              }}
            >
              {post.title}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: "var(--surface2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid var(--border)",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "12px",
                    color: "var(--gold)",
                  }}
                >
                  {post.author.firstName[0]}
                </span>
              </div>
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "14px",
                  color: "var(--cream)",
                  opacity: 0.8,
                }}
              >
                {post.author.firstName} {post.author.lastName}
              </span>
            </div>
          </header>

          {post.featuredImg && (
            <div
              style={{
                aspectRatio: "16/9",
                border: "1px solid var(--border)",
                borderRadius: "20px",
                marginBottom: "40px",
                overflow: "hidden",
                position: "relative",
              }}
            >
              <img
                src={post.featuredImg}
                alt={post.title}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          )}

          {/* GEO Key Takeaway Box */}
          {post.geoTakeaway && (
            <div
              style={{
                background: "rgba(197, 160, 89, 0.03)",
                border: "1px solid rgba(197, 160, 89, 0.18)",
                borderRadius: "16px",
                padding: "24px 28px",
                marginBottom: "44px",
                backdropFilter: "blur(6px)",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15)",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  color: "var(--gold)",
                  marginBottom: "8px",
                }}
              >
                Summary &amp; Key Takeaway
              </div>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "15px",
                  lineHeight: 1.6,
                  color: "var(--cream)",
                  margin: 0,
                  opacity: 0.95,
                }}
              >
                {post.geoTakeaway}
              </p>
            </div>
          )}

          <BlogContentRenderer
            content={post.content}
            productsMap={productsMap}
            featuredImg={post.featuredImg}
          />

          {/* Q&A Accordion (FAQs) */}
          {faqs.length > 0 && (
            <div
              style={{
                marginTop: "64px",
                paddingTop: "40px",
                borderTop: "1px solid var(--border)",
              }}
            >
              <h3
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "22px",
                  fontWeight: 300,
                  color: "var(--gold-light)",
                  marginBottom: "24px",
                }}
              >
                Key Questions &amp; Detailed Answers
              </h3>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                {faqs.map((faq: any, idx: number) => (
                  <div
                    key={idx}
                    style={{
                      background: "var(--surface2)",
                      border: "1px solid var(--border)",
                      borderRadius: "12px",
                      padding: "24px",
                    }}
                  >
                    <h4
                      style={{
                        fontFamily: "var(--font-serif)",
                        fontSize: "16px",
                        fontWeight: 400,
                        color: "var(--cream)",
                        marginBottom: "10px",
                        marginTop: 0,
                        lineHeight: 1.4,
                      }}
                    >
                      {faq.q}
                    </h4>
                    <p
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "14px",
                        lineHeight: 1.6,
                        color: "var(--text-muted)",
                        margin: 0,
                      }}
                    >
                      {faq.a}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Citations references */}
          {citations.length > 0 && (
            <div
              style={{
                marginTop: "48px",
                paddingTop: "28px",
                borderTop: "1px solid var(--border)",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "var(--text-dim)",
                }}
              >
                Authority Sources &amp; Citations
              </span>
              <ul
                style={{
                  listStyleType: "none",
                  padding: 0,
                  margin: 0,
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "16px",
                }}
              >
                {citations.map((cite: any, idx: number) => (
                  <li key={idx}>
                    <a
                      href={cite.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "11px",
                        color: "var(--gold)",
                        textDecoration: "underline",
                        textUnderlineOffset: "4px",
                      }}
                    >
                      {cite.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <footer
            style={{
              marginTop: "80px",
              paddingTop: "40px",
              borderTop: "1px solid var(--border)",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <p
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "20px",
                  color: "var(--cream)",
                  fontStyle: "italic",
                  marginBottom: "24px",
                }}
              >
                A curation of brilliance for grand spaces.
              </p>
              <Link
                href="/collections"
                className="btn-primary"
                style={{ display: "inline-block", textDecoration: "none" }}
              >
                Explore Collections
              </Link>
            </div>
          </footer>
        </article>
      </main>
    </>
  );
}
