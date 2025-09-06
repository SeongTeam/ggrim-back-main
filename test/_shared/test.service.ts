import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../src/modules/db/db.service";
import { AuthService } from "../../src/modules/auth/auth.service";
import { UserService } from "../../src/modules/user/user.service";
import { factoryUserStub, UserDummy } from "./stub/user.stub";
import { factoryQuizStub, QuizDummy } from "./stub/quiz.stub";
import { User } from "../../src/modules/user/entity/user.entity";
import { OneTimeTokenPurpose } from "../../src/modules/auth/types/oneTimeToken";
import { OneTimeToken } from "../../src/modules/auth/entity/oneTimeToken.entity";
import { factoryTagStub, TagDummy } from "./stub/tag.stub";
import { Tag } from "../../src/modules/tag/entities/tag.entity";
import { ArtistDummy, factoryArtistStub } from "./stub/artist.stub";
import { Artist } from "../../src/modules/artist/entities/artist.entity";
import { factoryStyleStub, StyleDummy } from "./stub/style.stub";
import { Style } from "../../src/modules/style/entities/style.entity";
import { factoryPaintingStub, PaintingDummy } from "./stub/painting.stub";
import { Painting } from "../../src/modules/painting/entities/painting.entity";
import { Quiz } from "../../src/modules/quiz/entities/quiz.entity";
import {
	factoryQuizReaction,
	QuizDislikeDummy,
	QuizLikeDummy,
} from "../e2e/quiz/quiz-reaction.stub";
import { QuizLike } from "../../src/modules/quiz/entities/quizLike.entity";
import { QuizDislike } from "../../src/modules/quiz/entities/quizDislike.entity";
import { faker } from "@faker-js/faker";
import { getRandomElement, selectRandomElements } from "../../src/utils/random";

@Injectable()
export class TestService {
	constructor(
		private readonly dbService: DatabaseService,
		private readonly authService: AuthService,
		private readonly userService: UserService,
	) {
		if (process.env.NODE_ENV !== "test") {
			throw new Error("ERROR-TEST-UTILS-ONLY-FOR-TESTS");
		}
	}

	getBearerAuthCredential(user: User): string {
		const token = this.authService.signToken({
			email: user.email,
			role: user.role,
			username: user.username,
			purpose: "access",
			type: "ACCESS",
		});

		return "Bearer " + token;
	}

	getBasicAuthCredential(email: string, password: string) {
		const credential = Buffer.from(`${email}:${password}`, "utf-8").toString("base64");

		return `Basic ${credential}`;
	}

	async createSignUpOneTimeToken(email: string): Promise<OneTimeToken> {
		return await this.authService.signOneTimeJWTWithoutUser(
			this.dbService.getQueryRunner(),
			email,
			"sign-up",
		);
	}

	async createOneTimeToken(user: User, purpose: OneTimeTokenPurpose): Promise<OneTimeToken> {
		return await this.authService.signOneTimeJWTWithUser(
			this.dbService.getQueryRunner(),
			user.email,
			purpose,
			user,
		);
	}

	async useOneTimeToken(oneTimeToken: OneTimeToken): Promise<OneTimeToken> {
		await this.authService.markOneTimeJWT(this.dbService.getQueryRunner(), oneTimeToken.id);
		return oneTimeToken;
	}

	//insert stub data
	async insertStubUser(
		userStub: UserDummy,
		quizzes?: QuizDummy[],
		oneTimeTokens?: OneTimeToken[],
	): Promise<User> {
		const hashedPassword = await this.authService.hash(userStub.password);
		const result = await this.userService.createUser(this.dbService.getQueryRunner(), {
			quizzes,
			...userStub,
			password: hashedPassword,
			oneTimeTokens,
		});

		return result;
	}

