import { NextResponse } from "next/server";
import { ACTION_LABELS, type ArticleAction } from "@/lib/article-actions";
import { AppError, toApiError } from "@/lib/errors";
import { generateIllustration } from "@/lib/illustration";
import {
  extractTheses,
  generateTelegramPost,
  summarizeArticle,
} from "@/lib/openrouter";
import { fetchAndParseArticle, type ParsedArticle } from "@/lib/parse-article";

const ACTIONS: ArticleAction[] = ["summary", "theses", "telegram", "illustration"];

type ActionResult =
  | { kind: "text"; result: string; sourceUrl?: string }
  | { kind: "image"; imageUrl: string; imagePrompt: string };

async function processArticleAction(
  action: ArticleAction,
  article: ParsedArticle,
  url: string,
): Promise<ActionResult> {
  switch (action) {
    case "summary":
      return { kind: "text", result: await summarizeArticle(article) };
    case "theses":
      return { kind: "text", result: await extractTheses(article) };
    case "telegram":
      return {
        kind: "text",
        result: await generateTelegramPost(article, url),
        sourceUrl: url,
      };
    case "illustration": {
      const illustration = await generateIllustration(article);
      return {
        kind: "image",
        imageUrl: illustration.imageUrl,
        imagePrompt: illustration.imagePrompt,
      };
    }
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
    const actionResult = await processArticleAction(action, article, url);

    if (actionResult.kind === "image") {
      return NextResponse.json({
        action: ACTION_LABELS[action],
        resultType: "image",
        imageUrl: actionResult.imageUrl,
        imagePrompt: actionResult.imagePrompt,
        article,
      });
    }

    return NextResponse.json({
      result: actionResult.result,
      resultType: "text",
      action: ACTION_LABELS[action],
      article,
      ...(actionResult.sourceUrl && { sourceUrl: actionResult.sourceUrl }),
    });
  } catch (error) {
    const { status, body } = toApiError(error);
    return NextResponse.json({ error: body }, { status });
  }
}
