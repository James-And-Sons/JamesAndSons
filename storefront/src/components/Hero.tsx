"use client";

import Link from "next/link";
import Image from "next/image";
import { useTenantConfig, useDictionary } from "@james-andsons/ui";

export default function Hero() {
  const config = useTenantConfig();
  const { t } = useDictionary();

  const brandName = config.brand.name;
  const tagline = t("common.tagline", "Let your light shine before others");
  const citation = t("common.tagline_citation", "Matthew 5:16");

  return (
    <>
      {/* Desktop Hero */}
      <section className="hero hidden md:flex">
        <div className="hero-bg"></div>

        {/* Abstract Hero Graphics */}
        <div className="hero-chandelier"></div>
        <Image
          src="/images/hero-chandelier.png"
          alt={`${brandName} Hero Visual`}
          width={450}
          height={580}
          priority
          unoptimized
          className="hero-svg live-chandelier object-contain"
        />

        <div className="font-serif italic text-[var(--gold-pale)] text-[24px] tracking-[0.1em] mb-4 py-12 opacity-95 animate-fadeIn">
          &ldquo;{tagline}&rdquo; &mdash;{citation}
        </div>

        <div className="hero-eyebrow">
          {t("hero.eyebrow", "The 2026 Collection")}
        </div>

        <h1 className="hero-title">
          {t("hero.title_line1", "Illuminate")}
          <br />
          <em>{t("hero.title_line2", "with Purpose")}</em>
        </h1>

        <p className="hero-sub">
          {t(
            "hero.sub",
            "Explore India's premier B2B & D2C ecosystem for luxury lighting. Masterfully crafted chandeliers engineered for sustainable brilliance.",
          )}
        </p>

        <div className="hero-ctas">
          <Link
            href="/collections"
            className="btn-primary"
            style={{ textDecoration: "none" }}
          >
            {t("common.cta.shop_collection", "Shop Collection")}
          </Link>
          {config.featureFlags.enableB2bPortal && (
            <Link
              href="/b2b"
              className="btn-outline"
              style={{ textDecoration: "none" }}
            >
              {t("common.cta.b2b_portal", "B2B Portal")}
            </Link>
          )}
        </div>

        <div className="hero-stats">
          <div className="hero-stat">
            <div className="hero-stat-num">{t("hero.stat_1_num", "90+")}</div>
            <div className="hero-stat-label">
              {t("hero.stat_1_label", "CRI Rating")}
            </div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-num">{t("hero.stat_2_num", "100%")}</div>
            <div className="hero-stat-label">
              {t("hero.stat_2_label", "Handcrafted")}
            </div>
          </div>
        </div>
      </section>

      {/* Mobile Hero */}
      <section className="mobile-hero-section md:hidden mt-4">
        <div className="mobile-hero-visual">
          <Image
            src="/images/hero-chandelier.png"
            alt={`${brandName} Hero Visual`}
            width={180}
            height={230}
            priority
            unoptimized
            className="mobile-chandelier-svg live-chandelier object-contain"
          />
          <div className="mobile-hero-badge">
            <div className="mobile-hero-badge-dot"></div>
            {t("hero.eyebrow", "The 2026 Collection")}
          </div>
          <div className="mobile-hero-title">
            {t("hero.title_line1", "Illuminate")}
            <br />
            <em>{t("hero.title_line2", "with Purpose")}</em>
          </div>

          <div className="font-serif italic text-[var(--gold-pale)] text-[15px] tracking-[0.05em] mb-3 opacity-95">
            &ldquo;{tagline}&rdquo; &mdash;{citation}
          </div>

          <div className="mobile-hero-sub">
            {t(
              "hero.sub",
              "India's premier luxury lighting ecosystem — heritage craftsmanship for grand spaces.",
            )}
          </div>
          <div className="mobile-hero-ctas">
            <Link href="/collections" className="mobile-btn-primary">
              {t("common.cta.shop_collection", "Shop Collection")}
            </Link>
            {config.featureFlags.enableB2bPortal && (
              <Link href="/b2b" className="mobile-btn-ghost">
                {t("common.cta.b2b_portal", "B2B Portal")}
              </Link>
            )}
          </div>
        </div>

        <div className="mobile-hero-stats">
          <div className="mobile-stat-chip">
            <i
              className="ti ti-brightness-up mobile-stat-icon"
              aria-hidden="true"
            ></i>
            <div>
              <div className="mobile-stat-num">
                {t("hero.stat_1_num", "90+")}
              </div>
              <div className="mobile-stat-label">
                {t("hero.stat_1_label", "CRI Rating")}
              </div>
            </div>
          </div>
          <div className="mobile-stat-chip">
            <i className="ti ti-award mobile-stat-icon" aria-hidden="true"></i>
            <div>
              <div className="mobile-stat-num">
                {t("hero.stat_2_num", "100%")}
              </div>
              <div className="mobile-stat-label">
                {t("hero.stat_2_label", "Handcrafted")}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
