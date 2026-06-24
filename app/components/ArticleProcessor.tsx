"use client";

import { useEffect, useState } from "react";
import {
  ACTION_LABELS,
  ACTION_LOADING_LABELS,
  ACTION_PLACEHOLDERS,
  ACTION_TITLES,
  type ArticleAction,
} from "@/lib/article-actions";
import {
  ERROR_MESSAGES,
  getErrorTitle,
  type ApiErrorBody,
} from "@/lib/errors";
import { stripTelegramSourceSuffix } from "@/lib/openrouter";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CircleAlert } from "lucide-react";

const FETCHING_ARTICLE_MESSAGE = "Загружаю статью…";

export function ArticleProcessor() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState("");
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<ArticleAction | null>(null);
  const [loading, setLoading] = useState(false);
  const [processMessage, setProcessMessage] = useState<string | null>(null);
  const [error, setError] = useState<ApiErrorBody | null>(null);

  const isUrlValid = url.trim().length > 0;

  useEffect(() => {
    if (!loading || !activeAction) {
      return;
    }

    const timer = window.setTimeout(() => {
      setProcessMessage(ACTION_LOADING_LABELS[activeAction]);
    }, 1500);

    return () => window.clearTimeout(timer);
  }, [loading, activeAction]);

  async function handleAction(action: ArticleAction) {
    if (!isUrlValid || loading) {
      return;
    }

    setActiveAction(action);
    setLoading(true);
    setProcessMessage(FETCHING_ARTICLE_MESSAGE);
    setError(null);
    setResult("");
    setSourceUrl(null);

    try {
      const response = await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), action }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: ApiErrorBody };
        setError(
          data.error ?? { code: "UNKNOWN", message: ERROR_MESSAGES.UNKNOWN },
        );
        return;
      }

      const data = (await response.json()) as {
        result: string;
        sourceUrl?: string;
      };
      setResult(data.result);
      setSourceUrl(data.sourceUrl ?? null);
    } catch {
      setError({ code: "UNKNOWN", message: ERROR_MESSAGES.UNKNOWN });
    } finally {
      setLoading(false);
      setProcessMessage(null);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <header className="space-y-2">
        <p className="text-sm font-medium tracking-wide text-sky-600 uppercase">
          Referent
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Анализ англоязычных статей
        </h1>
        <p className="text-slate-600">
          Вставьте ссылку на статью и выберите, какой результат нужен.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <label htmlFor="article-url" className="block text-sm font-medium text-slate-700">
          URL англоязычной статьи
        </label>
        <input
          id="article-url"
          type="url"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="Введите URL статьи, например: https://example.com/article"
          className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
        />
        <p className="mt-2 text-xs text-slate-500">
          Укажите ссылку на англоязычную статью
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-medium text-slate-700">Выберите действие</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {(Object.keys(ACTION_LABELS) as ArticleAction[]).map((action) => {
            const isActive = activeAction === action && (loading || result.length > 0);

            return (
              <button
                key={action}
                type="button"
                title={ACTION_TITLES[action]}
                onClick={() => handleAction(action)}
                disabled={!isUrlValid || loading}
                className={`rounded-xl px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  isActive
                    ? "bg-sky-600 text-white"
                    : "bg-slate-100 text-slate-800 hover:bg-slate-200"
                }`}
              >
                {ACTION_LABELS[action]}
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
        {processMessage && (
          <div className="mb-4 rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-800">
            {processMessage}
          </div>
        )}

        <div className="mb-3">
          <h2 className="text-lg font-medium text-slate-900">Результат</h2>
        </div>

        <div className="min-h-48 rounded-xl border border-slate-200 bg-white p-4">
          {error ? (
            <Alert variant="destructive">
              <CircleAlert />
              <AlertTitle>{getErrorTitle(error.code)}</AlertTitle>
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          ) : loading ? (
            <div className="space-y-3">
              <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-slate-200" />
            </div>
          ) : result ? (
            activeAction === "telegram" && sourceUrl ? (
              <div className="text-sm leading-7 text-slate-800">
                <p className="whitespace-pre-wrap">
                  {stripTelegramSourceSuffix(result, sourceUrl)}
                </p>
                <p className="mt-4 border-t border-slate-100 pt-4">
                  Источник:{" "}
                  <a
                    href={sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-600 underline decoration-sky-300 underline-offset-2 hover:text-sky-700"
                  >
                    {sourceUrl}
                  </a>
                </p>
              </div>
            ) : (
              <p className="whitespace-pre-wrap text-sm leading-7 text-slate-800">
                {result}
              </p>
            )
          ) : (
            <p className="text-sm text-slate-500">
              {activeAction
                ? ACTION_PLACEHOLDERS[activeAction]
                : "Выберите действие, чтобы увидеть результат."}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
