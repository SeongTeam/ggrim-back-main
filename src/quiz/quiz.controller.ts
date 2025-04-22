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
  Request,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { QueryRunner } from 'typeorm';
import { CONFIG_FILE_PATH } from '../_common/const/default.value';
import { AWS_BUCKET, AWS_INIT_FILE_KEY_PREFIX } from '../_common/const/env-keys.const';
import { ServiceException } from '../_common/filter/exception/service/service-exception';
import { IPaginationResult } from '../_common/interface';
import { ArtistService } from '../artist/artist.service';
import { CheckOwner } from '../auth/decorator/owner';
import { TokenAuthGuard } from '../auth/guard/authentication/token-auth.guard';
import { OwnerGuard } from '../auth/guard/authorization/owner.guard';
import { AuthUserPayload, ENUM_AUTH_CONTEXT_KEY } from '../auth/guard/type/request-payload';
import { S3Service } from '../aws/s3.service';
import { DBQueryRunner } from '../db/query-runner/decorator/query-runner.decorator';
import { QueryRunnerInterceptor } from '../db/query-runner/query-runner.interceptor';
import { PaintingService } from '../painting/painting.service';
import { StyleService } from '../style/style.service';
import { TagService } from '../tag/tag.service';
import { getLatestMonday } from '../utils/date';
import { CATEGORY_VALUES } from './const';
import { SearchQuizDTO } from './dto/SearchQuiz.dto';
import { CreateQuizDTO } from './dto/create-quiz.dto';
import { GenerateQuizQueryDTO } from './dto/generate-quiz.query.dto';
import { ResponseQuizDTO } from './dto/output/response-schedule-quiz.dto';
import { QuizContextDTO } from './dto/quiz-context.dto';
import { ScheduleQuizQueryDTO } from './dto/schedule-quiz.query.dto';
import { UpdateQuizDTO } from './dto/update-quiz.dto';
import { Quiz } from './entities/quiz.entity';
import { QuizContext } from './interface/quiz-context';
import { QuizScheduleService } from './quiz-schedule.service';
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
//TODO whitelist 옵션 추가하여 보안강화 고려하기
@UsePipes(new ValidationPipe({ transform: true }))
@Controller('quiz')
export class QuizController implements CrudController<Quiz> {
  constructor(
    public service: QuizService,
    @Inject(QuizScheduleService) private readonly scheduleService: QuizScheduleService,
    @Inject(TagService) private readonly tagService: TagService,
    @Inject(StyleService) private readonly styleService: StyleService,
    @Inject(ArtistService) private readonly artistService: ArtistService,
    @Inject(PaintingService) private readonly paintingService: PaintingService,
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

  @Get('quizContext')
  async getQuizContext(
    @Query()
    dto: QuizContextDTO,
  ) {
    Logger.log('test api:' + JSON.stringify(dto));
    // const classInstance = plainToInstance(QuizContextDTO, dto, { enableImplicitConversion: true });
    // Logger.log('transformation :' + JSON.stringify(classInstance));
    return dto;
  }

  @Get('schedule')
  async getScheduledQuiz(@Query() dto: ScheduleQuizQueryDTO): Promise<ResponseQuizDTO> {
    Logger.log(`context : `, dto.context);
    const QUIZ_PAGINATION = 20;
    const MAX_RETRY = 10;
    let attempt = 0;
    for (attempt = 0; attempt < MAX_RETRY; attempt++) {
      const context: QuizContext = await this.extractContext(dto);

      const searchDTO: SearchQuizDTO = await this.buildSearchDTO(context);

      const quizList: Quiz[] = await this.service.searchQuiz(
        searchDTO,
        context.page,
        QUIZ_PAGINATION,
      );
      if (quizList.length === 0) {
        await this.scheduleService.requestDeleteContext(context);
        dto.context = undefined;
        continue;
      }

      const isContextChanged = dto.context !== context;
      const currentIndex = isContextChanged ? undefined : dto.currentIndex;

      return new ResponseQuizDTO(quizList, context, currentIndex);
    }
    throw new ServiceException(
      `SERVICE_RUN_ERROR`,
      `INTERNAL_SERVER_ERROR`,
      `No available quizzes after multiple attempts`,
    );
  }
  // TODO: 응답 객체 개선하기
  // ? 질문: context 삽입 결과를 요청자에게 알려줄 필요가있는가? 성공할 수도 실패할 수 도 있는데.
  @Post('schedule')
  async addQuizContext(@Body() dto: QuizContextDTO) {
    this.validateQuizContextDTO(dto);

    return this.scheduleService.requestAddContext([dto]);
  }

  // TODO: Quiz 변경 로직 개선하기
  // - [x] Quiz 소유자만 변경할 수 있도록 수정하기
  // - [x] DB transaction 로직 추가하기
  // - [ ] 삭제 로직 추가

  @Post()
  @UseGuards(TokenAuthGuard)
  @UseInterceptors(QueryRunnerInterceptor)
  async create(
    @DBQueryRunner() qr: QueryRunner,
    @Request() request: any,

    @Body() dto: CreateQuizDTO,
  ) {
    const userPayload: AuthUserPayload = request[ENUM_AUTH_CONTEXT_KEY.USER];

    return this.service.createQuiz(qr, dto, userPayload.user);
  }

  @Put(':id')
  @CheckOwner({
    serviceClass: QuizService,
    idParam: 'id',
    ownerField: 'owner_id',
    serviceMethod: 'getQuizById',
  })
  @UseGuards(TokenAuthGuard, OwnerGuard)
  @UseInterceptors(QueryRunnerInterceptor)
  async update(
    @DBQueryRunner() qr: QueryRunner,
    @Request() request: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateQuizDTO,
  ) {
    const userPayload: AuthUserPayload = request[ENUM_AUTH_CONTEXT_KEY.USER];
    return this.service.updateQuiz(qr, id, dto, userPayload.user);
  }

  // TODO: 퀴즈 검색 로직 개선
  // - [ ] 제목으로 검색할 수 있도록 로직 추가하기
  // - [ ] <추가 작업>
  // ! 주의: <경고할 사항>
  // ? 질문: <의문점 또는 개선 방향>
  // * 참고: <관련 정보나 링크>

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

  // TODO : 퀴즈 사용자 상호작용 기능 추가
  // - [ ] : 제출 퀴즈
  // - [ ] : 사용자의 퀴즈 풀이 기록
  // - [ ] : 임시 사용자의 퀴즈 풀이 기록
  // - [ ] : 사용자의 퀴즈 싫어요/ 좋아요 기록

  async initialize() {
    const weeklyPaintings = await this.paintingService.getWeeklyPaintings();

    const fixedContexts: QuizContext[] = weeklyPaintings.map((p) => {
      return {
        artist: p.artist.name,
        page: 0,
      };
    });
    this.scheduleService.initialize(fixedContexts);
  }

  async validateQuizContextDTO(quizContext: QuizContextDTO): Promise<void> {
    const { artist, tag, style } = quizContext;
    const validations = [
      { value: artist, service: this.artistService, entity: 'artist', column: 'name' },
      { value: tag, service: this.tagService, entity: 'tag', column: 'name' },
      { value: style, service: this.styleService, entity: 'style', column: 'name' },
    ];
    for (const validation of validations) {
      const { value, service, entity } = validation;
      if (value) {
        const isFind = await service.findOneBy({ name: value });
        if (!isFind) {
          throw new ServiceException(
            'ENTITY_NOT_FOUND',
            'BAD_REQUEST',
            `${value} is not validate to ${entity}`,
          );
        }
      }
    }
  }

  private async extractContext(dto: ScheduleQuizQueryDTO): Promise<QuizContext> {
    const { context, currentIndex, endIndex } = dto;
    if (context && currentIndex && endIndex) {
      if (currentIndex !== endIndex) {
        this.validateQuizContextDTO(context);
        return context;
      }
    }
    return await this.scheduleService.scheduleContext();
  }

  private buildSearchDTO(context: QuizContext): SearchQuizDTO {
    return {
      artist: JSON.stringify(context.artist ? [context.artist] : []),
      tags: JSON.stringify(context.tag ? [context.tag] : []),
      styles: JSON.stringify(context.style ? [context.style] : []),
    };
  }
}
