import { Crud, CrudController, CrudRequest, Override, ParsedRequest } from "@dataui/crud";
import {
	Body,
	Controller,
	DefaultValuePipe,
	Delete,
	Get,
	Inject,
	Logger,
	OnApplicationBootstrap,
	OnModuleDestroy,
	Param,
	ParseBoolPipe,
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
} from "@nestjs/common";
import { QueryRunner } from "typeorm";
import { LoggerService } from "../logger/logger.service";
import { CONFIG_FILE_PATH } from "../_common/const/default.value";
import {
	AWS_BUCKET,
	AWS_BUCKET_ARTWORK,
	AWS_INIT_FILE_KEY_PREFIX,
} from "../_common/const/envKeys.const";
import { ServiceException } from "../_common/filter/exception/service/serviceException";
import { ArtistService } from "../artist/artist.service";
import { CheckOwner } from "../auth/metadata/owner";
import { TokenAuthGuard } from "../auth/guard/authentication/tokenAuth.guard";
import { OwnerGuard } from "../auth/guard/authorization/owner.guard";
import { AuthUserPayload, AUTH_GUARD_PAYLOAD } from "../auth/guard/type/requestPayload";
import { S3Service } from "../aws/s3.service";
import { DBQueryRunner } from "../db/query-runner/decorator/queryRunner.decorator";
import { QueryRunnerInterceptor } from "../db/query-runner/queryRunner.interceptor";
import { PaintingService } from "../painting/painting.service";
import { StyleService } from "../style/style.service";
import { TagService } from "../tag/tag.service";
import { getLatestMonday } from "../utils/date";
import { SearchQuizDTO } from "./dto/request/SearchQuizDTO";
import { CreateQuizDTO } from "./dto/request/createQuizDTO";
import { DetailQuizResponse } from "./dto/response/detailQuizResponse";
import { QuizResponse } from "./dto/response/quizResponse";
import { QuizContextDTO } from "./dto/request/quizContextDTO";
import { QuizReactionDTO, QuizReactionType } from "./dto/request/quizReactionDTO";
import { QuizReactionQueryDTO } from "./dto/request/quizReactionQueryDTO";
import { ScheduleQuizQueryDTO } from "./dto/request/scheduleQuiz.QueryDTO";
import { QuizSubmitDTO } from "./dto/request/quizSubmitDTO";
import { UpdateQuizDTO } from "./dto/request/updateQuizDTO";
import { QuizDislike } from "./entities/quizDislike.entity";
import { QuizLike } from "./entities/quizLike.entity";
import { Quiz } from "./entities/quiz.entity";
import { QuizContext } from "./interface/quizContext";
import { ShortQuiz } from "./interface/shortQuiz";
import { QuizScheduleService } from "./quizSchedule.service";
import { QuizService } from "./quiz.service";
import { AuthGuardRequest } from "../auth/guard/type/AuthRequest";

