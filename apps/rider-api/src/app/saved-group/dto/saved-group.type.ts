import { ObjectType, Field, Int, InputType } from '@nestjs/graphql';

@ObjectType()
export class SavedGroupMemberType {
  @Field()
  name!: string;

  @Field()
  phone!: string;
}

@ObjectType()
export class SavedGroupType {
  @Field(() => Int)
  id!: number;

  @Field()
  name!: string;

  /** 'personal' | 'business' */
  @Field()
  type!: string;

  @Field(() => [SavedGroupMemberType])
  members!: SavedGroupMemberType[];

  @Field()
  createdAt!: Date;
}

@InputType()
export class SavedGroupMemberInput {
  @Field()
  name!: string;

  @Field()
  phone!: string;
}
