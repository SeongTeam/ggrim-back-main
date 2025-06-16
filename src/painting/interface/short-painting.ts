import { Exclude } from 'class-transformer';
import { Artist } from '../../artist/entities/artist.entity';
import { Style } from '../../style/entities/style.entity';
import { Tag } from '../../tag/entities/tag.entity';
import { Painting } from '../entities/painting.entity';

export class ShortPainting
  implements Pick<Painting, 'id' | 'title' | 'image_url' | 'width' | 'height' | 'image_s3_key'>
{
  @Exclude()
  _artist?: Artist;

  @Exclude()
  _tags?: Tag[];

  @Exclude()
  _styles?: Style[];

  id!: string;
  title!: string;
  image_url!: string;
  width!: number;
  height!: number;
  image_s3_key: string;

  public constructor(painting: Painting) {
    const {
      id,
      title,
      width,
      height,
      image_url,
      image_s3_key,
      artist: _artist,
      tags: _tags,
      styles: _styles,
    } = painting;
    this.id = id;
    this.title = title;
    this.width = width;
    this.height = height;
    this.image_url = image_url;
    this._artist = _artist;
    this._tags = _tags;
    this._styles = _styles;
    this.image_s3_key = image_s3_key;

    Object.seal(this); //  객체 보호 (새 속성 추가 방지)
  }

  get artist() {
    return this._artist;
  }

  get tags() {
    return this._tags;
  }

  get styles() {
    return this._styles;
  }
}
