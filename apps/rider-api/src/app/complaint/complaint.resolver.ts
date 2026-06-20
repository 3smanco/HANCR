import { Resolver, Mutation, Query, Args, Int, Field, InputType, ObjectType } from '@nestjs/graphql';
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
export class ComplaintActivityType {
  @Field(() => Int) id!: number;
  @Field() type!: string;
  @Field({ nullable: true }) note?: string;
  @Field() createdAt!: Date;
}

@ObjectType()
export class RiderComplaintType {
  @Field(() => Int) id!: number;
  @Field(() => Int, { nullable: true }) orderId?: number;
  @Field() category!: string;
  @Field() status!: string;
  @Field({ nullable: true }) description?: string;
  @Field({ nullable: true }) resolutionNote?: string;
  @Field({ nullable: true }) resolvedAt?: Date;
  @Field() createdAt!: Date;
  @Field(() => [ComplaintActivityType], { defaultValue: [] })
  activities!: ComplaintActivityType[];
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
        // SLA: موعد استحقاق الرد بعد 24 ساعة من الإنشاء.
        dueAt: new Date(Date.now() + 24 * 3600 * 1000),
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
      orderId: saved.orderId,
      category: saved.category,
      status: saved.status,
      description: saved.description,
      createdAt: saved.createdAt,
      activities: [],
    };
  }

  /** شكاوى الراكب مع خطّ زمني للنشاط (read-only) */
  async list(riderId: number): Promise<RiderComplaintType[]> {
    const complaints = await this.repo.find({
      where: { reportedByType: 'rider', reportedById: riderId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
    if (complaints.length === 0) return [];
    const ids = complaints.map((c) => c.id);
    const activities = await this.activityRepo.find({
      where: ids.map((complaintId) => ({ complaintId })),
      order: { createdAt: 'ASC' },
    });
    const byComplaint = new Map<number, ComplaintActivityType[]>();
    for (const a of activities) {
      const list = byComplaint.get(a.complaintId) ?? [];
      list.push({
        id: a.id,
        type: a.type,
        note: a.note ?? undefined,
        createdAt: a.createdAt,
      });
      byComplaint.set(a.complaintId, list);
    }
    return complaints.map((c) => ({
      id: c.id,
      orderId: c.orderId,
      category: c.category,
      status: c.status,
      description: c.description,
      resolutionNote: c.resolutionNote ?? undefined,
      resolvedAt: c.resolvedAt ?? undefined,
      createdAt: c.createdAt,
      activities: byComplaint.get(c.id) ?? [],
    }));
  }

  /** ردّ الراكب داخل تذكرته (يُضاف للخطّ الزمني كـ rider_message). */
  async reply(
    riderId: number,
    complaintId: number,
    message: string,
    imageUrl?: string,
  ): Promise<boolean> {
    const c = await this.repo.findOne({
      where: { id: complaintId, reportedByType: 'rider', reportedById: riderId },
    });
    if (!c) return false;
    await this.activityRepo.save(
      this.activityRepo.create({
        complaintId: c.id,
        actorType: 'rider',
        actorId: riderId,
        type: 'rider_message',
        note: imageUrl ? `${message}\n📎 ${imageUrl}` : message,
      }),
    );
    // إعادة فتح التذكرة إن كانت مُغلقة ليراها الدعم.
    if (c.status === 'resolved' || c.status === 'dismissed') {
      await this.repo.update(c.id, { status: 'under_review' });
    }
    return true;
  }
}

@Resolver(() => RiderComplaintType)
export class RiderComplaintResolver {
  constructor(private readonly service: RiderComplaintService) {}

  @Query(() => [RiderComplaintType], {
    description: 'شكاوى الراكب مع حالتها وخطّها الزمني',
  })
  @UseGuards(JwtAuthGuard)
  myComplaints(@CurrentUser() user: AuthUser): Promise<RiderComplaintType[]> {
    return this.service.list(user.riderId);
  }

  @Mutation(() => RiderComplaintType, { description: 'تقديم شكوى من راكب' })
  @UseGuards(JwtAuthGuard)
  submitComplaint(
    @CurrentUser() user: AuthUser,
    @Args('input') input: SubmitComplaintInput,
  ): Promise<RiderComplaintType> {
    return this.service.submit(user.riderId, input);
  }

  @Mutation(() => Boolean, { description: 'ردّ الراكب داخل تذكرة' })
  @UseGuards(JwtAuthGuard)
  replyToComplaint(
    @CurrentUser() user: AuthUser,
    @Args('complaintId', { type: () => Int }) complaintId: number,
    @Args('message') message: string,
    @Args('imageUrl', { nullable: true }) imageUrl?: string,
  ): Promise<boolean> {
    return this.service.reply(user.riderId, complaintId, message, imageUrl);
  }
}
