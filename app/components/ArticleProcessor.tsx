"use client";

import { useState } from "react";
import {
  ACTION_LABELS,
  ACTION_LOADING_LABELS,
  ACTION_PLACEHOLDERS,
  type ArticleAction,
} from "@/lib/article-actions";
import { stripTelegramSourceSuffix } from "@/lib/openrouter";

export function ArticleProcessor() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState("");
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<ArticleAction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isUrlValid = url.trim().length > 0;

  async function handleAction(action: ArticleAction) {
    if (!isUrlValid || loading) {
      return;
    }

    setActiveAction(action);
    setLoading(true);
    setError("");
    setResult("");
    setSourceUrl(null);

    try {
      const response = await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), action }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Не удалось обработать статью");
      }

      const data = (await response.json()) as {
        result: string;
        sourceUrl?: string;
      };
      setResult(data.result);
      setSourceUrl(data.sourceUrl ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка");
    } finally {
      setLoading(false);
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
          placeholder="https://example.com/article"
          className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
        />

        <div className="mt-5 flex flex-wrap gap-3">
          {(Object.keys(ACTION_LABELS) as ArticleAction[]).map((action) => {
            const isActive = activeAction === action && (loading || result.length > 0);

            return (
              <button
                key={action}
                type="button"
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
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-medium text-slate-900">Результат</h2>
          {loading && activeAction && (
            <span className="text-sm text-sky-600">
              {ACTION_LOADING_LABELS[activeAction]}
            </span>
          )}
        </div>

        <div className="min-h-48 rounded-xl border border-slate-200 bg-white p-4">
          {error ? (
            <p className="text-sm text-red-600">{error}</p>
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
