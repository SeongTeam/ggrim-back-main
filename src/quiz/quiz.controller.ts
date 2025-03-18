import { Crud, CrudController } from '@dataui/crud';
import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Inject,
  Logger,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { existsSync } from 'fs';
import { CONFIG_FILE_PATH } from '../_common/const/default.value';
import { AWS_BUCKET, AWS_INIT_FILE_KEY_PREFIX } from '../_common/const/env-keys.const';
import { ServiceException } from '../_common/filter/exception/service/service-exception';
import { IPaginationResult } from '../_common/interface';
import { S3Service } from '../aws/s3.service';
import { getLatestMonday } from '../utils/date';
import { loadObjectFromJSON } from '../utils/json';
import { CATEGORY_VALUES } from './const';
import { SearchQuizDTO } from './dto/SearchQuiz.dto';
import { CreateQuizDTO } from './dto/create-quiz.dto';
import { GenerateQuizQueryDTO } from './dto/generate-quiz.query.dto';
import { WeeklyQuizSet } from './dto/output/weekly-quiz.dto';
import { UpdateQuizDTO } from './dto/update-quiz.dto';
import { Quiz } from './entities/quiz.entity';
import { QuizService } from './quiz.service';
import { QuizCategory } from './type';

@Crud({
  model: {
    type: Quiz,
  },
  routes: {
    only: ['getOneBase'],
  },
  params: {
    id: {
      field: 'id',
      type: 'uuid',
      primary: true,
    },
  },
  query: {
    join: {
      distractor_paintings: {
        eager: true,
      },
      answer_paintings: {
        eager: true,
      },
      example_paintings: {
        eager: true,
      },
      styles: {
        eager: true,
      },
      artists: {
        eager: true,
      },
      tags: {
        eager: true,
      },
    },
  },
})
@UsePipes(new ValidationPipe({ transform: true }))
@Controller('quiz')
export class QuizController implements CrudController<Quiz> {
  constructor(
    public service: QuizService,
    @Inject(S3Service) private readonly s3Service: S3Service,
  ) {}

  @Get('category/:key')
  async getQuizTags(@Param('key') key: string) {
    if (!CATEGORY_VALUES.includes(key as QuizCategory)) {
      throw new ServiceException(
        'BASE',
        'BAD_REQUEST',
        `${key} is not allowed.
      allowed category : ${JSON.stringify(CATEGORY_VALUES)}`,
      );
    }
    const map = await this.service.getCategoryValueMap(key as QuizCategory);
    return [...map.values()];
  }

  @Get('random')
  async generateNew(@Query() dto: GenerateQuizQueryDTO) {
    return this.service.generateQuizByValue(dto.category, dto.keyword);
  }

  /*TODO
    - DB transaction 로직 추가하기
  */
  @Post()
  async create(@Body() dto: CreateQuizDTO) {
    return this.service.createQuiz(dto);
  }

  @Put(':id')
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateQuizDTO) {
    return this.service.updateQuiz(id, dto);
  }

  @Get('')
  async searchQuiz(
    @Query() dto: SearchQuizDTO,
    @Query('page', new DefaultValuePipe(0), ParseIntPipe) page: number,
  ) {
    const paginationCount = 20;
    const data: Quiz[] = await this.service.searchQuiz(dto, page, paginationCount);

    const ret: IPaginationResult<Quiz> = {
      data,
      isMore: data.length === paginationCount,
      count: data.length,
      pagination: page,
    };

    return ret;
  }

  @Get('quiz-of-week')
  async getWeeklyArtData() {
    const latestMonday: string = getLatestMonday();
    const path = CONFIG_FILE_PATH;
    let quizFileName: string = `quiz_of_week_${latestMonday}.json`;
    if (!existsSync(path + quizFileName)) {
      Logger.error(`there is no file : ${path + quizFileName}`);
      quizFileName = `quiz_of_week_default.json`;
    }

    return loadObjectFromJSON<WeeklyQuizSet>(path + quizFileName);
  }

  @Get('init')
  async initFile(): Promise<string> {
    const latestMonday: string = getLatestMonday();
    const quizFileName: string = `quiz_of_week_${latestMonday}.json`;
    const bucketName = process.env[AWS_BUCKET] || 'no bucket';
    const prefixKey = process.env[AWS_INIT_FILE_KEY_PREFIX];

    try {
      await this.s3Service.downloadFile(
        bucketName,
        prefixKey + quizFileName,
        CONFIG_FILE_PATH + quizFileName,
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
