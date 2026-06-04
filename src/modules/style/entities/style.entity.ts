import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn, Unique } from "typeorm";
import { CustomBaseEntity } from "../../db/entity/customBase.entity";
import { Painting } from "../../painting/entities/painting.entity";

@Entity()
@Unique(["name", "search_name"])
export class Style extends CustomBaseEntity {
	@PrimaryGeneratedColumn("identity", {
		type: "integer",
		primaryKeyConstraintName: "pk_style",
		name: "id",
		generatedIdentity: "ALWAYS",
	})
	id!: number;

	@Column({ type: "character varying" }) // need to distinct value
	name!: string;

	@Column({ type: "character varying", nullable: true })
	info_url!: string | null;

	@ManyToMany(() => Painting, (painting) => painting.styles, {
		onUpdate: "NO ACTION",
		onDelete: "NO ACTION",
	})
	@JoinTable({
		name: "painting_styles_style",
		joinColumns: [
			{
				name: "style_id",
				referencedColumnName: "id",
				foreignKeyConstraintName: "fk_style_id",
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
	paintings!: Painting[];

	@Column()
	search_name!: string;
}
