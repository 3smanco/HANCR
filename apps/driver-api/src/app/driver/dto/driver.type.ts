import { ObjectType, Field, Int, Float } from '@nestjs/graphql';

@ObjectType()
export class DriverType {
  @Field(() => Int)
  id!: number;

  @Field()
  phoneNumber!: string;

  @Field()
  countryCode!: string;

  @Field()
  firstName!: string;

  @Field()
  lastName!: string;

  @Field({ nullable: true })
  avatarUrl?: string;

  @Field()
  status!: string;

  @Field()
  active!: boolean;

  @Field()
  banned!: boolean;

  @Field(() => Float)
  rating!: number;

  @Field(() => Int)
  ratingCount!: number;

  @Field({ nullable: true })
  carBrand?: string;

  @Field({ nullable: true })
  carModel?: string;

  @Field({ nullable: true })
  carColor?: string;

  @Field({ nullable: true })
  plateNumber?: string;

  @Field(() => Int, { nullable: true })
  carYear?: number;

  @Field({ nullable: true })
  carPhotoUrl?: string;

  @Field(() => Float)
  balance!: number;

  @Field()
  currency!: string;

  @Field({ nullable: true })
  fcmToken?: string;

  @Field(() => Int, { nullable: true })
  regionId?: number;

  @Field()
  createdAt!: Date;

  /** H3 — flags */
  @Field({ nullable: true })
  gender?: string;

  @Field()
  kidsApproved!: boolean;

  @Field()
  nightApproved!: boolean;

  /** I1 — pending_docs | docs_uploaded | approved | soft_reject | hard_reject */
  @Field()
  approvalStatus!: string;

  @Field({ nullable: true })
  rejectionReason?: string;
}
