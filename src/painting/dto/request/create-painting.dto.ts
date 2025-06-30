import { IsArray, IsNumber, IsOptional, IsString } from "class-validator";

//export class CreatePaintingDTO extends PartialType(Painting) {}
export class CreatePaintingDTO {
	@IsString()
	title!: string;

	//TODO IsUrl()으로 변경고려
	@IsString()
	image_url!: string;

	@IsString()
	description!: string;

	@IsOptional()
	@IsString()
	artistName?: string;

	@IsNumber()
	width?: number;

	@IsNumber()
	height?: number;

	@IsOptional()
	@IsNumber()
	completition_year?: number;

	/*TODO
  -  DB에 저장된 tag와 Style 값만 통과하도록 수정하기.
    - 방법 1 : @IsInArray() 데코레이터를 활용  
  */
	@IsOptional()
	@IsArray()
	@IsString({
		each: true,
	})
	tags?: string[];

	@IsOptional()
	@IsArray()
	@IsString({
		each: true,
	})
	styles?: string[];

	@IsString()
	image_s3_key?: string;
}
