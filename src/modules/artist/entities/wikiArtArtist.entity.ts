import { Column, Entity, OneToOne, PrimaryColumn } from "typeorm";
import { Painting } from "../../painting/entities/painting.entity";

@Entity()
export class wikiArtArtist {
	@PrimaryColumn()
	ArtistId!: string; // unique object identifier

	@Column()
	artistName!: string; // Name + Surname of an artist
	@Column()
	url!: string; // unique object identifier made of artistName

	@Column()
	image!: string; // absolute url for artist image

	@Column()
	lastNameFirst!: string; // Surname + Name of an artist, default: ""

	@Column()
	birthDay!: Date; // artist birthdate, format: Date([milliseconds]), default: null

	@Column()
	deathDay!: Date; // artist deathdate, format: Date([milliseconds]), default: null

	@Column()
	birthDayAsString!: string; // artist birth date in string representation, default: ""
	@Column()
	deathDayAsString!: string; // artist death date in string representation, default: ""
	@Column()
	wikipediaUrl!: string; // absolute url for artist wikipedia page, default: ""
	@Column({ type: "varchar", array: true })
	dictionaries!: string[]; // dictionaries ids, default: [""]
	//periods: ArtistDictionaryJson[] | null; // artist’s periods of work, default: null
	//series: ArtistDictionaryJson[] | null; // artist’s paintings series, default: null

	@Column()
	activeYearsStart!: number; // artist's active years left component, default: null
	@Column()
	activeYearsCompletion!: number; // artist's active years right component, default: null
	@Column()
	biography!: string; // artist biography, default: ""
	@Column()
	gender!: string; // artist's sex, "female" | "male", default: ""
	@Column()
	originalArtistName!: string; // artist name in native language, default: ""

	// @OneToMany(() => WikiArtPaintings, (painting) => painting.artist)
	// @Column()
	// works: WikiArtPaintings[];

	@OneToOne(() => Painting)
	painting!: Painting;
}
