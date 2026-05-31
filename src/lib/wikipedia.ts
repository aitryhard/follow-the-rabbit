import { ArticleData, RabbitMark } from "@/types";

const WIKI_API = "https://ru.wikipedia.org/w/api.php";

const cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 30_000;

async function cachedFetch(url: string): Promise<unknown> {
  const cached = cache.get(url);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;

  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      cache.set(url, { data, ts: Date.now() });
      return data;
    }
    if (res.status === 429) {
      await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
      continue;
    }
    throw new Error(`Wikipedia ${res.status}`);
  }
  throw new Error("Wikipedia 429 rate limit");
}

const WIKI_LINK_RE =
  /<a\s+(?:[^>]*?\s+)?href="\/wiki\/([^"]+)"(?:\s+[^>]*?)?\s*(?:title="([^"]*)")?[^>]*>/g;

const EXCLUDE_PATTERNS = [
  /^Special:/,
  /^Wikipedia:/,
  /^Help:/,
  /^File:/,
  /^Talk:/,
  /^Category:/,
  /^Template:/,
  /^Portal:/,
  /^User:/,
  /^Main_Page$/,
];

function shouldExclude(title: string): boolean {
  return EXCLUDE_PATTERNS.some((p) => p.test(title));
}

function decodeWikiTitle(encoded: string): string {
  return decodeURIComponent(encoded.replace(/_/g, " "));
}

export async function randomWikipediaTitle(): Promise<string> {
  const url = `${WIKI_API}?action=query&list=random&rnnamespace=0&rnlimit=1&format=json&origin=*`;
  const data = (await cachedFetch(url)) as { query?: { random?: { title: string }[] } };
  return data.query?.random?.[0]?.title || "";
}

export async function searchWikipedia(
  query: string
): Promise<{ title: string; snippet: string; pageid: number }[]> {
  const url = `${WIKI_API}?action=query&list=search&srsearch=${encodeURIComponent(
    query
  )}&srlimit=10&format=json&origin=*`;

  const data = (await cachedFetch(url)) as { query?: { search?: { title: string; snippet: string; pageid: number }[] } };

  return ((data as { query?: { search?: { title: string; snippet: string; pageid: number }[] } }).query?.search || []).map(
    (r: { title: string; snippet: string; pageid: number }) => ({
      title: r.title,
      snippet: r.snippet.replace(/<\/?[^>]+(>|$)/g, ""),
      pageid: r.pageid,
    })
  );
}

function extractWikiLinks(
  html: string
): { fullMatch: string; target: string; text: string; start: number }[] {
  const links: {
    fullMatch: string;
    target: string;
    text: string;
    start: number;
  }[] = [];

  let match: RegExpExecArray | null;
  const regex = new RegExp(WIKI_LINK_RE.source, "g");

  while ((match = regex.exec(html)) !== null) {
    const target = decodeWikiTitle(match[1]);
    if (shouldExclude(target)) continue;

    const textMatch = match[0].match(/>([^<]+)</);
    const text = textMatch ? textMatch[1] : target;

    if (text.length < 2) continue;

    links.push({
      fullMatch: match[0],
      target,
      text,
      start: match.index,
    });
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

function getProximityEmoji(step: number, total: number): string {
  const progress = step / total;
  if (progress >= 0.9) return "🐰";
  if (progress >= 0.7) return "🐇";
  if (progress >= 0.4) return "🥕";
  if (progress >= 0.15) return "🐾";
  return "🐾";
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

export async function fetchArticleWithMarks(
  title: string,
  step: number,
  totalSteps: number,
  seed: string
): Promise<ArticleData> {
  const isRabbit =
    title === "Rabbit" || title === "Кролик" || title === "Кролики";

  const url = `${WIKI_API}?action=parse&page=${encodeURIComponent(
    title
  )}&prop=text|headhtml&format=json&origin=*`;

  const data = (await cachedFetch(url)) as {
    parse?: { text?: { "*"?: string }; headhtml?: { "*"?: string } };
  };

  if (!data.parse) {
    throw new Error(`Article not found: ${title}`);
  }

  const headHtml: string = data.parse.headhtml?.["*"] || "";
  let html: string = data.parse.text?.["*"] || "";
  const rabbitMarks: RabbitMark[] = [];

  if (!isRabbit) {
    const links = extractWikiLinks(html);

    const perStepSeed = `${seed}-${step}`;
    const shuffled = shuffleWithSeed(links, perStepSeed);

    const markCount = 1;
    const selected = shuffled.slice(0, markCount);
    const proximityEmoji = getProximityEmoji(step, totalSteps);

    for (const link of selected) {
      const markerId = `rabbit-${rabbitMarks.length}`;
      const replacement = `<span class="rabbit-mark-wrap"><a href="#" data-rabbit-target="${link.target.replace(
        /"/g,
        "&quot;"
      )}" data-rabbit-id="${markerId}" class="rabbit-mark-link">${link.text}</a><span class="rabbit-mark-icon select-none">${proximityEmoji}</span></span>`;

      html = html.replace(link.fullMatch, replacement);

      rabbitMarks.push({
        text: link.text,
        target: link.target,
      });
    }
  }

  html = html.replace(/<a\s+[^>]*href="\/wiki\//g, '<a target="_blank" rel="noopener" href="https://ru.wikipedia.org/wiki/');

  return {
    title,
    html,
    headHtml,
    rabbitMarks,
    isRabbit,
    currentStep: step,
    totalSteps,
  };
}

export async function fetchRawArticle(title: string): Promise<{
  html: string;
  headHtml: string;
}> {
  const url = `${WIKI_API}?action=parse&page=${encodeURIComponent(
    title
  )}&prop=text|headhtml&format=json&origin=*`;

  const data = (await cachedFetch(url)) as {
    parse?: { text?: { "*"?: string }; headhtml?: { "*"?: string } };
  };

  if (!data.parse) {
    throw new Error(`Article not found: ${title}`);
  }

  return {
    html: data.parse.text?.["*"] || "",
    headHtml: data.parse.headhtml?.["*"] || "",
  };
}
