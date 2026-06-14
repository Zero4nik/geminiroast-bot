import { ReviewService } from './../review/review.service';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Telegraf } from 'telegraf';

@Injectable()
export class BotService implements OnModuleInit, OnModuleDestroy {
  private bot!: Telegraf;

  waitingForCode = new Map<number, NodeJS.Timeout>();
  constructor(
    private configService: ConfigService,
    private reviewService: ReviewService,
  ) {}

  onModuleInit() {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token) throw new Error('TELEGRAM_BOT_TOKEN no ser');
    this.bot = new Telegraf(token);

    this.bot.start((ctx) => {
      const username = ctx.from?.first_name || 'разработчик';
      return ctx.reply(
        `Привет, ${username}. Я GeminiRoast , твой лучший(скромный) AI-ревьюер.\n\n` +
          `Отправь команду /review и затем пришли мне код.`,
      );
    });
    this.bot.command('review', (ctx) => {
      const userId = ctx.from?.id;
      if (!userId) return;

      if (this.waitingForCode.has(userId)) {
        clearTimeout(this.waitingForCode.get(userId));
      }

      const timer = setTimeout(
        () => {
          this.waitingForCode.delete(userId);
          ctx.telegram
            .sendMessage(
              userId,
              '3 минуты прошло,отправь /review, если хочешь продолжить.',
            )
            .catch(() => {});
        },
        3 * 60 * 1000,
      );
      this.waitingForCode.set(userId, timer);
      return ctx.reply('Жду код,отправь его следующим сообщением');
    });
    this.bot.command('cancel', (ctx) => {
      const userId = ctx.from?.id;
      if (!userId) return;

      if (this.waitingForCode.has(userId)) {
        clearTimeout(this.waitingForCode.get(userId));
        this.waitingForCode.delete(userId);
        return ctx.reply(
          'Ожидание кода отменено, можешь снова отправить /review, когда будешь готов.',
        );
      }
      return ctx.reply('Ты не ждешь код-ревью,отправь /review,чтобы начать');
    });
    this.bot.on('text', async (ctx) => {
      const userId = ctx.from?.id;
      const message = ctx.message;

      if (!message || !userId || !('text' in message)) return;
      const text = message.text;

      if (!this.waitingForCode.has(userId)) {
        return ctx.reply(
          'Сначала отправь команду /review.\n\n' +
            'Я не принимаю код без команды, чтобы не тратить токены на случайные сообщения.',
        );
      }
      clearTimeout(this.waitingForCode.get(userId));
      this.waitingForCode.delete(userId);

      if (!this.looksLikeCode(text)) {
        return ctx.reply(
          '❌ Это не похоже на код.\n\n' +
            'Отправь функцию, класс или кусок файла с синтаксисом (скобки, точки с запятой и т.д.).\n' +
            'Отправь /review, чтобы попробовать снова.',
        );
      }
      if (text.length > 15000) {
        return ctx.reply(
          'Код слишком большой,разбей его на части или пришли меньший файл\n' +
            'Отправь /review, чтобы попробовать снова.',
        );
      }
      await ctx.reply('Проверяю твой код,ожидай...');
      try {
        const review = await this.reviewService.codeReview(text);

        if (review.length > 4000) {
          const chunks = review.match(/[\s\S]{1,4000}/g) || [];
          for (const chunk of chunks) {
            await ctx.reply(chunk);
          }
          await ctx.reply('✅ Отправь /review если хочешь еще ');
        } else {
          await ctx.reply(review);
          await ctx.reply('✅ Отправь /review для нового ревью ');
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error('Ошибка при код ревью:', errorMessage);
        await ctx.reply(
          `❌  Произошла ошибка при ревью: ${errorMessage}\n\n` +
            'Попробуй ещё раз через /review.',
        );
      }
    });
    const webHook = this.configService.get<string>('WEBHOOK_URL');
    if (webHook) {
      this.bot.launch({ webhook: { domain: webHook, port: 3000 } });
    } else {
      this.bot.launch();
    }
  }
  private looksLikeCode(text: string): boolean {
    if (text.length < 10) return false;

    const noProgramming =
      /^(как|что|почему|зачем|кто|где|когда|можно|привет|здаров|хей|hi|hello|help|спс|спасибо|ок|окей)/i;
    if (noProgramming.test(text.trim())) return false;

    const symvolIndicators = /[{}\[\]();=><`~]/;
    if (!symvolIndicators.test(text)) return false;

    return true;
  }

  onModuleDestroy() {
    for (const timer of this.waitingForCode.values()) {
      clearTimeout(timer);
    }
    this.waitingForCode.clear();

    this.bot?.stop('SIGINT');
  }
}
