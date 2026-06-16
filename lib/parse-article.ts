import * as cheerio from "cheerio";
import type { CheerioAPI } from "cheerio";

export type ParsedArticle = {
  date: string | null;
  title: string | null;
  content: string | null;
};

const CONTENT_SELECTORS = [
  "article",
  '[role="main"]',
  "main",
  ".post-content",
  ".entry-content",
  ".article-content",
  ".article-body",
  ".post",
  ".content",
  "#content",
  ".story-body",
];

const DATE_META_SELECTORS = [
  'meta[property="article:published_time"]',
  'meta[property="og:published_time"]',
  'meta[name="pubdate"]',
  'meta[name="date"]',
  'meta[name="publish-date"]',
  'meta[property="article:modified_time"]',
  'meta[name="DC.date.issued"]',
];

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function extractTitle($: CheerioAPI): string | null {
  const candidates = [
    $('meta[property="og:title"]').attr("content"),
    $("article h1").first().text(),
    $("main h1").first().text(),
    $("h1").first().text(),
    $("title").text(),
  ];

  for (const candidate of candidates) {
    const title = normalizeText(candidate ?? "");
    if (title) {
      return title;
    }
  }

  return null;
}

function extractDate($: CheerioAPI): string | null {
  const timeDatetime = $("time[datetime]").first().attr("datetime");
  if (timeDatetime) {
    return normalizeText(timeDatetime);
  }

  for (const selector of DATE_META_SELECTORS) {
    const value = $(selector).attr("content");
    if (value) {
      return normalizeText(value);
    }
  }

  const timeText = $("time").first().text();
  if (timeText) {
    return normalizeText(timeText);
  }

  const dateClassMatch = $('[class*="date"], [class*="publish"], .published')
    .first()
    .text();

  if (dateClassMatch) {
    return normalizeText(dateClassMatch);
  }

  return null;
}

function extractTextFromFragment(
  $: CheerioAPI,
  getFragment: () => ReturnType<CheerioAPI>,
): string {
  const fragment = getFragment().clone();

  fragment.find("script, style, noscript, nav, header, footer, aside, form").remove();

  const paragraphs = fragment
    .find("p, li, h2, h3, h4, blockquote")
    .map((_, node) => normalizeText($(node).text()))
    .get()
    .filter(Boolean);

  if (paragraphs.length > 0) {
    return paragraphs.join("\n\n");
  }

  return normalizeText(fragment.text());
}

function extractContent($: CheerioAPI): string | null {
  let bestContent = "";
  let bestLength = 0;

  for (const selector of CONTENT_SELECTORS) {
    $(selector).each((_, element) => {
      const text = extractTextFromFragment($, () => $(element));
      if (text.length > bestLength) {
        bestLength = text.length;
        bestContent = text;
      }
    });
  }

  if (bestContent) {
    return bestContent;
  }

  if ($("body").length === 0) {
    return null;
  }

  const bodyText = extractTextFromFragment($, () => $("body"));
  return bodyText || null;
}

export function parseArticleHtml(html: string): ParsedArticle {
  const $ = cheerio.load(html);

  return {
    date: extractDate($),
    title: extractTitle($),
    content: extractContent($),
  };
}

export async function fetchAndParseArticle(url: string): Promise<ParsedArticle> {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error("Некорректный URL");
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error("Поддерживаются только HTTP и HTTPS");
  }

  const response = await fetch(parsedUrl.toString(), {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; ReferentBot/1.0)",
      Accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(15000),
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(`Не удалось загрузить страницу (${response.status})`);
  }

  const html = await response.text();
  const article = parseArticleHtml(html);

  if (!article.title && !article.content) {
    throw new Error("Не удалось извлечь заголовок и содержимое статьи");
  }

  return article;
}
