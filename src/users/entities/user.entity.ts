import { UserRoles } from 'src/utils/roles.enum';
import { BaseEntity } from 'src/utils/base.entity';
import { Column, Entity } from 'typeorm';

@Entity({ name: 'users' })
export class User extends BaseEntity {
  @Column({ length: 500 })
  name!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ nullable: true })
  password?: string;

  @Column({ unique: true, nullable: true })
  clerkId?: string;

  @Column({
    type: 'simple-enum',
    enum: UserRoles,
    default: UserRoles.USER,
  })
  role!: UserRoles;

  @Column({ default: 0 })
  sessionVersion!: number;
}
