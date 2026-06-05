import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * I6 — دفعة هدايا مجانية. كل دفعة لها N أكواد فردية،
 * كل كود يُستهلَك مرة واحدة فقط (RiderEntity.balance += amount).
 */
@Entity('hancr_gift_batch')
export class GiftBatchEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 100 })
  name!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: number;

  @Column({ length: 3, default: 'SAR' })
  currency!: string;

  @Column({ type: 'int', name: 'total_count' })
  totalCount!: number;

  @Column({ type: 'int', default: 0, name: 'claimed_count' })
  claimedCount!: number;

  @Column({ type: 'date', nullable: true, name: 'expires_at' })
  expiresAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
