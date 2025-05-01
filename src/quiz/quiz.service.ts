import { TypeOrmCrudService } from '@dataui/crud-typeorm';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Mutex } from 'async-mutex';
import { FindManyOptions, QueryRunner, Repository } from 'typeorm';
import { ServiceException } from '../_common/filter/exception/service/service-exception';
import { Artist } from '../artist/entities/artist.entity';
import { createTransactionQueryBuilder } from '../db/query-runner/query-Runner.lib';
import { Painting } from '../painting/entities/painting.entity';
import { PaintingService } from '../painting/painting.service';
import { Style } from '../style/entities/style.entity';
import { Tag } from '../tag/entities/tag.entity';
import { User } from '../user/entity/user.entity';
import { extractValuesFromArray, updateProperty } from '../utils/object';
import { getRandomElement, getRandomNumber } from '../utils/random';
import { isArrayEmpty, isNotFalsy } from '../utils/validator';
import { QUIZ_TYPE_CONFIG } from './const';
import { SearchQuizDTO } from './dto/SearchQuiz.dto';
import { CreateQuizDTO } from './dto/create-quiz.dto';
import { ShortQuiz } from './dto/output/short-quiz.dto';
import { QuizReactionType } from './dto/quiz-reaction.dto';
import { QuizDTO } from './dto/quiz.dto';
import { UpdateQuizDTO } from './dto/update-quiz.dto';
import { QuizDislike } from './entities/quiz-dislike.entity';
import { QuizLike } from './entities/quiz-like.entity';
import { Quiz } from './entities/quiz.entity';
import { QuizSubmission } from './interface/quiz-Submission';
import { QuizReactionCount } from './interface/reaction-count';
import { RelatedPaintingIds, RelatedPaintings } from './interface/related-paintings.interface';
import { QuizCategory } from './type';

@Injectable()
export class QuizService extends TypeOrmCrudService<Quiz> {
  private viewMap = new Map<string, number>();
  private submissionMap = new Map<string, QuizSubmission>();
  private viewMapMutex = new Mutex();
  private submissionMapMutex = new Mutex();
  constructor(
    @InjectRepository(Quiz) repo: Repository<Quiz>,
    @Inject(PaintingService) private readonly paintingService: PaintingService,
    @InjectRepository(QuizDislike) private readonly dislikeRepo: Repository<QuizDislike>,
    @InjectRepository(QuizLike) private readonly likeRepo: Repository<QuizLike>,
  ) {
    super(repo);
  }

  async getCategoryValueMap(category: QuizCategory): Promise<Map<string, any>> {
    return await this.paintingService.getColumnValueMap(category);
  }

  async getRandomCategoryValue(category: QuizCategory): Promise<any> {
    const map: Map<string, any> = await this.getCategoryValueMap(category);
    const keys = [...map.keys()];
    const selectedKey = getRandomElement(keys);

    if (!selectedKey) {
      throw new ServiceException(
        'ENTITY_NOT_FOUND',
        'INTERNAL_SERVER_ERROR',
        `category : ${category}\n` + `maps : ${JSON.stringify(map)}`,
      );
    }

    return map.get(selectedKey);
  }

  extractCategoryValues(paintings: Painting[], category: QuizCategory): any[] {
    const values = extractValuesFromArray(paintings, category);
    const set = new Set<any>();

    if (category == 'artist') {
      const artists = values as Artist[];
      artists.forEach((artist) => set.add(artist.name));

      return [...set];
    }

    return [...set];
  }

  async generateQuizByValue(category: QuizCategory, selectedCategoryValue: any): Promise<QuizDTO> {
    await this.paintingService.validateColumnValue(category, selectedCategoryValue);
    const categoryMap = await this.getCategoryValueMap(category);

    const commonCategoryValue = selectedCategoryValue;

    const distractorPaintings = await this.selectDistractorPaintings(
      category,
      commonCategoryValue,
      QUIZ_TYPE_CONFIG.ONE_CHOICE.COUNT.DISTRACTOR,
    );

    const answerCategoryValues = this.getAnswerCategoryValues(
      category,
      distractorPaintings,
      categoryMap,
    );

    const answerPaintings = await this.getAnswerPaintings(
      category,
      answerCategoryValues,
      getRandomNumber(0, answerCategoryValues.length - 1),
    );

    const answerIdx = getRandomNumber(0, answerPaintings.length - 1);
    const answer = answerPaintings[answerIdx];
    const distractor = [...distractorPaintings];

    const ret = new QuizDTO(distractor, [answer], category, commonCategoryValue);
    this.validateQuizDto(ret, category, QUIZ_TYPE_CONFIG.ONE_CHOICE.COUNT.DISTRACTOR);

    return ret;
  }

