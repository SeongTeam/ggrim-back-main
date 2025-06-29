import {
	HttpException,
	HttpStatus,
	Inject,
	Injectable,
	UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";

import { InjectRepository } from "@nestjs/typeorm";
import { isEmpty } from "class-validator";
import {
	ENV_HASH_ROUNDS_KEY,
	ENV_JWT_SECRET_KEY,
	NODE_ENV,
} from "src/_common/const/env-keys.const";
import {
	DeepPartial,
	FindManyOptions,
	FindOneOptions,
	MoreThan,
	QueryRunner,
	Repository,
} from "typeorm";
import { ServiceException } from "../_common/filter/exception/service/service-exception";
import { createTransactionQueryBuilder } from "../db/query-runner/query-Runner.lib";
import { User, UserRole } from "../user/entity/user.entity";
import { OneTimeToken, OneTimeTokenPurpose } from "./entity/one-time-token.entity";
import { Verification } from "./entity/verification.entity";

export type TokenType = "REFRESH" | "ACCESS" | "ONE_TIME";
export type StandardTokenPurpose = "access" | "refresh";
export type JwtPurpose = OneTimeTokenPurpose | StandardTokenPurpose;

export const ENUM_JWT_ERROR_NAME = {
	TOKEN_EXPIRED: "TokenExpiredError",
	TOKEN_INVALID: "JsonWebTokenError",
	NOT_BEFORE: "NotBeforeError",
};

// ref : https://github.com/auth0/node-jsonwebtoken?tab=readme-ov-file#jwtsignpayload-secretorprivatekey-options-callback
export interface JWTDecode extends JWTPayload {
	iat: number; // second unit representing expired
	exp: number; // second unit representing expired
	// nbf?: Date;
	// aud? : object;
	// iss? : object;
}

export interface BaseJWTPayload {
	email: string;
	type: TokenType;
	purpose: JwtPurpose;
}
export interface JWTPayload extends BaseJWTPayload {
	username: string;
	role: UserRole;
}

export type AUTHORIZATION_TYPE = "Bearer" | "Basic";

// TODO: JWT 로직 개선
// - [ ] AccessToken 만료시간 줄이고 갱신 로직 추가하기
// - [ ] refresh 토큰 사용하고 탈취 위험성 줄이기
// - [ ] <추가 작업>
// ! 주의: <경고할 사항>
// ? 질문: Reflector의 getAllAndOverride() 와 get()의 차이는 무엇인가?
// * 참고: <관련 정보나 링크>

@Injectable()
export class AuthService {
	private ACCESS_TOKEN_TTL_SECOND = 3600 * 2;
	private REFRESH_TOKEN_TTL_SECOND = 3600 * 10;
	private ONE_TIME_TOKEN_TTL_SECOND = 15 * 60;
	private ONE_TIME_TOKEN_SIGN_UP_TTL_SECOND = 20 * 60;
	private VERIFICATION_EXPIRED_TTL_SECOND = 60 * 5 + 5; // margin value 5
	private VERIFY_INTERVAL_MS = 30 * 1000;

	constructor(
		@Inject(JwtService) private readonly jwtService: JwtService,
		@Inject(ConfigService) private readonly configService: ConfigService,
		@InjectRepository(Verification) private readonly verificationRepo: Repository<Verification>,
		@InjectRepository(OneTimeToken)
		private readonly oneTimeTokenRepo: Repository<OneTimeToken>,
	) {
		const envKeys = [ENV_HASH_ROUNDS_KEY, ENV_JWT_SECRET_KEY];
		const envFile = this.configService.get(NODE_ENV)
			? `.env.` + this.configService.get(NODE_ENV)
			: `.env`;
		for (const key of envKeys) {
			if (!this.configService.get(key)) {
				throw new Error(`${key} is not exist on ${envFile}`);
			}
		}
	}

	extractAuthorizationField(header: string, type: AUTHORIZATION_TYPE): string {
		const splitHeader = header.split(" ");

		if (splitHeader.length !== 2 || splitHeader[0] !== type) {
			throw new UnauthorizedException("invalid Header field");
		}

		return splitHeader[1];
	}

	verifyToken(token: string): JWTDecode {
		try {
			const decoded = this.jwtService.verify(token, {
				secret: this.configService.get<string>(ENV_JWT_SECRET_KEY),
			});
			return decoded as JWTDecode;
		} catch (e: unknown) {
			if (e instanceof Error && e.name) {
				throw new HttpException(e.name, HttpStatus["BAD_REQUEST"], { cause: e });
			}
			throw new ServiceException(
				"EXTERNAL_SERVICE_FAILED",
				"INTERNAL_SERVER_ERROR",
				`can't verify token`,
				{ cause: e },
			);
		}
	}

	refreshToken(token: string): string {
		const decoded: JWTDecode = this.verifyToken(token);
		// const payload: JWTPayload = {
		//   email: decoded.email,
		//   username: decoded.username,
		//   role: decoded.role,
		//   type: decoded.type,
		// };
		const newToken: string = this.signToken(decoded);

		return newToken;
	}

	signToken(payload: BaseJWTPayload | JWTPayload): string {
		let expiresIn: number;

		switch (payload.type) {
			case "ACCESS":
				expiresIn = this.ACCESS_TOKEN_TTL_SECOND;
				break;
			case "REFRESH":
				expiresIn = this.REFRESH_TOKEN_TTL_SECOND;
				break;
			case "ONE_TIME": {
				if (payload.purpose === "sign-up") {
					expiresIn = this.ONE_TIME_TOKEN_SIGN_UP_TTL_SECOND;
				} else {
					expiresIn = this.ONE_TIME_TOKEN_TTL_SECOND;
				}
				break;
			}
			default:
				throw new Error(`Unknown token type: ${payload.type}`);
		}

		const newToken: string = this.jwtService.sign(payload, {
			secret: this.configService.get<string>(ENV_JWT_SECRET_KEY),
			// seconds
			expiresIn,
		});

		return newToken;
	}

	async isHashMatched(target: string, hash: string) {
		const sha256 = crypto.createHash("sha256").update(target).digest("hex");
		const passOk = await bcrypt.compare(sha256, hash);

		return passOk;
	}

	async hash(src: string): Promise<string> {
		// fix src size to 32byte
		const sha256 = crypto.createHash("sha256").update(src).digest("hex");

		// encrypt during static performance
		const round = parseInt(this.configService.get<string>(ENV_HASH_ROUNDS_KEY, "10"));
		const salt = await bcrypt.genSalt(round);
		const hash = await bcrypt.hash(sha256, salt);

		return hash;
	}

	generatePinCode(length: number = 8): string {
		const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
		let result = "";
		const array = new Uint8Array(length);
		crypto.getRandomValues(array); // 브라우저/Node.js 모두 안전하게 랜덤값 생성 가능

		for (let i = 0; i < length; i++) {
			result += chars[array[i] % chars.length];
		}

		return result;
	}

	getVerificationExpiredTime(): Date {
		const now = new Date();
		const expiredDate = new Date(now.getTime() + this.VERIFICATION_EXPIRED_TTL_SECOND * 1000);
		return expiredDate;
	}

	//TODO typeorm 로직 개선
	// [x] : returning() 메소드를 사용하여 생성 후 반환되는 열들의 값 명시하기
	//  -> insertResult.generateMaps[0]은 직접삽입한 값은 포함되지 않기 때문에 returning() 적용필요.
	async createVerification(
		queryRunner: QueryRunner,
		email: string,
		pinCode: string,
	): Promise<Verification> {
		const hashedPinCode = await this.hash(pinCode);
		const expiredDate = this.getVerificationExpiredTime();
		const returnedColumns: (keyof Verification)[] = [
			"email",
			"pin_code_expired_date",
			"pin_code",
		];
		try {
			const result = await createTransactionQueryBuilder(queryRunner, Verification)
				.insert()
				.into(Verification)
				.values({
					email,
					pin_code: hashedPinCode,
					pin_code_expired_date: expiredDate,
				})
				.returning(returnedColumns)
				.execute();

			const verification = result.generatedMaps[0] as Verification;

			return verification;
		} catch (error) {
			throw new ServiceException(
				"EXTERNAL_SERVICE_FAILED",
				"INTERNAL_SERVER_ERROR",
				`Can't create User`,
				{ cause: error },
			);
		}
	}

	async updateVerification(
		queryRunner: QueryRunner,
		id: string,
		dto: DeepPartial<Verification>,
	): Promise<void> {
		try {
			const result = await createTransactionQueryBuilder(queryRunner, Verification)
				.update(Verification)
				.set({
					...dto,
				})
				.where("id = :id", { id })
				.execute();

			return;
		} catch (error) {
			throw new ServiceException(
				"EXTERNAL_SERVICE_FAILED",
				"INTERNAL_SERVER_ERROR",
				`Can't update username`,
				{ cause: error },
			);
		}
	}

	// return delay second
	getVerifyDelay(lastVerification: Verification): number {
		const now = new Date();
		const lastDate: null | Date = lastVerification.last_verified_date;

		if (isEmpty(lastDate)) {
			return 0;
		}

		const delay = now.getTime() - lastDate.getTime();
		const MS_PER_SECOND = 1000;
		if (delay >= this.VERIFY_INTERVAL_MS) {
			return 0;
		}

		return Math.round((this.VERIFY_INTERVAL_MS - delay) / MS_PER_SECOND);
	}

	async isVerifyEnable(email: string): Promise<boolean> {
		const VALID_INTERVAL_MS = 10 * 60 * 1000;
		const TEN_MINUTES_AGO = new Date(Date.now() - VALID_INTERVAL_MS);
		const MAX_REQUEST_COUNT = 3;
		const count = await this.verificationRepo.count({
			where: {
				email,
				created_date: MoreThan(TEN_MINUTES_AGO),
			},
		});
		return count < MAX_REQUEST_COUNT;
	}

	async findVerification(options: FindOneOptions<Verification>): Promise<Verification | null> {
		const one = await this.verificationRepo.findOne(options);

		return one;
	}

	async findVerificationList(options: FindManyOptions<Verification>): Promise<Verification[]> {
		const results = await this.verificationRepo.find(options);

		return results;
	}

	async isEnableCreateOneTimeJWT(email: string): Promise<boolean> {
		const VALID_INTERVAL_MS = 10 * 60 * 1000;
		const TEN_MINUTES_AGO = new Date(Date.now() - VALID_INTERVAL_MS);
		const MAX_REQUEST_COUNT = 5;
		const count = await this.oneTimeTokenRepo.count({
			where: {
				email,
				created_date: MoreThan(TEN_MINUTES_AGO),
			},
		});

		return count < MAX_REQUEST_COUNT;
	}

	async signOneTimeJWTWithUser(
		queryRunner: QueryRunner,
		email: string,
		purpose: OneTimeTokenPurpose,
		user: User,
	): Promise<OneTimeToken> {
		const { role, username } = user;
		const payload: JWTPayload = { role, username, email, purpose, type: "ONE_TIME" };

		const token = this.signToken(payload);

		const oneTimeToken = await this.createOneTimeToken(queryRunner, token, email, user);
		oneTimeToken.token = token;

		return oneTimeToken;
	}

	async signOneTimeJWTWithoutUser(
		queryRunner: QueryRunner,
		email: string,
		purpose: OneTimeTokenPurpose,
	): Promise<OneTimeToken> {
		const basePayload: BaseJWTPayload = { email, purpose, type: "ONE_TIME" };

		const token = this.signToken(basePayload);

		const oneTimeToken = await this.createOneTimeToken(queryRunner, token, email);
		oneTimeToken.token = token;

		return oneTimeToken;
	}

	async markOneTimeJWT(queryRunner: QueryRunner, oneTimeTokenID: string) {
		await this.updateOneTimeToken(queryRunner, oneTimeTokenID, { used_date: new Date() });
	}

	async createOneTimeToken(
		queryRunner: QueryRunner,
		token: string,
		email: string,
		user?: User,
	): Promise<OneTimeToken> {
		const decoded = this.verifyToken(token);
		const { purpose, exp: expired_date_ms } = decoded;
		const MS_PER_SECOND = 1000;
		const returnedColumn: (keyof OneTimeToken)[] = [
			"email",
			"expired_date",
			"token",
			"user",
			"user_id",
			"id",
		];
		if (purpose === "access" || purpose === "refresh") {
			throw new ServiceException(
				"SERVICE_RUN_ERROR",
				"INTERNAL_SERVER_ERROR",
				`purpose field(${purpose}) is invalid. `,
			);
		}

		const hashed = await this.hash(token);

		try {
			const result = await createTransactionQueryBuilder(queryRunner, OneTimeToken)
				.createQueryBuilder()
				.insert()
				.into(OneTimeToken)
				.values({
					email,
					expired_date: new Date(expired_date_ms * MS_PER_SECOND),
					token: hashed,
					user,
					purpose,
				})
				.returning(returnedColumn)
				.execute();

			return result.generatedMaps[0] as OneTimeToken;
		} catch (error) {
			throw new ServiceException(
				"EXTERNAL_SERVICE_FAILED",
				"INTERNAL_SERVER_ERROR",
				`Can't create OneTimeToken`,
				{ cause: error },
			);
		}
	}

	async updateOneTimeToken(queryRunner: QueryRunner, id: string, dto: DeepPartial<OneTimeToken>) {
		if (dto.token) {
			throw new ServiceException(
				"SERVICE_RUN_ERROR",
				"INTERNAL_SERVER_ERROR",
				`Can't update token field because of security `,
			);
		}
		// not need to select updated row's columns
		// const returnedColumn: (keyof OneTimeToken)[] = [
		//   'email',
		//   'purpose',
		//   'token',
		//   'used_date',
		//   'user',
		// ];

		try {
			const result = await createTransactionQueryBuilder(queryRunner, OneTimeToken)
				.update(OneTimeToken)
				.set({
					...dto,
				})
				.where("id = :id", { id })
				// .returning(returnedColumn)
				.execute();

			return;
		} catch (error) {
			throw new ServiceException(
				"EXTERNAL_SERVICE_FAILED",
				"INTERNAL_SERVER_ERROR",
				`Can't update OneTimeToken`,
				{ cause: error },
			);
		}
	}

	async findOneTimeTokenByID(id: string): Promise<OneTimeToken | null> {
		return await this.findOneTimeToken({ where: { id } });
	}

	async findOneTimeToken(options: FindOneOptions<OneTimeToken>): Promise<OneTimeToken | null> {
		const one = await this.oneTimeTokenRepo.findOne(options);

		return one;
	}

	async findOneTimeTokenList(options: FindManyOptions<OneTimeToken>): Promise<OneTimeToken[]> {
		const results = await this.oneTimeTokenRepo.find(options);

		return results;
	}
}
