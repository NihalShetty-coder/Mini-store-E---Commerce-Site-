import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter, Playfair_Display } from "next/font/google";
import dynamic from "next/dynamic";
import "./globals.css";
import { ErrorBoundary } from "@/components/error/ErrorBoundary";
import { generateMetadata as generateSiteMetadata } from "@/lib/metadata";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";

// Lazy-load heavy components to improve initial load and HMR performance
const CartDrawer = dynamic(() => import("@/components/layout/CartDrawer"));
const ToastContainer = dynamic(() => import("@/components/ui/ToastContainer"));
const RouteGuard = dynamic(() => import('@/components/auth/route-guard'));
const WishlistSync = dynamic(() => import('@/components/sync/WishlistSync'));

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = generateSiteMetadata({});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Suspense fallback={null}>
          <GoogleAnalytics />
        </Suspense>
      </head>
      <body
        className={`${inter.variable} ${playfair.variable} antialiased font-inter`}
        suppressHydrationWarning
      >
        <ErrorBoundary>
          <RouteGuard>
            <WishlistSync />
            <CartDrawer />
            <ToastContainer />
            {children}
          </RouteGuard>
        </ErrorBoundary>
      </body>
    </html>
  );
}