  getAnswerCategoryValues(
    category: QuizCategory,
    distractorPaintings: Painting[],
    categoryMap: Map<string, any>,
  ): any[] {
    const distractorCategoryValues = this.extractCategoryValues(distractorPaintings, category);
    const answerCategoryValues: any[] = [];
    categoryMap.forEach((value, key) => {
      if (!distractorCategoryValues.includes(value)) {
        answerCategoryValues.push(value);
      }
    });

    return answerCategoryValues;
  }

  validateQuizDto(quizDTO: QuizDTO, category: QuizCategory, distractorCount: number) {
    const distractor = quizDTO.distractorPaintings;
    const answer = quizDTO.answerPaintings;

    if (distractor.length != distractorCount) {
      throw new ServiceException(
        'SERVICE_RUN_ERROR',
        'INTERNAL_SERVER_ERROR',
        `distractor : ${distractor.length}`,
      );
    }

    if (answer.length != QUIZ_TYPE_CONFIG.ONE_CHOICE.COUNT.ANSWER) {
      throw new ServiceException(
        'SERVICE_RUN_ERROR',
        'INTERNAL_SERVER_ERROR',
        `answer : ${answer.length}`,
      );
    }

    const distractorFields = this.extractCategoryValues(distractor, category);

    const answerFields = this.extractCategoryValues(answer, category);

    const isNoCommonValues = answerFields.every(
      (answerField) => !distractorFields.includes(answerField),
    );

    if (!isNoCommonValues) {
      throw new ServiceException(
        'SERVICE_RUN_ERROR',
        'INTERNAL_SERVER_ERROR',
        `answer has fields of distractor\n` +
          `distractorFields : ${JSON.stringify(distractorFields, null, 2)}\n` +
          `answerFields : ${JSON.stringify(answerFields, null, 2)}\n` +
          `category : ${category}`,
      );
    }
  }

  async createQuiz(queryRunner: QueryRunner, dto: CreateQuizDTO, owner: User) {
    const { answerPaintings, distractorPaintings, examplePainting } =
      await this.getRelatedPaintings({ ...dto });

    const newQuiz = new Quiz();
    newQuiz.answer_paintings = [...answerPaintings];
    newQuiz.distractor_paintings = [...distractorPaintings];
    newQuiz.type = dto.type;
    newQuiz.time_limit = dto.timeLimit;
    newQuiz.title = dto.title;
    newQuiz.example_painting = examplePainting;
    newQuiz.description = dto.description;
    newQuiz.owner_id = owner.id;
    newQuiz.owner = owner;

    return this.insertQuiz(queryRunner, newQuiz);
  }

  async updateQuiz(queryRunner: QueryRunner, id: string, dto: UpdateQuizDTO, owner: User) {
    const quiz = await this.repo.findOneByOrFail({ id });
    if (!isNotFalsy(quiz)) {
      throw new ServiceException(
        'ENTITY_NOT_FOUND',
        'BAD_REQUEST',
        `Not found quiz.\n` + `id : ${id}`,
      );
    }

    updateProperty(quiz, 'time_limit', dto.timeLimit);
    updateProperty(quiz, 'title', dto.title);
    updateProperty(quiz, 'description', dto.description);

    const { answerPaintings, distractorPaintings, examplePainting } =
      await this.getRelatedPaintings({ ...dto });
    quiz.answer_paintings = answerPaintings;
    quiz.distractor_paintings = distractorPaintings;
    quiz.example_painting = examplePainting;

    return this.insertQuiz(queryRunner, quiz);
  }

  private async selectDistractorPaintings(
    category: QuizCategory,
    commonValue: any,
    count: number,
  ): Promise<Painting[]> {
    let paintings: Painting[] = [];

    if ((category = 'artist')) {
      /*TODO
      - 동명이인 작가는 어떻게 처리할 것인가? */
      paintings = await this.paintingService.getPaintingsByArtist(commonValue);
    }

    const map = new Map<number, Painting>();
    if (paintings.length > count) {
      while (map.size != count) {
        const idx = getRandomNumber(0, paintings.length - 1);
        if (map.has(idx)) {
          continue;
        }
        map.set(idx, paintings[idx]);
      }
      return [...map.values()];
    }

    if (paintings.length < count) {
      throw new ServiceException(
        'ENTITY_NOT_FOUND',
        'BAD_REQUEST',
        `Not enough Paintings.\n` +
          `${JSON.stringify({ category, commonValue, count, paintings }, null, 2)}`,
      );
    }

    return paintings;
  }

