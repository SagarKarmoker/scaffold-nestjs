import { UserRoles } from "src/utils/roles.enum";
import { BaseEntity, Column, Entity } from "typeorm";

@Entity({ name: 'users' })
export class User extends BaseEntity {
    @Column({ length: 500 })
    name!: string;

    @Column({ unique: true })
    email!: string;

    @Column({ nullable: false })
    password!: string;

    @Column({
        type: 'enum',
        enum: UserRoles,
        default: UserRoles.USER,
    })
    role!: UserRoles;
}