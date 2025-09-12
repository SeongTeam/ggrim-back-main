import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../src/modules/db/db.service";
import { AuthService } from "../../src/modules/auth/auth.service";
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

// TODO: 데이터 시딩 로직 개선하기
// - [x] connection pool 최대한 활용하기
// - [x] relation 생성 로직 성능 개선하기
// - [x] TypeOrm save() api 대신, insert() api 또는 QueryBuilder API 사용하기
//  -> save API는 오버헤드가 크므로, SQL 쿼리를 직접 수행하는 API를 사용해야함
// - [ ] 외부 라이브러리(typeOrm, node-postgresql) 실패 및 에러 예외처리 로직 추가하기
// - [ ] <추가 작업>
// ! 주의: <경고할 사항>
// ? 질문: <의문점 또는 개선 방향>
// * 참고: <관련 정보나 링크>

type PaintingRelations = { artist: Artist; tags: Tag[]; styles: Style[] };

type InsertPaintingArgs = {
	paintingDummy: PaintingDummy;
} & PaintingRelations;

type OneChoiceQuizzesRelations = {
	owner: User;
	answer: Painting;
	distractors: Painting[];
	tags: Tag[];
	styles: Style[];
	artists: Artist[];
};

type InsertOneChoiceQuizzesArgs = {
	quizStub: QuizDummy;
	owner: User;
	answer: Painting;
	distractors: Painting[];
};

