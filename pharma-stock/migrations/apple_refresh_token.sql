-- Apple Sign-In token revocation support
-- Run with: psql $DATABASE_URL -f migrations/apple_refresh_token.sql
--
-- Stores an encrypted Apple OAuth refresh token per user (obtained by exchanging
-- the authorizationCode from expo-apple-authentication's native sign-in flow),
-- so that on self-service account deletion (DELETE /api/mobile/v1/me) we can
-- call Apple's /auth/revoke endpoint and properly disconnect the Sign in with
-- Apple association, per App Review guideline 5.1.1(v).
--
-- Encrypted (AES-256-GCM, see src/lib/mobile/appleTokenCrypto.ts) rather than
-- hashed, since the raw token must be recoverable to send back to Apple.

ALTER TABLE users ADD COLUMN IF NOT EXISTS apple_refresh_token_enc TEXT;
