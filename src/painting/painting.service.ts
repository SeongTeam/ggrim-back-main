import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { existsSync } from 'fs';
import { Brackets, QueryRunner, Repository } from 'typeorm';
import { CONFIG_FILE_PATH } from '../_common/const/default.value';
import { ServiceException } from '../_common/filter/exception/service/service-exception';
import { IPaginationResult } from '../_common/interface';
import { ArtistService } from '../artist/artist.service';
import { Artist } from '../artist/entities/artist.entity';
import { createTransactionQueryBuilder } from '../db/query-runner/query-Runner.lib';
import { Style } from '../style/entities/style.entity';
import { StyleService } from '../style/style.service';
import { Tag } from '../tag/entities/tag.entity';
import { TagService } from '../tag/tag.service';
import { getLatestMonday } from '../utils/date';
import { loadObjectFromJSON } from '../utils/json';
import { isArrayEmpty, isFalsy, isNotFalsy } from '../utils/validator';
import { CreatePaintingDTO } from './dto/create-painting.dto';
import { WeeklyArtWorkSet } from './dto/output/weekly-art.dto';
import { ReplacePaintingDTO } from './dto/replace-painting.dto';
import { SearchPaintingDTO } from './dto/search-painting.dto';
import { Painting } from './entities/painting.entity';
import { ShortPainting } from './interface/short-painting';

@Injectable()
export class PaintingService {
  constructor(
    @InjectRepository(Painting) private readonly repo: Repository<Painting>,
    @Inject(TagService) private readonly tagService: TagService,
    @Inject(StyleService) private readonly styleService: StyleService,
    @Inject(ArtistService) private readonly artistService: ArtistService,
  ) {}

  //TODO typeorm 로직 개선
  // [ ] : returning() 메소드를 사용하여 생성 후 반환되는 열들의 값 명시하기
  //  -> insertResult.generateMaps[0]은 직접삽입한 값은 포함되지 않기 때문에 returning() 적용필요.
  async create(queryRunner: QueryRunner, dto: CreatePaintingDTO): Promise<Painting> {
    let artist: Artist | undefined = undefined;

    const query = createTransactionQueryBuilder(queryRunner, Painting)
      .insert()
      .into(Painting)
      .values([
        {
          title: dto.title,
          searchTitle: dto.title.trim().split(/\s+/).join('_').toUpperCase(),
          image_url: dto.image_url,
          description: dto.description,
          width: dto.width,
          height: dto.height,
          completition_year: dto.completition_year,
          image_s3_key: dto.image_s3_key,
          artist,
        },
      ]);

    Logger.debug(`[create] ${query.getSql()}`);
    const result = await query.execute();
    const newPainting: Painting = result.generatedMaps[0] as Painting;
    if (isNotFalsy(dto.artistName)) {
      await this.setArtist(queryRunner, newPainting, dto.artistName);
    }

    if (isNotFalsy(dto.styles) && !isArrayEmpty(dto.styles)) {
      await this.relateToStyle(queryRunner, newPainting, dto.styles);
    }

    if (isNotFalsy(dto.tags) && !isArrayEmpty(dto.tags)) {
      await this.relateToTag(queryRunner, newPainting, dto.tags);
    }

    return result.generatedMaps[0] as Painting;
  }

  // TODO: 업데이트 로직 버그 수정
  // - [ ] update() 메소드 실행 후, result.generatedMaps[0]은 Painting이 아님
  //  -> generatedMaps 필드는 쿼리 실행으로 생성된 파일의 집합이므로, 업데이트 쿼리 실행시 Painting은 생성되지 않음.

  async replace(
    queryRunner: QueryRunner,
    painting: Painting,
    dto: ReplacePaintingDTO,
  ): Promise<void> {
    const query = createTransactionQueryBuilder(queryRunner, Painting)
      .update(Painting)
      .set({
        title: dto.title,
        description: dto.description,
        image_url: dto.image_url,
        height: dto.height,
        width: dto.width,
        completition_year: dto.completition_year,
        image_s3_key: dto.image_s3_key,
        searchTitle: dto.title.trim().split(/\s+/).join('_').toUpperCase(),
      })
      .where('painting.id = :paintingId', { paintingId: painting.id });

    Logger.debug(`[PaintingService][replace] ${query.getSql()}`);
    const result = await query.execute();

    if (painting.artist && painting.artist.name !== dto.artistName) {
      await this.setArtist(queryRunner, painting, dto.artistName);
    }

    if (isNotFalsy(dto.tags)) {
      await this.relateToTag(queryRunner, painting, dto.tags);
      const tagNamesToOmit: string[] = painting.tags
        .map((tag) => tag.name)
        .filter((name) => !dto.tags.some((tagName) => tagName === name));
      await this.notRelateToTag(queryRunner, painting, tagNamesToOmit);
    }

    if (isNotFalsy(dto.styles)) {
      await this.relateToStyle(queryRunner, painting, dto.styles);
      const styleNamesToOmit: string[] = painting.styles
        .map((style) => style.name)
        .filter((name) => !dto.styles.some((styleName) => styleName === name));

      await this.notRelateToStyle(queryRunner, painting, styleNamesToOmit);
    }

    return;
  }