@Crud({
	model: {
		type: Quiz,
	},
	routes: {
		only: ["getOneBase"],
	},
	params: {
		id: {
			field: "id",
			type: "uuid",
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
			owner: {
				eager: true,
			},
		},
	},
})
//TODO whitelist 옵션 추가하여 보안강화 고려하기
@UsePipes(new ValidationPipe({ transform: true }))
@Controller("quiz")
export class QuizController
	implements CrudController<Quiz>, OnApplicationBootstrap, OnModuleDestroy
{
	constructor(
		public service: QuizService,
		@Inject(QuizScheduleService) private readonly scheduleService: QuizScheduleService,
		@Inject(TagService) private readonly tagService: TagService,
		@Inject(StyleService) private readonly styleService: StyleService,
		@Inject(ArtistService) private readonly artistService: ArtistService,
		@Inject(PaintingService) private readonly paintingService: PaintingService,
		@Inject(S3Service) private readonly s3Service: S3Service,
		@Inject(LoggerService) private readonly logger: LoggerService,
	) {}

	async onModuleDestroy() {
		Logger.log(`[OnModuleDestroy] run `, QuizController.name);
		const MAX_RETRY = 3;
		for (let i = 0; i < MAX_RETRY; i++) {
			const isEmpty = await this.service.isViewMapEmpty();
			if (isEmpty) {
				break;
			}
			await this.service.flushViewMap();
		}

		for (let i = 0; i < MAX_RETRY; i++) {
			const isEmpty = await this.service.isSubmissionMapEmpty();
			if (isEmpty) {
				break;
			}
			await this.service.flushSubmissionMap();
		}
		Logger.log(`[OnModuleDestroy] done `, QuizController.name);
	}

	@Post("submit/:id")
	async submitQuiz(@Param("id", ParseUUIDPipe) id: string, @Body() dto: QuizSubmitDTO) {
		await this.service.insertSubmission(id, dto.isCorrect);
		return true;
	}

	@Get(":id/reactions")
	async getQuizReactions(
		@Param("id") id: string,
		@Query() dto: QuizReactionQueryDTO,
	): Promise<QuizDislike[] | QuizLike[]> {
		const pageCount = 30;

		const { page, type, user_id } = dto;

		const baseOptions = {
			take: pageCount,
			skip: page,
			where: { quiz_id: id, user_id },
			relations: ["user"],
		};

		switch (type) {
			case "dislike":
				return this.service.findQuizDislikes(baseOptions);
			case "like":
				return this.service.findQuizLikes(baseOptions);
			default:
				throw new ServiceException(
					"NOT_IMPLEMENTED",
					"NOT_IMPLEMENTED",
					"access not implemented logic",
				);
		}
	}

	@Post(":id/reaction")
	@UseGuards(TokenAuthGuard)
	@UseInterceptors(QueryRunnerInterceptor)
	async createQuizReaction(
		@DBQueryRunner() qr: QueryRunner,
		@Request() request: AuthGuardRequest,
		@Param("id") id: string,
		@Body() dto: QuizReactionDTO,
	): Promise<void> {
		const userPayload = request[AUTH_GUARD_PAYLOAD.USER]!;
		const { user } = userPayload;
		const quiz = await qr.manager.findOne(Quiz, { where: { id } });
		if (!quiz) {
			throw new ServiceException(
				`ENTITY_NOT_FOUND`,
				"BAD_REQUEST",
				`quiz ${id} is not exist`,
			);
		}

		const { type } = dto;
		if (type === "like") {
			await this.service.likeQuiz(qr, user, quiz);
		} else if (type === "dislike") {
			await this.service.dislikeQuiz(qr, user, quiz);
		} else {
			throw new ServiceException(
				"NOT_IMPLEMENTED",
				"NOT_IMPLEMENTED",
				"access not implemented logic",
			);
		}
	}

	@Delete(":id/reaction")
	@UseGuards(TokenAuthGuard)
	@UseInterceptors(QueryRunnerInterceptor)
	async deleteQuizReaction(
		@DBQueryRunner() qr: QueryRunner,
		@Request() request: AuthGuardRequest,
		@Param("id") id: string,
	): Promise<void> {
		const userPayload: AuthUserPayload = request[AUTH_GUARD_PAYLOAD.USER]!;
		const { user } = userPayload;
		const quiz = await qr.manager.findOne(Quiz, { where: { id } });
		if (!quiz) {
			throw new ServiceException(
				`ENTITY_NOT_FOUND`,
				"BAD_REQUEST",
				`quiz ${id} is not exist`,
			);
		}

		await this.service.removeReaction(qr, user, quiz);
	}

	@Get("schedule")
	async getScheduledQuiz(@Query() dto: ScheduleQuizQueryDTO): Promise<QuizResponse> {
		Logger.log(`context : `, dto.context);
		const QUIZ_PAGINATION = 20;
		const MAX_RETRY = 10;
		let attempt = 0;
		for (attempt = 0; attempt < MAX_RETRY; attempt++) {
			const context: QuizContext = await this.extractContext(dto);

			const searchDTO: SearchQuizDTO = this.buildSearchDTO(context);

			const pagination = await this.service.searchQuiz(
				searchDTO,
				context.page,
				QUIZ_PAGINATION,
			);

			const quizList: ShortQuiz[] = pagination.data;
			if (quizList.length === 0) {
				await this.scheduleService.requestDeleteContext(context);
				dto.context = undefined;
				continue;
			}

			const isContextChanged = dto.context !== context;
			const currentIndex = isContextChanged ? undefined : dto.currentIndex;

			return new QuizResponse(quizList, context, currentIndex);
		}
		throw new ServiceException(
			`SERVICE_RUN_ERROR`,
			`INTERNAL_SERVER_ERROR`,
			`No available quizzes after multiple attempts`,
		);
	}
	// TODO: 응답 객체 개선하기
	// ? 질문: context 삽입 결과를 요청자에게 알려줄 필요가있는가? 성공할 수도 실패할 수 도 있는데.
	@Post("schedule")
	async addQuizContext(@Body() dto: QuizContextDTO) {
		await this.validateQuizContextDTO(dto);

		return this.scheduleService.requestAddContext([dto]);
	}

	// TODO: Quiz 변경 로직 개선하기
	// - [x] Quiz 소유자만 변경할 수 있도록 수정하기
	// - [x] DB transaction 로직 추가하기
	// - [x] 삭제 로직 추가

	@Post()
	@UseGuards(TokenAuthGuard)
	@UseInterceptors(QueryRunnerInterceptor)
	async create(
		@DBQueryRunner() qr: QueryRunner,
		@Request() request: AuthGuardRequest,

		@Body() dto: CreateQuizDTO,
	) {
		const userPayload: AuthUserPayload = request[AUTH_GUARD_PAYLOAD.USER]!;

		return this.service.createQuiz(qr, dto, userPayload.user);
	}

	@Override("getOneBase")
	async getQuizAndIncreaseView(
		@Param("id") id: string,
		@Query("isS3Access", new DefaultValuePipe(false), ParseBoolPipe) isS3Access: boolean,
		@ParsedRequest() req: CrudRequest,
		@Query("user-id") userId: string | undefined,
	): Promise<DetailQuizResponse> {
		let quiz = await this.service.getOne(req);

		if (isS3Access) {
			quiz = await this.replaceImageSrcToS3(quiz);
		}

		const [, reactionCount] = await Promise.all([
			this.service.increaseView(id),
			this.service.getQuizReactionCounts(id),
		]);

		const userReaction: QuizReactionType | undefined = userId
			? await this.service.getUserReaction(id, userId)
			: undefined;

		// responseDTO 정의하기
		return new DetailQuizResponse(quiz, reactionCount, userReaction);
	}

	@Put(":id")
	@CheckOwner({
		serviceClass: QuizService,
		idParam: "id",
		ownerField: "owner_id",
		serviceMethod: "getQuizById",
	})
	@UseGuards(TokenAuthGuard, OwnerGuard)
	@UseInterceptors(QueryRunnerInterceptor)
	async update(
		@DBQueryRunner() qr: QueryRunner,
		@Request() request: AuthGuardRequest,
		@Param("id", ParseUUIDPipe) id: string,
		@Body() dto: UpdateQuizDTO,
	) {
		return await this.service.updateQuiz(qr, id, dto);
	}

	@Delete(":id")
	@CheckOwner({
		serviceClass: QuizService,
		idParam: "id",
		ownerField: "owner_id",
		serviceMethod: "getQuizById",
	})
	@UseGuards(TokenAuthGuard, OwnerGuard)
	@UseInterceptors(QueryRunnerInterceptor)
	async delete(@DBQueryRunner() qr: QueryRunner, @Param("id", ParseUUIDPipe) id: string) {
		return this.service.softDeleteQuiz(qr, id);
	}

	// TODO: 퀴즈 검색 로직 개선
	// - [ ] 제목으로 검색할 수 있도록 로직 추가하기
	// - [ ] <추가 작업>
	// ! 주의: <경고할 사항>
	// ? 질문: <의문점 또는 개선 방향>
	// * 참고: <관련 정보나 링크>

	@Get("")
	async searchQuiz(
		@Query() dto: SearchQuizDTO,
		@Query("page", new DefaultValuePipe(0), ParseIntPipe) page: number,
		@Query("count", new DefaultValuePipe(20), ParseIntPipe) count: number,
	) {
		const ret = await this.service.searchQuiz(dto, page, count);

		return ret;
	}

	@Get("init")
	async initFile(): Promise<string> {
		const latestMonday: string = getLatestMonday();
		const quizFileName: string = `quiz_of_week_${latestMonday}.json`;
		const bucketName = process.env[AWS_BUCKET] || "no bucket";
		const prefixKey = process.env[AWS_INIT_FILE_KEY_PREFIX];

		try {
			await this.s3Service.downloadFile(
				bucketName,
				prefixKey + quizFileName,
				CONFIG_FILE_PATH + quizFileName,
			);

			return "success init";
		} catch (err: unknown) {
			throw new ServiceException(
				"EXTERNAL_SERVICE_FAILED",
				"INTERNAL_SERVER_ERROR",
				`${this.initFile.name}() failed. need to check config`,
				{
					cause: err,
				},
			);
		}
	}

	// TODO : 퀴즈 사용자 상호작용 기능 추가
	// - [x] : 제출 퀴즈
	// - [ ] : 사용자의 퀴즈 풀이 기록
	// - [ ] : 임시 사용자의 퀴즈 풀이 기록
	// - [x] : 사용자의 퀴즈 싫어요/ 좋아요 기록

	async onApplicationBootstrap() {
		Logger.log(`[onApplicationBootstrap] run`, QuizController.name);
		const weeklyPaintings = await this.paintingService.getWeeklyPaintings();

		const fixedContexts: QuizContext[] = weeklyPaintings.map((p) => {
			return {
				artist: p.artist.name,
				page: 0,
			};
		});
		await this.scheduleService.initialize(fixedContexts);
		Logger.log(`[onApplicationBootstrap] done`, QuizController.name);
	}

	async validateQuizContextDTO(quizContext: QuizContextDTO): Promise<void> {
		const { artist, tag, style } = quizContext;
		const validations = [
			{ value: artist, service: this.artistService, entity: "artist", column: "name" },
			{ value: tag, service: this.tagService, entity: "tag", column: "name" },
			{ value: style, service: this.styleService, entity: "style", column: "name" },
		];
		for (const validation of validations) {
			const { value, service, entity } = validation;
			if (value) {
				const isFind = await service.findOneBy({ name: value });
				if (!isFind) {
					throw new ServiceException(
						"ENTITY_NOT_FOUND",
						"BAD_REQUEST",
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
				await this.validateQuizContextDTO(context);
				return context;
			}
		}
		return await this.scheduleService.scheduleContext();
	}

	private buildSearchDTO(context: QuizContext): SearchQuizDTO {
		return {
			artists: context.artist ? [context.artist] : [],
			tags: context.tag ? [context.tag] : [],
			styles: context.style ? [context.style] : [],
		};
	}

	async replaceImageSrcToS3(quiz: Quiz) {
		const bucket = process.env[AWS_BUCKET_ARTWORK];
		if (!bucket) {
			throw new ServiceException(
				"SERVICE_RUN_ERROR",
				"INTERNAL_SERVER_ERROR",
				`AWS_BUCKET_ARTWORK env is not config`,
			);
		}

		const { answer_paintings, distractor_paintings } = quiz;
		const paintings = [...answer_paintings, ...distractor_paintings];

		const urls = await Promise.all(
			paintings.map((p) => this.s3Service.getCloudFrontUrl(bucket, p.image_s3_key)),
		);

		paintings.forEach((p, idx) => {
			p.image_url = urls[idx];
		});

		quiz.answer_paintings = paintings.slice(0, answer_paintings.length);
		quiz.distractor_paintings = paintings.slice(answer_paintings.length);

		return quiz;
	}
}
