import { Crud, CrudController, CrudRequest } from "@dataui/crud";
import {
	Body,
	Controller,
	Delete,
	forwardRef,
	Get,
	HttpCode,
	HttpStatus,
	Inject,
	Param,
	ParseUUIDPipe,
	Put,
	Req,
	UseInterceptors,
} from "@nestjs/common";
import { isArray, isEmpty, isNotEmpty } from "class-validator";
import { QueryRunner } from "typeorm";
import { ServiceException } from "../_common/filter/exception/service/serviceException";
import { AuthService } from "../auth/auth.service";
import { SecurityTokenGuard } from "../auth/guard/authentication/securityToken.guard";
import { TokenAuthGuard } from "../auth/guard/authentication/tokenAuth.guard";
import {
	AuthUserPayload,
	SecurityTokenPayload,
	TempUserPayload,
} from "../auth/guard/types/requestPayload";
import { AUTH_GUARD_PAYLOAD } from "../auth/guard/const";
import { DBQueryRunner } from "../db/query-runner/decorator/queryRunner";
import { QueryRunnerInterceptor } from "../db/query-runner/queryRunner.interceptor";
import { CreateUserDTO } from "./dto/request/createUser.dto";
import { ReplacePassWordDTO } from "./dto/request/replacePw.dto";
import { ReplaceRoleDTO } from "./dto/request/replaceRole.dto";
import { ReplaceUsernameDTO } from "./dto/request/replaceUsername.dto";
import { User } from "./entity/user.entity";
import { UserService } from "./user.service";
import { Request } from "express";
import { ShowUserResponse } from "./dto/request/response/showUser.response";
import { ApiOverride } from "../_common/decorator/swagger/CRUD/apiOverride";
import { UseOwnerGuard, UseRolesGuard } from "../auth/guard/decorator/authorization";
import { UseTempUserGuard } from "../auth/guard/decorator/authentication";
import { Pagination } from "../_common/types";
import { ApiOkResponse } from "@nestjs/swagger";

@Crud({
	model: {
		type: User,
	},
	routes: {
		only: ["getManyBase", "createOneBase"],
	},
	params: {
		id: {
			field: "id",
			type: "uuid",
			primary: true,
		},
	},
	query: {
		softDelete: true,
	},
	dto: {
		create: CreateUserDTO,
	},
})
@Controller("user")
export class UserController implements CrudController<User> {
	constructor(
		public service: UserService,
		@Inject(forwardRef(() => AuthService)) private readonly authService: AuthService,
	) {}

	// TODO: UserController 기능 추가
	// - [x] 사용자 생성시, Authentication 로직 추가
	//  -> 이메일 인증 등을 사용하여 인증된 사용자 확인하기
	// - [x] 사용자 생성시, 비밀번호 암호화 기능 추가
	// - [x] 비밀번호 변경, 유저이름 변경 등에 사용자 권한 확인 로직 추가
	// - [x] 사용자 삭제시, 본인 인증 및 권한 확인 로직 추가
	// ! 주의: <경고할 사항>
	// ? 질문: <의문점 또는 개선 방향>
	// * 참고: <관련 정보나 링크>

	@ApiOkResponse({ type: ShowUserResponse })
	@HttpCode(HttpStatus.OK)
	@Get(":id")
	async getOne(@Param("id", ParseUUIDPipe) id: string): Promise<ShowUserResponse> {
		const user = await this.service.findOne({
			where: { id },
		});
		if (!user) throw new ServiceException("ENTITY_NOT_FOUND", "BAD_REQUEST");
		return new ShowUserResponse(user);
	}

	@ApiOverride("getManyBase", ShowUserResponse)
	async getMany(req: CrudRequest): Promise<Pagination<ShowUserResponse> | ShowUserResponse[]> {
		const results = await this.service.getMany(req);
		const ret = isArray(results)
			? results.map((usr) => new ShowUserResponse(usr))
			: {
					...results,
					data: results.data.map((usr) => new ShowUserResponse(usr)),
				};

		return ret;
	}

	@ApiOverride(`createOneBase`, ShowUserResponse)
	@UseTempUserGuard("sign-up")
	@UseInterceptors(QueryRunnerInterceptor)
	async signUp(
		@DBQueryRunner() qr: QueryRunner,
		@Req() request: Request,
		@Body() dto: CreateUserDTO,
	) {
		const tempUserPayload: TempUserPayload = request[AUTH_GUARD_PAYLOAD.TEMP_USER]!;
		const { oneTimeTokenID, email } = tempUserPayload;
		const { username } = dto;
		const sameUsers = await this.service.find({ where: [{ email }, { username }] });

		sameUsers.forEach((user) => {
			if (user.email == email) {
				throw new ServiceException(
					"ENTITY_DUPLICATED",
					"BAD_REQUEST",
					`${email} are already exist`,
				);
			}

			if (user.username == username) {
				throw new ServiceException(
					"ENTITY_DUPLICATED",
					"BAD_REQUEST",
					`${username} are already exist`,
				);
			}
		});

		await this.authService.markOneTimeJWT(qr, oneTimeTokenID);

		const encryptedPW = await this.authService.hash(dto.password);
		const newUser = await this.service.createUser(qr, { ...dto, password: encryptedPW, email });

		return new ShowUserResponse(newUser);
	}

