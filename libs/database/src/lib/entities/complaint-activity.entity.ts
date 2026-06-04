import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/** سجل أنشطة على شكوى (Timeline) */
@Entity('hancr_complaint_activity')
@Index(['complaintId'])
export class ComplaintActivityEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'complaint_id' })
  complaintId!: number;

  /** 'admin' | 'rider' | 'driver' | 'system' */
  @Column({ length: 20, name: 'actor_type' })
  actorType!: string;

  @Column({ nullable: true, name: 'actor_id' })
  actorId?: number;

  /** 'created' | 'assigned' | 'status_change' | 'note' | 'resolved' | 'dismissed' */
  @Column({ length: 30 })
  type!: string;

  @Column({ type: 'text', nullable: true })
  note?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
