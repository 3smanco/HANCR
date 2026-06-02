import { Field, Int, ObjectType } from '@nestjs/graphql';

/** بانر ترويجي يُعرَض في الشاشة الرئيسية (SDUI من app-config) */
@ObjectType()
export class BannerType {
  @Field()
  id!: string;

  @Field()
  imageUrl!: string;

  @Field({ nullable: true })
  title?: string;

  @Field({ nullable: true })
  subtitle?: string;

  /** وجهة عند الضغط: مسار داخلي أو رابط أو كود (اختياري) */
  @Field({ nullable: true })
  link?: string;

  @Field(() => Int)
  order!: number;
}

/** إعدادات التطبيق العامة التي يقرأها تطبيق الراكب */
@ObjectType()
export class AppConfigPublicType {
  @Field(() => [BannerType])
  banners!: BannerType[];
}
