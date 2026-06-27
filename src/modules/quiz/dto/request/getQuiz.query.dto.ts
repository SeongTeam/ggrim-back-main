import { IsBoolean, IsNumber } from "class-validator";
import { IsOptionalProperty } from "../../../_common/decorator/swagger/class-validator/isOptionalProperty";
import { Transform } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";
import { transformToId } from "../../../../utils/obfuscate";

export class GetQuizQueryDTO {
	/**
	 * @description this field always transform invalid value or type into default value
	 */
	@ApiProperty({ default: false })
	@Transform(({ value }) => (value === "true" ? true : false), {
		toClassOnly: true,
	})
	@IsOptionalProperty()
	@IsBoolean()
	isS3Access: boolean = false;

	@ApiProperty({ type: "string", default: false })
	@IsOptionalProperty()
	@Transform(
		({ value }) => {
			// console.log("transform GetQuizQueryDTO");
			/**WARNING
			 * because of nest.js feature, setting ValidationPipe.transform=false make @Transform() works twice.
			 * ex : rawData -> transform(rawData) -> transform(transform(rawData)) -> validate
			 * To prevent it, need to option toClassOnly:true,
			 * Ref : https://github.com/nestjs/nest/issues/3842,https://github.com/nestjs/nest/issues/5852
			 */
			return transformToId(value);
		},
		{
			toClassOnly: true,
		},
	)
	@IsNumber({ allowInfinity: false, allowNaN: false })
	userId?: number;
}
