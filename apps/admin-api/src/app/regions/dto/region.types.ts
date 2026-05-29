import { ObjectType, InputType, Field, Int } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-scalars';

@ObjectType()
export class AdminRegionType {
  @Field(() => Int) id!: number;
  @Field() name!: string;
  @Field() nameEn!: string;
  @Field() currency!: string;
  @Field() enabled!: boolean;
  @Field() bidModeEnabled!: boolean;
  @Field({ nullable: true }) metroApiUrl?: string;
  @Field(() => Int) defaultSearchRadius!: number;
  @Field(() => GraphQLJSON, { nullable: true }) boundary?: unknown;
  @Field() createdAt!: Date;
  @Field() updatedAt!: Date;
}

@InputType()
export class CreateRegionInput {
  @Field() name!: string;
  @Field() nameEn!: string;
  @Field() currency!: string;
  @Field({ nullable: true }) metroApiUrl?: string;
  @Field(() => Int, { nullable: true }) defaultSearchRadius?: number;
  @Field({ nullable: true }) bidModeEnabled?: boolean;
  @Field(() => GraphQLJSON, { nullable: true }) boundary?: unknown;
}

@InputType()
export class UpdateRegionInput {
  @Field({ nullable: true }) name?: string;
  @Field({ nullable: true }) nameEn?: string;
  @Field({ nullable: true }) currency?: string;
  @Field({ nullable: true }) enabled?: boolean;
  @Field({ nullable: true }) bidModeEnabled?: boolean;
  @Field({ nullable: true }) metroApiUrl?: string;
  @Field(() => Int, { nullable: true }) defaultSearchRadius?: number;
  @Field(() => GraphQLJSON, { nullable: true }) boundary?: unknown;
}
