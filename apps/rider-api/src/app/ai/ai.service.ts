import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

export interface AiTurn {
  role: 'user' | 'assistant';
  content: string;
}

const SYSTEM_PROMPT = `أنت "مساعد HANCR" — المساعد الذكي داخل تطبيق HANCR لخدمات النقل والتوصيل في منطقة الخليج.
دورك: مساعدة الركّاب على الطلب والإجابة عن كل أسئلتهم بوضوح وود واختصار.

اللغة: ردّ دائماً بنفس لغة المستخدم (عربي أو إنجليزي). إن كتب بالعربية فبالعربية، وإن كتب بالإنجليزية فبالإنجليزية.

عن HANCR — الخدمات المتاحة:
- رحلة (Ride): سيارة أجرة عادية.
- توصيل/طرود (Delivery/Parcel): إرسال واستلام الطرود مع رمز تحقّق.
- استقبال المطار (Airport Pickup).
- سفر فاخر (Luxury): سيارات راقية.
- المشترك/Commuter: اشتراك يومي/شهري للموظفين والطلاب (ذهاب وعودة بأوقات وأيام محدّدة).
- مشاركة الرحلة (Carpool) · بقالة (Grocery) · متابعة الرحلات الجوية · المحفظة وشحنها · الأماكن المحفوظة · الرحلات المجدولة · الإحالات والكوبونات.

كيف يحجز الراكب رحلة:
1. من الشاشة الرئيسية يضغط "Where to?" أو الزر الأوسط.
2. يحدّد الوجهة على الخريطة أو يبحث عنها، ويمكنه إضافة محطة.
3. يختار نوع الخدمة ويرى تقدير الأجرة (يعتمد على المسافة والوقت).
4. يؤكّد الطلب ثم يُطابَق مع أقرب سائق.

المناطق المُفعَّلة حالياً: قطر والسعودية (الإمارات قريباً). الدفع: المحفظة أو نقداً.

قواعد مهمة:
- لا تختلق أسعاراً محدّدة؛ اشرح أن السعر يُحسب من المسافة والوقت ويظهر قبل التأكيد.
- لا تطلب أبداً كلمات مرور أو بيانات بطاقات.
- إن لم تعرف إجابة دقيقة، اقترح التواصل مع الدعم: support@hancr.com.
- كن مختصراً (جُمَل قليلة)، عملياً، ولطيفاً. وجّه المستخدم خطوة بخطوة عند الحجز.`;

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  // المزوّد: OpenAI (إن وُجد مفتاحه) وإلا Anthropic.
  private readonly openai: OpenAI | null;
  private readonly anthropic: Anthropic | null;
  private readonly provider: 'openai' | 'anthropic' | null;
  private readonly model: string;

  constructor(private readonly config: ConfigService) {
    const openaiKey = config.get<string>('OPENAI_API_KEY');
    const anthropicKey = config.get<string>('ANTHROPIC_API_KEY');
    if (openaiKey) {
      this.openai = new OpenAI({ apiKey: openaiKey });
      this.anthropic = null;
      this.provider = 'openai';
      this.model = config.get<string>('OPENAI_MODEL') ?? 'gpt-4o';
    } else if (anthropicKey) {
      this.openai = null;
      this.anthropic = new Anthropic({ apiKey: anthropicKey });
      this.provider = 'anthropic';
      this.model = config.get<string>('ANTHROPIC_MODEL') ?? 'claude-opus-4-8';
    } else {
      this.openai = null;
      this.anthropic = null;
      this.provider = null;
      this.model = '';
      this.logger.warn('لا مفتاح OpenAI/Anthropic — المساعد الذكي معطّل.');
    }
  }

  get enabled(): boolean {
    return this.provider !== null;
  }

  /**
   * محادثة مع المساعد. history هو سجل المحادثة (user/assistant بالتناوب)،
   * message هي رسالة المستخدم الجديدة. يعيد نص رد المساعد.
   */
  async chat(message: string, history: AiTurn[] = []): Promise<string> {
    if (!this.provider) {
      return 'المساعد الذكي غير مُهيّأ بعد. تواصل مع الدعم support@hancr.com أو استخدم الحجز اليدوي.';
    }

    // نحافظ على آخر 12 دوراً فقط (سياق معقول + تكلفة أقل)
    const trimmed = history.slice(-12).filter((t) => t.content?.trim());

    try {
      if (this.provider === 'openai') {
        const resp = await this.openai!.chat.completions.create({
          model: this.model,
          max_tokens: 1024,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...trimmed.map((t) => ({ role: t.role, content: t.content })),
            { role: 'user', content: message },
          ],
        });
        return (
          resp.choices[0]?.message?.content?.trim() ||
          'عذراً، لم أفهم. أعد صياغة سؤالك من فضلك.'
        );
      }

      // Anthropic
      const messages: Anthropic.MessageParam[] = [
        ...trimmed.map((t) => ({ role: t.role, content: t.content })),
        { role: 'user' as const, content: message },
      ];
      const resp = await this.anthropic!.messages.create({
        model: this.model,
        max_tokens: 1024,
        thinking: { type: 'adaptive' },
        system: SYSTEM_PROMPT,
        messages,
      });
      const text = resp.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('\n')
        .trim();
      return text || 'عذراً، لم أفهم. أعد صياغة سؤالك من فضلك.';
    } catch (e) {
      this.logger.error(
        `AI chat failed (${this.provider}): ${(e as Error).message}`,
      );
      return 'حدث خطأ مؤقّت في المساعد. حاول مجدداً بعد قليل.';
    }
  }
}
