import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/** I7 — معيار تقييم قابل للتخصيص (cleanliness/safety/manners…). */
@Entity('hancr_review_parameter')
@Index(['active'])
export class ReviewParameterEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 40, unique: true })
  code!: string;

  @Column({ length: 100, name: 'label_ar' })
  labelAr!: string;

  @Column({ length: 100, name: 'label_en' })
  labelEn!: string;

  /** 'driver' | 'rider' */
  @Column({ length: 10 })
  target!: string;

  @Column({ type: 'int', default: 0, name: 'sort_order' })
  sortOrder!: number;

  @Column({ default: true })
  active!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
