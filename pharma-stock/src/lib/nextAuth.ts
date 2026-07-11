import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import GoogleProvider from "next-auth/providers/google";
import AppleProvider from "next-auth/providers/apple";
import pool from "@/lib/db";
import crypto from "crypto";

function generateAppleClientSecret(): string {
  const privateKey = (process.env.APPLE_PRIVATE_KEY ?? "").replace(/\\n/g, "\n");
  const keyId = process.env.APPLE_KEY_ID ?? "";
  const teamId = process.env.APPLE_TEAM_ID ?? "";
  const serviceId = process.env.APPLE_WEB_SERVICE_ID ?? "";

  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "ES256", kid: keyId })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({ iss: teamId, iat: now, exp: now + 15777000, aud: "https://appleid.apple.com", sub: serviceId })
  ).toString("base64url");

  const signingInput = `${header}.${payload}`;
  const sign = crypto.createSign("SHA256");
  sign.update(signingInput);
  const signature = sign
    .sign({ key: privateKey, dsaEncoding: "ieee-p1363" })
    .toString("base64url");
  return `${signingInput}.${signature}`;
}

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
      async authorize(credentials) {
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
            clientSecret: generateAppleClientSecret(),
          }),
        ]
      : []),
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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role as string;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as string;
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
