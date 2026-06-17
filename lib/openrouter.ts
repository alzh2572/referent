const DEFAULT_MODEL = "deepseek/deepseek-chat";
const MAX_CONTENT_LENGTH = 12000;

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

export async function translateArticleText(input: {
  title: string | null;
  date: string | null;
  content: string | null;
}): Promise<string> {
  if (!input.content?.trim()) {
    throw new Error("В статье не найден текст для перевода");
  }

  const content =
    input.content.length > MAX_CONTENT_LENGTH
      ? `${input.content.slice(0, MAX_CONTENT_LENGTH)}\n\n[Текст обрезан для перевода]`
      : input.content;

  const articleParts = [
    input.title ? `Title: ${input.title}` : null,
    input.date ? `Date: ${input.date}` : null,
    `Content:\n${content}`,
  ]
    .filter(Boolean)
    .join("\n\n");

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
