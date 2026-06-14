import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CityEntity, CountryEntity } from '@hancr/database';
import {
  CityType,
  CountryType,
  SetCityEnabledInput,
  SetCountryEnabledInput,
} from './dto/geography.types';

/**
 * GeographyService — قراءة/إدارة التسلسل الجغرافي (دول/مدن).
 * يغذّي فلتر الدولة/المدينة في الشريط العلوي وإدارة تفعيل الأسواق.
 */
@Injectable()
export class GeographyService {
  constructor(
    @InjectRepository(CountryEntity)
    private readonly countryRepo: Repository<CountryEntity>,
    @InjectRepository(CityEntity)
    private readonly cityRepo: Repository<CityEntity>,
  ) {}

  async listCountries(onlyEnabled = false): Promise<CountryType[]> {
    const where = onlyEnabled ? { enabled: true } : {};
    const countries = await this.countryRepo.find({
      where,
      order: { enabled: 'DESC', nameEn: 'ASC' },
    });
    // عدّ المدن المُفعَّلة لكل دولة
    const counts = await this.cityRepo
      .createQueryBuilder('c')
      .select('c.country_id', 'countryId')
      .addSelect('COUNT(*)', 'cnt')
      .where('c.enabled = true')
      .groupBy('c.country_id')
      .getRawMany<{ countryId: number; cnt: string }>();
    const countMap = new Map(counts.map((r) => [Number(r.countryId), Number(r.cnt)]));
    return countries.map((c) => this.toCountry(c, countMap.get(c.id) ?? 0));
  }

  async listCities(filter?: {
    countryId?: number;
    countryIso?: string;
    onlyEnabled?: boolean;
  }): Promise<CityType[]> {
    const qb = this.cityRepo.createQueryBuilder('c');
    if (filter?.countryId) qb.andWhere('c.country_id = :cid', { cid: filter.countryId });
    if (filter?.countryIso) {
      qb.innerJoin(CountryEntity, 'co', 'co.id = c.country_id').andWhere(
        'co.iso2 = :iso',
        { iso: filter.countryIso.toUpperCase() },
      );
    }
    if (filter?.onlyEnabled) qb.andWhere('c.enabled = true');
    qb.orderBy('c.name_en', 'ASC');
    const cities = await qb.getMany();
    return cities.map((c) => this.toCity(c));
  }

  async setCountryEnabled(input: SetCountryEnabledInput): Promise<CountryType> {
    const c = await this.countryRepo.findOne({ where: { id: input.id } });
    if (!c) throw new NotFoundException('Country not found');
    c.enabled = input.enabled;
    const saved = await this.countryRepo.save(c);
    return this.toCountry(saved, 0);
  }

  async setCityEnabled(input: SetCityEnabledInput): Promise<CityType> {
    const c = await this.cityRepo.findOne({ where: { id: input.id } });
    if (!c) throw new NotFoundException('City not found');
    c.enabled = input.enabled;
    const saved = await this.cityRepo.save(c);
    return this.toCity(saved);
  }

  private toCountry(c: CountryEntity, cityCount: number): CountryType {
    return {
      id: c.id,
      iso2: c.iso2,
      name: c.name,
      nameEn: c.nameEn,
      currency: c.currency,
      timezone: c.timezone,
      flag: c.flag,
      dialCode: c.dialCode,
      units: c.units,
      taxRule: c.taxRule
        ? { type: c.taxRule.type, rate: c.taxRule.rate, label: c.taxRule.label }
        : undefined,
      docRequirements: c.docRequirements ?? [],
      emergencyNumber: c.emergencyNumber,
      enabled: c.enabled,
      cityCount,
    };
  }

  private toCity(c: CityEntity): CityType {
    return {
      id: c.id,
      countryId: c.countryId,
      name: c.name,
      nameEn: c.nameEn,
      timezone: c.timezone,
      centerLat: c.centerLat != null ? Number(c.centerLat) : undefined,
      centerLng: c.centerLng != null ? Number(c.centerLng) : undefined,
      enabled: c.enabled,
    };
  }
}
