import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Inject,
  Logger,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { existsSync } from 'fs';
import { QueryRunner } from 'typeorm';
import { CONFIG_FILE_PATH } from '../_common/const/default.value';
import { AWS_BUCKET, AWS_INIT_FILE_KEY_PREFIX } from '../_common/const/env-keys.const';
import { ServiceException } from '../_common/filter/exception/service/service-exception';
import { S3Service } from '../aws/s3.service';
import { DBQueryRunner } from '../db/query-runner/decorator/query-runner.decorator';
import { QueryRunnerInterceptor } from '../db/query-runner/query-runner.interceptor';
import { getLatestMonday } from '../utils/date';
import { loadObjectFromJSON } from '../utils/json';
import { CreatePaintingDTO } from './dto/create-painting.dto';
import { FindPaintingQueryDTO } from './dto/find-painting.query.dto';
import { WeeklyArtWorkSet } from './dto/output/weekly-art.dto';
import { ReplacePaintingDTO } from './dto/replace-painting.dto';
import { SearchPaintingDTO } from './dto/search-painting.dto';
import { Painting } from './entities/painting.entity';
import { PaintingService } from './painting.service';
import { IPaginationResult } from './responseDTO';

@UsePipes(new ValidationPipe({ transform: true }))
@Controller('painting')
export class PaintingController {
  constructor(
    @Inject(PaintingService) private readonly service: PaintingService,
    @Inject(S3Service) private readonly s3Service: S3Service,
  ) {}

  @Get('/')
  async searchPainting(
    @Query() dto: SearchPaintingDTO,
    @Query('page', new DefaultValuePipe(0), ParseIntPipe) page: number,
  ) {
    const paginationCount = 50;
    const data: Painting[] = await this.service.searchPainting(dto, page, paginationCount);

    const ret: IPaginationResult<Painting> = {
      data,
      isMore: data.length === paginationCount,
      count: data.length,
      pagination: page,
    };

    return ret;
  }

  @Get('values/:columnName')
  async getColumnValues(@Param('columnName') columnName: string) {
    /*TODO
    - columnName 검증 pipe 데코레이터 구현 필요
      - PaintingTable 내에 존재하는 column 이름인지 확인 필요
    */
    const map = await this.service.getColumnValueMap(columnName as keyof Painting);

    return [...map.values()];
  }

  @Get('by-ids')
  async getById(@Query() dto: FindPaintingQueryDTO) {
    return this.service.getByIds(dto.ids);
  }

  @Post()
  @UseInterceptors(QueryRunnerInterceptor)
  async createPainting(@DBQueryRunner() queryRunner: QueryRunner, @Body() body: CreatePaintingDTO) {
    try {
      const newPaintingWithoutRelations = await this.service.create(queryRunner, body);
      return newPaintingWithoutRelations;
    } catch (error: any) {
      /*TODO
        - 비동기 함수의 에러를 캐치할수 있도록, await를 명시하도록 컨벤션을 정해야함.
         - async 함수 내에서 에러가 발생한다면, await를 하지 않는 경우, try-catch문으로 에러를 캐치할수 없다.
         - 방법1) prettier를 사용하여 promise를 처리하도록 규칙을 강제한다.
      */
      Logger.error(`[createPainting] ${JSON.stringify(error)}`);
      throw error;
    }
  }

  @Put('/:id')
  @UseInterceptors(QueryRunnerInterceptor)
  async replacePainting(
    @DBQueryRunner() queryRunner: QueryRunner,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReplacePaintingDTO,
  ) {
    const targetPainting = await this.service.findPaintingOrThrow(id);

    return this.service.replace(queryRunner, targetPainting, dto);
  }

  @Delete('/:id')
  @UseInterceptors(QueryRunnerInterceptor)
  async deletePainting(
    @DBQueryRunner() queryRunner: QueryRunner,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const targetPainting = await this.service.findPaintingOrThrow(id);
    return this.service.deleteOne(queryRunner, targetPainting);
  }
  /*TODO 
  -
  */

  @Get('art_of_week')
  async getWeeklyArtData() {
    const latestMonday: string = getLatestMonday();
    const path = CONFIG_FILE_PATH;
    let artworkFileName: string = `artwork_of_week_${latestMonday}.json`;
    if (!existsSync(path + artworkFileName)) {
      Logger.error(`there is no file : ${path + artworkFileName}`);
      artworkFileName = `artwork_of_week_default.json`;
    }

    return loadObjectFromJSON<WeeklyArtWorkSet>(path + artworkFileName);
  }

  @Get('init')
  async initFile(): Promise<string> {
    const latestMonday: string = getLatestMonday();
    const artworkFileName: string = `artwork_of_week_${latestMonday}.json`;
    const bucketName = process.env[AWS_BUCKET] || 'no bucket';
    const prefixKey = process.env[AWS_INIT_FILE_KEY_PREFIX];

    try {
      await this.s3Service.downloadFile(
        bucketName,
        prefixKey + artworkFileName,
        CONFIG_FILE_PATH + artworkFileName,
      );

      return 'success init';
    } catch (err: unknown) {
      throw new ServiceException(
        'EXTERNAL_SERVICE_FAILED',
        'INTERNAL_SERVER_ERROR',
        `${this.initFile.name}() failed. need to check config`,
        {
          cause: err,
        },
      );
    }
  }
}
