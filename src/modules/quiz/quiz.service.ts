import { Inject, Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
	FindManyOptions,
	FindOneOptions,
	FindOptionsRelations,
	QueryRunner,
	Repository,
} from "typeorm";
import { ServiceException } from "../_common/filter/exception/service/serviceException";
import { Pagination } from "../_common/types";
import { Artist } from "../artist/entities/artist.entity";
import { createTransactionQueryBuilder } from "../db/query-runner/queryRunner.lib";
import { Painting } from "../painting/entities/painting.entity";
import { PaintingService } from "../painting/painting.service";
import { Style } from "../style/entities/style.entity";
import { Tag } from "../tag/entities/tag.entity";
import { User } from "../user/entity/user.entity";
import { updateProperty } from "../../utils/object";
import { isArrayEmpty, isNotFalsy } from "../../utils/validator";
import { SearchQuizQueryDTO } from "./dto/request/searchQuiz.query.dto";
import { CreateQuizDTO } from "./dto/request/createQuiz.dto";
import { QuizReactionType } from "./const";
import { ReplaceQuizDTO } from "./dto/request/replaceQuiz.dto";
import { QuizDislike } from "./entities/quizDislike.entity";
import { QuizLike } from "./entities/quizLike.entity";
import { Quiz } from "./entities/quiz.entity";
import { QuizReactionCount } from "./type";
import { RelatedPaintings } from "./type";
import { RelatedPaintingIds } from "./type";
import { QuizSubmission } from "./batch/type";
import { assert } from "console";
@Injectable()
export class QuizService {
	constructor(
		@InjectRepository(Quiz) private repo: Repository<Quiz>,
		@Inject(PaintingService) private readonly paintingService: PaintingService,
		@InjectRepository(QuizDislike) private readonly dislikeRepo: Repository<QuizDislike>,
		@InjectRepository(QuizLike) private readonly likeRepo: Repository<QuizLike>,
	) {}

	async createQuiz(queryRunner: QueryRunner, dto: CreateQuizDTO, owner: User) {
		const { answerPaintings, distractorPaintings, examplePainting } =
			await this.getRelatedPaintings({ ...dto });

		const newQuiz = new Quiz();
		newQuiz.answer_paintings = [...answerPaintings];
		newQuiz.distractor_paintings = [...distractorPaintings];
		newQuiz.type = dto.type;
		newQuiz.time_limit = dto.timeLimit;
		newQuiz.title = dto.title;
		newQuiz.example_painting = examplePainting === undefined ? null : examplePainting;
		newQuiz.description = dto.description;
		newQuiz.owner_id = owner.id;
		newQuiz.owner = owner;

		return this.insertQuiz(queryRunner, newQuiz);
	}

	async updateQuiz(queryRunner: QueryRunner, quiz: Quiz, dto: ReplaceQuizDTO) {
		updateProperty(quiz, "time_limit", dto.timeLimit);
		updateProperty(quiz, "title", dto.title);
		updateProperty(quiz, "description", dto.description);

		const { answerPaintings, distractorPaintings, examplePainting } =
			await this.getRelatedPaintings({ ...dto });
		quiz.answer_paintings = answerPaintings;
		quiz.distractor_paintings = distractorPaintings;
		quiz.example_painting = examplePainting === undefined ? null : examplePainting;

		return this.insertQuiz(queryRunner, quiz);
	}

