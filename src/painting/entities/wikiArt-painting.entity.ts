import { IsArray, IsNumber, IsString, ValidateIf } from "class-validator";
import { Column, Entity, OneToOne, PrimaryColumn } from "typeorm";
import { TYPE_DEFAULT_VALUE } from "../../_common/const/default.value";
import { Painting } from "./painting.entity";
@Entity()
export class WikiArtPainting {
	@PrimaryColumn()
	@IsString()
	wikiArtId: string = TYPE_DEFAULT_VALUE.string;

	@Column()
	@IsString()
	title: string = TYPE_DEFAULT_VALUE.string;

	@Column()
	@IsString()
	url: string = TYPE_DEFAULT_VALUE.string;

	@Column()
	@IsString()
	artistName: string = TYPE_DEFAULT_VALUE.string;

	@Column()
	@IsString()
	artistUrl: string = TYPE_DEFAULT_VALUE.string;

	//   @ManyToOne(() => wikiArtArtist, (artist) => artist.works)
	//   artist: wikiArtArtist;

	@Column()
	@IsString()
	image: string = TYPE_DEFAULT_VALUE.string;

	@Column()
	@IsNumber()
	width: number = TYPE_DEFAULT_VALUE.number;

	@Column()
	@IsNumber()
	height: number = TYPE_DEFAULT_VALUE.number;

	@Column({ nullable: true })
	@IsNumber()
	completitionYear!: number; // painting completition year, default: null

	//dictionaries: string[]; // dictionaries ids, default: [""]
	@Column()
	@IsString()
	location: string = TYPE_DEFAULT_VALUE.string; // location (country + city), default: ""
	//period: ArtistDictionaryJson | null; // artist’s period of work, default: null
	//serie: ArtistDictionaryJson | null; // artist’s paintings series, default: null

	@Column({ type: "varchar", array: true, default: [""] })
	@IsArray()
	@IsString({ each: true })
	genres: string[] = TYPE_DEFAULT_VALUE.array; // array of genres names, default: [""]

	@Column({ type: "varchar", array: true, default: [""] })
	@IsArray()
	@IsString({ each: true })
	styles: string[] = TYPE_DEFAULT_VALUE.array; // array of styles names, default: [""]

	@Column({ type: "varchar", array: true, default: [""] })
	@IsArray()
	@IsString({ each: true })
	media: string[] = TYPE_DEFAULT_VALUE.array; // array of media names, default: [""]

	@Column({ type: "varchar", array: true, default: [""] })
	@IsArray()
	@IsString({ each: true })
	galleries: string[] = TYPE_DEFAULT_VALUE.array; // array of galleries names, default: [""]

	@Column({ type: "varchar", array: true, default: [""] })
	@IsArray()
	@IsString({ each: true })
	tags: string[] = TYPE_DEFAULT_VALUE.array; // array of tags names, default: [""]

	@Column("decimal", { precision: 12, scale: 5, nullable: true })
	@ValidateIf((object, value) => value !== null)
	@IsNumber({ allowNaN: false }, { message: "sizeX is not number" })
	sizeX: number = TYPE_DEFAULT_VALUE.number; // original painting dimension X, default: null

	@Column("decimal", { precision: 12, scale: 5, nullable: true })
	@ValidateIf((object, value) => value !== null)
	@IsNumber({ allowNaN: false }, { message: "sizeY is not number" })
	sizeY: number = TYPE_DEFAULT_VALUE.number; // original painting dimension Y, default: null

	@Column("decimal", { precision: 12, scale: 5, nullable: true })
	@ValidateIf((object, value) => value !== null)
	@IsNumber({ allowNaN: false }, { message: "diameter is not number" })
	diameter: number = TYPE_DEFAULT_VALUE.number; // original painting diameter, default: null

	@Column({ type: "text", default: "" })
	@IsString()
	description: string = TYPE_DEFAULT_VALUE.string; // painting description, default: ""

	@OneToOne(() => Painting, {
		cascade: ["update", "insert"],
	})
	painting!: Painting;
}
