import {
  Resolver,
  Query,
  Mutation,
  Args,
  Int,
  ObjectType,
  Field,
  Float,
} from '@nestjs/graphql';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, LessThanOrEqual, MoreThanOrEqual, Or, Repository } from 'typeorm';
import {
  AnnouncementEntity,
  GiftBatchEntity,
  GiftCodeEntity,
  WalletOwnerType,
  WalletTransactionStatus,
  WalletTransactionType,
} from '@hancr/database';
import { WalletService } from '@hancr/wallet';
import { JwtAuthGuard, CurrentUser } from '../auth/jwt-auth.guard';
import { AuthUser } from '../auth/jwt.strategy';

@ObjectType()
export class RiderAnnouncementType {
  @Field(() => Int) id!: number;
  @Field() title!: string;
  @Field() body!: string;
  @Field({ nullable: true }) url?: string;
  @Field() startsAt!: Date;
  @Field({ nullable: true }) endsAt?: Date;
}

@ObjectType()
export class GiftClaimResultType {
  @Field() success!: boolean;
  @Field(() => Float) amount!: number;
  @Field() currency!: string;
  @Field(() => Float) newBalance!: number;
}

@Injectable()
export class RiderMarketingService {
  constructor(
    @InjectRepository(AnnouncementEntity)
    private readonly annRepo: Repository<AnnouncementEntity>,
    @InjectRepository(GiftBatchEntity)
    private readonly batchRepo: Repository<GiftBatchEntity>,
    @InjectRepository(GiftCodeEntity)
    private readonly codeRepo: Repository<GiftCodeEntity>,
    private readonly walletService: WalletService,
  ) {}

  async activeAnnouncements(): Promise<RiderAnnouncementType[]> {
    const now = new Date();
    const rows = await this.annRepo.find({
      where: [
        {
          active: true,
          target: In(['all', 'rider']),
          startsAt: LessThanOrEqual(now),
          endsAt: Or(IsNull(), MoreThanOrEqual(now)),
        },
      ],
      order: { startsAt: 'DESC' },
    });
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      body: r.body,
      url: r.url,
      startsAt: r.startsAt,
      endsAt: r.endsAt,
    }));
  }

  async claimGiftCode(
    riderId: number,
    code: string,
  ): Promise<GiftClaimResultType> {
    const trimmed = code.trim().toUpperCase();
    const giftCode = await this.codeRepo.findOne({ where: { code: trimmed } });
    if (!giftCode) throw new NotFoundException('Code not found');
    if (giftCode.claimedBy) {
      throw new BadRequestException('Code already claimed');
    }
    const batch = await this.batchRepo.findOne({
      where: { id: giftCode.batchId },
    });
    if (!batch) throw new NotFoundException('Batch not found');
    if (batch.expiresAt && new Date(batch.expiresAt) < new Date()) {
      throw new BadRequestException('Gift batch expired');
    }

    // Credit the rider's wallet
    const result = await this.walletService.credit({
      ownerType: WalletOwnerType.Rider,
      ownerId: riderId,
      type: WalletTransactionType.PromoBonus,
      amount: Number(batch.amount),
      currency: batch.currency,
      status: WalletTransactionStatus.Completed,
      description: `Gift code ${trimmed} (${batch.name})`,
    });

    giftCode.claimedBy = riderId;
    giftCode.claimedAt = new Date();
    await this.codeRepo.save(giftCode);
    batch.claimedCount += 1;
    await this.batchRepo.save(batch);

    return {
      success: true,
      amount: Number(batch.amount),
      currency: batch.currency,
      newBalance: result.newBalance,
    };
  }
}

@Resolver()
export class RiderMarketingResolver {
  constructor(private readonly service: RiderMarketingService) {}

  @Query(() => [RiderAnnouncementType], {
    description: 'الإعلانات النشطة للراكب',
  })
  activeAnnouncements(): Promise<RiderAnnouncementType[]> {
    return this.service.activeAnnouncements();
  }

  @Mutation(() => GiftClaimResultType, { description: 'استخدام كود هدية' })
  @UseGuards(JwtAuthGuard)
  claimGiftCode(
    @CurrentUser() user: AuthUser,
    @Args('code') code: string,
  ): Promise<GiftClaimResultType> {
    return this.service.claimGiftCode(user.riderId, code);
  }
}
