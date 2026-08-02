import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function BlogListPage() {
  let posts: any[] = [];
  try {
    posts = await prisma.blogPost.findMany({
      where: { isDraft: false },
      orderBy: { createdAt: "desc" },
      include: { author: true },
    });
  } catch (error) {
    console.error("Error fetching blog posts:", error);
  }

  return (
    <>
      <main
        className="md:pt-16 min-h-screen"
        style={{ background: "var(--obsidian)" }}
      >
        {/* Mobile Layout */}
        <div className="md:hidden" style={{ paddingBottom: "60px" }}>
          <div
            className="mobile-section-intro"
            style={{ paddingBottom: "12px" }}
          >
            <div>
              <div className="section-label" style={{ marginBottom: "4px" }}>
                Journal
              </div>
              <div
                className="section-title"
                style={{ fontSize: "24px", lineHeight: 1.2 }}
              >
                The Collector's <em>Archive</em>
              </div>
            </div>
          </div>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "13.5px",
              color: "var(--text-muted)",
              margin: "0 24px 28px",
              lineHeight: 1.6,
            }}
          >
            Exploring the intersection of historical illumination, artisanal
            craftsmanship, and modern architectural lighting.
          </p>

          <div style={{ padding: "0 20px" }}>
            {posts.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "60px 20px",
                  border: "1px dashed var(--border)",
                  borderRadius: "16px",
                }}
              >
                <p
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                  }}
                >
                  New stories arriving soon
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "28px",
                }}
              >
                {posts.map((post: any) => {
                  const coverImage =
                    post.featuredImg ||
                    "https://res.cloudinary.com/dy1durdrj/image/upload/v1785528826/2bbb030c-d5f2-4a7c-8f8e-c27f585dc052_hyymtq.png";
                  const wordCount = post.content
                    ? post.content.split(/\s+/).length
                    : 0;
                  const readTime = `${Math.ceil(wordCount / 200)} min read`;

                  return (
                    <Link
                      key={post.id}
                      href={`/blog/${post.slug}`}
                      style={{
                        textDecoration: "none",
                        display: "block",
                      }}
                    >
                      <article
                        style={{
                          background:
                            "linear-gradient(145deg, rgba(24, 20, 16, 0.95), rgba(14, 12, 10, 0.98))",
                          border: "1px solid rgba(197, 160, 89, 0.25)",
                          borderRadius: "20px",
                          overflow: "hidden",
                          boxShadow: "0 12px 32px rgba(0, 0, 0, 0.35)",
                          transition:
                            "transform 0.25s ease, border-color 0.25s ease",
                        }}
                      >
                        {/* Prominent Card Cover Image */}
                        <div
                          style={{
                            aspectRatio: "16/9",
                            width: "100%",
                            position: "relative",
                            overflow: "hidden",
                            background: "var(--surface2)",
                            borderBottom: "1px solid rgba(197, 160, 89, 0.15)",
                          }}
                        >
                          <img
                            src={coverImage}
                            alt={post.title}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              display: "block",
                            }}
                          />
                          <div
                            style={{
                              position: "absolute",
                              inset: 0,
                              background:
                                "linear-gradient(to top, rgba(10, 9, 7, 0.8) 0%, transparent 50%)",
                            }}
                          />
                          <div
                            style={{
                              position: "absolute",
                              bottom: "12px",
                              left: "16px",
                              right: "16px",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <span
                              style={{
                                fontFamily: "var(--font-mono)",
                                fontSize: "10px",
                                textTransform: "uppercase",
                                letterSpacing: "0.12em",
                                color: "var(--gold-light)",
                                background: "rgba(0, 0, 0, 0.75)",
                                padding: "3px 10px",
                                borderRadius: "20px",
                                border: "0.5px solid rgba(197, 160, 89, 0.3)",
                                backdropFilter: "blur(4px)",
                              }}
                            >
                              {new Date(post.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )}
                            </span>
                            <span
                              style={{
                                fontFamily: "var(--font-mono)",
                                fontSize: "10px",
                                color: "rgba(255, 255, 255, 0.85)",
                                background: "rgba(0, 0, 0, 0.65)",
                                padding: "3px 10px",
                                borderRadius: "20px",
                                backdropFilter: "blur(4px)",
                              }}
                            >
                              ⏱ {readTime}
                            </span>
                          </div>
                        </div>

                        {/* Card Body Details */}
                        <div style={{ padding: "22px 20px 20px" }}>
                          <h2
                            style={{
                              fontFamily: "var(--font-serif)",
                              fontSize: "21px",
                              fontWeight: 300,
                              color: "var(--cream)",
                              marginBottom: "10px",
                              lineHeight: 1.3,
                            }}
                          >
                            {post.title}
                          </h2>
                          <p
                            style={{
                              fontFamily: "var(--font-body)",
                              fontSize: "13.5px",
                              color: "var(--text-muted)",
                              lineHeight: 1.6,
                              display: "-webkit-box",
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              marginBottom: "18px",
                            }}
                          >
                            {post.excerpt}
                          </p>

                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              paddingTop: "14px",
                              borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              <div
                                style={{
                                  width: "24px",
                                  height: "24px",
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
                                    fontSize: "9px",
                                    color: "var(--gold)",
                                  }}
                                >
                                  {post.author?.firstName?.[0] || "J"}
                                </span>
                              </div>
                              <span
                                style={{
                                  fontFamily: "var(--font-body)",
                                  fontSize: "12px",
                                  color: "var(--cream)",
                                  opacity: 0.8,
                                }}
                              >
                                {post.author
                                  ? `${post.author.firstName} ${post.author.lastName}`
                                  : "Editorial Team"}
                              </span>
                            </div>

                            <span
                              style={{
                                fontFamily: "var(--font-mono)",
                                fontSize: "10px",
                                color: "var(--gold)",
                                textTransform: "uppercase",
                                letterSpacing: "0.12em",
                                fontWeight: 600,
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              Read Story →
                            </span>
                          </div>
                        </div>
                      </article>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:block">
          <div
            style={{
              background: "var(--void)",
              borderBottom: "1px solid var(--border)",
              padding: "60px 40px",
              textAlign: "center",
              paddingTop: "100px",
            }}
          >
            <div className="section-label">Journal</div>
            <h1
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "clamp(40px, 6vw, 64px)",
                fontWeight: 300,
                color: "var(--cream)",
                marginTop: "12px",
              }}
            >
              The Collector's Archive
            </h1>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "15px",
                color: "var(--text-muted)",
                marginTop: "16px",
                maxWidth: "600px",
                margin: "16px auto 0",
                lineHeight: 1.7,
              }}
            >
              Exploring the intersection of historical illumination, artisanal
              craftsmanship, and modern architectural lighting.
            </p>
          </div>

          <div
            style={{
              maxWidth: "1200px",
              margin: "0 auto",
              padding: "60px 40px",
            }}
          >
            {posts.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "100px 20px",
                  border: "1px dashed var(--border)",
                  borderRadius: "16px",
                }}
              >
                <p
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "12px",
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  New stories arriving soon
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
                  gap: "40px",
                }}
              >
                {posts.map((post: any) => {
                  const coverImage =
                    post.featuredImg ||
                    "https://res.cloudinary.com/dy1durdrj/image/upload/v1785528826/2bbb030c-d5f2-4a7c-8f8e-c27f585dc052_hyymtq.png";
                  const wordCount = post.content
                    ? post.content.split(/\s+/).length
                    : 0;
                  const readTime = `${Math.ceil(wordCount / 200)} min read`;

                  return (
                    <Link
                      key={post.id}
                      href={`/blog/${post.slug}`}
                      style={{ textDecoration: "none" }}
                    >
                      <article
                        style={{
                          cursor: "pointer",
                          background:
                            "linear-gradient(145deg, rgba(20, 17, 14, 0.9), rgba(10, 9, 7, 0.95))",
                          border: "1px solid var(--border)",
                          borderRadius: "16px",
                          overflow: "hidden",
                          transition: "all 0.3s ease",
                        }}
                        className="group hover:border-[var(--gold)]/50 hover:shadow-2xl"
                      >
                        <div
                          style={{
                            aspectRatio: "16/9",
                            overflow: "hidden",
                            position: "relative",
                            background: "var(--surface2)",
                          }}
                        >
                          <img
                            src={coverImage}
                            alt={post.title}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                            className="transition-transform duration-700 group-hover:scale-105"
                          />
                        </div>
                        <div style={{ padding: "24px" }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: "12px",
                            }}
                          >
                            <span className="section-label">
                              {new Date(post.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )}
                            </span>
                            <span
                              style={{
                                fontFamily: "var(--font-mono)",
                                fontSize: "11px",
                                color: "var(--text-dim)",
                              }}
                            >
                              ⏱ {readTime}
                            </span>
                          </div>
                          <h2
                            style={{
                              fontFamily: "var(--font-serif)",
                              fontSize: "24px",
                              fontWeight: 300,
                              color: "var(--cream)",
                              marginBottom: "12px",
                              lineHeight: 1.3,
                            }}
                            className="group-hover:text-[var(--gold-light)] transition-colors"
                          >
                            {post.title}
                          </h2>
                          <p
                            style={{
                              fontFamily: "var(--font-body)",
                              fontSize: "14px",
                              color: "var(--text-muted)",
                              lineHeight: 1.6,
                              display: "-webkit-box",
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              marginBottom: "20px",
                            }}
                          >
                            {post.excerpt}
                          </p>
                          <div
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: "10px",
                              color: "var(--gold)",
                              textTransform: "uppercase",
                              letterSpacing: "0.12em",
                              fontWeight: 600,
                            }}
                          >
                            Read Story →
                          </div>
                        </div>
                      </article>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