  async searchQuiz(
    dto: SearchQuizDTO,
    page: number,
    paginationCount: number,
  ): Promise<ShortQuiz[]> {
    /*TODO 검색 로직 개선
      - [ ]각 JSON 값이 string[]인지 확인 필요.
      - [ ] 배열의 각 원소가 공백("")인지 확인 필요.
        - 공백값이 삽입되어 DB QUERY에 적용되면, 공백값과 일치하는 조건이 추가됨.
      - [ ] title, description 검색 고려하기
    */
    const { tags, styles, artists } = dto;

    const quizAlias = 'q';
    const queryBuilder = await this.repo.createQueryBuilder('q').select();

    if (!isArrayEmpty(tags)) {
      const subQueryFilterByTags = await this.repo
        .createQueryBuilder()
        .subQuery()
        .select('quiz_tags.quizId')
        .from('quiz_tags_tag', 'quiz_tags') // Many-to-Many 연결 테이블
        .innerJoin('tag', 'tag', 'tag.id = quiz_tags.tagId') // 연결 테이블과 Tag JOIN
        .where('tag.name IN (:...tagNames)') // tagNames 필터링
        .groupBy('quiz_tags.quizId')
        .having('COUNT(DISTINCT tag.id) = :tagCount') // 정확한 태그 갯수 매칭
        .getQuery();

      const alias = 't';
      const relation: keyof Quiz = 'tags';

      queryBuilder
        .innerJoinAndSelect(`${quizAlias}.${relation}`, alias)
        .andWhere(`${quizAlias}.id IN ${subQueryFilterByTags}`, {
          tagNames: tags,
          tagCount: tags.length,
        });
    }

    if (!isArrayEmpty(styles)) {
      const subQueryFilterByStyles = await this.repo
        .createQueryBuilder()
        .subQuery()
        .select('quiz_styles.quizId')
        .from('quiz_styles_style', 'quiz_styles') // Many-to-Many 연결 테이블
        .innerJoin('style', 'style', 'style.id = quiz_styles.styleId') // 연결 테이블과 Tag JOIN
        .where('style.name IN (:...styleNames)') // tagNames 필터링
        .groupBy('quiz_styles.quizId')
        .having('COUNT(DISTINCT style.id) = :styleCount') // 정확한 태그 갯수 매칭
        .getQuery();
      const alias = 's';
      const relation: keyof Quiz = 'styles';

      queryBuilder
        .innerJoinAndSelect(`${quizAlias}.${relation}`, alias)
        .andWhere(`${quizAlias}.id IN ${subQueryFilterByStyles}`, {
          styleNames: styles,
          styleCount: styles.length,
        });
    }

    if (!isArrayEmpty(artists)) {
      const subQueryFilterByArtists = await this.repo
        .createQueryBuilder()
        .subQuery()
        .select('quiz_artists.quizId')
        .from('quiz_artists_artist', 'quiz_artists') // Many-to-Many 연결 테이블
        .innerJoin('artist', 'artist', 'artist.id = quiz_artists.artistId') // 연결 테이블과 Tag JOIN
        .where('artist.name IN (:...artistNames)') // tagNames 필터링
        .groupBy('quiz_artists.quizId')
        .having('COUNT(DISTINCT artist.id) = :artistCount') // 정확한 태그 갯수 매칭
        .getQuery();

      const alias = 'a';
      const relation: keyof Quiz = 'artists';
      queryBuilder
        .innerJoinAndSelect(`${quizAlias}.${relation}`, alias)
        .andWhere(`${quizAlias}.id IN ${subQueryFilterByArtists}`, {
          artistNames: artists,
          artistCount: artists.length,
        });
    }

    Logger.debug(queryBuilder.getSql());

    const quizzes = await queryBuilder
      .skip(page * paginationCount)
      .take(paginationCount)
      .orderBy(`${quizAlias}.created_date`, 'DESC')
      .getMany();

    return quizzes.map((quiz) => new ShortQuiz(quiz));
  }

  async getQuizById(id: string): Promise<Quiz | null> {
    const quiz = await this.findOne({ where: { id } });

    return quiz;
  }

