import { PickType } from "@nestjs/mapped-types";
import { IsEmail } from "class-validator";
import { CreateUserDTO } from "../../../user/dto/request/createUserDTO";

export class BasicTokenGuardDTO extends PickType(CreateUserDTO, ["password"]) {
	@IsEmail()
	email!: string;
}
