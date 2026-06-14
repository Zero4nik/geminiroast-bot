import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class ReviewService {
  private openAI: OpenAI;
  private model: string;
  private prompt: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('DEEPSEEK_API_KEY');
    if (!apiKey) throw new Error('DEEPSEEK_API_KEY не найден в .env');

    const model = this.configService.get<string>('DEEPSEEK_MODEL');
    if (!model) throw new Error('DEEPSEEK_MODEL не найден в .env');

    const prompt = this.configService.get<string>('ROAST_PROMPT');
    if (!prompt) throw new Error('ROAST_PROMPT не найден в .env');

    this.model = model;
    this.prompt = prompt;

    this.openAI = new OpenAI({
      baseURL: 'https://api.deepseek.com/v1',
      apiKey: apiKey,
      defaultHeaders: {
        'HTTP-Referer': 'https://t.me/GeminiRoast_bot',
        'X-Title': 'GeminiRoast',
      },
    });
  }
  async codeReview(code: string) {
    const fullPrompt = `${this.prompt} \n\n ВОТ КОД НА РЕВЬЮ: \n\n ${code}`;

    try {
      const completion = await this.openAI.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: fullPrompt }],
        temperature: 0.3,
        max_tokens: 2048,
      });
      const reviewText = completion.choices[0]?.message?.content;

      if (!reviewText) {
        return 'Ошибка: AI не вернул ответ. Попробуйте ещё раз.';
      }

      return reviewText;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error('Ошибка при запросе:', error);
      return `Ошибка при запросе к AI ${errorMessage}. Проверьте ключ и модель в .env`;
    }
  }
}
