import { NextRequest, NextResponse } from "next/server";
import { fetchArticleWithMarks } from "@/lib/wikipedia";

export async function GET(request: NextRequest) {
  const title = request.nextUrl.searchParams.get("title");
  const step = parseInt(request.nextUrl.searchParams.get("step") || "0");
  const total = parseInt(request.nextUrl.searchParams.get("total") || "0");
  const seed = request.nextUrl.searchParams.get("seed") || "";

  if (!title) {
    return new NextResponse("Missing title", { status: 400 });
  }

  try {
    const data = await fetchArticleWithMarks(title, step, total, seed);

    const html = `<!DOCTYPE html>
<html class="client-nojs vector-feature-language-in-header-enabled vector-feature-language-in-main-page-header-disabled vector-feature-sticky-header-disabled vector-feature-page-tools-pinned-disabled vector-feature-toc-pinned-clientpref-1 vector-feature-main-menu-pinned-disabled vector-feature-limited-width-clientpref-1 vector-feature-limited-width-content-enabled vector-feature-custom-font-size-clientpref-1 vector-feature-appearance-pinned-clientpref-1 vector-feature-night-mode-disabled skin-theme-clientpref-day vector-toc-not-available vector-animations-ready ve-available" lang="ru" dir="ltr">
<head>
<meta charset="UTF-8">
<base href="https://ru.wikipedia.org/">
${data.headHtml.replace(/<script[\s\S]*?<\/script>/gi, "")}
<style>
  html, body {
    margin: 0;
    padding: 0;
    background: #fff;
  }
  .rabbit-mark-wrap { display: inline; position: relative; }
  .rabbit-mark-link {
    color: #b45309 !important;
    cursor: pointer !important;
    border-bottom: 2px dashed rgba(217, 119, 6, 0.6) !important;
    text-decoration: none !important;
    background: rgba(255, 251, 235, 0.9) !important;
    padding: 0 2px !important;
    border-radius: 2px !important;
    font-weight: 600 !important;
  }
  .rabbit-mark-link:hover {
    background: #fef3c7 !important;
    border-bottom-color: #d97706 !important;
    color: #92400e !important;
  }
  .rabbit-mark-icon {
    font-size: 0.85em;
    margin-left: 1px;
    opacity: 0.7;
    display: inline-block;
  }
</style>
</head>
<body class="skin-vector skin-vector-search-vue mediawiki ltr sitedir-ltr mw-hide-empty-elt ns-0 ns-subject mw-editable page-${title.replace(/[^a-zA-Z0-9\u0400-\u04FF]/g, '_')} rootpage-${title.replace(/[^a-zA-Z0-9\u0400-\u04FF]/g, '_')} skin-vector-2022 action-view uls-dialog-sticky-hide">
<div id="mw-page-base" class="noprint"></div>
<div id="mw-head-base" class="noprint"></div>
<div id="content" class="mw-body ve-init-mw-desktopArticleTarget-targetContainer" role="main">
  <div id="bodyContent" class="vector-body">
    <div id="mw-content-text" class="mw-body-content">
      <div class="mw-content-ltr mw-parser-output" lang="ru" dir="ltr">
        ${data.html}
      </div>
    </div>
  </div>
</div>
<script>
  document.addEventListener('click', function(e) {
    var link = e.target.closest('.rabbit-mark-link');
    if (link) {
      e.preventDefault();
      var target = link.getAttribute('data-rabbit-target');
      if (target) {
        window.parent.postMessage({ type: 'rabbit-hop', target: target }, '*');
      }
      return;
    }
    var a = e.target.closest('a[href^="/wiki/"]');
    if (a) {
      e.preventDefault();
      var href = a.getAttribute('href');
      var pageTitle = href.replace('/wiki/', '').replace(/#.*$/, '');
      window.parent.postMessage({ type: 'rabbit-hop', target: decodeURIComponent(pageTitle) }, '*');
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
  } catch {
    return new NextResponse("Article not found", { status: 404 });
  }
}