	async searchQuiz(dto: SearchQuizQueryDTO): Promise<Pagination<Quiz>> {
		//TODO 검색 로직 개선
		//- [x] Dto 검증 구현
		// -> controller 또는 호출자에서 검증
		//- [ ] 배열의 각 원소가 공백("")인지 확인 필요.
		//	-> 공백값이 삽입되어 DB QUERY에 적용되면, 공백값과 일치하는 조건이 추가됨.
		//- [ ] title, description 검색 고려하기
		//
		const { tags, styles, artists, page, count: paginationCount } = dto;

		const quizAlias = "q";
		const queryBuilder = this.repo.createQueryBuilder("q").select();

		if (!isArrayEmpty(tags)) {
			const subQueryFilterByTags = this.repo
				.createQueryBuilder()
				.subQuery()
				.select("quiz_tags.quizId")
				.from("quiz_tags_tag", "quiz_tags") // Many-to-Many 연결 테이블
				.innerJoin("tag", "tag", "tag.id = quiz_tags.tagId") // 연결 테이블과 Tag JOIN
				.where("tag.name IN (:...tagNames)") // tagNames 필터링
				.groupBy("quiz_tags.quizId")
				.having("COUNT(DISTINCT tag.id) = :tagCount") // 정확한 태그 갯수 매칭
				.getQuery();

			const alias = "t";
			const relation: keyof Quiz = "tags";

			queryBuilder
				.innerJoinAndSelect(`${quizAlias}.${relation}`, alias)
				.andWhere(`${quizAlias}.id IN ${subQueryFilterByTags}`, {
					tagNames: tags,
					tagCount: tags.length,
				});
		}

		if (!isArrayEmpty(styles)) {
			const subQueryFilterByStyles = this.repo
				.createQueryBuilder()
				.subQuery()
				.select("quiz_styles.quizId")
				.from("quiz_styles_style", "quiz_styles") // Many-to-Many 연결 테이블
				.innerJoin("style", "style", "style.id = quiz_styles.styleId") // 연결 테이블과 Tag JOIN
				.where("style.name IN (:...styleNames)") // tagNames 필터링
				.groupBy("quiz_styles.quizId")
				.having("COUNT(DISTINCT style.id) = :styleCount") // 정확한 태그 갯수 매칭
				.getQuery();
			const alias = "s";
			const relation: keyof Quiz = "styles";

			queryBuilder
				.innerJoinAndSelect(`${quizAlias}.${relation}`, alias)
				.andWhere(`${quizAlias}.id IN ${subQueryFilterByStyles}`, {
					styleNames: styles,
					styleCount: styles.length,
				});
		}

		if (!isArrayEmpty(artists)) {
			const subQueryFilterByArtists = this.repo
				.createQueryBuilder()
				.subQuery()
				.select("quiz_artists.quizId")
				.from("quiz_artists_artist", "quiz_artists") // Many-to-Many 연결 테이블
				.innerJoin("artist", "artist", "artist.id = quiz_artists.artistId") // 연결 테이블과 Tag JOIN
				.where("artist.name IN (:...artistNames)") // tagNames 필터링
				.groupBy("quiz_artists.quizId")
				.having("COUNT(DISTINCT artist.id) = :artistCount") // 정확한 태그 갯수 매칭
				.getQuery();

			const alias = "a";
			const relation: keyof Quiz = "artists";
			queryBuilder
				.innerJoinAndSelect(`${quizAlias}.${relation}`, alias)
				.andWhere(`${quizAlias}.id IN ${subQueryFilterByArtists}`, {
					artistNames: artists,
					artistCount: artists.length,
				});
		}

		Logger.debug(queryBuilder.getSql());

		const [quizzes, total] = await queryBuilder
			.innerJoinAndSelect(`${quizAlias}.owner`, "user")
			.skip(page * paginationCount)
			.take(paginationCount)
			.orderBy(`${quizAlias}.created_date`, "DESC")
			.getManyAndCount();

		return {
			data: quizzes,
			count: quizzes.length,
			total,
			page,
			pageCount:
				Math.floor(total / paginationCount) + (total % paginationCount === 0 ? 0 : 1),
		};
	}

	/**
	 *
	 * @param findOptions
	 * @returns quiz with all relations when you no config relations
	 */
	async findOne(findOptions: FindOneOptions<Quiz>): Promise<Quiz | null> {
		const defaultRelations: FindOptionsRelations<Quiz> = {
			answer_paintings: true,
			distractor_paintings: true,
			artists: true,
			example_painting: true,
			tags: true,
			styles: true,
			owner: true,
		};

		if (!findOptions.relations) {
			findOptions.relations = defaultRelations;
		}

		const quiz = await this.repo.findOne(findOptions);

		return quiz;
	}

	async getQuizById(id: string): Promise<Quiz | null> {
		const quiz = await this.repo.findOne({ where: { id } });

		return quiz;
	}

	async softDeleteQuiz(queryRunner: QueryRunner, id: string): Promise<void> {
		try {
			await createTransactionQueryBuilder(queryRunner, Quiz)
				.softDelete()
				.where("id = :id", { id })
				.execute();
			return;
		} catch (error) {
			throw new ServiceException(
				"EXTERNAL_SERVICE_FAILED",
				"INTERNAL_SERVER_ERROR",
				`Can't delete Quiz`,
				{ cause: error },
			);
		}
	}

	async increaseSubmission(id: string, submission: QuizSubmission) {
		const quiz = await this.repo.findOneOrFail({ where: { id } });
		const incorrect_count = quiz.incorrect_count + submission.incorrect_count;
		const correct_count = quiz.correct_count + submission.correct_count;
		await this.repo.update(id, {
			incorrect_count,
			correct_count,
		});
	}

	async increaseViewCount(id: string, count: number) {
		await this.repo.increment({ id }, "view_count", count);

		const quiz = await this.repo.findOneOrFail({ where: { id } });
		const view_count = quiz.view_count + count;
		await this.repo.update(id, {
			view_count,
		});
	}

	async findQuizDislikes(options: FindManyOptions<QuizDislike>): Promise<QuizDislike[]> {
		const dislikes: QuizDislike[] = await this.dislikeRepo.find(options);

		return dislikes;
	}

	async findQuizLikes(options: FindManyOptions<QuizLike>): Promise<QuizLike[]> {
		const likes: QuizLike[] = await this.likeRepo.find(options);

		return likes;
	}

