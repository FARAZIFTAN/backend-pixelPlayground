import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// List of allowed origins - prefer environment variable, fallback to frontend URL
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://karyaklik.netlify.app';
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : [
      FRONTEND_URL,
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:5174',
    ];

// CORS headers configuration
function getCorsHeaders(origin: string | null): Record<string, string> {
  // Check if origin is allowed
  const isAllowed = origin && allowedOrigins.includes(origin);
  
  return {
    'Access-Control-Allow-Credentials': 'true',
    // If origin is not allowed, fallback to configured FRONTEND_URL
    'Access-Control-Allow-Origin': isAllowed ? origin : FRONTEND_URL,
    'Access-Control-Allow-Methods': 'GET,DELETE,PATCH,POST,PUT,OPTIONS',
    'Access-Control-Allow-Headers': 
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, ' +
      'Content-MD5, Content-Type, Date, X-Api-Version, Authorization, ' +
      'Cache-Control, Pragma, Expires, If-Modified-Since, If-None-Match, X-Request-Type',
    'Access-Control-Max-Age': '86400', // 24 hours
  };
}

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin');
  const pathname = request.nextUrl.pathname;

  // Handle OPTIONS preflight request
  if (request.method === 'OPTIONS') {
    const corsHeaders = getCorsHeaders(origin);
    return new NextResponse(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  // Handle actual request
  const response = NextResponse.next();
  const corsHeaders = getCorsHeaders(origin);

  // Apply CORS headers to response
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Add cache headers for static files
  if (pathname.startsWith('/uploads/')) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }

  return response;
}

// Configure which routes use this middleware
export const config = {
  matcher: [
    '/api/:path*',      // All API routes
    '/uploads/:path*',  // All upload files
  ],
};
