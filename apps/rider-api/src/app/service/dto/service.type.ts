import { ObjectType, Field, Int, Float } from '@nestjs/graphql';

@ObjectType()
export class ServiceType {
  @Field(() => Int)
  id!: number;

  @Field()
  name!: string;

  @Field()
  nameEn!: string;

  @Field()
  serviceType!: string;

  @Field(() => Float)
  baseFare!: number;

  @Field(() => Float)
  minimumFee!: number;

  @Field(() => Float, { nullable: true })
  hourlyRate?: number;

  @Field(() => Int)
  searchRadius!: number;

  @Field()
  bidModeEnabled!: boolean;

  @Field()
  enabled!: boolean;

  @Field(() => Int)
  displayOrder!: number;

  @Field({ nullable: true })
  iconUrl?: string;

  @Field()
  isVip!: boolean;
}
