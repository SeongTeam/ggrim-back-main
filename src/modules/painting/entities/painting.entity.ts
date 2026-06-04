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
import { Style } from "../../style/entities/style.entity";
import { Tag } from "../../tag/entities/tag.entity";

@Entity()
export class Painting extends CustomBaseEntity {
	@PrimaryGeneratedColumn("identity", {
		type: "integer",
		primaryKeyConstraintName: "pk_painting",
		name: "id",
		generatedIdentity: "ALWAYS",
	})
	id!: number;

	@Column()
	title!: string;

	@Column({ type: "text" })
	searchTitle!: string;

	@Column()
	image_url!: string;

	@Column({ type: "text", default: "" })
	description!: string; // painting description, default: ""

	@Column({ type: "integer", nullable: true })
	completition_year!: number | null; // painting completition year, default: null

	@Column()
	width!: number;

	@Column()
	height!: number;

	@Column()
	image_s3_key!: string;

	@ManyToMany(() => Tag, (tag) => tag.paintings, { onUpdate: "NO ACTION", onDelete: "NO ACTION" })
	@JoinTable({
		name: "painting_tags_tag",
		joinColumns: [
			{
				name: "painting_id",
				referencedColumnName: "id",
				foreignKeyConstraintName: "fk_painting_id",
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

	@ManyToMany(() => Style, (style) => style.paintings, {
		onUpdate: "NO ACTION",
		onDelete: "NO ACTION",
	})
	@JoinTable({
		name: "painting_styles_style",
		joinColumns: [
			{
				name: "painting_id",
				referencedColumnName: "id",
				foreignKeyConstraintName: "fk_painting_id",
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

	@ManyToOne(() => Artist, (artist) => artist.paintings, {
		onUpdate: "NO ACTION",
		onDelete: "NO ACTION",
		nullable: true,
	})
	@JoinColumn({
		name: "artist_id",
		foreignKeyConstraintName: "fk_artist_id",
		referencedColumnName: "id",
	})
	artist!: Artist;
}
