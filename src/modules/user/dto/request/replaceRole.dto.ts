import { ApiProperty } from "@nestjs/swagger";
import { IsInArray } from "../../../../utils/classValidator";
import { USER_ROLE, UserRole } from "../../const";

export class ReplaceRoleDTO {
	@ApiProperty({ enum: Object.values(USER_ROLE) })
	@IsInArray(Object.values(USER_ROLE))
	role!: UserRole;
}
