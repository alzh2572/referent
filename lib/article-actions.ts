export type ArticleAction =
  | "summary"
  | "theses"
  | "telegram"
  | "illustration";

export const ACTION_LABELS: Record<ArticleAction, string> = {
  summary: "О чем статья?",
  theses: "Тезисы",
  telegram: "Пост для Telegram",
  illustration: "Иллюстрация",
};

export const ACTION_PLACEHOLDERS: Record<ArticleAction, string> = {
  summary: "Краткое описание статьи появится здесь…",
  theses: "Тезисы статьи появятся здесь…",
  telegram: "Пост для Telegram появится здесь…",
  illustration: "Иллюстрация появится здесь…",
};

export const ACTION_LOADING_LABELS: Record<ArticleAction, string> = {
  summary: "Анализ статьи…",
  theses: "Формирование тезисов…",
  telegram: "Подготовка поста…",
  illustration: "Формирую промпт для иллюстрации…",
};

export const ACTION_TITLES: Record<ArticleAction, string> = {
  summary: "Кратко объяснить, о чём статья: тема, главная мысль и аудитория",
  theses: "Выделить 5–10 ключевых тезисов статьи списком",
  telegram: "Собрать пост для Telegram с заголовком, тезисами и ссылкой на источник",
  illustration: "Сгенерировать иллюстрацию по теме статьи через AI",
};

export const ILLUSTRATION_IMAGE_LOADING_LABEL = "Генерирую изображение…";
