import { NextRequest, NextResponse } from "next/server";
import { searchWikipedia } from "@/lib/wikipedia";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await searchWikipedia(q);
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
