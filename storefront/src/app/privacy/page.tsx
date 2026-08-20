import Footer from "@/components/Footer";
import Link from "next/link";
import { BRAND_CONFIG } from "@james-andsons/config";

export const metadata = {
  title: `Privacy & Data Protection Policy | ${BRAND_CONFIG.name}`,
  description: `Official Privacy and Data Protection Policy for ${BRAND_CONFIG.name}, detailing customer PII handling, AES-256 encryption, and Amazon Data Protection Policy (DPP) compliance.`,
};

export default function PrivacyPolicyPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--obsidian)",
        color: "var(--cream)",
      }}
    >
      <section
        style={{
          padding: "140px 24px 80px",
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            textTransform: "uppercase",
            letterSpacing: "0.2em",
            color: "var(--gold)",
            marginBottom: "12px",
          }}
        >
          Legal & Security Compliance
        </div>
        <h1
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "clamp(32px, 5vw, 48px)",
            fontWeight: 300,
            lineHeight: 1.1,
            marginBottom: "24px",
          }}
        >
          Privacy & Data Protection <em>Policy</em>
        </h1>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "15px",
            color: "var(--text-muted)",
            lineHeight: 1.7,
            marginBottom: "48px",
          }}
        >
          This Privacy Policy describes how {BRAND_CONFIG.name} ("we", "us", or
          "our") collects, uses, encrypts, retains, and disposes of personal
          data across our digital platforms, administrative portals, and
          marketplace integrations including Amazon SP-API.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          {/* Compliance Summary Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "20px",
            }}
          >
            <div
              style={{
                padding: "24px",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "16px",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  textTransform: "uppercase",
                  color: "var(--gold)",
                  marginBottom: "8px",
                }}
              >
                Encryption Standard
              </div>
              <div
                style={{ fontFamily: "var(--font-heading)", fontSize: "18px" }}
              >
                AES-256 & TLS 1.3
              </div>
            </div>

            <div
              style={{
                padding: "24px",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "16px",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  textTransform: "uppercase",
                  color: "var(--gold)",
                  marginBottom: "8px",
                }}
              >
                PII Retention Limit
              </div>
              <div
                style={{ fontFamily: "var(--font-heading)", fontSize: "18px" }}
              >
                &lt; 30 Days Post-Shipment
              </div>
            </div>

            <div
              style={{
                padding: "24px",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "16px",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  textTransform: "uppercase",
                  color: "var(--gold)",
                  marginBottom: "8px",
                }}
              >
                Amazon Integration
              </div>
              <div
                style={{ fontFamily: "var(--font-heading)", fontSize: "18px" }}
              >
                DPP & SP-API Compliant
              </div>
            </div>
          </div>

          {/* Section 1: Information Collection & Utilization */}
          <div
            style={{
              padding: "32px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "20px",
            }}
          >
            <h2
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "22px",
                marginBottom: "16px",
                color: "var(--cream)",
              }}
            >
              1. Information Collection & Purpose of Processing
            </h2>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "14px",
                color: "var(--text-muted)",
                lineHeight: 1.7,
                marginBottom: "16px",
              }}
            >
              We collect Personally Identifiable Information (PII) solely to
              facilitate direct-to-consumer order fulfillment, shipping
              logistics, tax compliance, and customer support. The types of PII
              processed include:
            </p>
            <ul
              style={{
                paddingLeft: "20px",
                fontFamily: "var(--font-body)",
                fontSize: "14px",
                color: "var(--text-muted)",
                lineHeight: 1.8,
              }}
            >
              <li>
                <strong>Recipient Details:</strong> Customer full name, shipping
                street address, postal code, and contact phone number.
              </li>
              <li>
                <strong>Transactional Data:</strong> Items purchased, order
                total, payment gateway reference IDs, and tax breakdowns
                (GSTIN).
              </li>
              <li>
                <strong>Marketplace Data:</strong> Amazon Seller Central order
                payloads accessed via SP-API Restricted Data Tokens (RDT).
              </li>
            </ul>
          </div>

          {/* Section 2: Amazon Data Protection Policy (DPP) Compliance */}
          <div
            style={{
              padding: "32px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "20px",
            }}
          >
            <h2
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "22px",
                marginBottom: "16px",
                color: "var(--cream)",
              }}
            >
              2. Amazon SP-API & Data Protection Policy (DPP) Compliance
            </h2>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "14px",
                color: "var(--text-muted)",
                lineHeight: 1.7,
                marginBottom: "12px",
              }}
            >
              For orders placed through Amazon, {BRAND_CONFIG.name} accesses
              customer information via Amazon Selling Partner API (SP-API) under
              strict compliance with Amazon's Data Protection Policy (DPP):
            </p>
            <ul
              style={{
                paddingLeft: "20px",
                fontFamily: "var(--font-body)",
                fontSize: "14px",
                color: "var(--text-muted)",
                lineHeight: 1.8,
              }}
            >
              <li>
                Amazon PII is accessed exclusively via Restricted Data Tokens
                (RDT) for legitimate fulfillment and tax calculation purposes.
              </li>
              <li>
                Amazon customer data is never used for external marketing,
                cross-promotions, or sold to third-party vendors.
              </li>
              <li>
                Access within our system is restricted to authorized employees
                on a strict need-to-know basis using Role-Based Access Control
                (RBAC).
              </li>
            </ul>
          </div>

          {/* Section 3: Data Retention & Automated Sanitization */}
          <div
            style={{
              padding: "32px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "20px",
            }}
          >
            <h2
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "22px",
                marginBottom: "16px",
                color: "var(--cream)",
              }}
            >
              3. PII Retention Limit & Automated Disposal (&lt; 30 Days)
            </h2>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "14px",
                color: "var(--text-muted)",
                lineHeight: 1.7,
                marginBottom: "16px",
              }}
            >
              In accordance with Amazon DPP requirements,{" "}
              <strong>
                all Personally Identifiable Information (PII) retrieved for
                order fulfillment is retained for less than 30 days after order
                shipment delivery
              </strong>
              .
            </p>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "14px",
                color: "var(--text-muted)",
                lineHeight: 1.7,
              }}
            >
              Upon expiration of the 30-day post-shipment window, automated
              background maintenance scripts securely purge customer names,
              street addresses, and phone numbers from our active database
              records. Anonymized, non-PII financial totals are retained solely
              to satisfy statutory corporate accounting and GST compliance
              mandates under Indian law.
            </p>
          </div>

          {/* Section 4: Data Security, Encryption & KMS */}
          <div
            style={{
              padding: "32px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "20px",
            }}
          >
            <h2
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "22px",
                marginBottom: "16px",
                color: "var(--cream)",
              }}
            >
              4. Data Security, Encryption & Key Management
            </h2>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "14px",
                color: "var(--text-muted)",
                lineHeight: 1.7,
                marginBottom: "16px",
              }}
            >
              We enforce multi-layered defense-in-depth security mechanisms to
              protect data against unauthorized access, disclosure, or breach:
            </p>
            <ul
              style={{
                paddingLeft: "20px",
                fontFamily: "var(--font-body)",
                fontSize: "14px",
                color: "var(--text-muted)",
                lineHeight: 1.8,
              }}
            >
              <li>
                <strong>Encryption in Transit:</strong> All HTTP traffic and API
                communications are encrypted using high-grade TLS 1.3 protocols.
              </li>
              <li>
                <strong>Encryption at Rest:</strong> Database storage and
                archived backups are encrypted using AES-256 bit standards
                managed via hardware Key Management Systems (KMS).
              </li>
              <li>
                <strong>Network Isolation:</strong> Production databases operate
                in private virtual subnets with zero direct public IP
                accessibility.
              </li>
              <li>
                <strong>Access Control:</strong> SSO with mandatory Multi-Factor
                Authentication (MFA) and granular RBAC governance.
              </li>
            </ul>
          </div>

          {/* Section 5: Third-Party Disclosures */}
          <div
            style={{
              padding: "32px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "20px",
            }}
          >
            <h2
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "22px",
                marginBottom: "16px",
                color: "var(--cream)",
              }}
            >
              5. Third-Party Logistics & Carrier Disclosures
            </h2>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "14px",
                color: "var(--text-muted)",
                lineHeight: 1.7,
              }}
            >
              Customer shipping details are shared strictly with authorized
              logistics service providers (such as Shiprocket and contracted
              courier partners) for the sole purpose of shipping label
              generation, physical transit, and order delivery. We do not sell,
              license, lease, or monetize customer data under any circumstances.
            </p>
          </div>

          {/* Section 6: Contact & Incident Point of Contact */}
          <div
            style={{
              padding: "32px",
              background: "rgba(184,134,11,0.05)",
              border: "1px solid rgba(184,134,11,0.2)",
              borderRadius: "20px",
            }}
          >
            <h2
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "20px",
                marginBottom: "12px",
                color: "var(--gold)",
              }}
            >
              Privacy & Security Contact
            </h2>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "14px",
                color: "var(--text-muted)",
                lineHeight: 1.6,
                marginBottom: "16px",
              }}
            >
              For data protection inquiries, access/deletion requests, or to
              reach our Incident Management Point of Contact (IMPOC), please
              contact our Data Protection Officer:
            </p>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "13px",
                color: "var(--cream)",
                lineHeight: 1.8,
              }}
            >
              Email:{" "}
              <a
                href={`mailto:${BRAND_CONFIG.supportEmail}`}
                style={{ color: "var(--gold)", textDecoration: "underline" }}
              >
                {BRAND_CONFIG.supportEmail}
              </a>
              <br />
              Address: James & Sons Luxury Lighting, Operations & Compliance
              Division, India
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