  /*TODO
    - 함수 동작 사양 주석 양식 만들기
  */

  async searchPainting(
    dto: SearchPaintingDTO,
    page: number,
    paginationCount: number,
  ): Promise<IPaginationResult<ShortPainting>> {
    /*TODO
    - 입력된 tag와 style이 유효한지 점검하기
    - [ ] 배열의 각 원소가 공백인지 확인 필요.
      - 공백값이 삽입되어 DB QUERY에 적용되면, 공백값과 일치하는 조건이 추가됨.
    - [ ] Join() 실행시, SELECT 쿼리가 2번 발생하는 상황 해결하기
      -> TypeORM 로직 문제이거나, 프로젝트 로직 또는 설정 문제로 고려됨
    */
    // const selectColumns: (keyof Painting)[] = ['id', 'image_url', 'height', 'width'];
    const paintingAlias = 'p';
    const queryBuilder = await this.repo.createQueryBuilder(paintingAlias);

    queryBuilder.where(`p.searchTitle like '%' || :searchTitle|| '%'`, {
      searchTitle: dto.title.trim().split(/\s+/).join('_').toUpperCase(),
    });

    if (isNotFalsy(dto.artistName) && dto.artistName.trim().length > 0) {
      const alias = 'a';
      const path: keyof Painting = 'artist';
      queryBuilder.innerJoinAndSelect(`${paintingAlias}.${path}`, alias).andWhere(
        new Brackets((qb) => {
          qb.where(`${alias}.name = :artistName`, {
            artistName: dto.artistName,
          });
        }),
      );
    }

    if (!isArrayEmpty(dto.tags)) {
      const subQueryFilterByTag = await this.repo
        .createQueryBuilder()
        .subQuery()
        .select('painting_tags.paintingId')
        .from('painting_tags_tag', 'painting_tags') // Many-to-Many 연결 테이블
        .innerJoin('tag', 'tag', 'tag.id = painting_tags.tagId') // 연결 테이블과 Tag JOIN
        .where('tag.name IN (:...tagNames)') // tagNames 필터링
        .groupBy('painting_tags.paintingId')
        .having('COUNT(DISTINCT tag.id) = :tagCount') // 정확한 태그 갯수 매칭
        .getQuery();

      const alias = 't';
      const path: keyof Painting = 'tags';
      queryBuilder
        .innerJoinAndSelect(`${paintingAlias}.${path}`, alias)
        .andWhere(`p.id IN ${subQueryFilterByTag}`, {
          tagNames: dto.tags,
          tagCount: dto.tags.length,
        });
    }

    if (!isArrayEmpty(dto.styles)) {
      const subQueryFilterByStyle = await this.repo
        .createQueryBuilder()
        .subQuery()
        .select('painting_styles.paintingId')
        .from('painting_styles_style', 'painting_styles') // Many-to-Many 연결 테이블
        .innerJoin('style', 'style', 'style.id = painting_styles.styleId')
        .where('style.name IN (:...styleNames)')
        .groupBy('painting_styles.paintingId')
        .having('COUNT(DISTINCT style.id) = :styleCount')
        .getQuery();

      const alias = 's';
      const path: keyof Painting = 'styles';
      queryBuilder
        .innerJoinAndSelect(`${paintingAlias}.${path}`, alias)
        .andWhere(`p.id IN ${subQueryFilterByStyle}`, {
          styleNames: dto.styles,
          styleCount: dto.styles.length,
        });
    }

    const [paintings, total] = await queryBuilder
      .skip(page * paginationCount)
      .take(paginationCount)
      .orderBy('p.created_date', 'DESC')
      .getManyAndCount();

    const data = paintings.map((p) => new ShortPainting(p));

    return {
      data,
      count: data.length,
      total,
      page,
      pageCount: Math.floor(total / paginationCount) + (total % paginationCount === 0 ? 0 : 1),
    };
  }
  async getPaintingsByArtist(artistName: string) {
    const result = await this.repo
      .createQueryBuilder('p')
      .innerJoinAndSelect('p.artist', 'artist')
      .innerJoinAndSelect('p.tags', 'tag')
      .innerJoinAndSelect('p.styles', 'style')
      .where('artist.name  = :artist', {
        artist: artistName,
      })
      .getMany();
    return result;
  }

