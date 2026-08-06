"use client";
import Link from "next/link";

export default function ContactCTA() {
  return (
    <section
      id="contact-cta"
      style={{
        padding: "80px 40px",
        background:
          "linear-gradient(135deg, var(--surface) 0%, var(--obsidian) 100%)",
        borderTop: "1px solid var(--border)",
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        {/* Top grid: headline + contact details */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "48px",
            alignItems: "start",
            marginBottom: "56px",
          }}
        >
          {/* Left: Headline */}
          <div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                color: "var(--gold)",
                marginBottom: "20px",
              }}
            >
              Get in Touch
            </div>
            <h2
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "clamp(28px, 4vw, 48px)",
                fontWeight: 300,
                lineHeight: 1.2,
                color: "var(--text)",
                marginBottom: "20px",
              }}
            >
              Let Us Light Up
              <br />
              <em style={{ color: "var(--gold-light)" }}>Your Space</em>
            </h2>
            <p
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "16px",
                color: "var(--text-muted)",
                lineHeight: 1.8,
                maxWidth: "420px",
              }}
            >
              From bespoke chandeliers for heritage estates to large-scale
              hospitality projects — our design concierge team is here to bring
              your vision to life.
            </p>
          </div>

          {/* Right: Contact details */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "24px" }}
          >
            {/* Phone */}
            <a
              href="tel:+917668829714"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                textDecoration: "none",
                color: "inherit",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "var(--gold)")
              }
              onMouseLeave={(e) => (e.currentTarget.style.color = "inherit")}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  border: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <i
                  className="ti ti-phone"
                  style={{ fontSize: "18px", color: "var(--gold)" }}
                />
              </div>
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "9px",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: "var(--text-muted)",
                    marginBottom: "2px",
                  }}
                >
                  Call Our Concierge
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: "17px",
                    color: "var(--text)",
                  }}
                >
                  +91 76688 29714
                </div>
              </div>
            </a>

            {/* Email */}
            <a
              href="mailto:connect@jamesandsons.in"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                textDecoration: "none",
                color: "inherit",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "var(--gold)")
              }
              onMouseLeave={(e) => (e.currentTarget.style.color = "inherit")}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  border: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <i
                  className="ti ti-mail"
                  style={{ fontSize: "18px", color: "var(--gold)" }}
                />
              </div>
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "9px",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: "var(--text-muted)",
                    marginBottom: "2px",
                  }}
                >
                  Write to Us
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: "17px",
                    color: "var(--text)",
                  }}
                >
                  connect@jamesandsons.in
                </div>
              </div>
            </a>

            {/* Showroom / HQ Address */}
            <div
              style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  border: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <i
                  className="ti ti-map-pin"
                  style={{ fontSize: "18px", color: "var(--gold)" }}
                />
              </div>
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "9px",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: "var(--text-muted)",
                    marginBottom: "2px",
                  }}
                >
                  Headquarters
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: "16px",
                    color: "var(--text)",
                    lineHeight: 1.5,
                  }}
                >
                  Peer matha, parav dubey,
                  <br />
                  Aligarh, Uttar Pradesh, India- 202001
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Buttons row */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            flexWrap: "wrap",
            borderTop: "1px solid var(--border)",
            paddingTop: "40px",
          }}
        >
          <Link
            href="/contact"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              background: "var(--gold)",
              color: "var(--obsidian)",
              padding: "16px 36px",
              textDecoration: "none",
              fontWeight: 600,
              transition: "opacity 0.2s",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLAnchorElement).style.opacity = "0.85")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLAnchorElement).style.opacity = "1")
            }
          >
            Send an Enquiry
          </Link>

          <a
            href="https://wa.me/917668829714?text=Hello%20James%20%26%20Sons%2C%20I%20would%20like%20to%20enquire%20about%20your%20collections."
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              background: "#25D366",
              color: "#fff",
              padding: "16px 36px",
              textDecoration: "none",
              fontWeight: 600,
              transition: "opacity 0.2s",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLAnchorElement).style.opacity = "0.85")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLAnchorElement).style.opacity = "1")
            }
          >
            <i className="ti ti-brand-whatsapp" style={{ fontSize: "16px" }} />
            WhatsApp Us
          </a>

          <Link
            href="/catalogues"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              border: "1px solid var(--border)",
              color: "var(--text-muted)",
              padding: "16px 36px",
              textDecoration: "none",
              transition: "all 0.3s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.borderColor =
                "var(--gold)";
              (e.currentTarget as HTMLAnchorElement).style.color =
                "var(--gold)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.borderColor =
                "var(--border)";
              (e.currentTarget as HTMLAnchorElement).style.color =
                "var(--text-muted)";
            }}
          >
            <i className="ti ti-download" style={{ fontSize: "14px" }} />
            Download Catalogue
          </Link>
        </div>
      </div>
    </section>
  );
}
