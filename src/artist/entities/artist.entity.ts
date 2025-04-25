import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { CustomBaseEntity } from '../../db/entity/custom.base.entity';
import { Painting } from '../../painting/entities/painting.entity';

@Entity()
/*TODO
- 동명이인을 구분할 방법을 찾아야함
*/
// @Unique(['name'])
export class Artist extends CustomBaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({
    nullable: true,
  })
  image_url!: string;

  @Column({
    type: 'time without time zone',
    nullable: true,
  })
  birth_date!: Date;

  @Column({
    type: 'time without time zone',
    nullable: true,
  })
  death_date!: Date;

  @Column({
    nullable: true,
  })
  info_url!: string;

  @OneToMany(() => Painting, (painting) => painting.artist, {
    onDelete: 'RESTRICT',
  })
  paintings!: Painting[];
}
