import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from './auth';

/**
 * Verify that the user is an admin
 */
export async function verifyAdmin(request: NextRequest) {
  const authUser = await verifyAuth(request);

  if (!authUser) {
    return null;
  }

  // Check if user has admin role
  if (authUser.role !== 'admin') {
    return null;
  }

  return authUser;
}

/**
 * Return forbidden response for non-admin users
 */
export function forbiddenResponse(message: string = 'Access denied. Admin only.') {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    { status: 403 }
  );
}
