// /app/api/log/route.ts
import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getToken } from "next-auth/jwt";

async function getGeoData(ip: string) {
  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`);
    if (!res.ok) throw new Error("Geo API failed");
    return await res.json();
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const token = await getToken({ req: request }); // Will be null if user not logged in

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { path } = body;
  if (!path || typeof path !== "string") {
    return NextResponse.json({ error: "Path is required" }, { status: 400 });
  }

  const userId = token?.id ?? null; // null if guest
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const geo = ip !== "unknown" ? await getGeoData(ip) : null;

  // User-Agent
  const userAgent = request.headers.get("user-agent") || null;

  const client = await pool.connect();
  try {
    const insertQuery = `
    INSERT INTO path_log (path, user_id, country, region,ip,user_agent)
    VALUES ($1, $2, $3, $4, $5, $6)
  `;
    await client.query(insertQuery, [
      path,
      userId,
      geo?.country_name || null,
      geo?.region || null,
      ip,
      userAgent,
    ]);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error logging path:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  } finally {
    client.release();
  }
}
