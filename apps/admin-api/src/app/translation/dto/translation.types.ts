import { Field, Int, ObjectType } from '@nestjs/graphql';

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
