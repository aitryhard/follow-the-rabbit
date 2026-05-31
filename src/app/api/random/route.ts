import { NextResponse } from "next/server";
import { randomWikipediaTitle } from "@/lib/wikipedia";

export async function GET() {
  try {
    const title = await randomWikipediaTitle();
    if (!title) {
      return NextResponse.json({ error: "No random article" }, { status: 502 });
    }
    return NextResponse.json({ title });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Random failed" },
      { status: 502 }
    );
  }
}
