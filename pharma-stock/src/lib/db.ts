import { Pool } from "pg";

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME, //  database name
  password: process.env.DB_PASS, //  password
  port: parseInt(process.env.DB_PORT as string, 10), //  port
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on("connect", () => {});

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
});

export default pool;
