import { Style } from 'src/style/entities/style.entity';
import { Tag } from 'src/tag/entities/tag.entity';
import { Painting } from '../entities/painting.entity';
import { IShortPaintingResponseDTO, ShortPaintingResponseDTO } from './short-painting-response.dto';

export interface IDetailPaintingResponseDTO extends IShortPaintingResponseDTO {
  description: string;
  tags: Tag[];
  styles: Style[];
}

export class DetailPaintingResponseDTO extends ShortPaintingResponseDTO {
  description: string;
  tags: Tag[];
  styles: Style[];

  private constructor(data: IDetailPaintingResponseDTO) {
    super(data);

    this.description = data.description;
    this.tags = data.tags;
    this.styles = data.styles;
    Object.seal(this);
  }

  static fromPainting(painting: Painting): DetailPaintingResponseDTO {
    return new DetailPaintingResponseDTO({
      ...ShortPaintingResponseDTO.fromPainting(painting), // 부모 클래스의 fromPainting 사용
      description: painting.description ?? '',
      tags: painting.tags ?? [],
      styles: painting.styles ?? [],
    });
  }
}
