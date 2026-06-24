import { NextResponse } from "next/server";
import { ACTION_LABELS, type ArticleAction } from "@/lib/article-actions";
import { AppError, toApiError } from "@/lib/errors";
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
  url: string,
): Promise<string> {
  switch (action) {
    case "summary":
      return summarizeArticle(article);
    case "theses":
      return extractTheses(article);
    case "telegram":
      return generateTelegramPost(article, url);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      url?: string;
      action?: string;
    };

    const url = body.url?.trim();
    const action = body.action as ArticleAction | undefined;

    if (!url) {
      throw new AppError("MISSING_URL");
    }

    if (!action || !ACTIONS.includes(action)) {
      throw new AppError("INVALID_ACTION");
    }

    const article = await fetchAndParseArticle(url);
    const result = await processArticleAction(action, article, url);

    return NextResponse.json({
      result,
      action: ACTION_LABELS[action],
      article,
      ...(action === "telegram" && { sourceUrl: url }),
    });
  } catch (error) {
    const { status, body } = toApiError(error);
    return NextResponse.json({ error: body }, { status });
  }
}
