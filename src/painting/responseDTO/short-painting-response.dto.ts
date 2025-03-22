import { Painting } from '../entities/painting.entity';

export class ShortPaintingResponseDTO {
  id: string;
  title: string;
  imageUrl: string;
  width: number;
  height: number;
  artistName: string;

  constructor(painting: Painting) {
    this.id = painting.id;
    this.title = painting.title;
    this.imageUrl = painting.image_url;
    this.width = painting.width;
    this.height = painting.height;
    this.artistName = painting.artist.name;

    Object.seal(this);
  }
}
