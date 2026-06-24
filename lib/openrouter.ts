import type { ParsedArticle } from "@/lib/parse-article";
import { AppError } from "@/lib/errors";

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
    throw new AppError("AI_CONFIG_ERROR");
  }

  return { apiKey, baseUrl };
}

export async function createChatCompletion(
  messages: ChatMessage[],
  model = DEFAULT_MODEL,
  temperature = 0.3,
): Promise<string> {
  const { apiKey, baseUrl } = getOpenRouterConfig();

  let response: Response;

  try {
    response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
      }),
      signal: AbortSignal.timeout(120000),
    });
  } catch {
    throw new AppError("AI_TIMEOUT");
  }

  const data = (await response.json()) as ChatCompletionResponse;

  if (!response.ok) {
    throw new AppError("AI_FAILED");
  }

  const content = data.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new AppError("AI_FAILED");
  }

  return content;
}

export function formatArticleForPrompt(article: ParsedArticle): string {
  if (!article.content?.trim()) {
    throw new AppError("EMPTY_CONTENT");
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

export async function summarizeArticle(article: ParsedArticle): Promise<string> {
  const articleParts = formatArticleForPrompt(article);

  return createChatCompletion(
    [
      {
        role: "system",
        content:
          "You are a professional editor. You analyze English articles and respond in Russian. Return only the final answer without explanations or meta-commentary.",
      },
      {
        role: "user",
        content: `Briefly explain what this article is about in 3-5 sentences in Russian. Mention the topic, the key idea, and the target audience.\n\n${articleParts}`,
      },
    ],
    DEFAULT_MODEL,
  );
}

export async function extractTheses(article: ParsedArticle): Promise<string> {
  const articleParts = formatArticleForPrompt(article);

  return createChatCompletion(
    [
      {
        role: "system",
        content:
          "You are an analyst. You extract key ideas from English articles and respond in Russian. Return only the final answer without explanations or meta-commentary.",
      },
      {
        role: "user",
        content: `Extract 5-10 key theses from this article as a markdown bullet list in Russian. Each thesis must be one concise idea. Use the format "- thesis".\n\n${articleParts}`,
      },
    ],
    DEFAULT_MODEL,
    0.2,
  );
}

export function formatTelegramSourceLine(sourceUrl: string): string {
  return `Источник: ${sourceUrl}`;
}

export function stripTelegramSourceSuffix(
  result: string,
  sourceUrl: string,
): string {
  const suffix = `\n\n${formatTelegramSourceLine(sourceUrl)}`;
  return result.endsWith(suffix) ? result.slice(0, -suffix.length).trimEnd() : result;
}

export async function generateTelegramPost(
  article: ParsedArticle,
  sourceUrl: string,
): Promise<string> {
  const articleParts = formatArticleForPrompt(article);

  const post = await createChatCompletion(
    [
      {
        role: "system",
        content:
          "You are an SMM editor writing posts for a Telegram channel in Russian. Return only the final post without explanations or meta-commentary. Keep the post under 1400 characters — a source link will be appended separately.",
      },
      {
        role: "user",
        content: `Write a Telegram post in Russian based on this article. Structure:
1. Catchy headline (1 line)
2. Brief lead (2-3 sentences)
3. 3-5 bullet points with the main ideas
4. Call to action or a question for the audience
5. 2-4 relevant hashtags at the end

Do not include the source URL — it will be added automatically.

${articleParts}`,
      },
    ],
    DEFAULT_MODEL,
    0.5,
  );

  return `${post}\n\n${formatTelegramSourceLine(sourceUrl)}`;
}
