import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, DM_Mono, Outfit } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import Script from "next/script";
import { Suspense } from "react";
import Footer from "@/components/Footer";
import Providers from "@/components/Providers";
import ScrollToTop from "@/components/ScrollToTop";
import { PWAInstallPrompt } from "@james-andsons/ui";
import MetaPixel from "@/components/MetaPixel";
import ThemeColorSync from "@/components/ThemeColorSync";
import Navigation from "@/components/Navigation";
import PwaInstallHelper from "@/components/PwaInstallHelper";
import StorefrontPushManager from "@/components/StorefrontPushManager";
import { BRAND_CONFIG } from "@james-andsons/config";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-dm-mono",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://jamesandsons.in"),
  title: "James & Sons | Luxury Illumination Ecosystem",
  description:
    "India's premier destination for designer chandeliers and heritage lighting craftsmanship. Curating brilliance for grand spaces.",
  manifest: "/manifest.json",
  openGraph: {
    title: "James & Sons | Luxury Illumination Ecosystem",
    description:
      "India's premier destination for designer chandeliers and heritage lighting craftsmanship. Curating brilliance for grand spaces.",
    url: "https://jamesandsons.in",
    siteName: "James & Sons",
    images: [
      {
        url: "https://jamesandsons.in/images/logo-dark.png",
        secureUrl: "https://jamesandsons.in/images/logo-dark.png",
        width: 1200,
        height: 630,
        alt: "James & Sons Logo",
        type: "image/png",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "James & Sons | Luxury Illumination Ecosystem",
    description:
      "India's premier destination for designer chandeliers and heritage lighting craftsmanship. Curating brilliance for grand spaces.",
    images: ["https://jamesandsons.in/images/logo-dark.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: BRAND_CONFIG.name,
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon" },
      { url: "/favicon.png", type: "image/png" },
    ],
    apple: "/icons/icon-192x192.png",
  },
  other: {
    "p:domain_verify": "05e17f9bd7917ad9a8dd38bdc291baf3",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf7f2" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0b" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${dmMono.variable} ${outfit.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css"
        />
        <meta
          name="p:domain_verify"
          content="05e17f9bd7917ad9a8dd38bdc291baf3"
        />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <Providers>
          <ThemeColorSync />
          <Suspense fallback={null}>
            <MetaPixel />
          </Suspense>
          <ScrollToTop />
          <div className="flex flex-col min-h-screen">
            <Navigation />
            {children}
            <Footer />
          </div>
        </Providers>
        {(() => {
          const gaId = process.env.NEXT_PUBLIC_GA_ID || "GT-NBJMTB56";
          return (
            <>
              <Script
                src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
                strategy="afterInteractive"
              />
              <Script id="google-analytics" strategy="afterInteractive">
                {`
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${gaId}');
                `}
              </Script>
            </>
          );
        })()}
        <Analytics />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebSite",
                  name: "James & Sons",
                  url: "https://jamesandsons.in/",
                  potentialAction: {
                    "@type": "SearchAction",
                    target: {
                      "@type": "EntryPoint",
                      urlTemplate:
                        "https://jamesandsons.in/search?q={search_term_string}",
                    },
                    "query-input": "required name=search_term_string",
                  },
                },
                {
                  "@type": "ItemList",
                  name: "Main Navigation",
                  itemListElement: [
                    {
                      "@type": "SiteNavigationElement",
                      position: 1,
                      name: "Collections",
                      url: "https://jamesandsons.in/collections",
                    },
                    {
                      "@type": "SiteNavigationElement",
                      position: 2,
                      name: "Spaces",
                      url: "https://jamesandsons.in/spaces",
                    },
                    {
                      "@type": "SiteNavigationElement",
                      position: 3,
                      name: "Blog",
                      url: "https://jamesandsons.in/blog",
                    },
                    {
                      "@type": "SiteNavigationElement",
                      position: 4,
                      name: "B2B Portal",
                      url: "https://jamesandsons.in/b2b",
                    },
                  ],
                },
              ],
            }),
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                    navigator.serviceWorker.getRegistrations().then(function(regs) {
                      for (var i = 0; i < regs.length; i++) {
                        regs[i].unregister();
                      }
                    });
                  } else {
                    navigator.serviceWorker.register('/sw.js');
                  }
                });
              }
            `,
          }}
        />
        <PwaInstallHelper />
        <StorefrontPushManager />
      </body>
    </html>
  );
}
