import {
	Column,
	Entity,
	JoinColumn,
	JoinTable,
	ManyToMany,
	ManyToOne,
	PrimaryGeneratedColumn,
} from "typeorm";
import { Artist } from "../../artist/entities/artist.entity";
import { CustomBaseEntity } from "../../db/entity/customBase.entity";
import { Painting } from "../../painting/entities/painting.entity";
import { Style } from "../../style/entities/style.entity";
import { Tag } from "../../tag/entities/tag.entity";
import { User } from "../../user/entity/user.entity";
import { QUIZ_TIME_LIMIT } from "../const";
import { QuizType } from "../type";

/*TODO
- 문제 풀이 로직 통계 정보 열 추가하기
  - 시간 초과 횟수
  - 문제 안푼 횟수 ....
  => 필요한 열을 점검 및 추가하기
*/
@Entity()
export class Quiz extends CustomBaseEntity {
	@PrimaryGeneratedColumn("identity", {
		type: "integer",
		primaryKeyConstraintName: "pk_quiz",
		name: "id",
		generatedIdentity: "ALWAYS",
	})
	id!: number;

	@Column()
	title!: string;

	@ManyToMany(() => Painting, { onUpdate: "CASCADE", onDelete: "CASCADE" })
	@JoinTable({
		name: "quiz_distractor_paintings_painting",
		joinColumns: [
			{
				name: "quiz_id",
				referencedColumnName: "id",
				foreignKeyConstraintName: "fk_quiz_id",
			},
		],
		inverseJoinColumns: [
			{
				name: "painting_id",
				referencedColumnName: "id",
				foreignKeyConstraintName: "fk_painting_id",
			},
		],
	})
	distractor_paintings!: Painting[];

	@ManyToMany(() => Painting, { onUpdate: "CASCADE", onDelete: "CASCADE" })
	@JoinTable({
		name: "quiz_answer_paintings_painting",
		joinColumns: [
			{
				name: "quiz_id",
				referencedColumnName: "id",
				foreignKeyConstraintName: "fk_quiz_id",
			},
		],
		inverseJoinColumns: [
			{
				name: "painting_id",
				referencedColumnName: "id",
				foreignKeyConstraintName: "fk_painting_id",
			},
		],
	})
	answer_paintings!: Painting[];

	@Column({
		name: "example_painting_id",
		nullable: true,
		foreignKeyConstraintName: "fk_example_painting_id",
	})
	example_painting_id!: number;

	/*TODO
    - 추가된 컬럼을 반영하여 CRUD 로직 수정하기
  */
	@ManyToOne(() => Painting, {
		onUpdate: "NO ACTION",
		onDelete: "NO ACTION",
		nullable: true,
	})
	@JoinColumn({
		name: "example_painting_id",
		referencedColumnName: "id",
		foreignKeyConstraintName: "fk_example_painting_id",
	})
	example_painting!: Painting | null;

	@Column({ default: 0 })
	view_count!: number;

	@Column({
		default: 0,
	})
	correct_count!: number;

	@Column({
		default: 0,
	})
	incorrect_count!: number;

	@Column({
		default: QUIZ_TIME_LIMIT.EASY,
	})
	time_limit!: number;

	@Column({ type: "text" })
	description!: string;

	@Column()
	type!: QuizType;

	@ManyToMany(() => Artist, { onUpdate: "CASCADE", onDelete: "CASCADE" })
	@JoinTable({
		name: "quiz_artists_artist",
		joinColumns: [
			{
				name: "quiz_id",
				referencedColumnName: "id",
				foreignKeyConstraintName: "fk_quiz_id",
			},
		],
		inverseJoinColumns: [
			{
				name: "artist_id",
				referencedColumnName: "id",
				foreignKeyConstraintName: "fk_artist_id",
			},
		],
	})
	artists!: Artist[];

	@ManyToMany(() => Tag, { onUpdate: "CASCADE", onDelete: "CASCADE" })
	@JoinTable({
		name: "quiz_tags_tag",
		joinColumns: [
			{
				name: "quiz_id",
				referencedColumnName: "id",
				foreignKeyConstraintName: "fk_quiz_id",
			},
		],
		inverseJoinColumns: [
			{
				name: "tag_id",
				referencedColumnName: "id",
				foreignKeyConstraintName: "fk_tag_id",
			},
		],
	})
	tags!: Tag[];

	@ManyToMany(() => Style, { onUpdate: "CASCADE", onDelete: "CASCADE" })
	@JoinTable({
		name: "quiz_styles_style",
		joinColumns: [
			{
				name: "quiz_id",
				referencedColumnName: "id",
				foreignKeyConstraintName: "fk_quiz_id",
			},
		],
		inverseJoinColumns: [
			{
				name: "style_id",
				referencedColumnName: "id",
				foreignKeyConstraintName: "fk_style_id",
			},
		],
	})
	styles!: Style[];

	@Column({ type: "integer" })
	user_id!: number;

	@ManyToOne(() => User, (user) => user.quizzes, { onUpdate: "NO ACTION", onDelete: "NO ACTION" })
	@JoinColumn({
		name: "user_id",
		foreignKeyConstraintName: "pk_user_id",
		referencedColumnName: "id",
	})
	user!: User;
}
