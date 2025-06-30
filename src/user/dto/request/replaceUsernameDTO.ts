import { PickType } from "@nestjs/mapped-types";
import { CreateUserDTO } from "./createUserDTO";

export class ReplaceUsernameDTO extends PickType(CreateUserDTO, ["username"]) {}
