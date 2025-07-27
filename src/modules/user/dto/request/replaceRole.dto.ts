import { ApiProperty } from "@dataui/crud/lib/crud";
import { IsInArray } from "../../../../utils/classValidator";
import { USER_ROLE, UserRole } from "../../const";

export class ReplaceRoleDTO {
	@ApiProperty({ enum: Object.values(USER_ROLE) })
	@IsInArray(Object.values(USER_ROLE))
	role!: UserRole;
}