@Injectable()
export class TestService {
	constructor(
		private readonly dbService: DatabaseService,
		private readonly authService: AuthService,
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

	async insertStubUser(userStub: UserDummy): Promise<User> {
		const hashedPassword = await this.authService.hash(userStub.password);
		const repo = this.dbService.getRepository(User);
		await repo.insert({
			...userStub,
			password: hashedPassword,
		});

		const id = userStub.id;
		const user = await repo.findOne({ where: { id } });

		return user as User;
	}

	async insertUserStubs(userStubs: UserDummy[]): Promise<User[]> {
		const repo = this.dbService.getRepository(User);
		const stubs = structuredClone(userStubs);
		for (const stub of stubs) {
			const hashedPassword = await this.authService.hash(stub.password);
			stub.password = hashedPassword;
		}

		const result = await repo.insert(stubs);

		const ids = result.generatedMaps.map((val) => (val as User).id);
		const users = await repo
			.createQueryBuilder()
			.select("user")
			.from(User, "user")
			.where("user.id IN (:...ids)", { ids })
			.getMany();

		return users;
	}

	async insertTagStubs(tagStubs: TagDummy[]) {
		const manager = this.dbService.getManager();
		const result = await manager.insert(Tag, tagStubs);

		const ids = result.generatedMaps.map((t) => (t as Tag).id);

		const tags = await manager
			.createQueryBuilder()
			.select("tag")
			.from(Tag, "tag")
			.where("tag.id IN (:...ids)", { ids })
			.getMany();

		return tags;
	}
	async insertArtistStubs(artistStubs: ArtistDummy[]) {
		const manager = this.dbService.getManager();
		const result = await manager.insert(Artist, artistStubs);
		const ids = result.generatedMaps.map((a) => (a as Artist).id);

		const artists = await manager
			.createQueryBuilder()
			.select("artist")
			.from(Artist, "artist")
			.where("artist.id IN (:...ids)", { ids })
			.getMany();

		return artists;
	}
	async insertStyleStubs(styleStubs: StyleDummy[]) {
		let ret: Style[] = [];
		const manager = this.dbService.getManager();
		try {
			const result = await manager.insert(Style, styleStubs);
			const ids = result.generatedMaps.map((s) => (s as Style).id);

			const styles = await manager
				.createQueryBuilder()
				.select("style")
				.from(Style, "style")
				.where("style.id IN (:...ids)", { ids })
				.getMany();
			ret = styles;
		} catch (error) {
			this.handleInsertError(error, { styleStubs });
		}

		return ret;
	}

	async insertPaintingStub(paintingStubs: InsertPaintingArgs[]) {
		const manager = this.dbService.getManager();
		const insertRelations = async (painting: Painting, relations: PaintingRelations) => {
			const { artist, tags, styles } = relations;
			await manager
				.createQueryBuilder()
				.relation(Painting, "artist")
				.of(painting)
				.set(artist);
			await manager.createQueryBuilder().relation(Painting, "tags").of(painting).add(tags);
			await manager
				.createQueryBuilder()
				.relation(Painting, "styles")
				.of(painting)
				.add(styles);
		};

		// const mapRelations = (
		// 	painting: Painting,
		// 	relations: {
		// 		artist: Artist;
		// 		tags: Tag[];
		// 		styles: Style[];
		// 	},
		// ) => {
		// 	painting.artist = relations.artist;
		// 	painting.tags = relations.tags;
		// 	painting.styles = relations.styles;

		// 	return painting;
		// };

		const relationMap: Map<string, PaintingRelations> = new Map();

		for (const stub of paintingStubs) {
			const { artist, tags, styles, paintingDummy } = stub;
			const id = paintingDummy.id;
			if (!relationMap.has(id)) {
				relationMap.set(id, { artist, tags, styles });
			}
		}

		const paintingDummies = paintingStubs.map((stub) => stub.paintingDummy);
		const result = await manager.insert(Painting, paintingDummies);
		const paintings = result.generatedMaps.map((val) => val as Painting);
		await Promise.all(paintings.map((p) => insertRelations(p, relationMap.get(p.id)!)));

		const ids = paintings.map((p) => p.id);
		const paintingWithRelation = await manager
			.createQueryBuilder()
			.select("painting")
			.from(Painting, "painting")
			.where("painting.id IN (:...ids)", { ids })
			.leftJoinAndSelect("painting.tags", "tag")
			.leftJoinAndSelect("painting.styles", "style")
			.leftJoinAndSelect("painting.artist", "artist")
			.getMany();

		return paintingWithRelation;
	}

	async insertOneChoiceQuizStubs(quizStubs: InsertOneChoiceQuizzesArgs[]) {
		const extractRelations = (stub: InsertOneChoiceQuizzesArgs) => {
			const { answer, distractors, owner } = stub;
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
			return { owner, answer, distractors, tags, styles, artists };
		};

		const insertRelations = (quiz: Quiz, relations: OneChoiceQuizzesRelations) => {
			const { answer, distractors, tags, styles, artists } = relations;
			const relationsField: Pick<
				Quiz,
				"answer_paintings" | "distractor_paintings" | "artists" | "tags" | "styles"
			> = {
				answer_paintings: [answer],
				distractor_paintings: distractors,
				tags,
				styles,
				artists,
			};

			return Promise.all(
				Object.entries(relationsField).map(([key, value]) =>
					manager.createQueryBuilder().relation(Quiz, key).of(quiz).add(value),
				),
			);
		};

		const relationMap: Map<string, OneChoiceQuizzesRelations> = new Map();

		for (const stub of quizStubs) {
			const id = stub.quizStub.id;

			if (!relationMap.has(id)) {
				const relations = extractRelations(stub);
				relationMap.set(id, relations);
			}
		}

		const manager = this.dbService.getManager();
		const insertDataList = quizStubs.map((stub) => ({
			...stub.quizStub,
			owner_id: stub.owner.id,
		}));
		const result = await manager.insert(Quiz, insertDataList);

		const quizzes = result.generatedMaps.map((val) => val as Quiz);
		const ids = quizzes.map((q) => q.id);

		await Promise.all(quizzes.map((q) => insertRelations(q, relationMap.get(q.id)!)));

		const quizWithRelations = await manager
			.createQueryBuilder()
			.select("quiz")
			.from(Quiz, "quiz")
			.where("quiz.id IN (:...ids)", { ids })
			.leftJoinAndSelect("quiz.tags", "tag")
			.leftJoinAndSelect("quiz.styles", "style")
			.leftJoinAndSelect("quiz.artists", "artist")
			.leftJoinAndSelect("quiz.answer_paintings", "quiz_answer_painting")
			.leftJoinAndSelect("quiz.distractor_paintings", "quiz_distractor_painting")
			.getMany();

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
		const stubs = Array(count)
			.fill(0)
			.map(() => factoryTagStub());

		const tags = await this.insertTagStubs(stubs);

		return tags;
	}

	async seedStyles(count: number) {
		const stubs = Array(count)
			.fill(0)
			.map(() => factoryStyleStub());

		const styles = await this.insertStyleStubs(stubs);

		return styles;
	}

	async seedArtists(count: number) {
		const stubs = Array(count)
			.fill(0)
			.map(() => factoryArtistStub());

		const artists = await this.insertArtistStubs(stubs);

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
			const [newTags, newStyles, newArtists] = await Promise.all([
				this.seedTags(tagCount),
				this.seedStyles(styleCount),
				this.seedArtists(artistCount),
			]);
			tags.push(...newTags);
			styles.push(...newStyles);
			artists.push(...newArtists);
		} else {
			tags.push(...relations.tags);
			styles.push(...relations.styles);
			artists.push(...relations.artists);
		}

		const seedArgsList: InsertPaintingArgs[] = Array(count)
			.fill(0)
			.map(() => {
				const tagCount = faker.number.int({
					min: 1,
					max: Math.max(1, Math.floor(tags.length / 2)),
				});

				return {
					paintingDummy: factoryPaintingStub(),
					tags: selectRandomElements(tags, tagCount),
					styles: [getRandomElement(styles)!],
					artist: getRandomElement(artists)!,
				};
			});
		const paintings = await this.insertPaintingStub(seedArgsList);

		return paintings;
	}

