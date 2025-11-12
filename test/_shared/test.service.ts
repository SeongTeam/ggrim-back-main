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
import { assert } from "node:console";
import { deduplicate } from "../../src/utils/object";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import { EntityTarget, TypeORMError } from "typeorm";
import { USER_ROLE, UserRole } from "../../src/modules/user/const";
import { ReadonlyDeep, WritableDeep } from "type-fest";

// TODO: 데이터 시딩 로직 개선하기
// - [x] connection pool 최대한 활용하기
// - [x] relation 생성 로직 성능 개선하기
// - [x] TypeOrm save() api 대신, insert() api 또는 QueryBuilder API 사용하기
//  -> save API는 오버헤드가 크므로, SQL 쿼리를 직접 수행하는 API를 사용해야함
// - [x] 외부 라이브러리(typeOrm, node-postgresql) 실패 및 에러 예외처리 로직 추가하기
// - [ ] <추가 작업>
// ! 주의: <경고할 사항>
// ? 질문: <의문점 또는 개선 방향>
// * 참고: <관련 정보나 링크>

export type PaintingRelations = { artist: Artist; tags: Tag[]; styles: Style[] };

export type InsertPaintingArgs = {
	paintingDummy: PaintingDummy;
} & PaintingRelations;

export type OneChoiceQuizzesRelations = {
	owner: User;
	answer: Painting;
	distractors: [Painting, Painting, Painting];
	tags: Tag[];
	styles: Style[];
	artists: Artist[];
};

export type InsertOneChoiceQuizzesArgs = {
	quizStub: QuizDummy;
	owner: User;
	answer: Painting;
	distractors: [Painting, Painting, Painting];
};

