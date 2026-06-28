import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";
import { CustomBaseEntity } from "../../db/entity/customBase.entity";
import { User } from "../../user/entity/user.entity";
import { Quiz } from "./quiz.entity";
import { QUIZ_REACTION } from "../const";

@Entity()
@Unique("uq_user_quiz_dislike", ["user_id", "quiz_id"])
export class QuizDislike extends CustomBaseEntity {
	readonly _type = QUIZ_REACTION.DISLIKE;

	@PrimaryGeneratedColumn("identity", {
		type: "integer",
		primaryKeyConstraintName: "pk_quiz_dislike",
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
