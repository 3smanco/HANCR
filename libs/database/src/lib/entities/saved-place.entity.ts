import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * الأماكن المفضّلة للراكب (المنزل/العمل/مخصّص) للحجز السريع.
 */
@Entity('hancr_saved_place')
@Index(['riderId'])
export class SavedPlaceEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'rider_id' })
  riderId!: number;

  /** اسم المكان (المنزل، العمل، …) */
  @Column({ length: 60 })
  label!: string;

  /** العنوان النصي للعرض */
  @Column({ length: 255 })
  address!: string;

  @Column({ type: 'double precision' })
  lat!: number;

  @Column({ type: 'double precision' })
  lng!: number;

  /** home | work | other */
  @Column({ length: 10, default: 'other' })
  type!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
