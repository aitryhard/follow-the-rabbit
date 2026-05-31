import { NextRequest, NextResponse } from "next/server";
import { fetchRawArticle } from "@/lib/wikipedia";
import { extractLinks, weightedPick, seededRandom } from "@/lib/render-logic";

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
    const raw = await fetchRawArticle(title);

    const isRabbit =
      title === "Rabbit" || title === "Кролик" || title === "Кролики";

    let contentHtml = raw.html;
    const headContent = raw.headHtml;

    if (!isRabbit) {
      // Find one rabbit mark in the content
      const links = extractLinks(raw.html);
      const perStepSeed = `${seed}-${step}`;
      const rand = seededRandom(perStepSeed);
      const progress = total > 0 ? step / total : 0;

      let selected: { fullMatch: string; target: string; text: string }[];

      if (step > total) {
        const rabbitWords = /кролик|крольч|заяц|зайц|крол|rabbit/i;
        const directLink = links.find((l) => rabbitWords.test(l.text));
        if (directLink) {
          selected = [{ ...directLink, target: "Кролик" }];
        } else {
          const anyRabbit = links.find((l) => rabbitWords.test(l.target));
          if (anyRabbit) {
            selected = [{ ...anyRabbit, target: "Кролик" }];
          } else {
            // Fallback: inject marker
            contentHtml += `<p style="text-align:center;margin:2em 0;font-size:1.15em"><a href="#" data-rabbit-target="Кролик" class="rabbit-mark-link" style="color:#ea580c!important;cursor:pointer!important;border-bottom:3px solid rgba(234,88,12,0.7)!important;text-decoration:none!important;background:rgba(255,237,213,0.95)!important;padding:2px 6px!important;border-radius:4px!important;font-weight:700!important;box-shadow:0 0 8px rgba(234,88,12,0.4)!important;font-size:1.1em!important">Кролик</a><img src="${origin}/fullrabbit.svg" alt="" style="display:inline-block;width:42px;height:42px;vertical-align:middle;margin-left:6px"></p>`;
            selected = [];
          }
        }
      } else {
        const bias = Math.pow(progress, 3) * 20;
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
        contentHtml = contentHtml.replace(link.fullMatch, replacement);
      }
    }

    const html = `<!DOCTYPE html>
<html class="client-nojs vector-feature-language-in-header-enabled skin-theme-clientpref-day" lang="ru" dir="ltr">
<head>
<meta charset="UTF-8">
<base href="https://ru.wikipedia.org/">
<link rel="stylesheet" href="/w/load.php?lang=ru&amp;modules=mediawiki.skinning.content.parsoid%7Cmediawiki.skinning.interface%7Cskins.vector.styles%7Csite.styles&amp;only=styles">
${headContent}
<style>
  html, body { margin:0; padding:0; background:#fff; }
  body { font-family: sans-serif; }
  .mw-parser-output { padding: 1.5em; }
  .rabbit-mark-wrap { display: inline; position: relative; }
  .rabbit-mark-link:hover { filter: brightness(0.95); }
  .mw-editsection { display: none; }
</style>
</head>
<body class="skin-vector mediawiki ltr sitedir-ltr mw-hide-empty-elt skin-vector-2022 action-view">
<div id="content" class="mw-body" role="main">
  <div id="bodyContent" class="vector-body">
    <div id="mw-content-text" class="mw-body-content">
      <div class="mw-content-ltr mw-parser-output" lang="ru" dir="ltr">
        ${contentHtml}
      </div>
    </div>
  </div>
</div>
<script>
document.addEventListener('click',function(e){
  var link=e.target.closest('.rabbit-mark-link');
  if(link){
    e.preventDefault();
    var t=link.getAttribute('data-rabbit-target');
    if(t) window.parent.postMessage({type:'rabbit-hop',target:t},'*');
  }
});
</script>
</body>
</html>`;

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
      `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:40px;text-align:center;color:#555"><p>${msg}</p></body></html>`,
      {
        status: 502,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }
    );
  }
}
