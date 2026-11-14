import type { Metadata, Viewport } from "next";
import {
  Cormorant_Garamond,
  DM_Mono,
  Libre_Baskerville,
} from "next/font/google";
import "./globals.css";
import LayoutClient from "@/components/LayoutClient";
import { BRAND_CONFIG } from "@james-andsons/config";

const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-serif",
});
const mono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});
const body = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: `Admin Portal | ${BRAND_CONFIG.name}`,
  description: `Management dashboard for ${BRAND_CONFIG.name} platform.`,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: BRAND_CONFIG.adminPwaName,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon" },
      { url: "/favicon.png", type: "image/png" },
    ],
    apple: [{ url: "/favicon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, // prevents iOS zoom-on-input-focus
  userScalable: false,
  viewportFit: "cover", // enables env(safe-area-inset-*) CSS
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0b" },
    { media: "(prefers-color-scheme: light)", color: "#faf8f5" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${serif.variable} ${mono.variable} ${body.variable}`}
      suppressHydrationWarning
    >
      <body
        className="flex min-h-screen bg-background font-body text-secondary text-[14px] overflow-x-hidden transition-colors duration-300"
        suppressHydrationWarning
      >
        <LayoutClient>{children}</LayoutClient>
      </body>
    </html>
  );
}
