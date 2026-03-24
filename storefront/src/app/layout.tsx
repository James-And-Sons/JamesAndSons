import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Mono, Libre_Baskerville } from "next/font/google";
import { Analytics } from "@vercel/analytics/react"
import Footer from "@/components/Footer";
import Providers from "@/components/Providers";
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

const libreBaskerville = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-libre",
});

export const metadata: Metadata = {
  title: "James & Sons | Luxury Illumination Ecosystem",
  description: "India's premier destination for designer chandeliers and heritage lighting craftsmanship. Curating brilliance for grand spaces.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body
        className={`${cormorant.variable} ${dmMono.variable} ${libreBaskerville.variable} antialiased`}
      >
        <Providers>
          <div className="flex flex-col min-h-screen">
            {children}
            <Footer />
          </div>
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
