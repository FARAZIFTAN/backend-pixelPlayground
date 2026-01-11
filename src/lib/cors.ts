import { NextResponse } from 'next/server';

/**
 * Get allowed origins from environment or defaults
 */
export function getAllowedOrigins(): string[] {
  // 1. Daftar Wajib (Hardcoded agar pasti jalan di Production)
  const origins = [
    'https://karyaklik.netlify.app',  // <--- PASTI ADA, TIDAK BISA DITIMPA
    'http://localhost:5173',          // Vite local
    'http://localhost:3000',          // Next local
  ];

  // 2. Tambahan dari Environment Variable (Opsional)
  if (process.env.FRONTEND_URL) {
    origins.push(process.env.FRONTEND_URL);
  }

  if (process.env.ALLOWED_ORIGINS) {
    const extraOrigins = process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim());
    origins.push(...extraOrigins);
  }

  // Hapus duplikat (opsional tapi bagus)
  return [...new Set(origins)];
}

/**
 * Get CORS headers for a given origin
 */
export function getCorsHeaders(origin?: string | null): Record<string, string> {
  const allowedOrigins = getAllowedOrigins();
  
  // Default fallback jika origin tidak dikenali (PENTING: Default ke Netlify, BUKAN ke Env Var)
  const defaultOrigin = 'https://karyaklik.netlify.app'; 
  const requestOrigin = origin || defaultOrigin;

  // Cek apakah origin yang meminta ada di daftar whitelist
  const isAllowed = allowedOrigins.includes(requestOrigin) || allowedOrigins.includes('*');
  
  // Jika diizinkan pakai origin request, jika tidak pakai default Netlify
  const allowOrigin = isAllowed ? requestOrigin : defaultOrigin;
  
  return {
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET,DELETE,PATCH,POST,PUT,OPTIONS',
    'Access-Control-Allow-Headers': 
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, ' +
      'Content-MD5, Content-Type, Date, X-Api-Version, Authorization, ' +
      'Cache-Control, Pragma, Expires, If-Modified-Since, If-None-Match, X-Request-Type',
  };
}

/**
 * Create a NextResponse with CORS headers
 */
export function corsResponse(
  data: any,
  init?: ResponseInit,
  origin?: string | null
): NextResponse {
  const response = NextResponse.json(data, init);
  const corsHeaders = getCorsHeaders(origin);
  
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
}

/**
 * Create an OPTIONS response with CORS headers
 */
export function corsOptionsResponse(origin?: string | null): NextResponse {
  const response = new NextResponse(null, { status: 200 });
  const corsHeaders = getCorsHeaders(origin);
  
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
}