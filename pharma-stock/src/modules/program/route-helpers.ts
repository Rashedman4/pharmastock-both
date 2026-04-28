import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function getAuthUser(request: NextRequest) {
  const token = await getToken({ req: request });
  if (!token?.id) {
    return { error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }) };
  }

  return {
    userId: Number(token.id),
    role: typeof token.role === "string" ? token.role : "user",
  };
}

export async function requireAdmin(request: NextRequest) {
  const auth = await getAuthUser(request);
  if ("error" in auth) return auth;
  if (auth.role !== "admin") {
    return { error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }) };
  }
  return auth;
}
