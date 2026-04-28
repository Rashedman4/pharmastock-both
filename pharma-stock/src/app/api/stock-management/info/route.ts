import { NextRequest, NextResponse } from "next/server";

const API_SECRET_KEY = process.env.API_SECRET_KEY || "fallback-secret-key";

export async function POST(req: NextRequest) {
  // Verify the API secret key
  const apiKey = req.headers.get("x-api-key");
  if (apiKey !== API_SECRET_KEY) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { symbol } = await req.json();

  // Check if the symbol is present
  if (!symbol) {
    return NextResponse.json(
      { error: "Stock symbol is required" },
      { status: 400 },
    );
  }

  try {
    // Make the GET request to the external API
    const apiResponse = await fetch(
      `https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${process.env.MY_API_KEY}`,
      { cache: "no-store" },
    );

    // If the response is not okay, throw an error
    if (!apiResponse.ok) {
      throw new Error("Failed to fetch stock data");
    }

    // Convert the response to JSON
    const data = await apiResponse.json();

    // Check if the data array is empty
    if (Array.isArray(data) && data.length === 0) {
      return NextResponse.json({ error: "No data found" }, { status: 404 });
    }

    // Send the data back to the client
    return NextResponse.json(data[0], { status: 200 });
  } catch (error) {
    // Handle any errors
    console.error("Error fetching stock data:", error);
    return NextResponse.json(
      { error: "Failed to fetch stock data" },
      { status: 500 },
    );
  }
}
