import { PickType } from "@nestjs/mapped-types";
import { CreateUserDTO } from "./createUser.dto";

export class ReplacePassWordDTO extends PickType(CreateUserDTO, ["password"]) {}
