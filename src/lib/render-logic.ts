export const RABBIT_KEYWORDS = [
  "животн", "млекопитающ", "звер", "природ", "лес", "нор", "ух", "уши", "хвост",
  "морков", "заяц", "зайц", "кролик", "трав", "пол", "грызун", "питом", "домашн",
  "фаун", "биолог", "зоолог", "вид", "род", "семейств", "отряд", "класс",
  "эколог", "луг", "степ", "сад", "огород", "корм", "шерст", "мех", "лап",
  "прыг", "скач", "бег", "млекопит", "травояд", "дик", "пушист", "зверёк",
  "питомец", "клетк", "вольер", "размнож", "детёныш", "потомств", "охота",
];

export function scoreLink(text: string, target: string): number {
  const lower = (text + " " + target).toLowerCase();
  let score = 0;
  for (const kw of RABBIT_KEYWORDS) {
    if (lower.includes(kw)) score += 1;
  }
  return score;
}

export function weightedPick<T extends { text: string; target: string }>(
  items: T[],
  rand: () => number,
  bias: number
): T {
  if (items.length === 0) throw new Error("No items");
  if (bias <= 0) return items[Math.floor(rand() * items.length)];

  const scored = items.map((item) => ({
    item,
    weight: 1 + scoreLink(item.text, item.target) * bias,
  }));

  const totalWeight = scored.reduce((s, x) => s + x.weight, 0);
  let r = rand() * totalWeight;
  for (const { item, weight } of scored) {
    r -= weight;
    if (r <= 0) return item;
  }
  return scored[scored.length - 1].item;
}

export function extractLinks(
  html: string
): { fullMatch: string; target: string; text: string }[] {
  const nonContentStart = findNonContentStart(html);
  const links: { fullMatch: string; target: string; text: string }[] = [];
  const regex =
    /<a\s+(?:[^>]*?\s+)?href="(?:\/\/[^"]*wikipedia\.org)?\/wiki\/([^"#]+)[^"]*"(?:\s+[^>]*?)?\s*(?:title="([^"]*)")?[^>]*>([^<]+)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(html)) !== null) {
    if (nonContentStart > 0 && match.index >= nonContentStart) continue;

    const fullMatch = match[0];
    const target = decodeURIComponent(match[1].replace(/_/g, " "));
    const text = match[3].trim();

    const excluded =
      /^(Special|Wikipedia|Help|File|Talk|Category|Template|Portal|User|Служебная|Википедия|Справка|Файл|Обсуждение|Категория|Шаблон|Портал|Участник|Модуль|Module|MediaWiki|Media|Image):/i;
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

export function findNonContentStart(html: string): number {
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

export function seededRandom(seed: string): () => number {
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
