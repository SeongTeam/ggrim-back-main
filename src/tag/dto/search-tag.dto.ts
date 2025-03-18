import { IsJSON } from 'class-validator';

export class SearchTagDTO {
  @IsJSON()
  names: string = ',';
}
