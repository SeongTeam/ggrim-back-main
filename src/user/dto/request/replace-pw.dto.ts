import { PickType } from "@nestjs/mapped-types";
import { CreateUserDTO } from "./create-user.dto";

export class ReplacePassWordDTO extends PickType(CreateUserDTO, ["password"]) {}
