import { Column, Entity } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';

export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
}

@Entity({ name: 'orders' })
export class Order extends BaseEntity {
  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'simple-enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Column({ nullable: true })
  userId?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  amount: number;
}
