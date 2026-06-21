import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * محادثة دعم حيّة بين الراكب وموظف خدمة العملاء (مستقلة عن شات الرحلة).
 * status: 'open' (بانتظار موظف) | 'assigned' | 'closed'.
 */
@Entity('hancr_support_conversation')
export class SupportConversationEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index()
  @Column({ name: 'rider_id' })
  riderId!: number;

  @Column({ length: 16, default: 'open' })
  status!: string;

  /** الموظف المُسنَد (admin user id) */
  @Column({ type: 'int', nullable: true, name: 'assigned_agent_id' })
  assignedAgentId?: number;

  @Column({ type: 'timestamp', nullable: true, name: 'last_message_at' })
  lastMessageAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
