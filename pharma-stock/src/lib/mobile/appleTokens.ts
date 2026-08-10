import { generateAppleClientSecret } from './appleClientSecret';

const APPLE_TOKEN_URL = 'https://appleid.apple.com/auth/token';
const APPLE_REVOKE_URL = 'https://appleid.apple.com/auth/revoke';
const APPLE_REQUEST_TIMEOUT_MS = 10_000;

interface AppleTokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
}

// Exchanges the one-time authorizationCode from the mobile app's native
// Sign in with Apple flow for a long-lived refresh_token, so it can later be
// revoked on account deletion. Best-effort: returns null on any failure
// rather than throwing, since this must never block login.
export async function exchangeAppleAuthorizationCode(authorizationCode: string): Promise<string | null> {
  const clientId = process.env.APPLE_BUNDLE_ID ?? '';
  try {
    const res = await fetch(APPLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: generateAppleClientSecret(clientId),
        code: authorizationCode,
        grant_type: 'authorization_code',
      }),
      signal: AbortSignal.timeout(APPLE_REQUEST_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as AppleTokenResponse;
    return data.refresh_token ?? null;
  } catch (error) {
    console.error('Apple authorization code exchange failed:', error);
    return null;
  }
}

// Disconnects a user's Sign in with Apple association (App Review guideline
// 5.1.1(v)). Best-effort: returns false on any failure rather than throwing,
// since account deletion must proceed even if Apple's API is unreachable.
export async function revokeAppleRefreshToken(refreshToken: string): Promise<boolean> {
  const clientId = process.env.APPLE_BUNDLE_ID ?? '';
  try {
    const res = await fetch(APPLE_REVOKE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: generateAppleClientSecret(clientId),
        token: refreshToken,
        token_type_hint: 'refresh_token',
      }),
      signal: AbortSignal.timeout(APPLE_REQUEST_TIMEOUT_MS),
    });
    return res.ok;
  } catch (error) {
    console.error('Apple token revocation failed:', error);
    return false;
  }
}
