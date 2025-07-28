import { IsArray, IsString } from "class-validator";
import { IsOptionalProperty } from "../../../_common/decorator/swagger/class-validator/isOptionalProperty";

export class SearchPaintingDTO {
	@IsOptionalProperty()
	@IsString()
	@IsOptional()
	title: string = "";

	@IsOptionalProperty()
	@IsString()
	artistName: string = "";

	/*형식 
    JSON 문자열 
      - 예시) url?tags=["1","2"]
      - 서버쪽에서 파싱 로직을 사용해야함
    */
	@IsOptionalProperty()
	@IsArray()
	@IsString({ each: true })
	tags: string[] = [];

	/*형식 
    JSON 문자열 
      - 예시) url?tags=["1","2"]
      - 서버쪽에서 파싱 로직을 사용해야함
    */
	@IsOptionalProperty()
	@IsArray()
	@IsString({ each: true })
	styles: string[] = [];
}
