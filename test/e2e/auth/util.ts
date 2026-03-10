import { TestingModule } from "@nestjs/testing";
import { OneTimeToken } from "../../../src/modules/auth/entity/oneTimeToken.entity";
import { AuthService } from "../../../src/modules/auth/auth.service";
import { ShowOneTimeTokenResponse } from "../../../src/modules/auth/dto/response/showOneTimeToken.response";
import { omit } from "../../../src/utils/object";
import { DatabaseService } from "../../../src/modules/db/db.service";
import { Verification } from "../../../src/modules/auth/entity/verification.entity";
import { User } from "../../../src/modules/user/entity/user.entity";
import { OneTimeTokenPurpose } from "../../../src/modules/auth/types/oneTimeToken";
import { UserService } from "../../../src/modules/user/user.service";
import { TestService } from "../../_shared/test.service";
import assert from "assert";
import { ShowVerificationResponse } from "../../../src/modules/auth/dto/response/showVerfication.response";

export async function useVerifyInfo(testingModule: TestingModule, email: string, pinCode: string) {
	const authService = testingModule.get(AuthService);
	const dbService = testingModule.get(DatabaseService);
	const qr = dbService.getQueryRunner();
	const verification = await registerVerifyInfo(testingModule, email, pinCode);
	const now = new Date();
	const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
	await authService.updateVerification(qr, verification.id, {
		last_verified_date: tenMinutesAgo,
		verification_success_date: tenMinutesAgo,
	});

	await qr.release();
}

export async function registerVerifyInfo(
	testingModule: TestingModule,
	email: string,
	pinCode: string,
) {
	const authService = testingModule.get(AuthService);
	const dbService = testingModule.get(DatabaseService);
	const qr = dbService.getQueryRunner();
	const verification = await authService.createVerification(qr, email, pinCode);

	await qr.release();

	return verification;
}

export async function deleteAllVerifications(
	testingModule: TestingModule,
	condition: Partial<{
		[K in keyof Verification]: Verification[K];
	}>,
) {
	const dbService = testingModule.get(DatabaseService);
	const manager = dbService.getManager();

	await manager.delete(Verification, condition);
}

export async function deleteAllUsers(testingModule: TestingModule, condition: { email: string }) {
	const dbService = testingModule.get(DatabaseService);
	const manager = dbService.getManager();
	const users = await manager.find(User, { where: condition });

	//delete relation table
	await Promise.all(users.map((user) => manager.delete(OneTimeToken, { user_id: user.id })));

	await manager.delete(User, condition);
}

export async function deleteAllOneTimeTokens(
	testingModule: TestingModule,
	condition: Partial<{
		[K in keyof OneTimeToken]: OneTimeToken[K];
	}>,
) {
	const dbService = testingModule.get(DatabaseService);
	const manager = dbService.getManager();

	await manager.delete(OneTimeToken, condition);
}

export async function createOneTimeToken(
	testingModule: TestingModule,
	userId: string,
	purpose: OneTimeTokenPurpose,
) {
	const userService = testingModule.get(UserService);
	const testService = testingModule.get(TestService);
	const user = await userService.findOne({ where: { id: userId } });
	assert(user !== null);
	const oneTimeToken = await testService.createOneTimeToken(user, purpose);

	return oneTimeToken;
}

export function expectVerification(
	receivedData: ShowVerificationResponse,
	receivedEntity: Verification,
) {
	//TODO API 결과 DB 변경 검증하기
	//- [x] Verification Entity 생성 검증
	//- [x] 응답 객체와 DB Entity 매칭 검증

	//validate token

	const expectedData = new ShowVerificationResponse(receivedEntity);
	//validate else
	expect(receivedData).toEqual(expectedData);
}

export async function expectOneTimeToken(
	testingModule: TestingModule,
	receivedData: ShowOneTimeTokenResponse,
	receivedEntity: OneTimeToken,
) {
	//TODO API 결과 DB 변경 검증하기
	//- [x] OneTimeToken Entity 생성 검증
	//- [x] DB에 저장된 OneTimeToken 중요 정보 암호화 검증
	//- [x] 응답 객체와 DB Entity 매칭 검증

	//validate token
	const receivedToken = receivedData.token;
	const encodedToken = receivedEntity.token;
	expect(receivedToken === encodedToken).toBe(false);

	const authService = testingModule.get(AuthService);
	const isMatched = await authService.isHashMatched(receivedToken, encodedToken);
	expect(isMatched).toBe(true);

	const expectedData = new ShowOneTimeTokenResponse(receivedEntity);
	//validate else
	expect(omit(receivedData, ["token"])).toEqual(omit(expectedData, ["token"]));
}

export async function initOneTimeTokenFromEmailVerification(
	testingModule: TestingModule,
	user: User,
) {
	const testService = testingModule.get(TestService);
	assert(user !== null);
	const oneTimeToken = await testService.createOneTimeToken(user, "email-verification");
	return oneTimeToken;
}
