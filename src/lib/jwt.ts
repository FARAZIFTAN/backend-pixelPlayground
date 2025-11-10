import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';

export interface JWTPayload {
  userId: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
}

/**
 * Generate JWT token
 */
export const generateToken = (payload: JWTPayload): string => {
  // @ts-ignore - jwt.sign types are complex, but this works correctly at runtime
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRE });
};

/**
 * Verify JWT token
 */
export const verifyToken = (token: string): JWTPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error('JWT Verification Error:', error);
    return null;
  }
};

/**
 * Decode JWT token without verification (useful for expanded tokens)
 */
export const decodeToken = (token: string): JWTPayload | null => {
  try {
    const decoded = jwt.decode(token) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
};