import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import GoogleProvider from "next-auth/providers/google";
import AppleProvider from "next-auth/providers/apple";
import pool from "@/lib/db";
import { createRateLimiter, getClientIPFromHeaders } from "@/lib/rate-limit";
import { hashToken } from "@/lib/mobile/jwt";
import { generateAppleClientSecret } from "@/lib/mobile/appleClientSecret";

const loginLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 10 });
const handoffLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 20 });

const appleWebEnabled = !!(
  process.env.APPLE_WEB_SERVICE_ID &&
  process.env.APPLE_TEAM_ID &&
  process.env.APPLE_KEY_ID &&
  process.env.APPLE_PRIVATE_KEY
);

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        const ip = getClientIPFromHeaders(
          req?.headers as Record<string, string | string[] | undefined> | undefined
        );
        if (!loginLimiter(`login:${ip}`)) {
          throw new Error("Too many login attempts. Please try again later.");
        }

        const client = await pool.connect();
        try {
          const userQuery = `SELECT * FROM users WHERE email = $1`;
          const result = await client.query(userQuery, [credentials?.email]);

          const user = result.rows[0];
          if (!user) {
            throw new Error("No user found with this email");
          }
          if (user.provider === "google" || user.provider === "apple") {
            throw new Error("Email registered with social login");
          }
          const isValid = await bcrypt.compare(
            credentials?.password as string,
            user.password as string
          );
          if (!isValid) {
            throw new Error("Invalid password");
          }

          return { id: user.id, role: user.role, email: user.email };
        } finally {
          client.release();
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    ...(appleWebEnabled
      ? [
          AppleProvider({
            clientId: process.env.APPLE_WEB_SERVICE_ID as string,
            clientSecret: generateAppleClientSecret(process.env.APPLE_WEB_SERVICE_ID as string),
          }),
        ]
      : []),
    CredentialsProvider({
      id: "mobile-handoff",
      name: "Mobile Handoff",
      credentials: {
        token: { label: "Token", type: "text" },
      },
      async authorize(credentials, req) {
        const ip = getClientIPFromHeaders(
          req?.headers as Record<string, string | string[] | undefined> | undefined
        );
        if (!handoffLimiter(`handoff:${ip}`)) {
          throw new Error("Too many attempts. Please try again later.");
        }

        const raw = credentials?.token;
        if (!raw) throw new Error("Missing token");
        const tokenHash = hashToken(raw);

        const result = await pool.query(
          `UPDATE mobile_web_handoff_tokens
           SET consumed_at = NOW()
           WHERE token_hash = $1 AND consumed_at IS NULL AND expires_at > NOW()
           RETURNING user_id, redirect_path`,
          [tokenHash]
        );
        const row = result.rows[0];
        if (!row) throw new Error("Token expired or already used");

        const userResult = await pool.query(
          `SELECT id, email, role FROM users WHERE id = $1`,
          [row.user_id]
        );
        const user = userResult.rows[0];
        if (!user) throw new Error("User not found");

        pool
          .query(
            `INSERT INTO elite_activity_logs (actor_user_id, entity_type, action, note)
             VALUES ($1, 'MOBILE_HANDOFF', 'PAYMENT_HANDOFF_CONSUMED', 'Mobile-to-web payment handoff')`,
            [user.id]
          )
          .catch(() => {});

        return {
          id: user.id,
          role: user.role,
          email: user.email,
          redirectPath: row.redirect_path as string,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60 * 30, // 30 days
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        const client = await pool.connect();
        try {
          const userQuery = `SELECT * FROM users WHERE provider = $1 AND provider_id = $2`;
          const result = await client.query(userQuery, [
            account.provider,
            account.providerAccountId,
          ]);

          let existingUser = result.rows[0];

          if (!existingUser) {
            const insertUserQuery = `
              INSERT INTO users (provider_email, provider, provider_id, password, created_at, email)
              VALUES ($1, $2, $3, $4, NOW(),$5)
              RETURNING id, email;
`;

            const insertResult = await client.query(insertUserQuery, [
              profile?.email,
              account.provider,
              account.providerAccountId,
              "oauth_password",
              profile?.email,
            ]);

            existingUser = insertResult.rows[0];
          }

          user.id = existingUser.id;
          return true;
        } catch (error) {
          console.error("Error during Google sign-in:", error);
          return false;
        } finally {
          client.release();
        }
      }

      if (account?.provider === "apple") {
        const client = await pool.connect();
        try {
          // 1. Find by Apple provider_id
          let existingUser = (
            await client.query(
              `SELECT id, email FROM users WHERE provider = 'apple' AND provider_id = $1`,
              [account.providerAccountId]
            )
          ).rows[0] ?? null;

          if (!existingUser) {
            const email = profile?.email ?? user.email ?? null;

            // 2. Find existing account by email and link it
            const emailUser = email
              ? ((await client.query(`SELECT id, email FROM users WHERE email = $1`, [email])).rows[0] ?? null)
              : null;

            if (emailUser) {
              await client.query(
                `UPDATE users SET provider = 'apple', provider_id = $1, provider_email = $2 WHERE id = $3`,
                [account.providerAccountId, email, emailUser.id]
              );
              existingUser = emailUser;
            } else {
              // 3. Create new user — email required on first Apple auth
              if (!email) return "/en/auth/login?error=apple_no_email";
              const insertResult = await client.query(
                `INSERT INTO users (email, provider_email, provider, provider_id, password, created_at)
                 VALUES ($1, $1, 'apple', $2, 'oauth_placeholder', NOW())
                 RETURNING id, email`,
                [email, account.providerAccountId]
              );
              existingUser = insertResult.rows[0];
            }
          }

          user.id = existingUser.id;
          return true;
        } catch (error) {
          console.error("Error during Apple sign-in:", error);
          return false;
        } finally {
          client.release();
        }
      }

      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = user.role as string;
      }
      if (account?.provider === "mobile-handoff" && (user as any)?.redirectPath) {
        token.handoffRedirect = (user as any).redirectPath as string;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as string;
      if (token.handoffRedirect) {
        (session as any).handoffRedirect = token.handoffRedirect;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  /*  debug: true,
  logger: {
    error: (code, metadata) => {
      console.error(code, metadata);
    },
    warn: (code) => {
      console.warn(code);
    },
    debug: (code, metadata) => {
      console.debug(code, metadata);
    },
  }, */
};
