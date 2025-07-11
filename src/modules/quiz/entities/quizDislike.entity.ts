import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";
import { CustomBaseEntity } from "../../db/entity/customBase.entity";
import { User } from "../../user/entity/user.entity";
import { Quiz } from "./quiz.entity";

@Entity()
@Unique(["user", "quiz"])
export class QuizDislike extends CustomBaseEntity {
	@PrimaryGeneratedColumn("uuid")
	id!: string;

	@ManyToOne(() => User)
	@JoinColumn({ name: "user_id" })
	user!: User;

	@Column()
	user_id!: string;

	@ManyToOne(() => Quiz)
	@JoinColumn({ name: "quiz_id" })
	quiz!: Quiz;

	@Column()
	quiz_id!: string;
}
