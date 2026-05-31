import { NextRequest, NextResponse } from "next/server";
import { extractLinks, weightedPick, seededRandom } from "@/lib/render-logic";

const WIKI_BASE = "https://ru.wikipedia.org";
const TIMEOUT_MS = 12000;
const MAX_ATTEMPTS = 3;

async function fetchWithRetry(url: string): Promise<Response> {
  let lastError = "";

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "FollowTheRabbit/1.0",
          "Accept-Language": "ru",
        },
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (res.ok) return res;

      lastError = `Wikipedia ${res.status}`;
      if (res.status === 404) break;
      if (res.status === 429) {
        await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
        continue;
      }
    } catch (err) {
      clearTimeout(timer);
      lastError = err instanceof Error ? err.message : "Сетевая ошибка";
    }

    if (attempt < MAX_ATTEMPTS - 1) {
      await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
    }
  }

  throw new Error(lastError);
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
    const wikiRes = await fetchWithRetry(
      `${WIKI_BASE}/wiki/${encodeURIComponent(title)}`
    );

    let html = await wikiRes.text();

    html = html.replace(
      "<head>",
      '<head><base href="https://ru.wikipedia.org/">'
    );
    html = html.replace(
      /<meta\s+http-equiv="Content-Security-Policy"[^>]*\/?>/gi,
      ""
    );
    html = html.replace(
      /<meta\s+http-equiv="X-Frame-Options"[^>]*\/?>/gi,
      ""
    );

    const isRabbit =
      title === "Rabbit" || title === "Кролик" || title === "Кролики";

    if (!isRabbit) {
      const links = extractLinks(html);
      const perStepSeed = `${seed}-${step}`;
      const rand = seededRandom(perStepSeed);
      const progress = total > 0 ? step / total : 0;

      let selected: { fullMatch: string; target: string; text: string }[];

      if (step > total) {
        // Penultimate step: inject a visible "Кролик" marker at the end of content
        const markerBlock = `<p style="text-align:center;margin:2em 0;font-size:1.15em"><a href="#" data-rabbit-target="Кролик" class="rabbit-mark-link" style="color:#ea580c!important;cursor:pointer!important;border-bottom:3px solid rgba(234,88,12,0.7)!important;text-decoration:none!important;background:rgba(255,237,213,0.95)!important;padding:2px 6px!important;border-radius:4px!important;font-weight:700!important;box-shadow:0 0 8px rgba(234,88,12,0.4)!important;font-size:1.1em!important">Кролик</a><img src="${origin}/fullrabbit.svg" alt="" style="display:inline-block;width:42px;height:42px;vertical-align:middle;margin-left:6px"></p>`;
        html = html.replace("</body>", `${markerBlock}</body>`);
        selected = []; // skip link replacement, we injected our own
      } else {
        const bias = Math.pow(progress, 2.5) * 8;
        const pick = weightedPick(links, rand, bias);
        selected = [pick];
      }

      let proximitySvg = "singlepaw";
      if (step > total) proximitySvg = "fullrabbit";
      else if (progress >= 0.85) proximitySvg = "noseprofile";
      else if (progress >= 0.65) proximitySvg = "ears";
      else if (progress >= 0.4) proximitySvg = "carrot";
      else if (progress >= 0.2) proximitySvg = "pawspair";

      const iconSize =
        proximitySvg === "fullrabbit"
          ? "42px"
          : proximitySvg === "pawspair"
            ? "48px"
            : "32px";

      for (const link of selected) {
        const replacement = `<a href="#" data-rabbit-target="${link.target.replace(
          /"/g,
          "&quot;"
        )}" class="rabbit-mark-link" style="color:#ea580c!important;cursor:pointer!important;border-bottom:3px solid rgba(234,88,12,0.7)!important;text-decoration:none!important;background:rgba(255,237,213,0.95)!important;padding:1px 3px!important;border-radius:3px!important;font-weight:700!important;box-shadow:0 0 6px rgba(234,88,12,0.3)!important">${link.text}</a><img src="${origin}/${proximitySvg}.svg" alt="" style="display:inline-block;width:${iconSize};height:${iconSize};vertical-align:middle;margin-left:3px">`;
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
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : "Не удалось загрузить";
    return new NextResponse(
      `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:40px;text-align:center;color:#555"><p>${msg}</p><p style="font-size:14px">Попробуйте кнопку «Повторить»</p></body></html>`,
      {
        status: 502,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }
    );
  }
}
