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

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Protect /admin and admin-related API routes
  const protectedPaths = ['/admin', '/api/upload', '/api/pdfs'];
  const isProtected = protectedPaths.some((path) => pathname.startsWith(path));

  if (isProtected) {
    if (!verifyBasicAuth(request)) {
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
  matcher: ['/admin/:path*', '/api/upload/:path*', '/api/pdfs/:path*'],
};
