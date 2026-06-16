import { NextResponse } from "next/server";
import { ACTION_LABELS, type ArticleAction } from "@/lib/article-actions";

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

  await new Promise((resolve) => setTimeout(resolve, 900));

  const result = [
    `Действие: ${ACTION_LABELS[action]}`,
    `Статья: ${url}`,
    "",
    "Здесь появится результат после подключения парсинга и AI.",
  ].join("\n");

  return NextResponse.json({ result });
}
