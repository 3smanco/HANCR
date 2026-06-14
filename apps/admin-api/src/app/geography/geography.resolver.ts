import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AdminJwtGuard } from '../auth/admin-jwt.guard';
import { AdminRolesGuard } from '../auth/admin-roles.guard';
import { RequireRole } from '../auth/roles.decorator';
import { GeographyService } from './geography.service';
import {
  CityType,
  CountryType,
  CitiesFilterInput,
  SetCityEnabledInput,
  SetCountryEnabledInput,
} from './dto/geography.types';

@Resolver()
export class GeographyResolver {
  constructor(private readonly geo: GeographyService) {}

  /** كل الدول (للوحة الإدارة + فلتر الشريط العلوي). */
  @Query(() => [CountryType], { description: 'قائمة الدول' })
  @UseGuards(AdminJwtGuard)
  countries(
    @Args('onlyEnabled', { nullable: true, defaultValue: false })
    onlyEnabled: boolean,
  ): Promise<CountryType[]> {
    return this.geo.listCountries(onlyEnabled);
  }

  /** مدن (اختياري حسب دولة). */
  @Query(() => [CityType], { description: 'قائمة المدن' })
  @UseGuards(AdminJwtGuard)
  cities(
    @Args('filter', { nullable: true }) filter?: CitiesFilterInput,
    @Args('onlyEnabled', { nullable: true, defaultValue: false })
    onlyEnabled?: boolean,
  ): Promise<CityType[]> {
    return this.geo.listCities({
      countryId: filter?.countryId,
      countryIso: filter?.countryIso,
      onlyEnabled,
    });
  }

  /** تفعيل/تعطيل دولة (super فقط). */
  @Mutation(() => CountryType)
  @UseGuards(AdminJwtGuard, AdminRolesGuard)
  @RequireRole('super')
  setCountryEnabled(
    @Args('input') input: SetCountryEnabledInput,
  ): Promise<CountryType> {
    return this.geo.setCountryEnabled(input);
  }

  /** تفعيل/تعطيل مدينة (super فقط). */
  @Mutation(() => CityType)
  @UseGuards(AdminJwtGuard, AdminRolesGuard)
  @RequireRole('super')
  setCityEnabled(
    @Args('input') input: SetCityEnabledInput,
  ): Promise<CityType> {
    return this.geo.setCityEnabled(input);
  }
}
