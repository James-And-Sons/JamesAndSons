import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Mono, Outfit } from "next/font/google";
import { Analytics } from "@vercel/analytics/react"
import Footer from "@/components/Footer";
import Providers from "@/components/Providers";
import ScrollToTop from "@/components/ScrollToTop";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-dm-mono",
});

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "James & Sons | Luxury Illumination Ecosystem",
  description: "India's premier destination for designer chandeliers and heritage lighting craftsmanship. Curating brilliance for grand spaces.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "James & Sons",
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
};

export const viewport = {
  themeColor: "#C4A05A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css" />
        <meta name="p:domain_verify" content="05e17f9bd7917ad9a8dd38bdc291baf3"/>
      </head>
      <body
        className={`${cormorant.variable} ${dmMono.variable} ${outfit.variable} antialiased`}
        suppressHydrationWarning
      >
        <Providers>
          <ScrollToTop />
          <div className="flex flex-col min-h-screen">
            {children}
            <Footer />
          </div>
        </Providers>
        <Analytics />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebSite",
                  "name": "James & Sons",
                  "url": "https://jamesandsons.in/",
                  "potentialAction": {
                    "@type": "SearchAction",
                    "target": {
                      "@type": "EntryPoint",
                      "urlTemplate": "https://jamesandsons.in/search?q={search_term_string}"
                    },
                    "query-input": "required name=search_term_string"
                  }
                },
                {
                  "@type": "ItemList",
                  "name": "Main Navigation",
                  "itemListElement": [
                    {
                      "@type": "SiteNavigationElement",
                      "position": 1,
                      "name": "Collections",
                      "url": "https://jamesandsons.in/collections"
                    },
                    {
                      "@type": "SiteNavigationElement",
                      "position": 2,
                      "name": "Spaces",
                      "url": "https://jamesandsons.in/spaces"
                    },
                    {
                      "@type": "SiteNavigationElement",
                      "position": 3,
                      "name": "Blog",
                      "url": "https://jamesandsons.in/blog"
                    },
                    {
                      "@type": "SiteNavigationElement",
                      "position": 4,
                      "name": "B2B Portal",
                      "url": "https://jamesandsons.in/b2b"
                    }
                  ]
                }
              ]
            })
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />

      </body>
    </html>
  );
}
