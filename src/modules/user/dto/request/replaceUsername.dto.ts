import { PickType } from "@nestjs/mapped-types";
import { CreateUserDTO } from "./createUser.dto";

export class ReplaceUsernameDTO extends PickType(CreateUserDTO, ["username"]) {}
