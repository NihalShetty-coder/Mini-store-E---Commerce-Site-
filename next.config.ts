import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  
  // Turbopack configuration for maximum performance
  turbopack: {
    // Fix: Lock root to this project dir so Turbopack doesn't scan parent Telegram/ folder
    root: path.resolve(__dirname),
  },
  
  // Performance optimizations
  experimental: {
    // Optimize imports for these packages to reduce bundle size
    // Note: Don't include Firebase here as it conflicts with serverExternalPackages
    optimizePackageImports: [
      'lucide-react',
      'framer-motion', 
      'recharts',
    ],
    // Optimize server components
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  
  // Externalize Firebase for server components (prevents bundling issues)
  serverExternalPackages: [
    'firebase',
    'firebase-admin',
    '@firebase/auth',
    '@firebase/firestore',
    '@firebase/analytics',
    '@firebase/app',
    '@firebase/storage',
  ],
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: 'i.ibb.co',
      },
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Skip Next.js image proxy — avoids NAT64 "private IP" blocking
    // and works with any external image host (imgbb already serves optimized images)
    unoptimized: true,
  },
  
  // Webpack compatibility path for local development
  webpack: (config) => {
    // Let Next.js handle caching automatically
    return config;
  },
};

export default nextConfig;
