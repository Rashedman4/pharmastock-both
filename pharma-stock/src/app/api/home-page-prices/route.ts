import { NextResponse } from "next/server";

const STOCK_SYMBOLS = [
  "JNJ",
  "SNY",
  "MRK",
  "ABBV",
  "LLY",
  "AMGN",
  "AZN",
  "NVS",
  "NVO",
  "JNJ",
];

const API_KEY = process.env.MY_API_KEY;
const API_URL =
  "https://financialmodelingprep.com/stable/search-exchange-variants?symbol=";

// Simple in-memory cache
let cache: { data: any; timestamp: number } | null = null;
const CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours in ms

export async function GET() {
  // Check cache
  if (cache && Date.now() - cache.timestamp < CACHE_DURATION) {
    return NextResponse.json(cache.data, { status: 200 });
  }

  const results: any[] = [];

  for (const symbol of STOCK_SYMBOLS) {
    try {
      const res = await fetch(`${API_URL}${symbol}&apikey=${API_KEY}`);
      if (!res.ok) continue;
      const data = await res.json();
      if (!Array.isArray(data) || !data[0]) continue;
      const d = data[0];
      results.push({
        symbol: d.symbol,
        name: d.companyName,
        price: d.price,
        change: d.changes,
        image: d.image,
      });
    } catch (e) {
      // skip on error
      console.log(e);
      continue;
    }
  }

  // Cache the result
  cache = { data: results, timestamp: Date.now() };
  return NextResponse.json(results, { status: 200 });
}
