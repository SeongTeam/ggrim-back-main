import { OmitType } from "@nestjs/swagger";
import { User } from "../../../src/modules/user/entity/user.entity";
import { CustomBaseEntityStub, factoryCustomBaseStub } from "./customBaseEntity.stub";
import { faker } from "@faker-js/faker";
import { UserRole, UserState } from "../../../src/modules/user/const";

export class UserDummy extends OmitType(User, ["quizzes", "oneTimeTokens"]) {}

export const factoryUserStub = (role: UserRole, state: UserState = "active"): UserDummy => {
	const customBase = factoryCustomBaseStub();
	const username = faker.internet.username();
	const email = faker.internet.email();
	const password = faker.internet.password();
	const last_login_date = customBase.updated_date;

	return {
		id: faker.string.uuid(),
		username,
		email,
		password,
		role,
		active: state,
		last_login_date,
		oauth_provider: null,
		oauth_provider_id: null,
		...factoryCustomBaseStub(),
	};
};

export const getNormalUserStub = (): UserDummy => {
	return {
		id: faker.string.uuid(),
		email: "user@email.test",
		password: "this-is-test",
		role: "user",
		username: "NormalUser",
		active: "active",
		last_login_date: new Date("2024-05-20T14:32:11.456Z"),
		oauth_provider: null,
		oauth_provider_id: null,
		...CustomBaseEntityStub(),
	};
};

export const getAdminUserStub = (): UserDummy => {
	return {
		id: faker.string.uuid(),
		email: "admin@email.test",
		password: "this-is-test",
		role: "admin",
		username: "adminUser",
		active: "active",
		last_login_date: new Date("2024-05-20T14:32:11.456Z"),
		oauth_provider: null,
		oauth_provider_id: null,
		...CustomBaseEntityStub(),
	};
};
