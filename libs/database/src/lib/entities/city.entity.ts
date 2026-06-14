import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CountryEntity } from './country.entity';

/**
 * المدينة — المستوى الأوسط في التسلسل الجغرافي:
 *   Country → City → Region(zone).
 * تحمل توقيتها المحلي ومركزها وصندوقها الحدودي — يقود فلتر الدولة/المدينة
 * في الشريط العلوي وعرض البثّ الحي بالتوقيت المحلي الصحيح.
 */
@Entity('hancr_city')
export class CityEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  /** الدولة الأم */
  @ManyToOne(() => CountryEntity, (country) => country.cities)
  @JoinColumn({ name: 'country_id' })
  country!: CountryEntity;

  @Column({ name: 'country_id' })
  countryId!: number;

  /** الاسم بالعربية */
  @Column({ length: 100 })
  name!: string;

  /** الاسم بالإنجليزية */
  @Column({ length: 100, name: 'name_en' })
  nameEn!: string;

  /** التوقيت المحلي (IANA tz) — يُورَّث من الدولة افتراضياً ويمكن تجاوزه. */
  @Column({ length: 64, default: 'UTC' })
  timezone!: string;

  /** مركز المدينة — للكاميرا الأولية للخريطة. */
  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true, name: 'center_lat' })
  centerLat?: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true, name: 'center_lng' })
  centerLng?: number;

  /** الصندوق الحدودي [[swLat,swLng],[neLat,neLng]] — لتأطير الكرة عند التكبير. */
  @Column({ type: 'jsonb', nullable: true })
  bbox?: number[][];

  /** هل المدينة مُفعَّلة. */
  @Column({ default: false })
  enabled!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
