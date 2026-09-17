import { NextResponse } from "next/server";
import { getNewsPage } from "@/lib/queries/news";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const symbol = searchParams.get("symbol") || "";

  try {
    const result = await getNewsPage({ page, symbol });
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Error fetching news, error: " + error },
      { status: 500 },
    );
  }
}