  async getPaintingsByTags(tagNames: string[]) {
    if (tagNames.length === 0) {
      return []; // 빈 배열이 들어오면 빈 결과 반환
    }

    const paintings = await this.repo
      .createQueryBuilder('painting')
      .innerJoinAndSelect('painting.artist', 'artist')
      .innerJoinAndSelect('painting.tags', 'tag')
      .innerJoinAndSelect('painting.styles', 'style')
      .where((qb) => {
        // 서브쿼리 사용
        const subQuery = qb
          .subQuery()
          .select('painting_tags.paintingId')
          .from('painting_tags_tag', 'painting_tags') // Many-to-Many 연결 테이블
          .innerJoin('tag', 'tag', 'tag.id = painting_tags.tagId') // 연결 테이블과 Tag JOIN
          .where('tag.name IN (:...tagNames)', { tagNames }) // tagNames 필터링
          .groupBy('painting_tags.paintingId')
          .having('COUNT(DISTINCT tag.id) = :tagCount') // 정확한 태그 갯수 매칭
          .getQuery();
        return `painting.id IN ${subQuery}`;
      })
      .setParameter('tagCount', tagNames.length) // 태그 갯수 설정
      .getMany();

    return paintings;
  }

  /**
   * - [] 중에서 0번째 index중 큰 순서로 이동 중에 DB에 없는 ID가 있으면 에러 발생
   * - 에러가 발생 ID를 console에 출력해 줌 (typeorm 자체 기능)
   */
  async getByIds(ids: string[]): Promise<Painting[]> {
    const query = this.repo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.tags', 'tags')
      .leftJoinAndSelect('p.styles', 'styles')
      .leftJoinAndSelect('p.artist', 'artist')
      .where('p.id IN (:...ids)', { ids });

    Logger.debug(query.getSql());

    const paintings: Painting[] = await query.getMany();

    if (paintings.length !== ids.length) {
      const foundIds = paintings.map((p) => p.id);
      const notFoundIds = ids.filter((id) => !foundIds.includes(id));

      throw new ServiceException(
        'ENTITY_NOT_FOUND',
        'BAD_REQUEST',
        `Can Not found ids : ${JSON.stringify(notFoundIds)}`,
      );
    }
    return paintings;
  }

  validatePaintingEntity(painting: Painting): boolean {
    if (!painting) return false;

    if (!painting.id) return false;

    return true;
  }

  async getColumnValueMap(column: keyof Painting): Promise<Map<string, any>> {
    const map = new Map<string, any>();

    if (column === 'artist') {
      const artists = await this.artistService.getArtistsHavingPainting();

      artists.forEach((artist) => {
        if (!map.has(artist.id)) {
          map.set(artist.id, artist.name);
        }
      });
    }

    if (column === 'tags') {
      const tags = await this.tagService.getTagsRelatedToPainting();
      tags.forEach((tag) => {
        if (!map.has(tag.id)) {
          map.set(tag.id, tag.name);
        }
      });
    }

    if (column === 'styles') {
      const styles = await this.styleService.getStylesRelatedToPainting();
      styles.forEach((style) => {
        if (!map.has(style.id)) {
          map.set(style.id, style.name);
        }
      });
    }

    return map;
  }

  async validateColumnValue(column: keyof Painting, value: any) {
    if (column === 'artist') {
      this.artistService.validateName(value);
    }
  }

  async relateToTag(
    queryRunner: QueryRunner,
    painting: Painting,
    tagNames: string[],
  ): Promise<void> {
    let tagNamesToAdd: string[] = [...tagNames];

    if (isNotFalsy(painting.tags)) {
      tagNamesToAdd = tagNames.filter((name) => !painting.tags.some((tag) => tag.name === name));
    }

    if (isArrayEmpty(tagNamesToAdd)) {
      return;
    }

    const tags: Tag[] = await this.getTagsByName(tagNames);

    const query = createTransactionQueryBuilder(queryRunner, Painting)
      .relation(Painting, 'tags')
      .of(painting);

    Logger.debug(`[insert tag] : ${query.getSql()}`);

    await query.add(tags);
  }

  async notRelateToTag(queryRunner: QueryRunner, painting: Painting, tagNames: string[]) {
    const tags: Tag[] = await this.getTagsByName(tagNames);
    const query = createTransactionQueryBuilder(queryRunner, Painting)
      .relation(Painting, 'tags')
      .of(painting);

    await query.remove(tags);
  }

  async relateToStyle(
    queryRunner: QueryRunner,
    painting: Painting,
    styleNames: string[],
  ): Promise<void> {
    let styleNamesToAdd: string[] = [...styleNames];

    if (isNotFalsy(painting.styles)) {
      styleNamesToAdd = styleNames.filter(
        (name) => !painting.styles.some((style) => style.name === name),
      );
    }

    if (isArrayEmpty(styleNamesToAdd)) {
      return;
    }

    const stylesToAdd: Style[] = await this.getStylesByName(styleNames);

    const query = createTransactionQueryBuilder(queryRunner, Painting)
      .relation(Painting, 'styles')
      .of(painting);

    Logger.debug(`[insert styles] : ${query.getSql()}`);

    await query.add(stylesToAdd);
  }

