import { ObjectType, InputType, Field, Int } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-scalars';

@ObjectType()
export class AppConfigType {
  @Field(() => Int) id!: number;

  /** 'main' | 'rider' | 'driver' */
  @Field() configKey!: string;

  /** Semantic version string e.g. "1.0.0" */
  @Field() version!: string;

  /** Two-Skin Theme Config */
  @Field(() => GraphQLJSON, { nullable: true })
  themeConfig?: unknown;

  /** Home Screen Layout (SDUI) */
  @Field(() => GraphQLJSON, { nullable: true })
  homeScreenConfig?: unknown;

  /** Feature Flags */
  @Field(() => GraphQLJSON, { nullable: true })
  featureFlags?: unknown;

  /** Loyalty / Miles Config */
  @Field(() => GraphQLJSON, { nullable: true })
  loyaltyConfig?: unknown;

  /** K3 — SMS provider config */
  @Field(() => GraphQLJSON, { nullable: true })
  smsConfig?: unknown;

  /** K3 — Payment gateway config */
  @Field(() => GraphQLJSON, { nullable: true })
  gatewayConfig?: unknown;

  /** N1 — Operational values (OTP, search radius, ETA, matching) */
  @Field(() => GraphQLJSON, { nullable: true })
  operationsConfig?: unknown;

  /** N1 — Cancellation rules + dynamic surge */
  @Field(() => GraphQLJSON, { nullable: true })
  pricingRulesConfig?: unknown;

  @Field({ nullable: true }) updatedBy?: string;
  @Field() updatedAt!: Date;
}

@InputType()
export class UpdateAppConfigInput {
  @Field({ nullable: true }) version?: string;

  @Field(() => GraphQLJSON, { nullable: true })
  themeConfig?: unknown;

  @Field(() => GraphQLJSON, { nullable: true })
  homeScreenConfig?: unknown;

  @Field(() => GraphQLJSON, { nullable: true })
  featureFlags?: unknown;

  @Field(() => GraphQLJSON, { nullable: true })
  loyaltyConfig?: unknown;

  @Field(() => GraphQLJSON, { nullable: true })
  smsConfig?: unknown;

  @Field(() => GraphQLJSON, { nullable: true })
  gatewayConfig?: unknown;

  @Field(() => GraphQLJSON, { nullable: true })
  operationsConfig?: unknown;

  @Field(() => GraphQLJSON, { nullable: true })
  pricingRulesConfig?: unknown;
}
