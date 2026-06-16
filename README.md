# GeminiRoast — AI Code Reviewer for Telegram

Беспощадный AI-ревьюер кода прямо в Telegram. Отправляешь код — получаешь разнос с конкретными исправлениями за 10 секунд.

## 🎯 Что делает

- Принимает код через команду `/review`
- Проверяет, что это действительно код (не болтовня)
- Отправляет в Llama 3.3 70B через OpenRouter API
- Возвращает структурированный разбор: критические ошибки, серьёзные замечания, предупреждения, советы
- Разбивает длинные ответы на части (Telegram-лимит 4000 символов)
- Защита от спама: тайм-аут 3 минуты, проверка на код, ограничение длины

## 🛠️ Стек

- **Фреймворк:** NestJS (телеграм-бот как микросервис)
- **Язык:** TypeScript
- **AI:** OpenRouter API → Llama 3.3 70B (бесплатный тир)
- **Среда:** Node.js 20+
- **Деплой:** Render

## 📸 Как работает

1. `/start` — приветствие
2. `/review` — бот ждёт код
3. Отправляешь функцию, класс или кусок файла
4. Бот проверяет на код, отправляет AI, возвращает разнос
5. `/stats` — счётчик пользователей
6. `/cancel` — отмена ожидания

## 🧱 Архитектура
src/
├── bot.update.ts # Обработчики команд (Telegraf)
├── bot.service.ts # Бизнес-логика бота
├── review.service.ts # Интеграция с OpenRouter API
├── config/ # Конфигурация (токены, промпты)
└── main.ts # Точка входа

text

## 🚀 Быстрый старт

```bash
git clone https://github.com/Zero4nik/geminiroast-bot.git
cd geminiroast-bot
npm install
Создай .env:

text
BOT_TOKEN=your_telegram_bot_token
OPENROUTER_API_KEY=your_openrouter_api_key
bash
npm run start:dev
🧪 Тестирование
bash
# unit-тесты
npm run test

# e2e-тесты
npm run test:e2e

# coverage
npm run test:cov
📦 Деплой
Бот запущен на Render. При пуше в main — автодеплой.

📖 Что я узнал
AI-интеграция: работа с OpenRouter API (прокси к Llama, Gemini, DeepSeek), промпт-инженерия для код-ревью, обработка ошибок API

Работа с ограничениями: обход блокировок (OpenRouter вместо прямого Gemini API), смена моделей (Llama, DeepSeek, Qwen), поиск бесплатных вариантов

Telegram Bot API: команды, middleware, обработка текста, тайм-ауты, защита от спама

📫 Контакты
Бот: @GeminiRoast_bot

Автор: @frontend_back

GitHub: Zero4nik
