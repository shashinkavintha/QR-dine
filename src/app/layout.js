import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "lenis/dist/lenis.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "QR Dine - Digital Menu System",
  description: "Next Generation QR Digital Menu System for Restaurants and Hotels",
  icons: {
    icon: '/favicon.ico',
  },
};

import SmoothScroll from '@/components/SmoothScroll';
import Script from 'next/script';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from '@/components/ThemeProvider';
import CookieBanner from '@/components/CookieBanner';

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <SmoothScroll>
            {children}
          </SmoothScroll>
          <Toaster position="top-right" />
        </ThemeProvider>
        <Script src="https://www.payhere.lk/lib/payhere.js" strategy="beforeInteractive" />
        <CookieBanner />
      </body>
    </html>
  );
}
