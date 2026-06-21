import { ObjectType, Field, Float, Int } from '@nestjs/graphql';

/// نتيجة بحث عن مكان (Places API New — searchText) مع الإحداثيات والمسافة.
@ObjectType()
export class PlacePredictionType {
  @Field()
  placeId!: string;

  /// الاسم الرئيسي (مثلاً: مطار حمد الدولي)
  @Field()
  title!: string;

  /// العنوان الكامل / المنطقة (لتمييز الفروع)
  @Field({ nullable: true })
  subtitle?: string;

  @Field(() => Float, { nullable: true })
  lat?: number;

  @Field(() => Float, { nullable: true })
  lng?: number;

  /// المسافة من موقع المستخدم بالأمتار (للترتيب والعرض)
  @Field(() => Int, { nullable: true })
  distanceMeters?: number;
}

/// إحداثيات مكان (احتياطي عبر Place Details New).
@ObjectType()
export class PlaceLocationType {
  @Field(() => Float)
  lat!: number;

  @Field(() => Float)
  lng!: number;

  @Field({ nullable: true })
  address?: string;
}
