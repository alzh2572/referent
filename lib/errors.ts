export type AppErrorCode =
  | "MISSING_URL"
  | "INVALID_ACTION"
  | "INVALID_URL"
  | "UNSUPPORTED_PROTOCOL"
  | "FETCH_FAILED"
  | "PARSE_FAILED"
  | "EMPTY_CONTENT"
  | "AI_CONFIG_ERROR"
  | "AI_FAILED"
  | "AI_TIMEOUT"
  | "IMAGE_CONFIG_ERROR"
  | "IMAGE_PERMISSION_DENIED"
  | "IMAGE_MODEL_LOADING"
  | "IMAGE_FAILED"
  | "UNKNOWN";

export const ERROR_MESSAGES: Record<AppErrorCode, string> = {
  MISSING_URL: "Укажите ссылку на статью.",
  INVALID_ACTION: "Выберите действие для обработки статьи.",
  INVALID_URL: "Некорректная ссылка. Проверьте URL и попробуйте снова.",
  UNSUPPORTED_PROTOCOL: "Поддерживаются только ссылки http и https.",
  FETCH_FAILED: "Не удалось загрузить статью по этой ссылке.",
  PARSE_FAILED:
    "Не удалось извлечь текст статьи. Возможно, страница не содержит статьи.",
  EMPTY_CONTENT: "В статье не найден текст для обработки.",
  AI_CONFIG_ERROR:
    "Сервис анализа временно недоступен. Проверьте настройки API-ключа.",
  AI_FAILED: "Не удалось сгенерировать ответ. Попробуйте ещё раз позже.",
  AI_TIMEOUT: "Превышено время ожидания ответа. Попробуйте ещё раз.",
  IMAGE_CONFIG_ERROR:
    "Сервис генерации изображений недоступен. Проверьте настройки API-ключа Hugging Face.",
  IMAGE_PERMISSION_DENIED:
    "У токена Hugging Face нет прав на генерацию изображений. Создайте новый токен с правом «Make calls to Inference Providers» на huggingface.co/settings/tokens.",
  IMAGE_MODEL_LOADING:
    "Модель генерации изображений загружается. Подождите минуту и попробуйте снова.",
  IMAGE_FAILED:
    "Не удалось сгенерировать иллюстрацию. Попробуйте ещё раз позже.",
  UNKNOWN: "Произошла непредвиденная ошибка. Попробуйте ещё раз.",
};

export const ERROR_TITLES: Record<AppErrorCode, string> = {
  MISSING_URL: "Не указана ссылка",
  INVALID_ACTION: "Не выбрано действие",
  INVALID_URL: "Некорректная ссылка",
  UNSUPPORTED_PROTOCOL: "Неподдерживаемый протокол",
  FETCH_FAILED: "Ошибка загрузки",
  PARSE_FAILED: "Ошибка разбора статьи",
  EMPTY_CONTENT: "Пустая статья",
  AI_CONFIG_ERROR: "Сервис недоступен",
  AI_FAILED: "Ошибка генерации",
  AI_TIMEOUT: "Таймаут",
  IMAGE_CONFIG_ERROR: "Сервис недоступен",
  IMAGE_PERMISSION_DENIED: "Нет прав токена",
  IMAGE_MODEL_LOADING: "Модель загружается",
  IMAGE_FAILED: "Ошибка генерации",
  UNKNOWN: "Ошибка",
};

export function getErrorTitle(code: AppErrorCode): string {
  return ERROR_TITLES[code];
}

export type ApiErrorBody = {
  code: AppErrorCode;
  message: string;
};

export class AppError extends Error {
  readonly code: AppErrorCode;

  constructor(code: AppErrorCode) {
    super(ERROR_MESSAGES[code]);
    this.name = "AppError";
    this.code = code;
  }
}

const ERROR_STATUS: Record<AppErrorCode, number> = {
  MISSING_URL: 400,
  INVALID_ACTION: 400,
  INVALID_URL: 400,
  UNSUPPORTED_PROTOCOL: 400,
  FETCH_FAILED: 422,
  PARSE_FAILED: 422,
  EMPTY_CONTENT: 422,
  AI_CONFIG_ERROR: 503,
  AI_FAILED: 502,
  AI_TIMEOUT: 504,
  IMAGE_CONFIG_ERROR: 503,
  IMAGE_PERMISSION_DENIED: 403,
  IMAGE_MODEL_LOADING: 503,
  IMAGE_FAILED: 502,
  UNKNOWN: 500,
};

export function toApiError(error: unknown): { status: number; body: ApiErrorBody } {
  if (error instanceof AppError) {
    return {
      status: ERROR_STATUS[error.code],
      body: { code: error.code, message: error.message },
    };
  }

  return {
    status: ERROR_STATUS.UNKNOWN,
    body: { code: "UNKNOWN", message: ERROR_MESSAGES.UNKNOWN },
  };
}

export function isFetchError(error: unknown): boolean {
  return error instanceof AppError && error.code === "FETCH_FAILED";
}
