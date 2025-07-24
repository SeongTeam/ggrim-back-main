import { IsInArray } from "../../../../utils/classValidator";
import { UserRole } from "../../entity/user.entity";

export class ReplaceRoleDTO {
	@IsInArray(["admin", "user"])
	role!: UserRole;
}
