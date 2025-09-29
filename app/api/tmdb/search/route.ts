import { searchTmdb } from "@/lib/tmdb";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query");

  if (!query) {
    return NextResponse.json({ error: "Query parameter is required" }, { status: 400 });
  }

  try {
    const data = await searchTmdb(query);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in TMDB search API:", error);
    return NextResponse.json({ error: "Failed to fetch from TMDB" }, { status: 500 });
  }
}
