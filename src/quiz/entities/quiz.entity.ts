import { IsNumber, IsString, IsUUID } from 'class-validator';
import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Artist } from '../../artist/entities/artist.entity';
import { CustomBaseEntity } from '../../db/entity/custom.base.entity';
import { Painting } from '../../painting/entities/painting.entity';
import { Style } from '../../style/entities/style.entity';
import { Tag } from '../../tag/entities/tag.entity';
import { User } from '../../user/entity/user.entity';
import { QUIZ_TIME_LIMIT } from '../const';
import { QUIZ_TYPE } from '../type';

/*TODO
- 문제 풀이 로직 통계 정보 열 추가하기
  - 시간 초과 횟수
  - 문제 안푼 횟수 ....
  => 필요한 열을 점검 및 추가하기
*/
@Entity()
export class Quiz extends CustomBaseEntity {
  @PrimaryGeneratedColumn('uuid')
  @IsString()
  id!: string;

  @Column()
  @IsString()
  title!: string;

  @ManyToMany(() => Painting, {
    cascade: ['update', 'insert'],
    eager: true,
  })
  @JoinTable()
  distractor_paintings!: Painting[];

  @ManyToMany(() => Painting, {
    cascade: ['update', 'insert'],
    eager: true,
  })
  @JoinTable()
  answer_paintings!: Painting[];

  /*TODO
    - 추가된 컬럼을 반영하여 CRUD 로직 수정하기
  */
  @ManyToOne(() => Painting, {
    cascade: ['update', 'insert'],
    eager: true,
    nullable: true,
  })
  @JoinTable()
  example_painting!: Painting | undefined;

  @Column({ default: 0 })
  view_count!: number;

  @Column({
    default: 0,
  })
  @IsNumber()
  correct_count!: number;

  @Column({
    default: 0,
  })
  @IsNumber()
  incorrect_count!: number;

  @Column({
    default: QUIZ_TIME_LIMIT.EASY,
  })
  time_limit!: number;

  @Column({ type: 'text' })
  @IsString()
  description!: string;

  @Column()
  type!: QUIZ_TYPE;

  @ManyToMany(() => Artist, {
    cascade: ['update', 'insert'],
  })
  @JoinTable()
  artists!: Artist[];

  @ManyToMany(() => Tag, {
    cascade: ['update', 'insert'],
  })
  @JoinTable()
  tags!: Tag[];

  @ManyToMany(() => Style, {
    cascade: ['update', 'insert'],
  })
  @JoinTable()
  styles!: Style[];

  @Column()
  @IsUUID()
  owner_id!: string;

  @ManyToOne(() => User, (user) => user.quizzes)
  @JoinColumn({ name: 'owner_id' })
  owner!: User;
}
