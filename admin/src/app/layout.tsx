import type { Metadata } from 'next';
import { Cormorant_Garamond, DM_Mono, Libre_Baskerville } from 'next/font/google';
import './globals.css';
import LayoutClient from '@/components/LayoutClient';

const serif = Cormorant_Garamond({ subsets: ['latin'], weight: ['300', '400', '500'], variable: '--font-serif' });
const mono = DM_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono' });
const body = Libre_Baskerville({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-body' });

export const metadata: Metadata = {
  title: 'Admin Portal | James & Sons',
  description: 'Management dashboard for James & Sons luxury e-commerce platform.',
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${serif.variable} ${mono.variable} ${body.variable}`} suppressHydrationWarning>
      <body className="flex min-h-screen bg-background font-body text-secondary text-[14px] overflow-x-hidden transition-colors duration-300" suppressHydrationWarning>
        <LayoutClient>
          {children}
        </LayoutClient>
      </body>
    </html>
  );
}
