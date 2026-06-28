import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";
import { CustomBaseEntity } from "../../db/entity/customBase.entity";
import { User } from "../../user/entity/user.entity";
import { Quiz } from "./quiz.entity";
import { QUIZ_REACTION } from "../const";

// TODO : 쿼리 성능 개선
// - [ ] : 조회성능 향상을 위해 user_id와 quiz_id에 대한 복합키 고려하기
@Entity()
@Unique("uq_user_quiz_like", ["user_id", "quiz_id"])
export class QuizLike extends CustomBaseEntity {
	readonly _type = QUIZ_REACTION.LIKE;

	@PrimaryGeneratedColumn("identity", {
		type: "integer",
		primaryKeyConstraintName: "pk_quiz_like",
		name: "id",
		generatedIdentity: "ALWAYS",
	})
	id!: number;

	@ManyToOne(() => User, { onUpdate: "NO ACTION", onDelete: "NO ACTION" })
	@JoinColumn({
		name: "user_id",
		foreignKeyConstraintName: "fk_user_id",
		referencedColumnName: "id",
	})
	user!: User;

	@Column({ type: "integer" })
	user_id!: number;

	@ManyToOne(() => Quiz, { onUpdate: "NO ACTION", onDelete: "NO ACTION" })
	@JoinColumn({
		name: "quiz_id",
		foreignKeyConstraintName: "fk_quiz_id",
		referencedColumnName: "id",
	})
	quiz!: Quiz;

	@Column({ type: "integer" })
	quiz_id!: number;
}
