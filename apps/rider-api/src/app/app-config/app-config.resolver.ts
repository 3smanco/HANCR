import { Resolver, Query } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppConfigEntity } from '@hancr/database';
import { AppConfigPublicType, BannerType } from './dto/app-config.type';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface RawBanner {
  id?: string;
  imageUrl?: string;
  title?: string;
  subtitle?: string;
  link?: string;
  order?: number;
  active?: boolean;
  expiresAt?: string;
}

@Resolver(() => AppConfigPublicType)
export class AppConfigResolver {
  constructor(
    @InjectRepository(AppConfigEntity)
    private readonly appConfigRepo: Repository<AppConfigEntity>,
  ) {}

  /** إعدادات الشاشة الرئيسية للراكب (البانرات النشطة مرتّبة) */
  @Query(() => AppConfigPublicType, { description: 'إعدادات التطبيق العامة' })
  @UseGuards(JwtAuthGuard)
  async appConfig(): Promise<AppConfigPublicType> {
    const cfg = await this.appConfigRepo.find({ take: 1 });
    const home = (cfg[0]?.homeScreenConfig ?? {}) as {
      banners?: RawBanner[];
    };
    const now = Date.now();

    const banners: BannerType[] = (home.banners ?? [])
      .filter((b) => b && b.imageUrl && b.active !== false)
      .filter((b) => !b.expiresAt || new Date(b.expiresAt).getTime() > now)
      .map((b, i) => ({
        id: b.id ?? String(i),
        imageUrl: b.imageUrl as string,
        title: b.title,
        subtitle: b.subtitle,
        link: b.link,
        order: b.order ?? i,
      }))
      .sort((a, b) => a.order - b.order);

    return { banners };
  }
}
