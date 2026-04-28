import { NextRequest, NextResponse } from "next/server";
const API_SECRET_KEY = process.env.API_SECRET_KEY || "fallback-secret-key";

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key");
  if (apiKey !== API_SECRET_KEY) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { type, value } = await req.json();

  // Check if the symbol is present
  if (!value || !type) {
    return NextResponse.json(
      { error: `${type} name is required` },
      { status: 400 },
    );
  }

  try {
    // Parameters (for example, you might use these as query params

    // Make the GET request to the external API

    let apiResponse;
    if (type === "company") {
      apiResponse = await fetch(
        `https://financialmodelingprep.com/api/v4/price-target-analyst-company?company=${value}&apikey=${process.env.MY_API_KEY}`,
        { cache: "no-store" },
      );
    } else if (type === "analyst") {
      apiResponse = await fetch(
        `https://financialmodelingprep.com/api/v4/price-target-analyst-name?name=${value}&apikey=${process.env.MY_API_KEY}`,
        { cache: "no-store" },
      );
    } else if (type === "news") {
      apiResponse = await fetch(
        `https://financialmodelingprep.com/api/v4/price-target-rss-feed?page=0&apikey=${process.env.MY_API_KEY}`,
        { cache: "no-store" },
      );
    } else {
      apiResponse = await fetch(
        `https://financialmodelingprep.com/api/v4/price-target?symbol=${value}&apikey=${process.env.MY_API_KEY}`,
        { cache: "no-store" },
      );
    }

    // If the response is not okay, throw an error
    if (!apiResponse.ok) {
      throw new Error("Failed to fetch stock price target news");
    }

    // Convert the response to JSON
    const data: [] = await apiResponse.json();
    if (Array.isArray(data) && data.length === 0) {
      return NextResponse.json({ error: "No data found" }, { status: 404 });
    }
    // Send the data back to the client
    const returnedData =
      type === "symbol"
        ? data.slice(0, 6)
        : type === "news"
          ? data.slice(0, 25)
          : data.slice(0, 17);
    return NextResponse.json(returnedData, { status: 200 });
  } catch (error) {
    // Handle any errors
    return NextResponse.json({ err: error }, { status: 500 });
  }
}
