'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { logger } from '@/lib/logger';

/**
 * Error Component for Next.js App Router
 * This handles errors in specific routes
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to our logging service
    logger.error('Route error caught', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    }, 'ROUTE_ERROR');
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="max-w-md w-full bg-white border-2 border-primary p-8 text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-primary" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="font-playfair text-2xl md:text-3xl font-black text-secondary">
            Something went wrong
          </h1>
          <p className="text-sm text-muted-custom leading-relaxed">
            We encountered an unexpected error while loading this page.
          </p>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="bg-red-50 border border-red-200 p-4 rounded text-left">
            <p className="text-xs font-mono text-red-800 break-all">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-[10px] text-red-600 mt-2">
                Digest: {error.digest}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button
            onClick={reset}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-secondary text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          <Link
            href="/"
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border border-border-custom text-secondary text-[10px] font-black uppercase tracking-widest hover:border-secondary transition-colors"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