	async seedUsersMultipleInsert(count: number) {
		const stubs = Array(count)
			.fill(0)
			.map(() => factoryUserStub("user"));
		const users = await this.insertUserStubs(stubs);
		return users;
	}

	async seedUsersSingleInsert(count: number) {
		const users = await Promise.all(
			Array(count)
				.fill(0)
				.map(() => this.insertStubUser(factoryUserStub("user"))),
		);

		return users;
	}

	async seedAdmins(count: number) {
		const stubs = Array(count)
			.fill(0)
			.map(() => factoryUserStub("admin"));
		const admins = await this.insertUserStubs(stubs);
		return admins;
	}

	async seedOneChoiceQuizzes(
		count: number,
		relations?: {
			owners: [User, ...User[]];
			paintings: [Painting, Painting, Painting, Painting, ...Painting[]];
		},
	) {
		let paintings: Painting[] = [];
		let owners: User[] = [];
		if (!relations) {
			const userCount = Math.min(10, count);
			const paintingCount = Math.min(30, count * 4);
			[paintings, owners] = await Promise.all([
				this.seedPaintings(paintingCount),
				this.seedUsersSingleInsert(userCount),
			]);
		} else {
			paintings = relations.paintings;
			owners = relations.owners;
		}

		const paintingSelectCount = 4;
		const seedQuizArgs: InsertOneChoiceQuizzesArgs[] = Array(count)
			.fill(0)
			.map(() => {
				const selectedPainting = selectRandomElements(paintings, paintingSelectCount);
				const answerIdx = faker.number.int({
					min: 0,
					max: paintingSelectCount - 1,
				});
				const answer = selectedPainting[answerIdx];
				const distractors = selectedPainting.filter((v, idx) => idx !== answerIdx);
				const owner = getRandomElement(owners)!;

				return {
					answer,
					distractors,
					owner,
					quizStub: factoryQuizStub(),
				};
			});

		const quizzes = await this.insertOneChoiceQuizStubs(seedQuizArgs);
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

	private handleInsertError(error: unknown, params: unknown) {
		if (error instanceof Error) {
			const { message, stack, name } = error;
			console.log(
				"insert data. \n" + `reason :` + JSON.stringify({ name, message, stack }),
				`params :` + JSON.stringify(params),
			);
		}
	}
}
