import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * I1 — وثيقة سائق (هوية، رخصة، استمارة، تأمين، شهادة عدلية).
 *
 * المعالجة:
 *  - يرفع السائق وثيقة عبر `uploadDriverDocument(type, url)` من تطبيقه
 *    (الرفع نفسه على GCS عبر signed URL)
 *  - الأدمن يراجع: approve / reject مع reason في درج /users/drivers/[id]
 */
@Entity('hancr_driver_document')
@Index(['driverId'])
@Index(['status'])
export class DriverDocumentEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'driver_id' })
  driverId!: number;

  /**
   * national_id | license | vehicle_registration | insurance | criminal_record
   */
  @Column({ length: 40 })
  type!: string;

  @Column({ type: 'text' })
  url!: string;

  @Column({ type: 'date', nullable: true, name: 'expires_at' })
  expiresAt?: Date;

  /** pending | approved | rejected */
  @Column({ length: 20, default: 'pending' })
  status!: string;

  @Column({ type: 'text', nullable: true, name: 'rejected_reason' })
  rejectedReason?: string;

  @CreateDateColumn({ name: 'uploaded_at' })
  uploadedAt!: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'reviewed_at' })
  reviewedAt?: Date;

  @Column({ nullable: true, name: 'reviewed_by' })
  reviewedBy?: number;
}
