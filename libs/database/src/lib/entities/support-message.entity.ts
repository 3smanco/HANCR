import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * رسالة في محادثة دعم حيّة. senderType: 'rider' | 'agent'.
 */
@Entity('hancr_support_message')
export class SupportMessageEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index()
  @Column({ name: 'conversation_id' })
  conversationId!: number;

  /** 'rider' | 'agent' */
  @Column({ length: 10, name: 'sender_type' })
  senderType!: string;

  @Column({ name: 'sender_id' })
  senderId!: number;

  @Column({ type: 'text' })
  body!: string;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'image_url' })
  imageUrl?: string;

  @Column({ default: false, name: 'is_read' })
  isRead!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
