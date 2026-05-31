import { describe, it, expect } from "vitest";
import {
  scoreLink,
  weightedPick,
  extractLinks,
  findNonContentStart,
  seededRandom,
  RABBIT_KEYWORDS,
} from "./render-logic";

describe("seededRandom", () => {
  it("returns values between 0 and 1", () => {
    const r = seededRandom("test");
    for (let i = 0; i < 100; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("same seed produces same sequence", () => {
    const a = seededRandom("rabbit");
    const b = seededRandom("rabbit");
    for (let i = 0; i < 20; i++) {
      expect(a()).toBe(b());
    }
  });

  it("different seeds produce different sequences", () => {
    const a = seededRandom("seed1");
    const b = seededRandom("seed2");
    const seqA = Array.from({ length: 10 }, () => a());
    const seqB = Array.from({ length: 10 }, () => b());
    expect(seqA).not.toEqual(seqB);
  });
});

describe("scoreLink", () => {
  it("scores animal-related words higher", () => {
    const animal = scoreLink("кролик", "Кролики");
    const building = scoreLink("здание", "Архитектура");
    expect(animal).toBeGreaterThan(building);
  });

  it("scores 0 for unrelated text", () => {
    expect(scoreLink("математика", "Алгебра")).toBe(0);
  });

  it("matches partial word stems", () => {
    expect(scoreLink("животное", "")).toBeGreaterThan(0);
    expect(scoreLink("лесной", "")).toBeGreaterThan(0);
  });

  it("searches both text and target", () => {
    const onlyInTarget = scoreLink("xyz", "кролик");
    const onlyInText = scoreLink("кролик", "xyz");
    expect(onlyInTarget).toBe(onlyInText);
    expect(onlyInTarget).toBeGreaterThan(0);
  });
});

describe("weightedPick", () => {
  const items = [
    { text: "здание", target: "Архитектура" },
    { text: "кролик", target: "Животные" },
    { text: "город", target: "Москва" },
  ];

  it("returns an item when bias is 0 (pure random)", () => {
    const r = seededRandom("t1");
    const pick = weightedPick(items, r, 0);
    expect(items).toContain(pick);
  });

  it("returns an item with high bias", () => {
    const r = seededRandom("t2");
    const pick = weightedPick(items, r, 100);
    expect(items).toContain(pick);
  });

  it("favors rabbit-related items with high bias", () => {
    const r = seededRandom("t3");
    let rabbitPicks = 0;
    for (let i = 0; i < 50; i++) {
      const pick = weightedPick(items, r, 50);
      if (pick.text === "кролик") rabbitPicks++;
    }
    // With high bias, rabbit should be picked most of the time
    expect(rabbitPicks).toBeGreaterThan(10);
  });

  it("throws on empty array", () => {
    const r = seededRandom("t4");
    expect(() => weightedPick([], r, 0)).toThrow("No items");
  });
});

describe("extractLinks", () => {
  it("extracts /wiki/ links in main content", () => {
    const html = `
      <div id="mw-content-text">
        <p><a href="/wiki/Test">Test link</a></p>
        <p><a href="/wiki/Another_Page">Another</a></p>
      </div>
    `;
    const links = extractLinks(html);
    expect(links).toHaveLength(2);
    expect(links[0].text).toBe("Test link");
    expect(links[0].target).toBe("Test");
    expect(links[1].text).toBe("Another");
    expect(links[1].target).toBe("Another Page");
  });

  it("extracts protocol-relative Wikipedia links", () => {
    const html = `
      <div id="mw-content-text">
        <p><a href="//ru.wikipedia.org/wiki/Москва">Москва</a></p>
      </div>
    `;
    const links = extractLinks(html);
    expect(links).toHaveLength(1);
    expect(links[0].target).toBe("Москва");
  });

  it("excludes category and file links", () => {
    const html = `
      <div id="mw-content-text">
        <p><a href="/wiki/Category:Test">Test</a></p>
        <p><a href="/wiki/File:Image.jpg">Image</a></p>
        <p><a href="/wiki/Valid">Valid</a></p>
      </div>
    `;
    const links = extractLinks(html);
    expect(links).toHaveLength(1);
    expect(links[0].text).toBe("Valid");
  });

  it("excludes Russian namespace links", () => {
    const html = `
      <div id="mw-content-text">
        <p><a href="/wiki/Категория:Города">Города</a></p>
        <p><a href="/wiki/Файл:Photo.jpg">Photo</a></p>
        <p><a href="/wiki/Шаблон:Test">Test</a></p>
        <p><a href="/wiki/Реальный">Реальный</a></p>
      </div>
    `;
    const links = extractLinks(html);
    expect(links).toHaveLength(1);
    expect(links[0].target).toBe("Реальный");
  });

  it("filters links after catlinks marker", () => {
    const html = `
      <div id="mw-content-text">
        <p><a href="/wiki/Before">Before</a></p>
        <div class="catlinks">
          <a href="/wiki/After">After</a>
        </div>
      </div>
    `;
    const links = extractLinks(html);
    expect(links).toHaveLength(1);
    expect(links[0].target).toBe("Before");
  });

  it("excludes text shorter than 2 characters", () => {
    const html = `
      <div id="mw-content-text">
        <p><a href="/wiki/X">X</a></p>
        <p><a href="/wiki/Ok">Ok</a></p>
      </div>
    `;
    const links = extractLinks(html);
    expect(links).toHaveLength(1);
    expect(links[0].text).toBe("Ok");
  });

  it("excludes Main Page", () => {
    const html = `
      <div id="mw-content-text">
        <p><a href="/wiki/Main_Page">Main Page</a></p>
        <p><a href="/wiki/Real">Real</a></p>
      </div>
    `;
    const links = extractLinks(html);
    expect(links).toHaveLength(1);
    expect(links[0].target).toBe("Real");
  });
});

describe("findNonContentStart", () => {
  it("finds catlinks after content anchor", () => {
    const html = `
      <div class="navbox">nav</div>
      <div id="mw-content-text">content</div>
      <div class="catlinks">categories</div>
    `;
    const pos = findNonContentStart(html);
    // Should find catlinks, not navbox (which is before content anchor)
    expect(pos).toBeGreaterThan(html.indexOf("mw-content-text"));
    expect(pos).toBeLessThan(html.length);
  });

  it("returns html.length when no markers found", () => {
    const html = `<div id="mw-content-text">content only</div>`;
    expect(findNonContentStart(html)).toBe(html.length);
  });
});

describe("RABBIT_KEYWORDS", () => {
  it("has all expected stems", () => {
    expect(RABBIT_KEYWORDS).toContain("животн");
    expect(RABBIT_KEYWORDS).toContain("кролик");
    expect(RABBIT_KEYWORDS).toContain("заяц");
    expect(RABBIT_KEYWORDS).toContain("морков");
    expect(RABBIT_KEYWORDS).toContain("грызун");
  });
});