	// TODO: 사용자 정보 변경 로직 개선하기
	// - [x] 사용자 본인만 개인 정보변경할 수 있도록 수정하기
	// - [x] User Entity 필드 1개 수정할 수 있는 서비스 로직 추가하여 재사용성 높이기
	// - [x] 메일 인증 로직 추가하기
	// - [x] Role 필드 기반 API 접근 권한 로직 추가하기
	// - [ ] 사용자 암호 초기화 로직 추가하기
	//  -> 현재는 암호 소실 사용자에게 PW 업데이트 권한을 임시로 제공하므로, 당장 필요치 않음.
	// ! 주의: <경고할 사항>
	// ? 질문: <의문점 또는 개선 방향>
	// * 참고: <관련 정보나 링크>

	@UseOwnerGuard(
		{ guard: SecurityTokenGuard, purpose: "update-password" },
		{
			serviceClass: UserService,
			idParam: "id",
			serviceMethod: "findUserById",
			ownerField: "id",
		},
	)
	@UseInterceptors(QueryRunnerInterceptor)
	@Put(":id/password")
	async replacePassword(
		@DBQueryRunner() qr: QueryRunner,
		@Req() request: Request,
		@Body() dto: ReplacePassWordDTO,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		@Param("id", ParseUUIDPipe) id: string,
	) {
		const authUserPayload: AuthUserPayload = request[AUTH_GUARD_PAYLOAD.USER]!;
		const { user } = authUserPayload;

		const encryptedPW = await this.authService.hash(dto.password);
		await this.service.updateUser(qr, user.id, { password: encryptedPW });

		const SecurityTokenGuardResult: SecurityTokenPayload =
			request[AUTH_GUARD_PAYLOAD.SECURITY_TOKEN]!;
		await this.authService.markOneTimeJWT(qr, SecurityTokenGuardResult.oneTimeTokenID);
	}

	@UseOwnerGuard(
		{ guard: TokenAuthGuard },
		{
			serviceClass: UserService,
			idParam: "id",
			serviceMethod: "findUserById",
			ownerField: "id",
		},
	)
	@UseInterceptors(QueryRunnerInterceptor)
	@Put(":id/username")
	async replaceUsername(
		@DBQueryRunner() qr: QueryRunner,
		@Req() request: Request,
		@Body() dto: ReplaceUsernameDTO,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		@Param("id", ParseUUIDPipe) id: string,
	) {
		const { username: newUsername } = dto;
		const authUserPayload: AuthUserPayload = request[AUTH_GUARD_PAYLOAD.USER]!;
		const { user } = authUserPayload;
		const sameUserName = await this.service.findOne({ where: { username: newUsername } });

		if (isNotEmpty(sameUserName)) {
			throw new ServiceException(
				"ENTITY_DUPLICATED",
				"BAD_REQUEST",
				`${newUsername} already exist`,
			);
		}

		await this.service.updateUser(qr, user.id, dto);
	}

	@UseRolesGuard("admin")
	@UseInterceptors(QueryRunnerInterceptor)
	@Put(":id/role")
	async replaceRole(
		@DBQueryRunner() qr: QueryRunner,
		@Param("id", ParseUUIDPipe) id: string,
		@Body() dto: ReplaceRoleDTO,
	) {
		const user = await this.service.findOne({ where: { id } });
		if (!user) {
			throw new ServiceException(
				"ENTITY_NOT_FOUND",
				`BAD_REQUEST`,
				`user(${id}) is not exist`,
			);
		}

		await this.service.updateUser(qr, user.id, dto);
	}

	@UseOwnerGuard(
		{ guard: SecurityTokenGuard, purpose: "delete-account" },
		{
			serviceClass: UserService,
			idParam: "id",
			serviceMethod: "findUserById",
			ownerField: "id",
		},
	)
	@UseInterceptors(QueryRunnerInterceptor)
	@Delete(":id")
	async deleteUser(
		@DBQueryRunner() qr: QueryRunner,
		@Req() request: Request,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		@Param("id", ParseUUIDPipe) id: string,
	) {
		const authUserPayload: AuthUserPayload = request[AUTH_GUARD_PAYLOAD.USER]!;
		const { user } = authUserPayload;

		await this.service.softDeleteUser(qr, user.id);

		const SecurityTokenGuardResult: SecurityTokenPayload =
			request[AUTH_GUARD_PAYLOAD.SECURITY_TOKEN]!;
		await this.authService.markOneTimeJWT(qr, SecurityTokenGuardResult.oneTimeTokenID);
	}

	@UseOwnerGuard(
		{
			guard: SecurityTokenGuard,
			purpose: "recover-account",
			authOptions: { withDeleted: true },
		},
		{
			serviceClass: UserService,
			idParam: "id",
			serviceMethod: "findDeletedUserById",
			ownerField: "id",
		},
	)
	@UseInterceptors(QueryRunnerInterceptor)
	@Put("recover/:id")
	async recoverUser(
		@DBQueryRunner() qr: QueryRunner,
		@Req() request: Request,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		@Param("id", ParseUUIDPipe) id: string,
	) {
		const authUserPayload: AuthUserPayload = request[AUTH_GUARD_PAYLOAD.USER]!;
		const { user: deletedUser } = authUserPayload;
		if (isEmpty(deletedUser.deleted_date)) {
			throw new ServiceException(
				"ENTITY_RESTORE_FAILED",
				"FORBIDDEN",
				`can't recover non-deleted user`,
			);
		}

		await this.service.recoverUser(qr, deletedUser.id);

		const securityToken: SecurityTokenPayload = request[AUTH_GUARD_PAYLOAD.SECURITY_TOKEN]!;
		await this.authService.markOneTimeJWT(qr, securityToken.oneTimeTokenID);
	}
}
