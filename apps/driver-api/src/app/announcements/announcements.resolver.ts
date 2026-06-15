import { Resolver, Query } from '@nestjs/graphql';
import { Injectable, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { AnnouncementEntity } from '@hancr/database';
import { DriverAnnouncementType } from './dto/announcement.type';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Injectable()
export class AnnouncementsService {
  constructor(
    @InjectRepository(AnnouncementEntity)
    private readonly repo: Repository<AnnouncementEntity>,
  ) {}

  /** إعلانات السائق النشطة ضمن نافذتها الزمنية (target: all أو driver). */
  async forDriver(): Promise<DriverAnnouncementType[]> {
    const now = new Date();
    const rows = await this.repo
      .createQueryBuilder('a')
      .where('a.active = true')
      .andWhere('a.target IN (:...targets)', { targets: ['all', 'driver'] })
      .andWhere('a.starts_at <= :now', { now })
      .andWhere(
        new Brackets((qb) => {
          qb.where('a.ends_at IS NULL').orWhere('a.ends_at >= :now', { now });
        }),
      )
      .orderBy('a.created_at', 'DESC')
      .limit(30)
      .getMany();

    return rows.map((a) => ({
      id: a.id,
      title: a.title,
      body: a.body,
      url: a.url ?? undefined,
      createdAt: a.createdAt,
    }));
  }
}

@Resolver()
export class AnnouncementsResolver {
  constructor(private readonly service: AnnouncementsService) {}

  /** إعلانات/أخبار السائق النشطة. */
  @Query(() => [DriverAnnouncementType], {
    description: 'إعلانات السائق النشطة',
  })
  @UseGuards(JwtAuthGuard)
  driverAnnouncements(): Promise<DriverAnnouncementType[]> {
    return this.service.forDriver();
  }
}
