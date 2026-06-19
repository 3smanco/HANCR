import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { RiderEntity } from './rider.entity';

/**
 * جهاز/جلسة دخول للراكب.
 * كل توكن JWT يحمل `jti` فريداً يُسجَّل هنا، فيمكن للمستخدم
 * استعراض أجهزته وإبطال أيٍّ منها على حدة (denylist عبر Redis).
 */
@Entity('hancr_rider_device')
export class RiderDeviceEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  /** معرّف التوكن (jti) — فريد لكل جلسة */
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64, name: 'jti' })
  jti!: string;

  /** اسم الجهاز كما يبلّغه التطبيق (مثل "Galaxy S23" أو "iPhone 15") */
  @Column({ type: 'varchar', length: 120, nullable: true, name: 'device_name' })
  deviceName?: string;

  /** المنصّة: android / ios / web */
  @Column({ type: 'varchar', length: 16, nullable: true })
  platform?: string;

  /** هل أُبطلت هذه الجلسة */
  @Column({ default: false })
  revoked!: boolean;

  /** آخر نشاط للجلسة */
  @Column({ name: 'last_active_at', nullable: true })
  lastActiveAt?: Date;

  /** الراكب صاحب الجلسة */
  @ManyToOne(() => RiderEntity)
  @JoinColumn({ name: 'rider_id' })
  rider!: RiderEntity;

  @Index()
  @Column({ name: 'rider_id' })
  riderId!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
