import { IsInArray } from "../../../utils/class-validator";
import { UserRole } from "../../entity/user.entity";

export class ReplaceRoleDTO {
	@IsInArray(["admin", "user"])
	role!: UserRole;
}
