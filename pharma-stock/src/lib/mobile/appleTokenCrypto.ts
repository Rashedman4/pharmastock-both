import crypto from 'crypto';

// Apple's refresh token must be recoverable in plaintext to send back to
// Apple's /auth/revoke endpoint on account deletion, so it's encrypted
// (AES-256-GCM) rather than hashed like our own mobile_refresh_tokens.
function getKey(): Buffer {
  const raw = process.env.APPLE_TOKEN_ENC_KEY ?? '';
  const key = Buffer.from(raw, 'hex');
  if (key.length !== 32) {
    throw new Error('APPLE_TOKEN_ENC_KEY must be a 64-character hex string (32 bytes)');
  }
  return key;
}

export function encryptAppleToken(token: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString('base64'), authTag.toString('base64'), ciphertext.toString('base64')].join('.');
}

export function decryptAppleToken(encoded: string): string {
  const [ivB64, tagB64, dataB64] = encoded.split('.');
  const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  const plaintext = Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]);
  return plaintext.toString('utf8');
}
