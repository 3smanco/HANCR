import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/** I7 — سبب إلغاء قابل للتخصيص من الإدارة. */
@Entity('hancr_cancel_reason')
@Index(['active'])
export class CancelReasonEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 40, unique: true })
  code!: string;

  @Column({ length: 200, name: 'label_ar' })
  labelAr!: string;

  @Column({ length: 200, name: 'label_en' })
  labelEn!: string;

  /** 'rider' | 'driver' | 'both' */
  @Column({ length: 10, name: 'applies_to' })
  appliesTo!: string;

  @Column({ type: 'int', default: 0, name: 'sort_order' })
  sortOrder!: number;

  @Column({ default: true })
  active!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
