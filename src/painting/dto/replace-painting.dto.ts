import { PickType } from '@nestjs/mapped-types';
import { IsArray, IsString } from 'class-validator';
import { CreatePaintingDTO } from './create-painting.dto';

export class ReplacePaintingDTO extends PickType(CreatePaintingDTO, [
  'title',
  'image_url',
  'description',
  'width',
  'height',
  'completition_year',
  'artistName',
  'image_s3_key',
]) {
  @IsArray()
  @IsString({ each: true })
  tags!: string[];

  @IsArray()
  @IsString({ each: true })
  styles!: string[];
}
