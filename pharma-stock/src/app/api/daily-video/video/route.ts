import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getToken } from "next-auth/jwt";

// POST handler
export async function POST(req: NextRequest) {
  const client = await pool.connect();
  try {
    const token = await getToken({ req });

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check authorized emails
    const authorizedEmails = process.env.AUTHORIZED_EMAILS?.split(",") || [];
    if (!authorizedEmails.includes(token.email as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      title_en,
      title_ar,
      content_en,
      content_ar,
      link,
      key_points_en,
      key_points_ar,
      duration,
    } = await req.json();

    // Validate required fields
    if (
      !title_en ||
      !title_ar ||
      !content_en ||
      !content_ar ||
      !link ||
      !key_points_en ||
      !key_points_ar ||
      !duration
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Convert key_points arrays to strings
    const keyPointsEnString = JSON.stringify(key_points_en);
    const keyPointsArString = JSON.stringify(key_points_ar);

    // Insert into database
    await client.query(
      `INSERT INTO videos (
        title_en, title_ar, content_en, content_ar,
        link, key_points_en, key_points_ar, duration
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        title_en,
        title_ar,
        content_en,
        content_ar,
        link,
        keyPointsEnString,
        keyPointsArString,
        duration,
      ]
    );

    return NextResponse.json({ message: "Video created successfully" });
  } catch (error) {
    console.error("Error creating video:", error);
    return NextResponse.json(
      { error: "Failed to create video" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// GET handler
export async function GET() {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT *
      FROM videos
      ORDER BY created_at DESC
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "No videos found" }, { status: 404 });
    }

    const video = result.rows[0];

    // Parse key_points back to arrays
    return NextResponse.json({
      ...video,
      key_points_en: JSON.parse(video.key_points_en),
      key_points_ar: JSON.parse(video.key_points_ar),
    });
  } catch (error) {
    console.error("Error fetching video:", error);
    return NextResponse.json(
      { error: "Failed to fetch video" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
