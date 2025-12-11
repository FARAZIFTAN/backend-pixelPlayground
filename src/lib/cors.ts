import { NextResponse } from 'next/server';

/**
 * Get allowed origins from environment or defaults
 */
export function getAllowedOrigins(): string[] {
  if (process.env.ALLOWED_ORIGINS) {
    return process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim());
  }
  
  // Default allowed origins for development
  return [
    'http://localhost:8080',  // Vite dev server
    'http://localhost:5173',  // Vite alternative port
    'http://localhost:3000',  // Next.js dev
    'http://localhost:5174',  // Vite alternative port 2
  ];
}

/**
 * Get CORS headers for a given origin
 */
export function getCorsHeaders(origin?: string | null): Record<string, string> {
  const allowedOrigins = getAllowedOrigins();
  const requestOrigin = origin || allowedOrigins[0];
  
  // Check if origin is allowed
  const isAllowed = allowedOrigins.includes(requestOrigin) || allowedOrigins.includes('*');
  const allowOrigin = isAllowed ? requestOrigin : allowedOrigins[0];
  
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