	async insertTagStub(tagStub: TagDummy) {
		const result = await this.dbService.getManager().insert(Tag, {
			...tagStub,
		});

		const id = (result.generatedMaps[0] as Tag).id;

		const tag = this.dbService.getManager().findOneOrFail(Tag, {
			where: {
				id,
			},
		});

		return tag;
	}
	async insertArtistStub(artistStub: ArtistDummy) {
		const result = await this.dbService.getManager().insert(Artist, {
			...artistStub,
		});
		const id = (result.generatedMaps[0] as Artist).id;

		const artist = await this.dbService.getManager().findOneOrFail(Artist, {
			where: {
				id,
			},
		});

		return artist;
	}
	async insertStyleStub(styleStub: StyleDummy) {
		const result = await this.dbService.getManager().insert(Style, {
			...styleStub,
		});
		const id = (result.generatedMaps[0] as Style).id;

		const style = await this.dbService.getManager().findOneOrFail(Style, {
			where: {
				id,
			},
		});

		return style;
	}
	async insertPaintingStub(
		paintingStub: PaintingDummy,
		artist: Artist,
		tags: Tag[],
		styles: Style[],
	) {
		const manager = this.dbService.getManager();
		const result = await manager.insert(Painting, {
			...paintingStub,
		});
		const painting = result.generatedMaps[0] as Painting;

		await manager.createQueryBuilder().relation(Painting, "artist").of(painting).set(artist);
		await manager.createQueryBuilder().relation(Painting, "tags").of(painting).add(tags);
		await manager.createQueryBuilder().relation(Painting, "styles").of(painting).add(styles);

		const paintingWithRelation = await manager.findOneOrFail(Painting, {
			where: {
				id: painting.id,
			},
			relations: {
				artist: true,
				tags: true,
				styles: true,
			},
		});

		return paintingWithRelation;
	}

	async insertOneChoiceQuizStub(
		quizStub: QuizDummy,
		owner: User,
		answer: Painting,
		distractors: Painting[],
	) {
		const tagMap: Map<string, Tag> = new Map();
		const styleMap: Map<string, Style> = new Map();
		const artistMap: Map<string, Artist> = new Map();
		const relationPaintings = [answer, ...distractors];

		relationPaintings.forEach((painting) => {
			painting.tags.forEach((tag) => {
				if (!tagMap.has(tag.id)) {
					tagMap.set(tag.id, tag);
				}
			});
			painting.styles.forEach((style) => {
				if (!styleMap.has(style.id)) {
					styleMap.set(style.id, style);
				}
			});
			if (!artistMap.has(painting.artist.id)) {
				artistMap.set(painting.artist.id, painting.artist);
			}
		});

		const tags = [...tagMap.values()];
		const styles = [...styleMap.values()];
		const artists = [...artistMap.values()];

		const manager = this.dbService.getManager();
		const result = await manager.insert(Quiz, {
			...quizStub,
			owner_id: owner.id,
		});

		const quiz = result.generatedMaps[0] as Quiz;
		const relations: Pick<
			Quiz,
			"answer_paintings" | "distractor_paintings" | "artists" | "tags" | "styles"
		> = {
			answer_paintings: [answer],
			distractor_paintings: distractors,
			tags,
			styles,
			artists,
		};

		await Promise.all(
			Object.entries(relations).map(([key, value]) =>
				manager.createQueryBuilder().relation(Quiz, key).of(quiz).add(value),
			),
		);

		const quizWithRelations = await this.dbService.getManager().findOneOrFail(Quiz, {
			where: { id: quiz.id },
			relations: {
				artists: true,
				answer_paintings: true,
				distractor_paintings: true,
				owner: true,
				styles: true,
				tags: true,
			},
		});
		return quizWithRelations;
	}

	async insertQuizLike(quizLikeStub: QuizLikeDummy, quiz: Quiz, user: User) {
		const quizLike = this.dbService.getManager().create(QuizLike, {
			...quizLikeStub,
			quiz,
			user,
		});
		await this.dbService.getManager().save(quizLike);

		const ret = await this.dbService.getManager().findOneOrFail(QuizLike, {
			where: { id: quizLike.id },
			relations: {
				quiz: true,
				user: true,
			},
		});

		return ret;
	}

	async insertQuizDisLike(quizDislikeStub: QuizDislikeDummy, quiz: Quiz, user: User) {
		const quizDislike = this.dbService.getManager().create(QuizDislike, {
			...quizDislikeStub,
			quiz,
			user,
		});
		await this.dbService.getManager().save(quizDislike);

		const ret = await this.dbService.getManager().findOneOrFail(QuizDislike, {
			where: { id: quizDislike.id },
			relations: {
				quiz: true,
				user: true,
			},
		});

		return ret;
	}

