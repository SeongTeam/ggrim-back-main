import { User } from "../../../entity/user.entity";
import { USER_ROLE, USER_STATE, UserRole, UserState } from "../../../const";
import { ApiProperty } from "@nestjs/swagger";

export class ShowUserResponse {
	id: string;

	@ApiProperty({ enum: Object.values(USER_ROLE), enumName: "USER_ROLE" })
	role: UserRole;

	username: string;

	@ApiProperty({ enum: Object.values(USER_STATE), enumName: "USER_STATE" })
	active!: UserState;

	/**
	 * @format IsoDateTime
	 * @example 2011-10-05T14:48:00.000Z
	 */
	last_login_date: string;

	/*TODO
        - Oauth 로직추가시 해당 컬럼 관련 로직 개선하기
        */
	oauth_provider: string | null;

	oauth_provider_id: string | null;

	constructor(user: User) {
		this.id = user.id;
		this.role = user.role;
		this.username = user.username;
		this.active = user.active;
		this.last_login_date = user.last_login_date.toISOString();
		this.oauth_provider = user.oauth_provider;
		this.oauth_provider_id = user.oauth_provider_id;
	}
}
