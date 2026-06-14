import { Module } from '@nestjs/common';
import { BotService } from './bot.service';
import { ConfigModule } from '@nestjs/config';
import { ReviewService } from 'src/review/review.service';

@Module({
  imports: [ConfigModule],
  providers: [BotService, ReviewService],
})
export class BotModule {}
