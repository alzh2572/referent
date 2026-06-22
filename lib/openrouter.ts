import type { ParsedArticle } from "@/lib/parse-article";

const DEFAULT_MODEL = "deepseek/deepseek-chat";
export const MAX_CONTENT_LENGTH = 12000;

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

function getOpenRouterConfig() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const baseUrl = process.env.OPENAI_BASE_URL ?? "https://openrouter.ai/api/v1";

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY не задан в .env.local");
  }

  return { apiKey, baseUrl };
}

export async function createChatCompletion(
  messages: ChatMessage[],
  model = DEFAULT_MODEL,
): Promise<string> {
  const { apiKey, baseUrl } = getOpenRouterConfig();

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.3,
    }),
    signal: AbortSignal.timeout(120000),
  });

  const data = (await response.json()) as ChatCompletionResponse;

  if (!response.ok) {
    throw new Error(data.error?.message ?? `OpenRouter вернул ошибку (${response.status})`);
  }

  const content = data.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new Error("OpenRouter не вернул текст перевода");
  }

  return content;
}

export function formatArticleForPrompt(article: ParsedArticle): string {
  if (!article.content?.trim()) {
    throw new Error("В статье не найден текст для обработки");
  }

  const content =
    article.content.length > MAX_CONTENT_LENGTH
      ? `${article.content.slice(0, MAX_CONTENT_LENGTH)}\n\n[Текст обрезан]`
      : article.content;

  return [
    article.title ? `Title: ${article.title}` : null,
    article.date ? `Date: ${article.date}` : null,
    `Content:\n${content}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

export async function translateArticleText(article: ParsedArticle): Promise<string> {
  const articleParts = formatArticleForPrompt(article);

  return createChatCompletion([
    {
      role: "system",
      content:
        "You are a professional translator. Translate English articles into Russian. Preserve meaning, tone, and paragraph structure. Return only the translation in Russian without explanations.",
    },
    {
      role: "user",
      content: `Translate this article to Russian:\n\n${articleParts}`,
    },
  ]);
}
