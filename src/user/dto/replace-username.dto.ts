import { PickType } from "@nestjs/mapped-types";
import { CreateUserDTO } from "./create-user.dto";

export class ReplaceUsernameDTO extends PickType(CreateUserDTO, ["username"]) {}
