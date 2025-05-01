import { Exclude } from 'class-transformer';
import { Artist } from '../../artist/entities/artist.entity';
import { Style } from '../../style/entities/style.entity';
import { Tag } from '../../tag/entities/tag.entity';
import { User } from '../../user/entity/user.entity';
import { Quiz } from '../entities/quiz.entity';

export class ShortQuiz
  implements Pick<Quiz, 'title' | 'created_date' | 'id' | 'owner' | 'time_limit' | 'updated_date'>
{
  @Exclude()
  private _tags?: Tag[];
  @Exclude()
  private _artists?: Artist[];
  @Exclude()
  private _styles?: Style[];

  id!: string;
  title!: string;

  time_limit!: number;
  created_date!: Date;
  updated_date!: Date;
  owner!: User;

  constructor(quiz: Quiz) {
    this.id = quiz.id;
    this.title = quiz.title;
    this.time_limit = quiz.time_limit;
    this.created_date = quiz.created_date;
    this.updated_date = quiz.created_date;
    this.owner = quiz.owner;
    this._tags = quiz.tags;
    this._artists = quiz.artists;
    this._styles = quiz.styles;
  }

  get tags() {
    return this._tags;
  }

  get artists() {
    return this._artists;
  }

  get styles() {
    return this._styles;
  }
}