	async seedTags(count: number) {
		const tags = await Promise.all(
			Array(count)
				.fill(0)
				.map(() => this.insertTagStub(factoryTagStub())),
		);

		return tags;
	}

	async seedStyles(count: number) {
		const styles = await Promise.all(
			Array(count)
				.fill(0)
				.map(() => this.insertStyleStub(factoryStyleStub())),
		);

		return styles;
	}

	async seedArtists(count: number) {
		const artists = await Promise.all(
			Array(count)
				.fill(0)
				.map(() => this.insertArtistStub(factoryArtistStub())),
		);

		return artists;
	}

	async seedPaintings(count: number): Promise<Painting[]>;

	async seedPaintings(
		count: number,
		relations?: {
			tags: Tag[];
			styles: Style[];
			artists: Artist[];
		},
	): Promise<Painting[]> {
		const tags: Tag[] = [];
		const styles: Style[] = [];
		const artists: Artist[] = [];

		if (!relations) {
			const tagCount = Math.min(10, count * 2);
			const styleCount = Math.min(10, count);
			const artistCount = Math.min(10, count);
			tags.push(...(await this.seedTags(tagCount)));
			styles.push(...(await this.seedStyles(styleCount)));
			artists.push(...(await this.seedArtists(artistCount)));
		} else {
			tags.push(...relations.tags);
			styles.push(...relations.styles);
			artists.push(...relations.artists);
		}

		const paintings = await Promise.all(
			Array(count)
				.fill(0)
				.map(() => {
					const tagCount = faker.number.int({
						min: 1,
						max: Math.max(1, Math.floor(tags.length / 2)),
					});
					const selectedTags = selectRandomElements(tags, tagCount);
					const selectedStyles = selectRandomElements(styles, 1);
					const selectedArtist = getRandomElement(artists);

					return this.insertPaintingStub(
						factoryPaintingStub(),
						selectedArtist!,
						selectedTags,
						selectedStyles,
					);
				}),
		);

		return paintings;
	}

	async seedUsers(count: number) {
		const users = await Promise.all(
			Array(count)
				.fill(0)
				.map(() => this.insertStubUser(factoryUserStub("user"))),
		);

		return users;
	}

	async seedAdmins(count: number) {
		const admins = await Promise.all(
			Array(count)
				.fill(0)
				.map(() => this.insertStubUser(factoryUserStub("admin"))),
		);

		return admins;
	}

	async seedOneChoiceQuizzes(
		count: number,
		relations?: {
			owners: [User, ...User[]];
			paintings: [Painting, Painting, Painting, Painting, ...Painting[]];
		},
	) {
		const paintings: Painting[] = [];
		const owners: User[] = [];
		if (!relations) {
			const userCount = Math.min(10, count);
			const paintingCount = Math.min(50, count * 4);
			owners.push(...(await this.seedUsers(userCount)));
			paintings.push(...(await this.seedPaintings(paintingCount)));
		} else {
			paintings.push(...relations.paintings);
			owners.push(...relations.owners);
		}

		const paintingSelectCount = 4;

		const quizzes = await Promise.all(
			Array(count)
				.fill(0)
				.map(() => {
					const selectedPainting = selectRandomElements(paintings, paintingSelectCount);
					const selectedOwner = getRandomElement(owners)!;
					const answerIdx = faker.number.int({ min: 0, max: paintingSelectCount - 1 });
					const answer = selectedPainting[answerIdx];
					const distractors = selectedPainting.filter((v, idx) => idx !== answerIdx);

					return this.insertOneChoiceQuizStub(
						factoryQuizStub(),
						selectedOwner,
						answer,
						distractors,
					);
				}),
		);

		return quizzes;
	}
	async seedReaction(type: "like", user: User, quiz: Quiz): Promise<QuizLike>;
	async seedReaction(type: "dislike", user: User, quiz: Quiz): Promise<QuizDislike>;
	async seedReaction(
		type: "like" | "dislike",
		user: User,
		quiz: Quiz,
	): Promise<QuizDislike | QuizLike> {
		const funcMap = {
			like: () => this.insertQuizLike(factoryQuizReaction("like"), quiz, user),
			dislike: () => this.insertQuizDisLike(factoryQuizReaction("dislike"), quiz, user),
		};

		const ret = await funcMap[type]();
		return ret;
	}
}
