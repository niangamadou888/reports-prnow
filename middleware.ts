import { NextRequest, NextResponse } from 'next/server';

const ADMIN_USERNAME = 'pradmin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Pr@dm1n#2024$SecureX!9kL';

function verifyBasicAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return false;
  }

  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
  const [username, password] = credentials.split(':');

  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}

function verifySessionCookie(request: NextRequest): boolean {
  const sessionCookie = request.cookies.get('admin_session');
  return sessionCookie?.value === 'authenticated';
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Allow auth API routes without authentication
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // Allow login page without authentication
  if (pathname === '/admin/login') {
    // If already authenticated, redirect to admin
    if (verifySessionCookie(request)) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return NextResponse.next();
  }

  // Protect /admin pages with cookie-based session
  if (pathname.startsWith('/admin')) {
    if (!verifySessionCookie(request)) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    return NextResponse.next();
  }

  // Protect API routes with basic auth (for programmatic access)
  const protectedApiPaths = ['/api/upload', '/api/pdfs'];
  const isProtectedApi = protectedApiPaths.some((path) => pathname.startsWith(path));

  if (isProtectedApi) {
    // Also allow cookie-based auth for API calls from the admin panel
    if (!verifyBasicAuth(request) && !verifySessionCookie(request)) {
      return new NextResponse('Authentication required', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Admin Area"',
        },
      });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/upload/:path*', '/api/pdfs/:path*', '/api/auth/:path*'],
};
