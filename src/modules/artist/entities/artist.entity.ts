import { Column, Entity, OneToMany, PrimaryGeneratedColumn, Unique } from "typeorm";
import { CustomBaseEntity } from "../../db/entity/customBase.entity";
import { Painting } from "../../painting/entities/painting.entity";

@Entity()
/*TODO Artist 엔티티 개선
- [ ] 동명이인 핸들링 방법 모색
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
		type: "date",
		nullable: true,
		transformer: {
			from: (value: string | null): Date | null => {
				return value ? new Date(value) : null;
			},
			to: (value: Date | null): string | null => {
				return value ? value.toISOString().split("T")[0] : null;
			},
		},
	})
	birth_date!: Date | null;

	@Column({
		type: "date",
		nullable: true,
		transformer: {
			from: (value: string | null): Date | null => {
				return value ? new Date(value) : null;
			},
			to: (value: Date | null): string | null => {
				return value ? value.toISOString().split("T")[0] : null;
			},
		},
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
	paintings?: Painting[];

	//combination UpperCase and '_'
	@Column()
	search_name!: string;
}
