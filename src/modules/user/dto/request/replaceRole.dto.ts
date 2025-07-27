import { IsInArray } from "../../../../utils/classValidator";
import { UserRole } from "../../const";

export class ReplaceRoleDTO {
	@IsInArray(["admin", "user"])
	role!: UserRole;
}
