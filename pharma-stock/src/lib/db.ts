import { Pool } from "pg";

// Store the pool on global so it survives Next.js hot reloads in dev — same
// pattern used for the Socket.IO server (src/lib/socket/socket-server.ts).
// Without this, every dev-mode recompile of a route that imports this module
// creates a brand new Pool (each with its own `max: 20` connections) without
// closing the previous one, so the old pools' connections are never released.
// Over a session with many edits, the accumulated connections from those
// leaked pools eventually exhaust Postgres's own connection limit, which
// then makes every query from *every* pool (including the current one) queue
// up and time out together — surfacing as "everything on this page failed to
// load," recovering only once enough leaked connections are reclaimed
// (idleTimeoutMillis) or a query happens to land in a moment of less
// contention.
const g = global as typeof globalThis & { _pgPool?: Pool };

const pool =
  g._pgPool ??
  new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS,
    port: parseInt(process.env.DB_PORT as string, 10),
    max: 20,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : undefined,
  });

if (process.env.NODE_ENV !== "production") {
  g._pgPool = pool;
}

pool.on("connect", () => {});

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
});

export default pool;
