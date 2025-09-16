import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Inject,
	Logger,
	OnApplicationBootstrap,
	OnModuleDestroy,
	Param,
	ParseUUIDPipe,
	Post,
	Put,
	Query,
	Req,
	UseInterceptors,
} from "@nestjs/common";
import { QueryRunner } from "typeorm";
import { LoggerService } from "../logger/logger.service";
import { AWS_BUCKET_ARTWORK, NODE_ENV } from "../_common/const/envKeys";
import { ServiceException } from "../_common/filter/exception/service/serviceException";
import { ArtistService } from "../artist/artist.service";
import { TokenAuthGuard } from "../auth/guard/authentication/tokenAuth.guard";
import { AuthUserPayload } from "../auth/guard/types/requestPayload";
import { AUTH_GUARD_PAYLOAD } from "../auth/guard/const";
import { S3Service } from "../aws/s3.service";
import { DBQueryRunner } from "../db/query-runner/decorator/queryRunner";
import { QueryRunnerInterceptor } from "../db/query-runner/queryRunner.interceptor";
import { PaintingService } from "../painting/painting.service";
import { StyleService } from "../style/style.service";
import { TagService } from "../tag/tag.service";
import { SearchQuizQueryDTO } from "./dto/request/searchQuiz.query.dto";
import { CreateQuizDTO } from "./dto/request/createQuiz.dto";
import { DetailQuizResponse } from "./dto/response/detailQuiz.response";
import { ScheduleQuizResponse } from "./dto/response/scheduleQuiz.response";
import { QuizContextDTO } from "./dto/request/quizContext.dto";
import { CreateQuizReactionDTO } from "./dto/request/createQuizReaction.dto";
import { QuizReactionType } from "./const";
import { QuizReactionQueryDTO } from "./dto/request/getQuizReaction.query.dto";
import { ScheduleQuizQueryDTO } from "./dto/request/scheduleQuiz.query.dto";
import { SubmitQuizDTO } from "./dto/request/submitQuiz.dto";
import { ReplaceQuizDTO } from "./dto/request/replaceQuiz.dto";
import { Quiz } from "./entities/quiz.entity";
import { QuizContext } from "./schedule/type";
import { QuizScheduleService } from "./schedule/quizSchedule.service";
import { QuizService } from "./quiz.service";
import { Request } from "express";
import { Pagination } from "../_common/types";
import { ApiPaginationResponse } from "../_common/decorator/swagger/apiPaginationResponse";
import { ShowQuiz, ShowQuizResponse } from "./dto/response/showQuiz.response";
import { UseOwnerGuard } from "../auth/guard/decorator/authorization";
import { UseTokenAuthGuard } from "../auth/guard/decorator/authentication";
import { GetQuizQueryDTO } from "./dto/request/getQuiz.query.dto";
import { ShowQuizReactionResponse } from "./dto/response/showQuizReaction.response";
import { ConfigService } from "@nestjs/config";
import { ApiCreatedResponse, ApiOkResponse, ApiQuery } from "@nestjs/swagger";
import { QuizBatchService } from "./batch/quiz.batch.service";

//TODO whitelist 옵션 추가하여 보안강화 고려하기
@Controller("quiz")
export class QuizController implements OnApplicationBootstrap, OnModuleDestroy {
	constructor(
		public service: QuizService,
		@Inject(QuizScheduleService) private readonly scheduleService: QuizScheduleService,
		@Inject(TagService) private readonly tagService: TagService,
		@Inject(StyleService) private readonly styleService: StyleService,
		@Inject(ArtistService) private readonly artistService: ArtistService,
		@Inject(PaintingService) private readonly paintingService: PaintingService,
		@Inject(S3Service) private readonly s3Service: S3Service,
		@Inject(LoggerService) private readonly logger: LoggerService,
		@Inject(ConfigService) private configService: ConfigService,
		@Inject(QuizBatchService) private batchService: QuizBatchService,
	) {}

	async onModuleDestroy() {
		Logger.log(`[OnModuleDestroy] run `, QuizController.name);
		const MAX_RETRY = 3;
		for (let i = 0; i < MAX_RETRY; i++) {
			const isEmpty = await this.batchService.isViewMapEmpty();
			if (isEmpty) {
				break;
			}
			await this.batchService.flushViewMap();
		}

		for (let i = 0; i < MAX_RETRY; i++) {
			const isEmpty = await this.batchService.isSubmissionMapEmpty();
			if (isEmpty) {
				break;
			}
			await this.batchService.flushSubmissionMap();
		}
		Logger.log(`[OnModuleDestroy] done `, QuizController.name);
	}

