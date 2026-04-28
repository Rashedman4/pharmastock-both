import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { unstable_cache } from "next/cache";

// Cache key and revalidation time
const CACHE_KEY = "signal_history";
const CACHE_TIME = 60; // 1 minute

// Cached function
const getSignalHistory = unstable_cache(
  async () => {
    const client = await pool.connect();
    const result = await client.query(
      "SELECT * FROM signal_history ORDER BY closing_date DESC"
    );
    client.release();

    return result.rows;
  },
  [CACHE_KEY],
  { revalidate: CACHE_TIME }
);

// GET handler
export const GET = async () => {
  try {
    const data = await getSignalHistory();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error fetching signal history:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
};
