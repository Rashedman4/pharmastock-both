import { NextRequest } from 'next/server';
import { verifyAccessToken } from './jwt';

export function getMobileAuthPayload(
  req: NextRequest
): { userId: number; email: string } | null {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  return verifyAccessToken(token);
}
