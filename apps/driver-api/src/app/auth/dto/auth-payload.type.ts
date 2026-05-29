import { ObjectType, Field } from '@nestjs/graphql';
import { DriverType } from '../../driver/dto/driver.type';

@ObjectType()
export class AuthPayload {
  @Field()
  accessToken!: string;

  @Field(() => DriverType)
  driver!: DriverType;

  @Field()
  isNewDriver!: boolean;
}
