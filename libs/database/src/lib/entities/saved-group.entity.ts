import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RiderEntity } from './rider.entity';

/** عضو في مجموعة محفوظة (لقطة: اسم + هاتف) */
export interface SavedGroupMember {
  name: string;
  phone: string;
}

/**
 * مجموعة محفوظة — قائمة جهات لمشاركة الرحلات/الفواتير بسرعة.
 * نوعان: شخصية (أصدقاء/عائلة) ومهنية (زملاء عمل). مستقلة عن Pool/Carpool.
 */
@Entity('hancr_saved_group')
export class SavedGroupEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  /** اسم المجموعة */
  @Column({ length: 100 })
  name!: string;

  /** النوع: 'personal' | 'business' */
  @Column({ length: 16, default: 'personal' })
  type!: string;

  /** الأعضاء (لقطات اسم/هاتف) */
  @Column({ type: 'jsonb', default: () => "'[]'" })
  members!: SavedGroupMember[];

  /** مالك المجموعة */
  @ManyToOne(() => RiderEntity)
  @JoinColumn({ name: 'owner_id' })
  owner!: RiderEntity;

  @Index()
  @Column({ name: 'owner_id' })
  ownerId!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
