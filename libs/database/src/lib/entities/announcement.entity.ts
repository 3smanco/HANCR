import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * I6 — إعلان مجدوَل يظهر في تطبيقات الراكب/السائق.
 * target: 'all' | 'rider' | 'driver'
 * يظهر فقط بين starts_at و ends_at، وإن كان active = true.
 */
@Entity('hancr_announcement')
@Index(['active'])
export class AnnouncementEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 200 })
  title!: string;

  @Column({ type: 'text' })
  body!: string;

  @Column({ length: 20, default: 'all' })
  target!: string;

  @Column({ type: 'text', nullable: true })
  url?: string;

  @Column({ type: 'timestamp', name: 'starts_at' })
  startsAt!: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'ends_at' })
  endsAt?: Date;

  @Column({ default: true })
  active!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
