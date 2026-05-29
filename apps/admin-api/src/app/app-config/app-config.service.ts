import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppConfigEntity } from '@hancr/database';
import { AppConfigType, UpdateAppConfigInput } from './dto/app-config.type';

@Injectable()
export class AppConfigService {
  constructor(
    @InjectRepository(AppConfigEntity)
    private readonly configRepo: Repository<AppConfigEntity>,
  ) {}

  async findAll(): Promise<AppConfigType[]> {
    const configs = await this.configRepo.find({ order: { configKey: 'ASC' } });
    return configs.map((c) => this.toType(c));
  }

  async findByKey(configKey: string): Promise<AppConfigType> {
    const config = await this.configRepo.findOne({ where: { configKey } });
    if (!config) {
      throw new NotFoundException(`AppConfig '${configKey}' not found`);
    }
    return this.toType(config);
  }

  async upsert(
    configKey: string,
    input: UpdateAppConfigInput,
    updatedBy: string,
  ): Promise<AppConfigType> {
    let config = await this.configRepo.findOne({ where: { configKey } });

    if (!config) {
      config = this.configRepo.create({ configKey });
    }

    if (input.version !== undefined) config.version = input.version;
    if (input.themeConfig !== undefined) config.themeConfig = input.themeConfig as Record<string, unknown>;
    if (input.homeScreenConfig !== undefined) config.homeScreenConfig = input.homeScreenConfig as Record<string, unknown>;
    if (input.featureFlags !== undefined) config.featureFlags = input.featureFlags as Record<string, unknown>;
    if (input.loyaltyConfig !== undefined) config.loyaltyConfig = input.loyaltyConfig as Record<string, unknown>;
    config.updatedBy = updatedBy;

    const saved = await this.configRepo.save(config);
    return this.toType(saved);
  }

  private toType(e: AppConfigEntity): AppConfigType {
    const t = new AppConfigType();
    t.id = e.id;
    t.configKey = e.configKey;
    t.version = e.version;
    t.themeConfig = e.themeConfig;
    t.homeScreenConfig = e.homeScreenConfig;
    t.featureFlags = e.featureFlags;
    t.loyaltyConfig = e.loyaltyConfig;
    t.updatedBy = e.updatedBy;
    t.updatedAt = e.updatedAt;
    return t;
  }
}
