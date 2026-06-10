import { Resolver, Query } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GraphQLJSON } from 'graphql-scalars';
import { AppConfigEntity } from '@hancr/database';

/**
 * N5 — الثيم الحي (SDUI) لتطبيق السائق.
 * عام بدون مصادقة (يُطبَّق على شاشات الـ splash/login).
 * يقرأ نفس صف 'main' الذي تكتبه لوحة التحكم — فالراكب والسائق يتشاركان
 * نفس الثيم المنشور من اللوحة.
 */
@Resolver()
export class ThemeResolver {
  constructor(
    @InjectRepository(AppConfigEntity)
    private readonly appConfigRepo: Repository<AppConfigEntity>,
  ) {}

  @Query(() => GraphQLJSON, {
    nullable: true,
    description: 'ثيم التطبيق الحي (SDUI) — عام بدون مصادقة',
  })
  async appTheme(): Promise<unknown> {
    const cfg = await this.appConfigRepo.findOne({
      where: { configKey: 'main' },
    });
    return cfg?.themeConfig ?? null;
  }
}
