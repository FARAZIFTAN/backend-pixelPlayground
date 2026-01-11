import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 1. HARDCODE DOMAIN ASLI (Supaya aman dari Env Var yang salah)
const PRODUCTION_URL = 'https://karyaklik.netlify.app';

// 2. Buat daftar whitelist yang pasti benar
const allowedOrigins = [
  PRODUCTION_URL,                // Wajib ada
  'http://localhost:5173',       // Local Vite
  'http://localhost:3000',       // Local Next
  process.env.FRONTEND_URL       // Opsional (jika ada di Env Var)
].filter(Boolean) as string[];   // Hapus value null/undefined

// CORS headers configuration
function getCorsHeaders(origin: string | null): Record<string, string> {
  // Cek apakah origin yang meminta ada di daftar whitelist
  // Jika origin ada di daftar, kita izinkan.
  const isAllowed = origin && allowedOrigins.includes(origin);
  
  // Jika diizinkan pakai origin request, JIKA TIDAK pakai Production URL (Netlify)
  // Jangan pernah fallback ke Env Var lagi karena itu sumber masalahnya
  const allowOrigin = isAllowed ? origin : PRODUCTION_URL;
  
  return {
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Origin': allowOrigin,
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

  // Handle OPTIONS preflight request (PENTING UNTUK LOGIN)
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