import { Resolver, Mutation, Args, Int, Field, InputType, ObjectType } from '@nestjs/graphql';
import { Injectable, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IsIn, IsInt, IsOptional, IsString, MinLength } from 'class-validator';
import {
  ComplaintActivityEntity,
  ComplaintEntity,
} from '@hancr/database';
import { JwtAuthGuard, CurrentUser } from '../auth/jwt-auth.guard';
import { AuthUser } from '../auth/jwt.strategy';

@InputType()
export class SubmitComplaintInput {
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  orderId?: number;

  @Field()
  @IsString()
  @IsIn(['safety', 'fare', 'route', 'cleanliness', 'behavior', 'other'])
  category!: string;

  @Field()
  @IsString()
  @MinLength(5)
  description!: string;
}

@ObjectType()
export class RiderComplaintType {
  @Field(() => Int) id!: number;
  @Field() category!: string;
  @Field() status!: string;
  @Field() createdAt!: Date;
}

@Injectable()
export class RiderComplaintService {
  constructor(
    @InjectRepository(ComplaintEntity)
    private readonly repo: Repository<ComplaintEntity>,
    @InjectRepository(ComplaintActivityEntity)
    private readonly activityRepo: Repository<ComplaintActivityEntity>,
  ) {}

  async submit(
    riderId: number,
    input: SubmitComplaintInput,
  ): Promise<RiderComplaintType> {
    const saved = await this.repo.save(
      this.repo.create({
        orderId: input.orderId,
        reportedByType: 'rider',
        reportedById: riderId,
        category: input.category,
        description: input.description,
        status: 'submitted',
      }),
    );
    await this.activityRepo.save(
      this.activityRepo.create({
        complaintId: saved.id,
        actorType: 'rider',
        actorId: riderId,
        type: 'created',
        note: `Category: ${input.category}`,
      }),
    );
    return {
      id: saved.id,
      category: saved.category,
      status: saved.status,
      createdAt: saved.createdAt,
    };
  }
}

@Resolver(() => RiderComplaintType)
export class RiderComplaintResolver {
  constructor(private readonly service: RiderComplaintService) {}

  @Mutation(() => RiderComplaintType, { description: 'تقديم شكوى من راكب' })
  @UseGuards(JwtAuthGuard)
  submitComplaint(
    @CurrentUser() user: AuthUser,
    @Args('input') input: SubmitComplaintInput,
  ): Promise<RiderComplaintType> {
    return this.service.submit(user.riderId, input);
  }
}
