import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PoolType } from '../enums/pool-type.enum';
import { RiderEntity } from './rider.entity';
import { PoolMemberEntity } from './pool-member.entity';

/**
 * المجموعة — عائلية أو مؤسسية
 * المالك يتحكم في: الميزانية، الصلاحيات، ساعات الاستخدام
 */
@Entity('hancr_pool')
export class PoolEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  /** اسم المجموعة */
  @Column({ length: 100 })
  name!: string;

  /** نوع المجموعة */
  @Column({ type: 'enum', enum: PoolType, name: 'pool_type' })
  poolType!: PoolType;

  /** رصيد المجموعة المشترك */
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  balance!: number;

  /** عملة المجموعة */
  @Column({ length: 3 })
  currency!: string;

  /** هل المجموعة نشطة */
  @Column({ default: true })
  active!: boolean;

  /** الحد الشهري الإجمالي للمجموعة */
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'monthly_limit' })
  monthlyLimit?: number;

  /** مالك المجموعة (رب الأسرة أو مدير الشركة) */
  @ManyToOne(() => RiderEntity)
  @JoinColumn({ name: 'owner_id' })
  owner!: RiderEntity;

  @Column({ name: 'owner_id' })
  ownerId!: number;

  /** أعضاء المجموعة */
  @OneToMany(() => PoolMemberEntity, (member) => member.pool)
  members!: PoolMemberEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