export type InsertQuizReaction<T extends QuizLikeDummy | QuizDislikeDummy> = {
	reactionStub: T;
	quiz: Quiz;
	user: User;
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

	getBearerAuthCredential(user: ReadonlyDeep<User>): string {
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
		let jwt = new OneTimeToken();
		const qr = this.dbService.getQueryRunner();
		try {
			jwt = await this.authService.signOneTimeJWTWithoutUser(qr, email, "sign-up");
			await qr.release();
		} catch (e) {
			this.handleInsertError(e, { email });
		}

		assert(jwt.id !== undefined);

		return jwt;
	}

	async createOneTimeToken(
		user: ReadonlyDeep<User>,
		purpose: ReadonlyDeep<OneTimeTokenPurpose>,
	): Promise<OneTimeToken> {
		let jwt = new OneTimeToken();
		const clonedUser = structuredClone(user) as User;
		const qr = this.dbService.getQueryRunner();
		try {
			jwt = await this.authService.signOneTimeJWTWithUser(
				qr,
				user.email,
				purpose,
				clonedUser,
			);
			await qr.release();
		} catch (e) {
			this.handleInsertError(e, { user, purpose });
		}

		assert(jwt.id !== undefined);

		return jwt;
	}

	async useOneTimeToken(oneTimeToken: ReadonlyDeep<OneTimeToken>): Promise<void> {
		const qr = this.dbService.getQueryRunner();
		try {
			await this.authService.markOneTimeJWT(qr, oneTimeToken.id);
			await qr.release();
		} catch (e) {
			this.handleInsertError(e, oneTimeToken);
		}
	}

	async insertStubUser(userStub: ReadonlyDeep<UserDummy>): Promise<User> {
		const repo = this.dbService.getRepository(User);
		let user = new User();
		try {
			const hashedPassword = await this.authService.hash(userStub.password);
			await repo.insert({
				...userStub,
				password: hashedPassword,
			});

			const id = userStub.id;
			user = await repo.findOneOrFail({ where: { id } });
		} catch (e) {
			this.handleInsertError(e, userStub);
		}
		assert(user.id !== undefined);

		return user;
	}

	//TODO : insertUserStubs 로직 개선하기
	// [x] : hash 알고리즘 병목으로 인한 성능 저하 문제 해결하기
	//		-> 방향 : insertStubUser 를 병렬 호출하여 해결 예정
	async insertUserStubs(userStubs: ReadonlyDeep<UserDummy[]>): Promise<User[]> {
		assert(userStubs.length > 0);

		const users = Promise.all(userStubs.map((stub) => this.insertStubUser(stub)));

		return users;
	}

	async insertTagStubs(tagStubs: ReadonlyDeep<TagDummy[]>) {
		assert(tagStubs.length > 0);
		const manager = this.dbService.getManager();

		const stubs = structuredClone(tagStubs) as TagDummy[];
		let tags: Tag[] = [];
		try {
			const result = await manager.insert(Tag, stubs);
			const ids = result.generatedMaps.map((t) => (t as Tag).id);

			tags = await manager
				.createQueryBuilder()
				.select("tag")
				.from(Tag, "tag")
				.where("tag.id IN (:...ids)", { ids })
				.getMany();
		} catch (e) {
			this.handleInsertError(e, tagStubs);
		}
		assert(tags.length === tagStubs.length);

		return tags;
	}
	async insertArtistStubs(artistStubs: ReadonlyDeep<ArtistDummy[]>) {
		assert(artistStubs.length > 0);
		const manager = this.dbService.getManager();
		let artists: Artist[] = [];

		const stubs = structuredClone(artistStubs) as ArtistDummy[];
		try {
			const result = await manager.insert(Artist, stubs);
			const ids = result.generatedMaps.map((a) => (a as Artist).id);

			artists = await manager
				.createQueryBuilder()
				.select("artist")
				.from(Artist, "artist")
				.where("artist.id IN (:...ids)", { ids })
				.getMany();
		} catch (e) {
			this.handleInsertError(e, artistStubs);
		}
		assert(artists.length === artistStubs.length);

		return artists;
	}
	async insertStyleStubs(styleStubs: ReadonlyDeep<StyleDummy[]>) {
		assert(styleStubs.length > 0);
		let styles: Style[] = [];
		const manager = this.dbService.getManager();
		const stubs = structuredClone(styleStubs) as StyleDummy[];
		try {
			const result = await manager.insert(Style, stubs);
			const ids = result.generatedMaps.map((s) => (s as Style).id);

			styles = await manager
				.createQueryBuilder()
				.select("style")
				.from(Style, "style")
				.where("style.id IN (:...ids)", { ids })
				.getMany();
		} catch (error) {
			this.handleInsertError(error, { styleStubs });
		}

		return styles;
	}

	async insertPaintingStubs(paintingStubs: ReadonlyDeep<InsertPaintingArgs[]>) {
		const manager = this.dbService.getManager();
		let paintingWithRelation: Painting[] = [];

		const clonedPaintingStubs = structuredClone(paintingStubs) as InsertPaintingArgs[];
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
		try {
			const relationMap: Map<string, PaintingRelations> = new Map();

			for (const stub of clonedPaintingStubs) {
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
			paintingWithRelation = await manager
				.createQueryBuilder()
				.select("painting")
				.from(Painting, "painting")
				.where("painting.id IN (:...ids)", { ids })
				.leftJoinAndSelect("painting.tags", "tag")
				.leftJoinAndSelect("painting.styles", "style")
				.leftJoinAndSelect("painting.artist", "artist")
				.getMany();
		} catch (e) {
			this.handleInsertError(e, { paintingStubs });
		}
		assert(paintingStubs.length === paintingWithRelation.length);
		return paintingWithRelation;
	}

	async insertOneChoiceQuizStubs(quizStubs: ReadonlyDeep<InsertOneChoiceQuizzesArgs[]>) {
		const extractRelations = (stub: InsertOneChoiceQuizzesArgs) => {
			const { answer, distractors, owner } = stub;
			const paintings = [answer, ...distractors];
			const tags = deduplicate(paintings.flatMap((p) => p.tags));
			const styles = deduplicate(paintings.flatMap((p) => p.styles));
			const artists = deduplicate(paintings.map((p) => p.artist));
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

		assert(quizStubs.length > 0);
		const clonedStubs = structuredClone(quizStubs) as InsertOneChoiceQuizzesArgs[];
		const relationMap: Map<string, OneChoiceQuizzesRelations> = new Map();

		let quizWithRelations: Quiz[] = [];

		for (const stub of clonedStubs) {
			const id = stub.quizStub.id;

			if (!relationMap.has(id)) {
				const relations = extractRelations(stub);
				relationMap.set(id, relations);
			}
		}

		const manager = this.dbService.getManager();
		const insertDataList = clonedStubs.map((stub) => ({
			...stub.quizStub,
			owner_id: stub.owner.id,
		}));

		try {
			const result = await manager.insert(Quiz, insertDataList);

			const quizzes = result.generatedMaps.map((val) => val as Quiz);
			const ids = quizzes.map((q) => q.id);

			await Promise.all(quizzes.map((q) => insertRelations(q, relationMap.get(q.id)!)));

			quizWithRelations = await manager
				.createQueryBuilder()
				.select("quiz")
				.from(Quiz, "quiz")
				.where("quiz.id IN (:...ids)", { ids })
				.leftJoinAndSelect("quiz.tags", "tag")
				.leftJoinAndSelect("quiz.styles", "style")
				.leftJoinAndSelect("quiz.artists", "artist")
				.leftJoinAndSelect("quiz.answer_paintings", "quiz_answer_painting")
				.leftJoinAndSelect("quiz.distractor_paintings", "quiz_distractor_painting")
				.leftJoinAndSelect("quiz.owner", "quiz_user")
				.getMany();
		} catch (error) {
			this.handleInsertError(error, quizStubs);
		}

		assert(clonedStubs.length === quizWithRelations.length);
		return quizWithRelations;
	}

	async insertQuizReaction(stubs: InsertQuizReaction<QuizLikeDummy>[]): Promise<QuizLike[]>;
	async insertQuizReaction(stubs: InsertQuizReaction<QuizDislikeDummy>[]): Promise<QuizDislike[]>;
	async insertQuizReaction(
		stubs: InsertQuizReaction<QuizLikeDummy>[] | InsertQuizReaction<QuizDislikeDummy>[],
	): Promise<QuizLike[] | QuizDislike[]> {
		const insertToDB = async <T extends Omit<QuizLike, "_type">>(
			entity: EntityTarget<T>,
			insertDataList: QueryDeepPartialEntity<T>[],
		) => {
			let reactions: T[] = [];
			try {
				const result = await manager.insert(entity, insertDataList);

				const ids = result.generatedMaps.map((val) => (val as T).id);

				reactions = await manager
					.createQueryBuilder()
					.select("reaction")
					.from(entity, "reaction")
					.where("reaction.id IN (:...ids)", { ids })
					.leftJoinAndSelect("reaction.user", "user")
					.leftJoinAndSelect("reaction.quiz", "quiz")
					.getMany();
			} catch (e) {
				this.handleInsertError(e, stubs);
			}

			return reactions;
		};

		const manager = this.dbService.getManager();

		assert(stubs.length > 0);

		let reactions = [];

		const type = stubs[0].reactionStub._type;
		const insertDataList = stubs.map((reaction) => ({
			...reaction.reactionStub,
			user_id: reaction.user.id,
			quiz_id: reaction.quiz.id,
		}));

		if (type === "dislike") {
			reactions = await insertToDB(
				QuizDislike,
				insertDataList as QueryDeepPartialEntity<QuizDislike>[],
			);
		} else {
			reactions = await insertToDB(
				QuizLike,
				insertDataList as QueryDeepPartialEntity<QuizLike>[],
			);
		}

		assert(reactions.length === stubs.length);
		assert(reactions[0].quiz);
		assert(reactions[0].user);

		return reactions;
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

	/**
	 * @description choose tag, style and artist is random.tag is selected 1 ~ half. style and artist is selected 1
	 * */
	async seedPaintings(
		count: number,
		relations?: ReadonlyDeep<{
			tags: Tag[];
			styles: Style[];
			artists: Artist[];
		}>,
	): Promise<Painting[]> {
		assert(count > 0);
		assert(count < 1000);
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
			const clonedRelations = structuredClone(relations) as WritableDeep<{
				tags: Tag[];
				styles: Style[];
				artists: Artist[];
			}>;
			tags.push(...clonedRelations.tags);
			styles.push(...clonedRelations.styles);
			artists.push(...clonedRelations.artists);
		}

		const seedArgsList: InsertPaintingArgs[] = Array(count)
			.fill(0)
			.map(() => {
				const tagCount = faker.number.int({
					min: 1,
					max: Math.max(1, Math.floor(tags.length / 2)),
				});
				const styleCount = faker.number.int({
					min: 1,
					max: Math.min(2, styles.length),
				});

				return {
					paintingDummy: factoryPaintingStub(),
					tags: selectRandomElements(tags, tagCount),
					styles: selectRandomElements(styles, styleCount),
					artist: getRandomElement(artists)!,
				};
			});
		const paintings = await this.insertPaintingStubs(seedArgsList);

		return paintings;
	}

	async seedUsersMultipleInsert(count: number) {
		assert(count > 0);
		assert(count < 1000);
		const stubs = Array(count)
			.fill(0)
			.map(() => factoryUserStub("user"));
		const users = await this.insertUserStubs(stubs);
		return users;
	}

	async seedUsersSingleInsert(count: number, userType: UserRole = USER_ROLE.USER) {
		assert(count > 0);
		assert(count < 1000);
		const users = await Promise.all(
			Array(count)
				.fill(0)
				.map(() => this.insertStubUser(factoryUserStub(userType))),
		);

		return users;
	}

	async seedAdmins(count: number) {
		assert(count > 0);
		assert(count < 1000);
		const stubs = Array(count)
			.fill(0)
			.map(() => factoryUserStub("admin"));
		const admins = await this.insertUserStubs(stubs);
		return admins;
	}

	async seedOneChoiceQuizzes(
		count: number,
		relations?: ReadonlyDeep<{
			owners: [User, ...User[]];
			paintings: [Painting, Painting, Painting, Painting, ...Painting[]];
		}>,

		userType: UserRole = USER_ROLE.USER,
	) {
		assert(count > 0);
		assert(count < 1000);
		let paintings: Painting[] = [];
		let owners: User[] = [];
		if (!relations) {
			const userCount = Math.min(10, count);
			const paintingCount = Math.min(30, count * 4);
			[paintings, owners] = await Promise.all([
				this.seedPaintings(paintingCount),
				this.seedUsersSingleInsert(userCount, userType),
			]);
		} else {
			const clonedRelations = structuredClone(relations) as WritableDeep<typeof relations>;
			paintings = clonedRelations.paintings;
			owners = clonedRelations.owners;
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
				const distractors = selectedPainting.filter((v, idx) => idx !== answerIdx) as [
					Painting,
					Painting,
					Painting,
				];
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
	async seedQuizReaction(count: number, type: "like"): Promise<QuizLike[]>;
	async seedQuizReaction(count: number, type: "like", userType: UserRole): Promise<QuizLike[]>;
	async seedQuizReaction(count: number, type: "dislike"): Promise<QuizDislike[]>;
	async seedQuizReaction(
		count: number,
		type: "dislike",
		userType: UserRole,
	): Promise<QuizDislike[]>;
	async seedQuizReaction(
		count: number,
		type: "like" | "dislike",
		userType: UserRole = USER_ROLE.USER,
	): Promise<QuizDislike[] | QuizLike[]> {
		assert(count > 0);
		assert(count < 1000);

		const root = Math.ceil(Math.sqrt(count));
		const quizCount = root;
		const userCount = root;

		assert(count <= quizCount * userCount);

		const [quizzes, users] = await Promise.all([
			this.seedOneChoiceQuizzes(quizCount),
			this.seedUsersSingleInsert(userCount, userType),
		]);
		let reactions: QuizLike[] | QuizDislike[] = [];

		if (type === "dislike") {
			const insertDataList: InsertQuizReaction<QuizDislikeDummy>[] = [];

			for (let i = 0; i < quizCount; i++) {
				for (let ii = 0; ii < userCount; ii++) {
					const reactionStub = factoryQuizReaction(type);
					insertDataList.push({
						reactionStub,
						quiz: quizzes[i],
						user: users[ii],
					});
				}
			}

			reactions = await this.insertQuizReaction(insertDataList);
		} else {
			const insertDataList: InsertQuizReaction<QuizLikeDummy>[] = [];

			for (let i = 0; i < quizCount; i++) {
				for (let ii = 0; ii < userCount; ii++) {
					const reactionStub = factoryQuizReaction(type);
					insertDataList.push({
						reactionStub,
						quiz: quizzes[i],
						user: users[ii],
					});
				}
			}

			reactions = await this.insertQuizReaction(insertDataList);
		}

		assert(reactions.length === quizCount * userCount);

		return reactions.slice(0, count);
	}

	private handleInsertError(error: unknown, params: unknown) {
		if (error instanceof TypeORMError) {
			const { name, message } = error;
			// 데이터베이스 쿼리 에러 처리
			console.error(`typeOrm error: ${name}`, message);
		} else if (error instanceof Error) {
			const { message, stack, name } = error;
			console.log(
				"insert data. \n" + `reason :` + JSON.stringify({ name, message, stack }),
				`params :` + JSON.stringify(params),
			);
		} else {
			console.error("Unknown error:", error);
		}

		process.exit(1);
	}
}