	@HttpCode(HttpStatus.CREATED)
	@Post("submit/:id")
	async submitQuiz(@Param("id", ParseUUIDPipe) id: string, @Body() dto: SubmitQuizDTO) {
		const target = await this.service.findOne({ where: { id } });

		if (!target) {
			throw new ServiceException("ENTITY_NOT_FOUND", "BAD_REQUEST");
		}

		await this.batchService.insertSubmission(target.id, dto.isCorrect);
	}

	@ApiOkResponse({ type: ShowQuizReactionResponse, isArray: true })
	@HttpCode(HttpStatus.OK)
	@Get(":id/reactions")
	async getQuizReactions(
		@Param("id", ParseUUIDPipe) id: string,
		@Query() dto: QuizReactionQueryDTO,
	): Promise<ShowQuizReactionResponse[]> {
		const target = await this.service.findOne({ where: { id } });

		if (!target) {
			throw new ServiceException("ENTITY_NOT_FOUND", "BAD_REQUEST");
		}

		const pageCount = 30;

		const { page } = dto;

		const baseOptions = {
			take: pageCount,
			skip: page,
			where: { quiz_id: target.id },
			relations: ["user"],
		};

		const [likes, dislikes] = await Promise.all([
			this.service.findQuizLikes(baseOptions),
			this.service.findQuizDislikes(baseOptions),
		]);

		const res = [
			...likes.map((lk) => new ShowQuizReactionResponse(lk)),
			...dislikes.map((dlk) => new ShowQuizReactionResponse(dlk)),
		];

		return res;
	}

