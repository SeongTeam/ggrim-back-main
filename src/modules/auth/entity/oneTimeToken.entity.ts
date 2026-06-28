import { Exclude } from "class-transformer";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { CustomBaseEntity } from "../../db/entity/customBase.entity";
import { User } from "../../user/entity/user.entity";
import { OneTimeTokenPurpose } from "../types/oneTimeToken";

@Entity()
export class OneTimeToken extends CustomBaseEntity {
	@PrimaryGeneratedColumn("identity", {
		type: "integer",
		primaryKeyConstraintName: "pk_one_time_token",
		name: "id",
		generatedIdentity: "ALWAYS",
	})
	id!: number;

	@Column()
	email!: string;

	@Column()
	token!: string;

	@Column({ type: "timestamp without time zone", nullable: true })
	used_date!: Date | null;

	@Column()
	expired_date!: Date;

	// 외래 키 컬럼 명시적으로 정의
	@Column({
		name: "user_id",
		type: "integer",
		nullable: true,
		foreignKeyConstraintName: "fk_user_id",
	})
	user_id!: number | null;

	@Exclude()
	@ManyToOne(() => User, (user) => user.oneTimeTokens, {
		onUpdate: "NO ACTION",
		onDelete: "NO ACTION",
		nullable: true,
	})
	@JoinColumn({
		name: "user_id",
		foreignKeyConstraintName: "fk_user_id",
		referencedColumnName: "id",
	})
	user!: User | null;

	@Column()
	purpose!: OneTimeTokenPurpose;
}
