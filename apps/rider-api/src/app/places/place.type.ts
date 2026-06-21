import { ObjectType, Field, Float } from '@nestjs/graphql';

/// اقتراح بحث عن مكان (Google Places Autocomplete).
@ObjectType()
export class PlacePredictionType {
  @Field()
  placeId!: string;

  /// الاسم الرئيسي (مثلاً: سفاري هايبر ماركت)
  @Field()
  title!: string;

  /// العنوان الثانوي (الحي/المدينة)
  @Field({ nullable: true })
  subtitle?: string;
}

/// إحداثيات مكان بعد اختياره (Place Details).
@ObjectType()
export class PlaceLocationType {
  @Field(() => Float)
  lat!: number;

  @Field(() => Float)
  lng!: number;

  @Field({ nullable: true })
  address?: string;
}
