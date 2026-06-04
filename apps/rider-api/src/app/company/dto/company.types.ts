import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class MyCompanyType {
  @Field(() => Int) companyId!: number;
  @Field() companyName!: string;
  @Field(() => Float) companyBalance!: number;
  @Field() currency!: string;
  @Field(() => Float) monthlyCapPerEmployee!: number;
  @Field(() => Float) monthlySpent!: number;
  /** المتاح هذا الشهر بعد السقف (0 = بلا حد) */
  @Field(() => Float) monthlyRemaining!: number;
  @Field() status!: string;
}
