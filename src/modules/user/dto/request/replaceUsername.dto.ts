import { PickType } from "@nestjs/swagger";
import { CreateUserDTO } from "./createUser.dto";

export class ReplaceUsernameDTO extends PickType(CreateUserDTO, ["username"]) {}
