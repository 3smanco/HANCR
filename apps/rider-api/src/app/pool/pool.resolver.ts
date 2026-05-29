import { Resolver, Query } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PoolEntity, PoolMemberEntity } from '@hancr/database';
import { PoolType } from './dto/pool.type';
import { JwtAuthGuard, CurrentUser } from '../auth/jwt-auth.guard';
import { AuthUser } from '../auth/jwt.strategy';

@Resolver(() => PoolType)
export class PoolResolver {
  constructor(
    @InjectRepository(PoolEntity)
    private readonly poolRepo: Repository<PoolEntity>,

    @InjectRepository(PoolMemberEntity)
    private readonly memberRepo: Repository<PoolMemberEntity>,
  ) {}

  /**
   * المجموعة التي ينتمي إليها الراكب
   */
  @Query(() => PoolType, {
    nullable: true,
    description: 'المجموعة العائلية/المؤسسية للراكب',
  })
  @UseGuards(JwtAuthGuard)
  async myPool(@CurrentUser() user: AuthUser): Promise<PoolType | null> {
    // البحث عن المجموعة التي يملكها الراكب
    const pool = await this.poolRepo.findOne({
      where: { ownerId: user.riderId, active: true },
      relations: ['members'],
    });

    if (!pool) return null;

    return {
      id: pool.id,
      name: pool.name,
      type: pool.poolType,
      ownerId: pool.ownerId,
      active: pool.active,
      members: (pool.members ?? []).map((m) => ({
        id: m.id,
        riderId: m.riderId,
        role: m.riderId === pool.ownerId ? 'owner' : 'member',
        joinedAt: m.createdAt,
      })),
      createdAt: pool.createdAt,
    };
  }
}
