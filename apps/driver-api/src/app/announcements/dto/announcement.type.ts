import { Field, Int, ObjectType } from '@nestjs/graphql';

/** إعلان موجَّه للسائقين (أخبار/عروض/تنبيهات) من لوحة التحكم. */
@ObjectType()
export class DriverAnnouncementType {
  @Field(() => Int) id!: number;
  @Field() title!: string;
  @Field() body!: string;
  @Field({ nullable: true }) url?: string;
  @Field() createdAt!: Date;
}