	async getUserReaction(quiz_id: string, user_id: string): Promise<QuizReactionType | undefined> {
		const promiseLike = this.findQuizLikes({ where: { quiz_id, user_id } });
		const promiseDislike = this.findQuizDislikes({ where: { quiz_id, user_id } });
		const [dislikes, likes] = await Promise.all([promiseDislike, promiseLike]);
		const reaction = dislikes.length > 0 ? "dislike" : likes.length > 0 ? "like" : undefined;
		return reaction;
	}

	async likeQuiz(queryRunner: QueryRunner, user: User, quiz: Quiz): Promise<QuizLike> {
		const manager = queryRunner.manager;

		const [, existing] = await Promise.all([
			manager.delete(QuizDislike, { user, quiz }),
			manager.findOne(QuizLike, {
				where: { user_id: user.id, quiz_id: quiz.id },
			}),
		]);
		if (!existing) {
			const like = manager.create(QuizLike, { user, quiz });
			await manager.save(like);
			return like;
		}

		return existing;
	}

	async dislikeQuiz(queryRunner: QueryRunner, user: User, quiz: Quiz): Promise<QuizDislike> {
		const manager = queryRunner.manager;

		const [, existing] = await Promise.all([
			manager.delete(QuizLike, { user, quiz }),
			manager.findOne(QuizDislike, {
				where: { user_id: user.id, quiz_id: quiz.id },
			}),
		]);
		if (!existing) {
			const dislike = manager.create(QuizDislike, { user, quiz });
			await manager.save(dislike);
			return dislike;
		}

		return existing;
	}

	async removeReaction(queryRunner: QueryRunner, user: User, quiz: Quiz) {
		const manager = queryRunner.manager;
		const promiseDislike = manager.delete(QuizDislike, { user, quiz });
		const promiseLike = manager.delete(QuizLike, { user, quiz });
		await Promise.all([promiseDislike, promiseLike]);
		return;
	}

	async getQuizReactionCounts(id: string): Promise<QuizReactionCount> {
		const promiseLike = this.likeRepo.count({ where: { quiz_id: id } });
		const promiseDislike = this.dislikeRepo.count({ where: { quiz_id: id } });

		const [likeCount, dislikeCount] = await Promise.all([promiseLike, promiseDislike]);

		return { likeCount, dislikeCount };
	}

	private async insertQuiz(queryRunner: QueryRunner, quiz: Quiz): Promise<Quiz> {
		/*TODO 
      - Quiz.type 에 알맞은 그림 개수 검증필요
    */

		const relationPaintings: Painting[] = [
			...quiz.answer_paintings,
			...quiz.distractor_paintings,
		];

		if (isNotFalsy(quiz.example_painting)) {
			relationPaintings.push(quiz.example_painting);
		}

		const tagMap: Map<string, Tag> = new Map();
		const styleMap: Map<string, Style> = new Map();
		const artistMap: Map<string, Artist> = new Map();

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

		quiz.tags = [...tagMap.values()];
		quiz.styles = [...styleMap.values()];
		quiz.artists = [...artistMap.values()];

		await queryRunner.manager.save(quiz);

		const insertedQuiz = await queryRunner.manager.findOne(Quiz, {
			where: {
				id: quiz.id,
			},
			relations: {
				answer_paintings: true,
				distractor_paintings: true,
				tags: true,
				styles: true,
				artists: true,
				owner: true,
			},
		});

		assert(insertedQuiz !== null);

		return insertedQuiz!;
	}

	private async createPaintingMap(paintingIds: string[]): Promise<Map<string, Painting>> {
		const resultMap: Map<string, Painting> = new Map();
		const idSet: Set<string> = new Set(paintingIds);
		const paintings: Painting[] = await this.paintingService.getManyByIds([...idSet.values()]);

		paintings.forEach((painting) => {
			if (!resultMap.has(painting.id)) {
				resultMap.set(painting.id, painting);
			}
		});

		return resultMap;
	}

	private async getRelatedPaintings(
		relatedPaintingIds: RelatedPaintingIds,
	): Promise<RelatedPaintings> {
		/**
		 * @requires relatedPaintingIds 유효성은 호출자에서 확인해야한다.
		 */
		const { answerPaintingIds, distractorPaintingIds, examplePaintingId } = relatedPaintingIds;
		const ids: string[] = [...answerPaintingIds, ...distractorPaintingIds];
		if (isNotFalsy(examplePaintingId)) {
			ids.push(examplePaintingId);
		}
		const paintingMap: Map<string, Painting> = new Map();
		const paintings: Painting[] = await this.paintingService.getManyByIds(ids);

		paintings.forEach((painting) => {
			if (!paintingMap.has(painting.id)) {
				paintingMap.set(painting.id, painting);
			}
		});

		return {
			answerPaintings: answerPaintingIds.map((id) => paintingMap.get(id)!),
			distractorPaintings: distractorPaintingIds.map((id) => paintingMap.get(id)!),
			examplePainting: examplePaintingId ? paintingMap.get(examplePaintingId)! : undefined,
		};
	}
}
