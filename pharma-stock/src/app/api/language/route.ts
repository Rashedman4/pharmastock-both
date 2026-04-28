import { parse } from "cookie";
import { NextRequest, NextResponse } from "next/server";

const LANGUAGE_COOKIE_NAME = "preferred_language";
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year

export async function GET(req: NextRequest) {
  const cookies = parse(req.headers.get("cookie") || "");
  const language = cookies[LANGUAGE_COOKIE_NAME] || "en";
  return NextResponse.json({ language });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { language } = body;

  const response = NextResponse.json({ success: true });
  response.cookies.set(LANGUAGE_COOKIE_NAME, language, {
    maxAge: COOKIE_MAX_AGE,
    path: "/",
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
