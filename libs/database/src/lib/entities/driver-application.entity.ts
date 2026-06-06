import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * M2 — Driver application (marketing-site signup, pre-approval).
 *
 * One row captures the full multi-step funnel: contact + vehicle + doc URLs.
 * Lifecycle: submitted → in_review → approved | rejected | needs_more_info.
 * On approval an admin provisions a real DriverEntity from this record.
 */
@Entity('hancr_driver_application')
@Index(['status', 'createdAt'])
export class DriverApplicationEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  // ── Step 1 — identity & contact ─────────────────────────────────────────
  @Column({ name: 'full_name', length: 120 })
  fullName!: string;

  @Column({ length: 160 })
  email!: string;

  @Column({ length: 30 })
  phone!: string;

  @Column({ length: 80, nullable: true })
  city?: string;

  @Column({ name: 'national_id_number', length: 40, nullable: true })
  nationalIdNumber?: string;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth?: string;

  // ── Step 2 — vehicle ────────────────────────────────────────────────────
  @Column({ name: 'vehicle_brand', length: 60, nullable: true })
  vehicleBrand?: string;

  @Column({ name: 'vehicle_model', length: 60, nullable: true })
  vehicleModel?: string;

  @Column({ name: 'vehicle_year', type: 'smallint', nullable: true })
  vehicleYear?: number;

  @Column({ name: 'vehicle_color', length: 40, nullable: true })
  vehicleColor?: string;

  @Column({ name: 'plate_number', length: 30, nullable: true })
  plateNumber?: string;

  // ── Step 3 — document URLs (each PUT directly to signed URL) ────────────
  @Column({ name: 'doc_national_id_url', type: 'text', nullable: true })
  docNationalIdUrl?: string;

  @Column({ name: 'doc_license_url', type: 'text', nullable: true })
  docLicenseUrl?: string;

  @Column({ name: 'doc_vehicle_registration_url', type: 'text', nullable: true })
  docVehicleRegistrationUrl?: string;

  @Column({ name: 'doc_insurance_url', type: 'text', nullable: true })
  docInsuranceUrl?: string;

  @Column({ name: 'doc_profile_photo_url', type: 'text', nullable: true })
  docProfilePhotoUrl?: string;

  // ── Workflow ────────────────────────────────────────────────────────────
  @Column({ length: 24, default: 'submitted' })
  status!: string;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason?: string;

  @Column({ name: 'reviewed_by', type: 'int', nullable: true })
  reviewedBy?: number;

  @Column({ name: 'reviewed_at', type: 'timestamp', nullable: true })
  reviewedAt?: Date;

  // ── Audit ───────────────────────────────────────────────────────────────
  @Column({ name: 'source_ip', length: 60, nullable: true })
  sourceIp?: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
