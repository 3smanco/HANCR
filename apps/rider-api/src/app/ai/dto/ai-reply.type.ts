import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class AiReply {
  /** نص رد المساعد */
  @Field()
  reply!: string;
}
