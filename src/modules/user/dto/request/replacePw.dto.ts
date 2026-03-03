import { PickType } from "@nestjs/swagger";
import { CreateUserDTO } from "./createUser.dto";

export class ReplacePassWordDTO extends PickType(CreateUserDTO, ["password"]) {}
