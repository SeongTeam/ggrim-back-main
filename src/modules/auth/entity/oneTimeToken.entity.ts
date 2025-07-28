import { Exclude } from "class-transformer";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { CustomBaseEntity } from "../../db/entity/customBase.entity";
import { User } from "../../user/entity/user.entity";
import { OneTimeTokenPurpose } from "../types/oneTimeToken";

@Entity()
export class OneTimeToken extends CustomBaseEntity {
	@PrimaryGeneratedColumn("uuid")
	id!: string;

	@Column()
	email!: string;

	@Column()
	token!: string;

	@Column({ nullable: true })
	used_date!: Date;

	@Column()
	expired_date!: Date;

	// 외래 키 컬럼 명시적으로 정의
	@Column({ nullable: true })
	user_id!: string;

	@Exclude()
	@ManyToOne(() => User, (user) => user.oneTimeTokens, { nullable: true })
	@JoinColumn({ name: "user_id" })
	user?: User;

	@Column()
	purpose!: OneTimeTokenPurpose;
}
