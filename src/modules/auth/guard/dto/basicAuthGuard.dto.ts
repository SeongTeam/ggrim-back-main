import { PickType } from "@nestjs/swagger";
import { IsEmail } from "class-validator";
import { CreateUserDTO } from "../../../user/dto/request/createUser.dto";

export class BasicTokenGuardDTO extends PickType(CreateUserDTO, ["password"]) {
	@IsEmail()
	email!: string;
}
