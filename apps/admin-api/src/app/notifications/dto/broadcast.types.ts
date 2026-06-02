import { Field, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';

/** الجمهور المستهدف بالإشعار الجماعي */
export enum BroadcastTarget {
  Riders = 'Riders',
  Drivers = 'Drivers',
  All = 'All',
}

registerEnumType(BroadcastTarget, { name: 'BroadcastTarget' });

@ObjectType()
export class BroadcastResultType {
  @Field(() => Int, { description: 'إجمالي التوكنات المستهدفة' })
  totalTokens!: number;

  @Field(() => Int, { description: 'عدد الإشعارات المُرسَلة بنجاح' })
  sent!: number;

  @Field(() => Int, { description: 'عدد الإخفاقات' })
  failed!: number;
}

export class BroadcastInputArgs {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  body!: string;

  @IsIn(Object.values(BroadcastTarget))
  target!: BroadcastTarget;
}
