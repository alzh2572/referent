export type ArticleAction = "summary" | "theses" | "telegram";

export const ACTION_LABELS: Record<ArticleAction, string> = {
  summary: "О чем статья?",
  theses: "Тезисы",
  telegram: "Пост для Telegram",
};

export const ACTION_PLACEHOLDERS: Record<ArticleAction, string> = {
  summary: "Краткое описание статьи появится здесь…",
  theses: "Тезисы статьи появятся здесь…",
  telegram: "Пост для Telegram появится здесь…",
};

export const ACTION_LOADING_LABELS: Record<ArticleAction, string> = {
  summary: "Анализ статьи…",
  theses: "Формирование тезисов…",
  telegram: "Подготовка поста…",
};