  async notRelateToStyle(
    queryRunner: QueryRunner,
    painting: Painting,
    styleNames: string[],
  ): Promise<void> {
    const stylesToOmit: Style[] = await this.getStylesByName(styleNames);

    const query = createTransactionQueryBuilder(queryRunner, Painting)
      .relation(Painting, 'styles')
      .of(painting);

    await query.remove(stylesToOmit);
  }

  async setArtist(queryRunner: QueryRunner, painting: Painting, artistName: string | undefined) {
    const query = createTransactionQueryBuilder(queryRunner, Painting)
      .relation(Painting, 'artist')
      .of(painting);

    if (isFalsy(artistName)) {
      await query.set(null);
      return;
    }

    const artists = await this.artistService.find({
      where: { name: artistName },
    });

    if (artists.length > 1) {
      throw new ServiceException(
        'DB_INCONSISTENCY',
        'INTERNAL_SERVER_ERROR',
        `${artistName} is multiple.\n
      ${JSON.stringify(artists, null, 2)}`,
      );
    }

    if (isArrayEmpty(artists)) {
      throw new ServiceException(
        'ENTITY_NOT_FOUND',
        'BAD_REQUEST',
        `not found artist : ${artistName}`,
      );
    }
    const artist: Artist = artists[0];

    await query.set(artist);
  }

  async getStylesByName(styleNames: string[]): Promise<Style[]> {
    const delimiter = ', ';

    const styles: Style[] = [];
    const finds = await this.styleService.findManyByName(styleNames);
    styles.push(...finds);

    if (styleNames.length !== styles.length) {
      const stylesFounded = styles.map((style) => style.name);
      const stylesNotFounded = styleNames.filter((name) => !stylesFounded.includes(name));
      throw new ServiceException(
        'ENTITY_NOT_FOUND',
        'BAD_REQUEST',
        `not found styles : ${stylesNotFounded.join(delimiter)}`,
      );
    }

    return styles;
  }

  async getTagsByName(tagNames: string[]): Promise<Tag[]> {
    const funcName = this.notRelateToTag.name;
    const delimiter = ', ';
    const tags: Tag[] = [];

    const finds = await this.tagService.findManyByName(tagNames);
    tags.push(...finds);

    if (tagNames.length !== tags.length) {
      const tagsFounded = tags.map((tag) => tag.name);
      const tagsNotFounded = tagNames.filter((name) => !tagsFounded.includes(name));
      throw new ServiceException(
        'ENTITY_NOT_FOUND',
        'BAD_REQUEST',
        `[${funcName}]not found tags : ${tagsNotFounded.join(delimiter)}`,
      );
    }
    return tags;
  }

  async deleteOne(queryRunner: QueryRunner, painting: Painting) {
    const query = createTransactionQueryBuilder(queryRunner, Painting)
      .softDelete()
      .from(Painting)
      .where('id = :idToDeleted', { idToDeleted: painting.id });

    Logger.debug(`[deleteOne] ${query.getSql()}`);

    const result = await query.execute();

    return result.affected;
  }

  public async findPaintingOrThrow(id: string): Promise<Painting> {
    const painting = (await this.getByIds([id]))[0];
    if (isFalsy(painting)) {
      throw new ServiceException(
        'ENTITY_NOT_FOUND',
        'BAD_REQUEST',
        `not found painting. id : ${id}\n`,
      );
    }
    return painting;
  }

  public async getWeeklyPaintings() {
    const latestMonday = getLatestMonday();
    const path = CONFIG_FILE_PATH;
    let artworkFileName: string = `artwork_of_week_${latestMonday}.json`;

    if (!existsSync(path + artworkFileName)) {
      Logger.error(`there is no file : ${path + artworkFileName}`);
      artworkFileName = `artwork_of_week_default.json`;
    }
    const obj = loadObjectFromJSON<WeeklyArtWorkSet>(path + artworkFileName);

    const paintingIdSet = new Set<string>();
    obj.data.forEach((data) => {
      const id = data.painting.id;
      if (id && id.trim().length > 0) {
        paintingIdSet.add(id);
      }
    });

    if (paintingIdSet.size == 0) {
      throw Error('Weekly Paintings must exist ');
    }
    const MAX_LENGTH = 20;
    if (paintingIdSet.size > MAX_LENGTH) {
      throw Error(`Weekly Paintings must lower than ${MAX_LENGTH}`);
    }

    //validate set
    const validPaintings = await this.getByIds([...paintingIdSet.values()]);

    return validPaintings;
  }
}
