import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { User } from 'src/modules/users/entities/user.entity';

@Entity({ name: 'refresh_tokens' })
export class RefreshToken extends BaseEntity {
  @Column({ unique: true })
  token!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user!: User;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'datetime' })
  expiresAt!: Date;

  @Column({ default: false })
  revoked!: boolean;
}
