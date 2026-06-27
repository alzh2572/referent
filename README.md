# Referent

Референт-переводчик с ИИ-обработкой. 
Описание проекта — [PROJECT.md](./PROJECT.md).
PLAN.md - план разработки

## Локальный запуск

```powershell
pnpm install
Copy-Item .env.example .env.local
# Откройте .env.local и вставьте ключи OpenRouter и Hugging Face
pnpm dev
```

Приложение: [http://localhost:3000](http://localhost:3000)

### Переменные окружения

| Переменная | Обязательна | Описание |
|------------|-------------|----------|
| `OPENROUTER_API_KEY` | да | API-ключ [OpenRouter](https://openrouter.ai/) |
| `HUGGINGFACE_API_KEY` | да* | API-ключ [Hugging Face](https://huggingface.co/settings/tokens) с правом **Make calls to Inference Providers** |
| `OPENAI_BASE_URL` | нет | По умолчанию `https://openrouter.ai/api/v1` |
| `HUGGINGFACE_IMAGE_MODEL` | нет | По умолчанию `black-forest-labs/FLUX.1-schnell` |

\* Обязателен только для генерации иллюстраций. При создании токена включите право **Make calls to Inference Providers** (Fine-grained token).

## Деплой на Vercel

1. Импортируйте репозиторий на [vercel.com](https://vercel.com).
2. Откройте проект → **Settings** → **Environment Variables** (в левом меню).
3. Добавьте `OPENROUTER_API_KEY` и `HUGGINGFACE_API_KEY` для **Production**, **Preview** и **Development**.
4. Нажмите **Save** и выполните **Redeploy** — старый деплой не подхватит новые переменные.

Через CLI:

```powershell
pnpm dlx vercel login
pnpm dlx vercel link
pnpm dlx vercel env add OPENROUTER_API_KEY production
pnpm dlx vercel env add OPENROUTER_API_KEY preview
pnpm dlx vercel env add OPENROUTER_API_KEY development
pnpm dlx vercel --prod
```

Синхронизация переменных с локальной машиной:

```powershell
pnpm dlx vercel env pull .env.local
```

## Сборка

```powershell
pnpm run build
pnpm start
```
