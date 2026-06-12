import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AiService } from './ai.service';
import { AiMessageInput } from './dto/ai-message.input';
import { AiReply } from './dto/ai-reply.type';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Resolver()
export class AiResolver {
  constructor(private readonly ai: AiService) {}

  /**
   * مساعد HANCR الذكي — يجيب عن الأسئلة ويساعد في الحجز (نص + صوت من العميل).
   * محميّ بـ JWT ومحدود المعدّل (يمنع إساءة الاستخدام/التكلفة).
   */
  @Mutation(() => AiReply, { description: 'مساعد HANCR الذكي (محادثة)' })
  @UseGuards(JwtAuthGuard)
  @Throttle({ strict: { limit: 20, ttl: 60000 } })
  async aiAssistant(
    @Args('message') message: string,
    @Args('history', { type: () => [AiMessageInput], nullable: true })
    history?: AiMessageInput[],
  ): Promise<AiReply> {
    const reply = await this.ai.chat(message, history ?? []);
    return { reply };
  }
}
