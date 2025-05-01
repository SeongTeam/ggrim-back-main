import { IsArray, IsString } from 'class-validator';

export class SearchQuizDTO {
  @IsArray()
  @IsString({ each: true })
  artists: string[] = [];

  /*형식 
      JSON 문자열 
        - 예시) url?tags=["1","2"]
        - 서버쪽에서 파싱 로직을 사용해야함
      */

  @IsArray()
  @IsString({ each: true })
  tags: string[] = [];

  /*형식 
      JSON 문자열 
        - 예시) url?tags=["1","2"]
        - 서버쪽에서 파싱 로직을 사용해야함
      */
  @IsArray()
  @IsString({ each: true })
  styles: string[] = [];
}
