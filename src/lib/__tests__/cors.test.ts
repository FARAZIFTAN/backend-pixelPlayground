import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { getAllowedOrigins, getCorsHeaders, corsResponse, corsOptionsResponse } from '../cors';

describe('CORS Utilities', () => {
  beforeEach(() => {
    delete process.env.ALLOWED_ORIGINS;
  });

  describe('getAllowedOrigins', () => {
    it('should return default origins when ALLOWED_ORIGINS not set', () => {
      const origins = getAllowedOrigins();
      
      expect(origins).toContain('http://localhost:8080');
      expect(origins).toContain('http://localhost:5173');
      expect(origins).toContain('http://localhost:3000');
    });

    it('should parse ALLOWED_ORIGINS from environment', () => {
      process.env.ALLOWED_ORIGINS = 'http://example.com,http://test.com';
      
      const origins = getAllowedOrigins();
      
      expect(origins).toContain('http://example.com');
      expect(origins).toContain('http://test.com');
      expect(origins).toHaveLength(2);
    });

    it('should trim whitespace from origins', () => {
      process.env.ALLOWED_ORIGINS = ' http://example.com , http://test.com ';
      
      const origins = getAllowedOrigins();
      
      expect(origins[0]).toBe('http://example.com');
      expect(origins[1]).toBe('http://test.com');
    });

    it('should handle single origin', () => {
      process.env.ALLOWED_ORIGINS = 'http://single.com';
      
      const origins = getAllowedOrigins();
      
      expect(origins).toHaveLength(1);
      expect(origins[0]).toBe('http://single.com');
    });
  });

  describe('getCorsHeaders', () => {
    it('should return CORS headers for allowed origin', () => {
      const headers = getCorsHeaders('http://localhost:8080');
      
      expect(headers['Access-Control-Allow-Credentials']).toBe('true');
      expect(headers['Access-Control-Allow-Origin']).toBe('http://localhost:8080');
      expect(headers['Access-Control-Allow-Methods']).toContain('GET');
      expect(headers['Access-Control-Allow-Methods']).toContain('POST');
    });

    it('should include all required HTTP methods', () => {
      const headers = getCorsHeaders('http://localhost:3000');
      
      expect(headers['Access-Control-Allow-Methods']).toContain('GET');
      expect(headers['Access-Control-Allow-Methods']).toContain('POST');
      expect(headers['Access-Control-Allow-Methods']).toContain('PUT');
      expect(headers['Access-Control-Allow-Methods']).toContain('DELETE');
      expect(headers['Access-Control-Allow-Methods']).toContain('PATCH');
      expect(headers['Access-Control-Allow-Methods']).toContain('OPTIONS');
    });

    it('should include Authorization header', () => {
      const headers = getCorsHeaders();
      
      expect(headers['Access-Control-Allow-Headers']).toContain('Authorization');
      expect(headers['Access-Control-Allow-Headers']).toContain('Content-Type');
    });

    it('should allow credentials', () => {
      const headers = getCorsHeaders();
      
      expect(headers['Access-Control-Allow-Credentials']).toBe('true');
    });

    it('should use first allowed origin when origin not provided', () => {
      const headers = getCorsHeaders();
      const origins = getAllowedOrigins();
      
      expect(headers['Access-Control-Allow-Origin']).toBe(origins[0]);
    });

    it('should handle null origin', () => {
      const headers = getCorsHeaders(null);
      
      expect(headers['Access-Control-Allow-Origin']).toBeTruthy();
    });

    it('should fallback to first origin for disallowed origin', () => {
      const headers = getCorsHeaders('http://notallowed.com');
      const origins = getAllowedOrigins();
      
      expect(headers['Access-Control-Allow-Origin']).toBe(origins[0]);
    });

    it('should allow wildcard origins', () => {
      process.env.ALLOWED_ORIGINS = '*';
      
      const headers = getCorsHeaders('http://any.com');
      
      expect(headers['Access-Control-Allow-Origin']).toBe('http://any.com');
    });
  });

  describe('corsResponse', () => {
    it('should create response with CORS headers', () => {
      const data = { message: 'test' };
      const response = corsResponse(data);
      
      expect(response).toBeDefined();
    });

    it('should include custom status code', () => {
      const response = corsResponse({ error: 'Not found' }, { status: 404 });
      
      expect(response).toBeDefined();
    });

    it('should set CORS headers on response', () => {
      const response = corsResponse({ data: 'test' }, undefined, 'http://localhost:3000');
      
      expect(response.headers.get('Access-Control-Allow-Origin')).toBeTruthy();
    });
  });

  describe('corsOptionsResponse', () => {
    it('should create OPTIONS response with 200 status', () => {
      const response = corsOptionsResponse();
      
      expect(response).toBeDefined();
      expect(response.status).toBe(200);
    });

    it('should include CORS headers in OPTIONS response', () => {
      const response = corsOptionsResponse('http://localhost:8080');
      
      expect(response.headers.get('Access-Control-Allow-Methods')).toBeTruthy();
      expect(response.headers.get('Access-Control-Allow-Headers')).toBeTruthy();
    });

    it('should handle null origin in OPTIONS', () => {
      const response = corsOptionsResponse(null);
      
      expect(response).toBeDefined();
      expect(response.headers.get('Access-Control-Allow-Origin')).toBeTruthy();
    });
  });
});
