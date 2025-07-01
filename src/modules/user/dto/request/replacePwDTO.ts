import { PickType } from "@nestjs/mapped-types";
import { CreateUserDTO } from "./createUserDTO";

export class ReplacePassWordDTO extends PickType(CreateUserDTO, ["password"]) {}
