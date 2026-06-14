import { Field, Int, ObjectType } from '@nestjs/graphql';

/** نتيجة ترجمة نصّ فعلية (عبر المزوّد). */
@ObjectType()
export class TranslationResult {
  /** هل خدمة الترجمة مُفعَّلة (المفتاح موجود)؟ */
  @Field() configured!: boolean;
  @Field({ nullable: true }) translatedText?: string;
  @Field({ nullable: true }) detectedSourceLanguage?: string;
  @Field() provider!: string;
  @Field({ nullable: true }) error?: string;
}

/**
 * جاهزية المزوّدين الفعلية — يقرأ وجود مفاتيح البيئة الحقيقية (Twilio/Stripe/
 * HyperPay/Moyasar/Translation) ليؤكّد للمالك أيّ التكاملات صارت حيّة بعد إضافة
 * المفاتيح. لا يكشف أي قيمة.
 */
@ObjectType()
export class ProviderReadiness {
  @Field() smsTwilio!: boolean;
  @Field() paymentStripe!: boolean;
  @Field() paymentHyperPay!: boolean;
  @Field() paymentMoyasar!: boolean;
  @Field() translation!: boolean;
  /** هل أيّ بوابة دفع مُفعَّلة؟ */
  @Field() anyPayment!: boolean;
}

/** نصّ مُكتشَف اللغة (تقريبياً بالنظام الكتابي). */
export type DetectedScript = 'arabic' | 'latin' | 'other' | 'unknown';

/** رسالة محادثة مُثراة باللغة المُكتشَفة. */
@ObjectType()
export class ConversationMessage {
  @Field(() => Int) id!: number;
  @Field() senderType!: string; // rider | driver
  @Field(() => Int) senderId!: number;
  @Field() text!: string;
  /** اللغة/النظام الكتابي المُكتشَف (arabic/latin/other). */
  @Field() script!: string;
  @Field() createdAt!: Date;
}

/**
 * محادثة رحلة مُحلَّلة لغوياً — تُظهر لغة كل طرف وتُعلِّم الرحلات التي يتحدّث فيها
 * الراكب والسائق بنُظُم كتابية مختلفة (إشارة الحاجة لترجمة فورية).
 */
@ObjectType()
export class OrderConversation {
  @Field(() => Int) orderId!: number;
  @Field(() => [ConversationMessage]) messages!: ConversationMessage[];
  /** النظام الكتابي الغالب للراكب. */
  @Field({ nullable: true }) riderScript?: string;
  /** النظام الكتابي الغالب للسائق. */
  @Field({ nullable: true }) driverScript?: string;
  /** هل الطرفان يستخدمان نُظُماً مختلفة → تحتاج ترجمة؟ */
  @Field() needsTranslation!: boolean;
  /** هل خدمة الترجمة مُجهَّزة (مفتاح المالك موجود)؟ */
  @Field() translationReady!: boolean;
  /** اسم متغيّر البيئة المطلوب لتفعيل الترجمة. */
  @Field() translationEnvKey!: string;
}
