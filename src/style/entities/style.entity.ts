import { Column, Entity, ManyToMany, PrimaryGeneratedColumn, Unique } from "typeorm";
import { CustomBaseEntity } from "../../db/entity/custom.base.entity";
import { Painting } from "../../painting/entities/painting.entity";

@Entity()
@Unique(["name", "search_name"])
export class Style extends CustomBaseEntity {
	@PrimaryGeneratedColumn("uuid")
	id!: string;

	@Column({ nullable: true }) // need to distinct value
	name!: string;

	@Column({ nullable: true })
	info_url!: string;

	@ManyToMany(() => Painting, (painting) => painting.styles)
	paintings!: Painting[];

	@Column()
	search_name!: string;
}
