import { NextRequest, NextResponse } from "next/server";

const WIKI_BASE = "https://ru.wikipedia.org";

function extractLinks(html: string): { fullMatch: string; target: string; text: string }[] {
  const nonContentStart = findNonContentStart(html);
  const links: { fullMatch: string; target: string; text: string }[] = [];
  const regex = /<a\s+(?:[^>]*?\s+)?href="\/wiki\/([^"#]+)[^"]*"(?:\s+[^>]*?)?\s*(?:title="([^"]*)")?[^>]*>([^<]+)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(html)) !== null) {
    if (nonContentStart > 0 && match.index >= nonContentStart) continue;

    const fullMatch = match[0];
    const target = decodeURIComponent(match[1].replace(/_/g, " "));
    const text = match[3].trim();

    const excluded = /^(Special|Wikipedia|Help|File|Talk|Category|Template|Portal|User|Служебная|Википедия|Справка|Файл|Обсуждение|Категория|Шаблон|Портал|Участник|Модуль|Module|MediaWiki|Media|Image):/i;
    if (
      text.length < 2 ||
      excluded.test(target) ||
      target === "Main Page" ||
      target === "Заглавная страница"
    ) {
      continue;
    }

    links.push({ fullMatch, target, text });
  }

  return links;
}

function findNonContentStart(html: string): number {
  const contentAnchor = html.search(/id="mw-content-text"/i);
  const searchFrom = contentAnchor >= 0 ? contentAnchor : 0;

  const markers = [
    /<div[^>]*\bclass="[^"]*catlinks[^"]*"[^>]*>/i,
    /<div[^>]*\bclass="[^"]*navbox[^"]*"[^>]*>/i,
    /<div[^>]*\bclass="[^"]*authority-control[^"]*"[^>]*>/i,
    /<div[^>]*\bid="catlinks"[^>]*>/i,
  ];
  let earliest = html.length;
  for (const m of markers) {
    const slice = html.slice(searchFrom);
    const match = slice.match(m);
    if (match && match.index !== undefined) {
      const idx = searchFrom + match.index;
      if (idx < earliest) earliest = idx;
    }
  }
  return earliest;
}

function seededRandom(seed: string): () => number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  let s = h >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) | 0;
    return (s >>> 0) / 4294967296;
  };
}

function shuffleWithSeed<T>(arr: T[], seed: string): T[] {
  const rand = seededRandom(seed);
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export async function GET(request: NextRequest) {
  const title = request.nextUrl.searchParams.get("title");
  const step = parseInt(request.nextUrl.searchParams.get("step") || "0");
  const total = parseInt(request.nextUrl.searchParams.get("total") || "0");
  const seed = request.nextUrl.searchParams.get("seed") || "";

  if (!title) {
    return new NextResponse("Missing title", { status: 400 });
  }

  const origin = request.nextUrl.origin;

  try {
    const wikiRes = await fetch(
      `${WIKI_BASE}/wiki/${encodeURIComponent(title)}`,
      { headers: { "User-Agent": "FollowTheRabbit/1.0" } }
    );

    if (!wikiRes.ok) {
      return new NextResponse("Page not found", { status: 404 });
    }

    let html = await wikiRes.text();

    html = html.replace("<head>", '<head><base href="https://ru.wikipedia.org/">');
    html = html.replace(/<meta\s+http-equiv="Content-Security-Policy"[^>]*\/?>/gi, "");
    html = html.replace(/<meta\s+http-equiv="X-Frame-Options"[^>]*\/?>/gi, "");

    const isRabbit =
      title === "Rabbit" || title === "Кролик" || title === "Кролики";

    if (!isRabbit) {
      const links = extractLinks(html);
      const perStepSeed = `${seed}-${step}`;
      const shuffled = shuffleWithSeed(links, perStepSeed);
      const selected = shuffled.slice(0, 1);

      const progress = total > 0 ? step / total : 0;
      let proximitySvg = "singlepaw";
      if (step === total) proximitySvg = "fullrabbit";
      else if (progress >= 0.85) proximitySvg = "noseprofile";
      else if (progress >= 0.65) proximitySvg = "ears";
      else if (progress >= 0.4) proximitySvg = "carrot";
      else if (progress >= 0.2) proximitySvg = "pawspair";

      const iconSize =
        proximitySvg === "fullrabbit" ? "42px" :
        proximitySvg === "pawspair" ? "48px" :
        "32px";

      for (const link of selected) {
        const replacement = `<a href="#" data-rabbit-target="${link.target.replace(/"/g, "&quot;")}" class="rabbit-mark-link" style="color:#ea580c!important;cursor:pointer!important;border-bottom:3px solid rgba(234,88,12,0.7)!important;text-decoration:none!important;background:rgba(255,237,213,0.95)!important;padding:1px 3px!important;border-radius:3px!important;font-weight:700!important;box-shadow:0 0 6px rgba(234,88,12,0.3)!important">${link.text}</a><img src="${origin}/${proximitySvg}.svg" alt="" style="display:inline-block;width:${iconSize};height:${iconSize};vertical-align:middle;margin-left:3px">`;
        html = html.replace(link.fullMatch, replacement);
      }
    }

    const scriptTag = `<script>
document.addEventListener('click',function(e){
  var link=e.target.closest('.rabbit-mark-link');
  if(link){
    e.preventDefault();
    var t=link.getAttribute('data-rabbit-target');
    if(t) window.parent.postMessage({type:'rabbit-hop',target:t},'*');
    return;
  }
  var a=e.target.closest('a[href^="/wiki/"]');
  if(a){
    e.preventDefault();
    var h=a.getAttribute('href').replace('/wiki/','').replace(/#.*$/,'');
    window.parent.postMessage({type:'rabbit-hop',target:decodeURIComponent(h)},'*');
  }
});
</script>`;

    html = html.replace("</body>", `${scriptTag}</body>`);

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch {
    return new NextResponse("Failed to load", { status: 500 });
  }
}
