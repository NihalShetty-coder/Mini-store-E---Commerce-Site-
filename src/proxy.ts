import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Proxy (previously Middleware)
 * Runs before every request to check authentication and permissions
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin route protection
  if (pathname.startsWith('/admin')) {
    // In a client-side rendered Firebase app, we can't easily verify the user's role
    // in middleware because Firebase Auth is client-side only.
    // 
    // Options:
    // 1. Use session cookies (requires Firebase Admin SDK setup)
    // 2. Use RouteGuard component (client-side protection - already implemented)
    // 3. Implement API-based auth verification
    //
    // For now, we rely on RouteGuard component for admin protection.
    // In production, consider implementing Firebase Admin SDK with session cookies.
    
    // You could add rate limiting headers here as additional security
    const response = NextResponse.next();
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (already have rate limiting)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)',
  ],
};