	@HttpCode(HttpStatus.CREATED)
	@UseTokenAuthGuard()
	@UseInterceptors(QueryRunnerInterceptor)
	@Post(":id/reaction")
	async createQuizReaction(
		@DBQueryRunner() qr: QueryRunner,
		@Req() request: Request,
		@Param("id", ParseUUIDPipe) id: string,
		@Body() dto: CreateQuizReactionDTO,
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
		} else {
			await this.service.dislikeQuiz(qr, user, quiz);
		}
	}

	@HttpCode(HttpStatus.OK)
	@UseTokenAuthGuard()
	@UseInterceptors(QueryRunnerInterceptor)
	@Delete(":id/reaction")
	async deleteQuizReaction(
		@DBQueryRunner() qr: QueryRunner,
		@Req() request: Request,
		@Param("id", ParseUUIDPipe) id: string,
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

	@ApiQuery({
		name: "currentIndex",
		required: false,
		description:
			"all fields exist. service handle query as all fields not exist same time when one of fields is missed",
		examples: {
			"All fields Exist": {
				currentIndex: 0,
				endIndex: 0,
				context: {
					artist: "example artist",
					page: 0,
				},
			},
			"All fields not exist": {},
		},
	})
	@ApiOkResponse({ type: ScheduleQuizResponse })
	@HttpCode(HttpStatus.OK)
	@Get("schedule")
	async getScheduledQuiz(
		@Query()
		query: ScheduleQuizQueryDTO,
	): Promise<ScheduleQuizResponse> {
		const MAX_RETRY = 10;
		let attempt = 0;
		for (attempt = 0; attempt < MAX_RETRY; attempt++) {
			const context: QuizContext = await this.extractContext(query);

			const search = this.buildSearchDTO(context, context.page);

			const pagination = await this.service.searchQuiz(search);

			const quizList: ShowQuiz[] = pagination.data.map((q) => new ShowQuiz(q));
			if (quizList.length === 0) {
				await this.scheduleService.requestDeleteContext(context);
				query.context = undefined;
				continue;
			}

			return new ScheduleQuizResponse(quizList, context);
		}
		throw new ServiceException(
			`SERVICE_RUN_ERROR`,
			`INTERNAL_SERVER_ERROR`,
			`No available quizzes after multiple attempts`,
		);
	}
	// TODO: 응답 객체 개선하기
	// ? 질문: context 삽입 결과를 요청자에게 알려줄 필요가있는가? 성공할 수도 실패할 수 도 있는데.
	@HttpCode(HttpStatus.CREATED)
	@Post("schedule")
	async addQuizContext(@Body() dto: QuizContextDTO) {
		await this.validateQuizContextDTO(dto);

		await this.scheduleService.requestAddContext([dto]);
	}

	// TODO: Quiz 변경 로직 개선하기
	// - [x] Quiz 소유자만 변경할 수 있도록 수정하기
	// - [x] DB transaction 로직 추가하기
	// - [x] 삭제 로직 추가

	@ApiCreatedResponse({ type: ShowQuizResponse })
	@HttpCode(HttpStatus.CREATED)
	@UseTokenAuthGuard()
	@UseInterceptors(QueryRunnerInterceptor)
	@Post()
	async create(
		@DBQueryRunner() qr: QueryRunner,
		@Req() request: Request,
		@Body() dto: CreateQuizDTO,
	): Promise<ShowQuizResponse> {
		const userPayload: AuthUserPayload = request[AUTH_GUARD_PAYLOAD.USER]!;

		const quiz = await this.service.createQuiz(qr, dto, userPayload.user);

		return new ShowQuizResponse(quiz);
	}

	@ApiOkResponse({ type: DetailQuizResponse })
	@HttpCode(HttpStatus.OK)
	@Get(":id")
	async getDetailQuiz(
		@Param("id") id: string,
		@Query() query: GetQuizQueryDTO,
	): Promise<DetailQuizResponse> {
		let quiz = await this.service.findOne({ where: { id } });
		if (!quiz) {
			throw new ServiceException("ENTITY_NOT_FOUND", "BAD_REQUEST");
		}

		const { isS3Access, userId } = query;

		if (isS3Access) {
			quiz = await this.replaceImageSrcToS3(quiz);
		}

		const [, reactionCount] = await Promise.all([
			this.batchService.insertView(id),
			this.service.getQuizReactionCounts(id),
		]);

		const userReaction: QuizReactionType | undefined = userId
			? await this.service.getUserReaction(id, userId)
			: undefined;

		// responseDTO 정의하기
		return new DetailQuizResponse(quiz, reactionCount, userReaction);
	}

	@ApiOkResponse({ type: ShowQuizResponse })
	@HttpCode(HttpStatus.OK)
	@UseOwnerGuard(
		{ guard: TokenAuthGuard },
		{
			serviceClass: QuizService,
			idParam: "id",
			ownerField: "owner_id",
			serviceMethod: "getQuizById",
		},
	)
	@UseInterceptors(QueryRunnerInterceptor)
	@Put(":id")
	async update(
		@DBQueryRunner() qr: QueryRunner,
		@Req() request: Request,
		@Param("id", ParseUUIDPipe) id: string,
		@Body() dto: ReplaceQuizDTO,
	): Promise<ShowQuizResponse> {
		const quiz = await this.service.updateQuiz(qr, id, dto);
		return new ShowQuizResponse(quiz);
	}

	@HttpCode(HttpStatus.OK)
	@UseOwnerGuard(
		{ guard: TokenAuthGuard },
		{
			serviceClass: QuizService,
			idParam: "id",
			ownerField: "owner_id",
			serviceMethod: "getQuizById",
		},
	)
	@UseInterceptors(QueryRunnerInterceptor)
	@Delete(":id")
	async delete(@DBQueryRunner() qr: QueryRunner, @Param("id", ParseUUIDPipe) id: string) {
		await this.service.softDeleteQuiz(qr, id);
	}

	// TODO: 퀴즈 검색 로직 개선
	// - [ ] 제목으로 검색할 수 있도록 로직 추가하기
	// - [ ] <추가 작업>
	// ! 주의: <경고할 사항>
	// ? 질문: <의문점 또는 개선 방향>
	// * 참고: <관련 정보나 링크>

	@ApiPaginationResponse(ShowQuiz)
	@HttpCode(HttpStatus.OK)
	@Get("")
	async searchQuiz(@Query() dto: SearchQuizQueryDTO): Promise<Pagination<ShowQuiz>> {
		const result = await this.service.searchQuiz(dto);
		const ret = {
			...result,
			data: result.data.map((quiz) => new ShowQuiz(quiz)),
		};

		return ret;
	}

	// TODO : 퀴즈 사용자 상호작용 기능 추가
	// - [x] : 제출 퀴즈
	// - [ ] : 사용자의 퀴즈 풀이 기록
	// - [ ] : 임시 사용자의 퀴즈 풀이 기록
	// - [x] : 사용자의 퀴즈 싫어요/ 좋아요 기록

	async onApplicationBootstrap() {
		if (this.configService.get<string>(NODE_ENV) === "test") {
			return;
		}
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

	private buildSearchDTO(
		context: QuizContext,
		page: number = 0,
		pageCount: number = 20,
	): SearchQuizQueryDTO {
		return {
			artists: context.artist ? [context.artist] : [],
			tags: context.tag ? [context.tag] : [],
			styles: context.style ? [context.style] : [],
			page,
			count: pageCount,
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
