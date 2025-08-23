import { Column, Entity, OneToMany, PrimaryGeneratedColumn, Unique } from "typeorm";
import { CustomBaseEntity } from "../../db/entity/customBase.entity";
import { Painting } from "../../painting/entities/painting.entity";

@Entity()
/*TODO
- 동명이인을 구분할 방법을 찾아야함
*/
@Unique(["name", "search_name"])
export class Artist extends CustomBaseEntity {
	@PrimaryGeneratedColumn("uuid")
	id!: string;

	@Column()
	name!: string;

	@Column({
		type: "character varying",
		nullable: true,
	})
	image_url!: string | null;

	@Column({
		type: "time without time zone",
		nullable: true,
	})
	birth_date!: Date | null;

	@Column({
		type: "time without time zone",
		nullable: true,
	})
	death_date!: Date | null;

	@Column({
		type: "character varying",
		nullable: true,
	})
	info_url!: string | null;

	@OneToMany(() => Painting, (painting) => painting.artist, {
		onDelete: "RESTRICT",
	})
	paintings!: Painting[];

	//combination UpperCase and '_'
	@Column()
	search_name!: string;
}
