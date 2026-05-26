import { NextResponse } from "next/server";
import { randomWikipediaTitle } from "@/lib/wikipedia";

export async function GET() {
  const title = await randomWikipediaTitle();
  return NextResponse.json({ title });
}
