import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AppConfigService } from './app-config.service';
import { AppConfigType, UpdateAppConfigInput } from './dto/app-config.type';
import { AdminJwtGuard, CurrentAdmin } from '../auth/admin-jwt.guard';
import { AdminUser } from '../auth/admin-jwt.strategy';

@Resolver(() => AppConfigType)
export class AppConfigResolver {
  constructor(private readonly appConfigService: AppConfigService) {}

  /** قائمة جميع إعدادات التطبيق */
  @Query(() => [AppConfigType], { description: 'قائمة إعدادات التطبيق' })
  @UseGuards(AdminJwtGuard)
  appConfigs(): Promise<AppConfigType[]> {
    return this.appConfigService.findAll();
  }

  /** إعداد بمفتاح محدد */
  @Query(() => AppConfigType, { description: 'إعداد تطبيق بالمفتاح' })
  @UseGuards(AdminJwtGuard)
  appConfig(
    @Args('configKey') configKey: string,
  ): Promise<AppConfigType> {
    return this.appConfigService.findByKey(configKey);
  }

  /** تحديث أو إنشاء إعداد */
  @Mutation(() => AppConfigType, { description: 'تحديث إعداد التطبيق (SDUI)' })
  @UseGuards(AdminJwtGuard)
  updateAppConfig(
    @Args('configKey') configKey: string,
    @Args('input') input: UpdateAppConfigInput,
    @CurrentAdmin() admin: AdminUser,
  ): Promise<AppConfigType> {
    return this.appConfigService.upsert(configKey, input, admin.email);
  }
}
