import { InputType, Field } from '@nestjs/graphql';
import { IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';

@InputType()
export class AiMessageInput {
  /** دور الرسالة: user أو assistant */
  @Field()
  @IsIn(['user', 'assistant'])
  role!: 'user' | 'assistant';

  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  content!: string;
}
