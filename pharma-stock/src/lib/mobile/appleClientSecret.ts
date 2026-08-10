import crypto from 'crypto';

// Builds the ES256 JWT "client_secret" Apple's Sign in with Apple REST API
// requires on every call (token exchange, revoke). `clientId` is the "sub"
// claim: the app's Bundle ID for native mobile flows, or a Services ID for
// web-based flows — same signing key can back both as long as the Apple
// Developer key is scoped to a shared App ID group.
export function generateAppleClientSecret(clientId: string): string {
  const privateKey = (process.env.APPLE_PRIVATE_KEY ?? '').replace(/\\n/g, '\n');
  const keyId = process.env.APPLE_KEY_ID ?? '';
  const teamId = process.env.APPLE_TEAM_ID ?? '';

  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'ES256', kid: keyId })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({ iss: teamId, iat: now, exp: now + 15777000, aud: 'https://appleid.apple.com', sub: clientId })
  ).toString('base64url');

  const signingInput = `${header}.${payload}`;
  const sign = crypto.createSign('SHA256');
  sign.update(signingInput);
  const signature = sign.sign({ key: privateKey, dsaEncoding: 'ieee-p1363' }).toString('base64url');
  return `${signingInput}.${signature}`;
}
