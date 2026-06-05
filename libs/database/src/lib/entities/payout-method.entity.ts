import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * I4 — طريقة سحب أرباح السائق.
 * النوع: bank (IBAN + bank name) | mada (IBAN) | stcpay (phoneNumber).
 * كل سائق يمكنه إضافة عدة طرق، واحدة منها is_default.
 */
@Entity('hancr_payout_method')
@Index(['driverId'])
export class PayoutMethodEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'driver_id' })
  driverId!: number;

  /** bank | mada | stcpay */
  @Column({ length: 20, default: 'bank' })
  type!: string;

  @Column({ length: 100, nullable: true, name: 'account_name' })
  accountName?: string;

  @Column({ length: 40, nullable: true })
  iban?: string;

  @Column({ length: 80, nullable: true, name: 'bank_name' })
  bankName?: string;

  @Column({ length: 30, nullable: true, name: 'phone_number' })
  phoneNumber?: string;

  @Column({ default: false, name: 'is_default' })
  isDefault!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
