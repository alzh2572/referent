import { NextResponse } from "next/server";
import { ACTION_LABELS, type ArticleAction } from "@/lib/article-actions";
import {
  extractTheses,
  generateTelegramPost,
  summarizeArticle,
} from "@/lib/openrouter";
import { fetchAndParseArticle, type ParsedArticle } from "@/lib/parse-article";

const ACTIONS: ArticleAction[] = ["summary", "theses", "telegram"];

async function processArticleAction(
  action: ArticleAction,
  article: ParsedArticle,
): Promise<string> {
  switch (action) {
    case "summary":
      return summarizeArticle(article);
    case "theses":
      return extractTheses(article);
    case "telegram":
      return generateTelegramPost(article);
  }
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    url?: string;
    action?: string;
  };

  const url = body.url?.trim();
  const action = body.action as ArticleAction | undefined;

  if (!url) {
    return NextResponse.json({ error: "Укажите URL статьи" }, { status: 400 });
  }

  if (!action || !ACTIONS.includes(action)) {
    return NextResponse.json({ error: "Выберите действие" }, { status: 400 });
  }

  try {
    const article = await fetchAndParseArticle(url);
    const result = await processArticleAction(action, article);

    return NextResponse.json({
      result,
      action: ACTION_LABELS[action],
      article,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Не удалось обработать статью";

    return NextResponse.json({ error: message }, { status: 422 });
  }
}
