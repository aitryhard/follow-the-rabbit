import { NextRequest, NextResponse } from "next/server";

const WIKI_BASE = "https://ru.wikipedia.org";

function extractLinks(html: string): { fullMatch: string; target: string; text: string }[] {
  const links: { fullMatch: string; target: string; text: string }[] = [];
  const regex = /<a\s+(?:[^>]*?\s+)?href="\/wiki\/([^"#]+)[^"]*"(?:\s+[^>]*?)?\s*(?:title="([^"]*)")?[^>]*>([^<]+)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(html)) !== null) {
    const target = decodeURIComponent(match[1].replace(/_/g, " "));
    const text = match[3].trim();

    if (
      text.length < 2 ||
      /^Special:/i.test(target) ||
      /^Wikipedia:/i.test(target) ||
      /^Help:/i.test(target) ||
      /^File:/i.test(target) ||
      /^Talk:/i.test(target) ||
      /^Category:/i.test(target) ||
      /^Template:/i.test(target) ||
      /^Portal:/i.test(target) ||
      /^User:/i.test(target) ||
      target === "Main_Page" ||
      target === "Заглавная_страница"
    ) {
      continue;
    }

    links.push({ fullMatch: match[0], target, text });
  }

  return links;
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
        proximitySvg === "fullrabbit" ? "28px" :
        proximitySvg === "pawspair" ? "32px" :
        "20px";

      for (const link of selected) {
        const replacement = `<a href="#" data-rabbit-target="${link.target.replace(/"/g, "&quot;")}" class="rabbit-mark-link" style="color:#b45309!important;cursor:pointer!important;border-bottom:2px dashed rgba(217,119,6,0.6)!important;text-decoration:none!important;background:rgba(255,251,235,0.9)!important;padding:0 2px!important;border-radius:2px!important;font-weight:600!important">${link.text}</a><img src="/${proximitySvg}.svg" alt="" style="display:inline-block;width:${iconSize};height:${iconSize};vertical-align:middle;margin-left:2px;opacity:0.7">`;
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
