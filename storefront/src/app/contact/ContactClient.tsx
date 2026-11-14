"use client";

import Link from "next/link";

export default function ContactClient() {
  const handleContactClick = (type: string) => {
    if (
      typeof window !== "undefined" &&
      typeof window.trackMetaEvent === "function"
    ) {
      window.trackMetaEvent("Contact", {
        contact_type: type,
      });
    }
  };

  return (
    <div
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "100px 40px 80px",
      }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .contact-card:hover {
          border-color: var(--gold) !important;
          background: rgba(196,160,90,0.02) !important;
        }
      `,
        }}
      />

      <div style={{ textAlign: "center", marginBottom: "80px" }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            textTransform: "uppercase",
            letterSpacing: "0.4em",
            color: "var(--gold)",
            marginBottom: "16px",
          }}
        >
          Concierge Services
        </div>
        <h1
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "clamp(36px,5vw,56px)",
            fontWeight: 300,
            color: "var(--cream)",
            margin: 0,
            lineHeight: 1.1,
          }}
        >
          Contact Us
        </h1>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "80px",
          alignItems: "start",
        }}
        className="md:grid-cols-2"
      >
        {/* Left Side: Contact Information */}
        <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
          <div>
            <h3
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "24px",
                fontWeight: 300,
                color: "var(--gold-light)",
                marginBottom: "16px",
              }}
            >
              The Headquarters
            </h3>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "15px",
                color: "var(--text-muted)",
                lineHeight: 1.8,
                margin: 0,
              }}
            >
              CNI Church Compound Civil Lines,
              <br />
              Aligarh, Uttar Pradesh India - 202001
            </p>
          </div>

          <div>
            <h3
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "24px",
                fontWeight: 300,
                color: "var(--gold-light)",
                marginBottom: "16px",
              }}
            >
              Direct Lines
            </h3>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                fontFamily: "var(--font-mono)",
                fontSize: "14px",
              }}
            >
              <div>
                <span style={{ color: "var(--text-dim)" }}>Phone:</span>{" "}
                <a
                  href="tel:+919045808115"
                  onClick={() => handleContactClick("phone")}
                  style={{ color: "var(--gold)", textDecoration: "none" }}
                >
                  +91 9045 808115
                </a>
              </div>
              <div style={{ marginTop: "12px" }}>
                <span style={{ color: "var(--text-dim)" }}>
                  General Inquiry:
                </span>{" "}
                <a
                  href="mailto:connect@jamesandsons.in"
                  onClick={() => handleContactClick("email_general")}
                  style={{ color: "var(--gold)", textDecoration: "none" }}
                >
                  connect@jamesandsons.in
                </a>
              </div>
              <div>
                <span style={{ color: "var(--text-dim)" }}>
                  Concierge Support:
                </span>{" "}
                <a
                  href="mailto:support@jamesandsons.in"
                  onClick={() => handleContactClick("email_support")}
                  style={{ color: "var(--gold)", textDecoration: "none" }}
                >
                  support@jamesandsons.in
                </a>
              </div>
            </div>
          </div>

          <div
            style={{
              borderTop: "0.5px solid var(--border)",
              paddingTop: "40px",
              marginTop: "20px",
            }}
          >
            <p
              style={{
                fontSize: "13px",
                color: "var(--text-dim)",
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              Our customer care desk is open Monday to Saturday, 10:00 AM – 7:00
              PM IST. If you are verified B2B client, please connect with your
              dedicated account manager directly.
            </p>
          </div>
        </div>

        {/* Right Side: Support Tickets Action Card */}
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          <div style={{ marginBottom: "12px" }}>
            <h3
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "24px",
                fontWeight: 300,
                color: "var(--gold-light)",
                marginBottom: "12px",
              }}
            >
              Online Support Portal
            </h3>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "14px",
                color: "var(--text-muted)",
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              We recommend using our secure portal features below for expedited
              assistance on orders and returns.
            </p>
          </div>

          {/* Ticket Request Card */}
          <Link href="/account/tickets/new" style={{ textDecoration: "none" }}>
            <div
              className="contact-card"
              style={{
                border: "1px solid var(--border)",
                background: "var(--surface)",
                padding: "32px",
                borderRadius: "8px",
                transition: "all 0.3s ease",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  marginBottom: "16px",
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "8px",
                    background: "rgba(196,160,90,0.06)",
                    border: "0.5px solid var(--border-gold)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--gold)",
                    fontSize: "20px",
                  }}
                >
                  <i className="ti ti-ticket"></i>
                </div>
                <h4
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: "20px",
                    fontWeight: 400,
                    color: "var(--cream)",
                    margin: 0,
                  }}
                >
                  File a Support Ticket
                </h4>
              </div>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "14px",
                  color: "var(--text-muted)",
                  lineHeight: 1.7,
                  margin: "0 0 24px 0",
                }}
              >
                Submit product inquiries, request returns for specific orders,
                and upload reference photos directly to our local support team.
              </p>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  textTransform: "uppercase",
                  color: "var(--gold)",
                  letterSpacing: "0.15em",
                  fontWeight: 500,
                }}
              >
                Raise a Support Ticket &rarr;
              </span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