  async softDeleteQuiz(queryRunner: QueryRunner, id: string): Promise<void> {
    try {
      const result = await createTransactionQueryBuilder(queryRunner, Quiz)
        .softDelete()
        .where('id = :id', { id })
        .execute();
      return;
    } catch (error) {
      throw new ServiceException(
        'EXTERNAL_SERVICE_FAILED',
        'INTERNAL_SERVER_ERROR',
        `Can't delete Quiz`,
        { cause: error },
      );
    }
  }

  // TODO : statistic Map 기능 개선
  // [ ] : Nodejs 최대 정수값(2^53-1) overflow 고려하기
  // [ ] : Update Query에 대해 트랜잭션 고려하기.
  //  -> 트랜잭션으로 묶는 것보다, 별도의 쿼리를 여러개 보내서 병렬적으로 처리하는게 더 효과적이지 않을까?
  // [x] : 앱 종료 훅 시점에, 플러시 실패에 대응 로직 추가하기
  // [ ] : 시스템 확장시, CONNECTION_POOL_SIZE 증가도 고려하기
  //  -> : MAX CONNECTION POOL 등의 앱 메모리 및 리소스 관리 고려할 것
  // [ ] : Quiz Flush 로직 통합 또는 Redis 사용 고려하기

  async flushViewMap() {
    const key: keyof Quiz = 'view_count';
    const CONNECTION_POOL_SIZE = 5;
    const buffer: [string, number][] = await this.viewMapMutex.runExclusive(() => {
      const arr = Array.from(this.viewMap.entries());
      this.viewMap.clear();
      return arr;
    });
    const failed: [string, number][] = [];
    Logger.log(`[flushViewMap]start flush. size : ${buffer.length}`, QuizService.name);

    const groupCount = Math.ceil(buffer.length / CONNECTION_POOL_SIZE);

    for (let i = 0; i < groupCount; i++) {
      const start = i * CONNECTION_POOL_SIZE;
      const end = (i + 1) * CONNECTION_POOL_SIZE;
      const queries = buffer.slice(start, end);

      const results = await Promise.allSettled(
        queries.map(([id, number]) => this.repo.increment({ id }, key, number)),
      );
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          Logger.error(
            `flushViewMap() failed to increment id=${queries[index][0]}: ${result.reason}`,
            QuizService.name,
          );
          failed.push(queries[index]);
        }
      });
    }

    Logger.log(`[flushViewMap] end flush. failed_size : ${failed.length}`, QuizService.name);

    if (!isArrayEmpty(failed)) {
      await this.viewMapMutex.runExclusive(() => {
        failed.forEach(([id, count]) => {
          const current = this.viewMap.get(id) || 0;
          this.viewMap.set(id, current + count);
        });
      });
    }
  }

  async flushSubmissionMap() {
    const CONNECTION_POOL_SIZE = 5;
    const buffer: [string, QuizSubmission][] = await this.submissionMapMutex.runExclusive(() => {
      const arr = Array.from(this.submissionMap.entries());
      this.submissionMap.clear();
      return arr;
    });
    const failed: [string, QuizSubmission][] = [];

    Logger.log(`[flushSubmissionMap]start flush. size : ${buffer.length}`, QuizService.name);
    const groupCount = Math.ceil(buffer.length / CONNECTION_POOL_SIZE);

    for (let i = 0; i < groupCount; i++) {
      const start = i * CONNECTION_POOL_SIZE;
      const end = (i + 1) * CONNECTION_POOL_SIZE;
      const queries = buffer.slice(start, end);

      const results = await Promise.allSettled(
        queries.map(([id, submission]) => this.repo.update(id, { ...submission })),
      );

      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          Logger.error(
            `flushSubmissionMap() failed to increment id=${queries[index][0]}: ${result.reason}`,
            QuizService.name,
          );
          failed.push(queries[index]);
        }
      });
    }

    Logger.log(`[flushSubmissionMap] end flush. failed_size : ${failed.length}`, QuizService.name);

    if (!isArrayEmpty(failed)) {
      await this.submissionMapMutex.runExclusive(() => {
        failed.forEach(([id, submission]) => {
          const current = this.submissionMap.get(id) ?? new QuizSubmission();
          const next = {
            correct_count: current.correct_count + submission.correct_count,
            incorrect_count: current.incorrect_count + submission.incorrect_count,
          };
          this.submissionMap.set(id, next);
        });
      });
    }
  }
  async insertSubmission(id: string, isCorrect: boolean): Promise<void> {
    await this.submissionMapMutex.runExclusive(() => {
      const current: QuizSubmission = this.submissionMap.get(id) ?? new QuizSubmission();
      const key: keyof QuizSubmission = isCorrect ? 'correct_count' : 'incorrect_count';

      current[key] += 1;

      this.submissionMap.set(id, current);
    });
  }

  async isViewMapEmpty(): Promise<boolean> {
    return await this.viewMapMutex.runExclusive(() => this.viewMap.size === 0);
  }

  async isSubmissionMapEmpty(): Promise<boolean> {
    return await this.submissionMapMutex.runExclusive(() => this.submissionMap.size === 0);
  }

  async increaseView(id: string): Promise<void> {
    await this.viewMapMutex.runExclusive(() => {
      const current = this.viewMap.get(id) || 0;
      this.viewMap.set(id, current + 1);
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
    const reaction = dislikes.length > 0 ? 'dislike' : likes.length > 0 ? 'like' : undefined;
    return reaction;
  }

  async likeQuiz(queryRunner: QueryRunner, user: User, quiz: Quiz): Promise<QuizLike> {
    const manager = queryRunner.manager;

    const [_, existing] = await Promise.all([
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

    const [_, existing] = await Promise.all([
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
    const [dislike, like] = await Promise.all([promiseDislike, promiseLike]);
    return;
  }

  async getQuizReactionCounts(id: string): Promise<QuizReactionCount> {
    const promiseLike = this.likeRepo.count({ where: { quiz_id: id } });
    const promiseDislike = this.dislikeRepo.count({ where: { quiz_id: id } });

    const [likeCount, dislikeCount] = await Promise.all([promiseLike, promiseDislike]);

    return { likeCount, dislikeCount };
  }

  private async getAnswerPaintings(
    category: QuizCategory,
    answerCategoryValues: any[],
    valueIdx: number,
  ): Promise<Painting[]> {
    let answerPaintings: Painting[] = [];

    if (!(valueIdx > 0 && answerCategoryValues.length - 1 > valueIdx)) {
      throw new ServiceException(
        'SERVICE_RUN_ERROR',
        'INTERNAL_SERVER_ERROR',
        `valueIdx is out of range.\n` +
          `${JSON.stringify({ category, length: answerCategoryValues.length - 1, valueIdx })}`,
      );
    }

    const categoryValue = answerCategoryValues[valueIdx];

    if (category === 'artist') {
      const artist = categoryValue;
      answerPaintings = await this.paintingService.getPaintingsByArtist(artist);
    }

    return answerPaintings;
  }

  private async insertQuiz(queryRunner: QueryRunner, quiz: Quiz): Promise<Quiz> {
    /*TODO 
      - Quiz.type 에 알맞은 그림 개수 검증필요
    */

    const relationPaintings: Painting[] = [...quiz.answer_paintings, ...quiz.distractor_paintings];

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

    // return await this.repo.save(quiz);
    return await queryRunner.manager.save(quiz);
  }

  private async createPaintingMap(paintingIds: string[]): Promise<Map<string, Painting>> {
    const resultMap: Map<string, Painting> = new Map();
    const idSet: Set<string> = new Set(paintingIds);
    const paintings: Painting[] = await this.paintingService.getByIds([...idSet.values()]);

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
    const { answerPaintingIds, distractorPaintingIds, examplePaintingId } = relatedPaintingIds;
    const ids: string[] = [...answerPaintingIds, ...distractorPaintingIds];
    if (isNotFalsy(examplePaintingId)) {
      ids.push(examplePaintingId);
    }
    const idToPaintingMap: Map<string, Painting> = await this.createPaintingMap(ids);

    return {
      answerPaintings: this.resolvePaintings(relatedPaintingIds.answerPaintingIds, idToPaintingMap),
      distractorPaintings: this.resolvePaintings(
        relatedPaintingIds.distractorPaintingIds,
        idToPaintingMap,
      ),
      examplePainting: relatedPaintingIds.examplePaintingId
        ? idToPaintingMap.get(relatedPaintingIds.examplePaintingId)
        : undefined,
    };
  }
  private resolvePaintings(ids: string[], paintingMap: Map<string, Painting>): Painting[] {
    return ids.map((id) => {
      const painting = paintingMap.get(id);
      if (!painting) {
        throw new ServiceException(
          'ENTITY_NOT_FOUND',
          'BAD_REQUEST',
          `Painting not found with id: ${id}`,
        );
      }
      return painting;
    });
  }
}
