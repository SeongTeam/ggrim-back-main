import { IsArray, IsNumber, IsString } from "class-validator";
import { IsOptionalProperty } from "../../../_common/decorator/swagger/class-validator/isOptionalProperty";

//export class CreatePaintingDTO extends PartialType(Painting) {}
export class CreatePaintingDTO {
	@IsString()
	title!: string;

	//TODO IsUrl()으로 변경고려
	@IsString()
	image_url!: string;

	@IsString()
	description!: string;

	@IsOptionalProperty()
	@IsString()
	artistName?: string;

	@IsOptionalProperty()
	@IsNumber()
	width?: number;

	@IsOptionalProperty()
	@IsNumber()
	height?: number;

	@IsOptionalProperty()
	@IsNumber()
	completition_year?: number;

	/*TODO
  -  DB에 저장된 tag와 Style 값만 통과하도록 수정하기.
    - 방법 1 : @IsInArray() 데코레이터를 활용  
  */
	@IsOptionalProperty()
	@IsArray()
	@IsString({
		each: true,
	})
	tags?: string[];

	@IsOptionalProperty()
	@IsArray()
	@IsString({
		each: true,
	})
	styles?: string[];

	@IsOptionalProperty()
	@IsString()
	image_s3_key?: string;
}
