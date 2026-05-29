import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EmergencyContactRelation } from '../enums/sos.enum';

/**
 * EmergencyContact — جهة طوارئ يضيفها الراكب
 *
 * عند تفعيل SOS، يُرسَل SMS بـ:
 *  - موقع الراكب الحالي
 *  - رقم لوحة السيارة + اسم السائق
 *  - رابط tracking مباشر للرحلة
 */
@Entity('hancr_emergency_contact')
@Index(['ownerType', 'ownerId'])
export class EmergencyContactEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  /** Rider | Driver — كلاهما يمكنه إضافة جهات طوارئ */
  @Column({ type: 'varchar', length: 16, name: 'owner_type' })
  ownerType!: 'Rider' | 'Driver';

  @Column({ type: 'int', name: 'owner_id' })
  ownerId!: number;

  /** اسم جهة الطوارئ (مثل: "أبي") */
  @Column({ length: 100 })
  name!: string;

  /** رقم الهاتف بصيغة E.164 (مثل: +966501234567) */
  @Column({ length: 20, name: 'phone_number' })
  phoneNumber!: string;

  @Column({
    type: 'enum',
    enum: EmergencyContactRelation,
    default: EmergencyContactRelation.Family,
  })
  relation!: EmergencyContactRelation;

  /** هل تُرسَل له إشعارات تلقائية بالرحلة (Trip Share) */
  @Column({ type: 'boolean', default: false, name: 'auto_share_trips' })
  autoShareTrips!: boolean;

  /** ترتيب الأولوية — الأقل = أعلى أولوية (أول من يُتَّصل به) */
  @Column({ type: 'int', default: 0 })
  priority!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
