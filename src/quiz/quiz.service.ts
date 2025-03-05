import { TypeOrmCrudService } from '@dataui/crud-typeorm';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceException } from '../_common/filter/exception/service/service-exception';
import { Artist } from '../artist/entities/artist.entity';
import { Style } from '../painting/child-module/style/entities/style.entity';
import { Tag } from '../painting/child-module/tag/entities/tag.entity';
import { Painting } from '../painting/entities/painting.entity';
import { PaintingService } from '../painting/painting.service';
import { extractValuesFromArray, updateProperty } from '../utils/object';
import { getRandomElement, getRandomNumber } from '../utils/random';
import { isNotFalsy } from '../utils/validator';
import { QUIZ_TYPE_CONFIG } from './const';
import { SearchQuizDTO } from './dto/SearchQuiz.dto';
import { CreateQuizDTO } from './dto/create-quiz.dto';
import { QuizDTO } from './dto/quiz.dto';
import { UpdateQuizDTO } from './dto/update-quiz.dto';
import { Quiz } from './entities/quiz.entity';
import { RelatedPaintingIds, RelatedPaintings } from './interface/related-paintings.interface';
import { QuizCategory } from './type';

@Injectable()
export class QuizService extends TypeOrmCrudService<Quiz> {
  constructor(
    @InjectRepository(Quiz) repo: Repository<Quiz>,
    @Inject(PaintingService) private readonly paintingService: PaintingService,
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

  async createQuiz(dto: CreateQuizDTO) {
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

    return this.insertQuiz(newQuiz);
  }

  async updateQuiz(id: string, dto: UpdateQuizDTO) {
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

    return this.insertQuiz(quiz);
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

  async searchQuiz(dto: SearchQuizDTO, page: number, paginationCount: number) {
    /*TODO
      - [ ]각 JSON 값이 string[]인지 확인 필요.
      - [ ] 배열의 각 원소가 공백("")인지 확인 필요.
        - 공백값이 삽입되어 DB QUERY에 적용되면, 공백값과 일치하는 조건이 추가됨.
    */
    const tags = JSON.parse(dto.tags) as string[];
    const styles = JSON.parse(dto.styles) as string[];
    const artists = JSON.parse(dto.artist) as string[];

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

    /*TODO
        - JOIN 횟수가 성능에 끼치는 영향 정도를 점검하기
          => 영향이 크면, 최적화 진행하기
      */
    const mainQuery = await this.repo
      .createQueryBuilder('quiz')
      .leftJoinAndSelect('quiz.tags', 'tag')
      .leftJoinAndSelect('quiz.styles', 'style')
      .leftJoinAndSelect('quiz.artists', 'artist')
      .leftJoinAndSelect('quiz.answer_paintings', 'answer_paintings')
      .leftJoinAndSelect('quiz.distractor_paintings', 'distractor_paintings')
      .leftJoinAndSelect('quiz.example_painting', 'example_painting');

    if (tags.length > 0) {
      mainQuery.andWhere(`quiz.id IN ${subQueryFilterByTags}`, {
        tagNames: tags,
        tagCount: tags.length,
      });
    }

    if (styles.length > 0) {
      mainQuery.andWhere(`quiz.id IN ${subQueryFilterByStyles}`, {
        styleNames: styles,
        styleCount: styles.length,
      });
    }

    if (artists.length > 0) {
      mainQuery.andWhere(`quiz.id IN ${subQueryFilterByArtists}`, {
        artistNames: artists,
        artistCount: artists.length,
      });
    }

    Logger.debug(mainQuery.getSql());

    const result = mainQuery
      .skip(page * paginationCount)
      .take(paginationCount)
      .getMany();

    return result;
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

  private async insertQuiz(quiz: Quiz) {
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

    return await this.repo.save(quiz);
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
