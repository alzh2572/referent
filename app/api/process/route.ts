import { NextResponse } from "next/server";
import { ACTION_LABELS, type ArticleAction } from "@/lib/article-actions";
import { fetchAndParseArticle } from "@/lib/parse-article";

const ACTIONS: ArticleAction[] = ["summary", "theses", "telegram"];

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
    const result = JSON.stringify(article, null, 2);

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
