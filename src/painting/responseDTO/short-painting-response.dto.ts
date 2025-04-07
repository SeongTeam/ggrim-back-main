import { Painting } from '../entities/painting.entity';

export interface IShortPaintingResponseDTO {
  id: string;
  title: string;
  imageUrl: string;
  width: number;
  height: number;
  artistName: string;
}

export class ShortPaintingResponseDTO implements IShortPaintingResponseDTO {
  id!: string;
  title!: string;
  imageUrl!: string;
  width!: number;
  height!: number;
  artistName!: string;

  public constructor(data: IShortPaintingResponseDTO) {
    Object.assign(this, data); // 한 줄 필드 할당
    Object.seal(this); //  객체 보호 (새 속성 추가 방지)
  }

  static fromPainting(painting: Painting): ShortPaintingResponseDTO {
    const { id, title, width, height, image_url, artist } = painting;

    return new ShortPaintingResponseDTO({
      id,
      title,
      width: width ?? 0,
      height: height ?? 0,
      imageUrl: image_url ?? '',
      artistName: artist?.name ?? '',
    });
  }
}
