import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const title = request.nextUrl.searchParams.get("title");
  if (!title) {
    return new NextResponse("Missing title", { status: 400 });
  }

  try {
    const wikiRes = await fetch(
      `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`,
      {
        headers: {
          "User-Agent": "FollowTheRabbit/1.0 (educational-project)",
        },
      }
    );

    if (!wikiRes.ok) {
      return new NextResponse("Page not found", { status: 404 });
    }

    let html = await wikiRes.text();

    html = html.replace(
      "<head>",
      '<head><base href="https://en.wikipedia.org/">'
    );

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch {
    return new NextResponse("Failed to load page", { status: 500 });
  }
}
