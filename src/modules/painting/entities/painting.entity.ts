import {
	Column,
	Entity,
	JoinColumn,
	JoinTable,
	ManyToMany,
	ManyToOne,
	OneToOne,
	PrimaryGeneratedColumn,
} from "typeorm";
import { Artist } from "../../artist/entities/artist.entity";
import { CustomBaseEntity } from "../../db/entity/customBase.entity";
import { Style } from "../../style/entities/style.entity";
import { Tag } from "../../tag/entities/tag.entity";
import { WikiArtPainting } from "./wikiArtPainting.entity";

@Entity()
export class Painting extends CustomBaseEntity {
	@PrimaryGeneratedColumn("uuid")
	id!: string;

	@Column()
	title!: string;

	@Column({ type: "text" })
	searchTitle!: string;

	@OneToOne(() => WikiArtPainting, {
		cascade: ["update", "insert"],
	})
	@JoinColumn()
	wikiArtPainting!: WikiArtPainting;

	@Column()
	image_url!: string;

	@Column({ type: "text", default: "" })
	description!: string; // painting description, default: ""

	@Column({ nullable: true })
	completition_year!: number; // painting completition year, default: null

	@Column()
	width!: number;

	@Column()
	height!: number;

	@Column()
	image_s3_key!: string;

	@ManyToMany(() => Tag, (tag) => tag.paintings)
	@JoinTable()
	tags!: Tag[];

	@ManyToMany(() => Style, (style) => style.paintings)
	@JoinTable()
	styles!: Style[];

	@ManyToOne(() => Artist, (artist) => artist.paintings, {
		onDelete: "RESTRICT",
	})
	@JoinColumn()
	artist!: Artist;
}
