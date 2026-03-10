import { TestingModule } from "@nestjs/testing";
import { OneTimeToken } from "../../../src/modules/auth/entity/oneTimeToken.entity";
import { OneTimeTokenPurpose } from "../../../src/modules/auth/types/oneTimeToken";
import { UserService } from "../../../src/modules/user/user.service";
import { TestService } from "../../_shared/test.service";
import assert from "assert";
import { DatabaseService } from "../../../src/modules/db/db.service";
import { UserDummy } from "../../_shared/stub/user.stub";

export async function getOneTimeTokenHeader(
	testModule: TestingModule,
	userEmail: string,
	purpose: OneTimeTokenPurpose,
	options?: { isUsed: boolean },
) {
	const testService = testModule.get(TestService);
	const userService = testModule.get(UserService);
	const header = {
		"x-one-time-token-identifier": "",
		"x-one-time-token-value": "",
	};
	let oneTimeToken: OneTimeToken;
	if (purpose === "sign-up") {
		const notExisted = await userService.findOne({ where: { email: userEmail } });
		assert(notExisted === null);
		oneTimeToken = await testService.createSignUpOneTimeToken(userEmail);
	} else if (purpose === "recover-account") {
		const deletedUser = await userService.findOne({
			where: { email: userEmail },
			withDeleted: true,
		});
		assert(deletedUser !== null);
		oneTimeToken = await testService.createOneTimeToken(deletedUser, "recover-account");
	} else {
		const user = await userService.findOne({ where: { email: userEmail } });
		assert(user !== null);
		oneTimeToken = await testService.createOneTimeToken(user, purpose);
	}

	header["x-one-time-token-identifier"] = oneTimeToken.id;
	header["x-one-time-token-value"] = oneTimeToken.token;

	if (options?.isUsed) {
		await testService.useOneTimeToken(oneTimeToken);
	}

	return header;
}

export async function arrangeDeletedUser(testModule: TestingModule, deletedUserStub: UserDummy) {
	const userService = testModule.get(UserService);
	const dbService = testModule.get(DatabaseService);
	const targetUser = await userService.findOne({ where: { email: deletedUserStub.email } });
	assert(targetUser !== null);
	const qr = dbService.getQueryRunner();
	await userService.softDeleteUser(qr, targetUser.id);
	await qr.release();
}
