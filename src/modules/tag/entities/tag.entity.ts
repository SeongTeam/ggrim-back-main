import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn, Unique } from "typeorm";
import { CustomBaseEntity } from "../../db/entity/customBase.entity";
import { Painting } from "../../painting/entities/painting.entity";

@Entity()
@Unique(["name", "search_name"])
export class Tag extends CustomBaseEntity {
	@PrimaryGeneratedColumn("identity", {
		type: "integer",
		primaryKeyConstraintName: "pk_tag",
		name: "id",
		generatedIdentity: "ALWAYS",
	})
	id!: number;

	@Column() // need to distinct value
	name!: string;

	@Column({ type: "character varying", nullable: true })
	info_url!: string | null;

	@ManyToMany(() => Painting, (painting) => painting.tags, {
		onUpdate: "NO ACTION",
		onDelete: "NO ACTION",
	})
	@JoinTable({
		name: "painting_tags_tag",
		joinColumns: [
			{
				name: "tag_id",
				referencedColumnName: "id",
				foreignKeyConstraintName: "fk_tag_id",
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
