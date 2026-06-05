import {
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * I6 — كود هدية فردي ضمن GiftBatchEntity.
 * الراكب يُدخل الكود في تطبيقه؛ عند النجاح:
 *   - يُعيَّن claimed_by = riderId
 *   - يُعيَّن claimed_at = now()
 *   - يُضاف batch.amount إلى رصيد محفظة الراكب
 *   - batch.claimedCount++
 */
@Entity('hancr_gift_code')
@Index(['batchId'])
@Index(['code'])
@Index(['claimedBy'])
export class GiftCodeEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'batch_id' })
  batchId!: number;

  @Column({ length: 40, unique: true })
  code!: string;

  @Column({ nullable: true, name: 'claimed_by' })
  claimedBy?: number;

  @Column({ type: 'timestamp', nullable: true, name: 'claimed_at' })
  claimedAt?: Date;
}
