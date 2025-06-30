import { Column, Entity, OneToOne, PrimaryColumn } from "typeorm";
import { TYPE_DEFAULT_VALUE } from "../../_common/const/default.value";
import { Painting } from "./painting.entity";
@Entity()
export class WikiArtPainting {
	@PrimaryColumn()
	wikiArtId: string = TYPE_DEFAULT_VALUE.string;

	@Column()
	title: string = TYPE_DEFAULT_VALUE.string;

	@Column()
	url: string = TYPE_DEFAULT_VALUE.string;

	@Column()
	artistName: string = TYPE_DEFAULT_VALUE.string;

	@Column()
	artistUrl: string = TYPE_DEFAULT_VALUE.string;

	//   @ManyToOne(() => wikiArtArtist, (artist) => artist.works)
	//   artist: wikiArtArtist;

	@Column()
	image: string = TYPE_DEFAULT_VALUE.string;

	@Column()
	width: number = TYPE_DEFAULT_VALUE.number;

	@Column()
	height: number = TYPE_DEFAULT_VALUE.number;

	@Column({ nullable: true })
	completitionYear!: number; // painting completition year, default: null

	//dictionaries: string[]; // dictionaries ids, default: [""]
	@Column()
	location: string = TYPE_DEFAULT_VALUE.string; // location (country + city), default: ""
	//period: ArtistDictionaryJson | null; // artist’s period of work, default: null
	//serie: ArtistDictionaryJson | null; // artist’s paintings series, default: null

	@Column({ type: "varchar", array: true, default: [""] })
	genres: string[] = TYPE_DEFAULT_VALUE.array; // array of genres names, default: [""]

	@Column({ type: "varchar", array: true, default: [""] })
	styles: string[] = TYPE_DEFAULT_VALUE.array; // array of styles names, default: [""]

	@Column({ type: "varchar", array: true, default: [""] })
	media: string[] = TYPE_DEFAULT_VALUE.array; // array of media names, default: [""]

	@Column({ type: "varchar", array: true, default: [""] })
	galleries: string[] = TYPE_DEFAULT_VALUE.array; // array of galleries names, default: [""]

	@Column({ type: "varchar", array: true, default: [""] })
	tags: string[] = TYPE_DEFAULT_VALUE.array; // array of tags names, default: [""]

	@Column("decimal", { precision: 12, scale: 5, nullable: true })
	sizeX: number = TYPE_DEFAULT_VALUE.number; // original painting dimension X, default: null

	@Column("decimal", { precision: 12, scale: 5, nullable: true })
	sizeY: number = TYPE_DEFAULT_VALUE.number; // original painting dimension Y, default: null

	@Column("decimal", { precision: 12, scale: 5, nullable: true })
	diameter: number = TYPE_DEFAULT_VALUE.number; // original painting diameter, default: null

	@Column({ type: "text", default: "" })
	description: string = TYPE_DEFAULT_VALUE.string; // painting description, default: ""

	@OneToOne(() => Painting, {
		cascade: ["update", "insert"],
	})
	painting!: Painting;
}
