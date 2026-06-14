import { Field, Float, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsBoolean, IsInt, IsOptional } from 'class-validator';

@ObjectType()
export class CountryTaxRuleType {
  @Field() type!: string;
  @Field(() => Float) rate!: number;
  @Field({ nullable: true }) label?: string;
}

@ObjectType()
export class CountryType {
  @Field(() => Int) id!: number;
  @Field() iso2!: string;
  @Field() name!: string;
  @Field() nameEn!: string;
  @Field() currency!: string;
  @Field() timezone!: string;
  @Field({ nullable: true }) flag?: string;
  @Field({ nullable: true }) dialCode?: string;
  @Field() units!: string;
  @Field(() => CountryTaxRuleType, { nullable: true }) taxRule?: CountryTaxRuleType;
  @Field(() => [String]) docRequirements!: string[];
  @Field({ nullable: true }) emergencyNumber?: string;
  @Field() enabled!: boolean;
  /** عدد المدن المُفعَّلة (للشارة في الفلتر). */
  @Field(() => Int) cityCount!: number;
}

@ObjectType()
export class CityType {
  @Field(() => Int) id!: number;
  @Field(() => Int) countryId!: number;
  @Field() name!: string;
  @Field() nameEn!: string;
  @Field() timezone!: string;
  @Field(() => Float, { nullable: true }) centerLat?: number;
  @Field(() => Float, { nullable: true }) centerLng?: number;
  @Field() enabled!: boolean;
}

@InputType()
export class SetCountryEnabledInput {
  @Field(() => Int) @IsInt() id!: number;
  @Field() @IsBoolean() enabled!: boolean;
}

@InputType()
export class SetCityEnabledInput {
  @Field(() => Int) @IsInt() id!: number;
  @Field() @IsBoolean() enabled!: boolean;
}

@InputType()
export class CitiesFilterInput {
  @Field(() => Int, { nullable: true }) @IsOptional() @IsInt() countryId?: number;
  @Field({ nullable: true }) @IsOptional() countryIso?: string;
}
