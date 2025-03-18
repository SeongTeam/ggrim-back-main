import { IsNumber, IsString } from 'class-validator';
import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Artist } from '../../artist/entities/artist.entity';
import { CustomBaseEntity } from '../../db/entity/custom.base.entity';
import { Style } from '../../style/entities/style.entity';
import { Tag } from '../../tag/entities/tag.entity';
import { WikiArtPainting } from './wikiArt-painting.entity';

@Entity()
export class Painting extends CustomBaseEntity {
  @PrimaryGeneratedColumn('uuid')
  @IsString()
  id!: string;

  @Column()
  @IsString()
  title!: string;

  @Column()
  @IsString()
  searchTitle!: string;

  @OneToOne(() => WikiArtPainting, {
    cascade: ['update', 'insert'],
  })
  @JoinColumn()
  wikiArtPainting!: WikiArtPainting;

  @Column({
    nullable: true,
  })
  @IsString()
  image_url!: string;

  @Column({ type: 'text', default: '' })
  @IsString()
  description!: string; // painting description, default: ""

  @Column({ nullable: true })
  @IsNumber()
  completition_year!: number; // painting completition year, default: null

  @Column({ nullable: true })
  @IsNumber()
  width!: number;

  @Column({ nullable: true })
  @IsNumber()
  height!: number;

  @ManyToMany(() => Tag, (tag) => tag.paintings)
  @JoinTable()
  tags!: Tag[];

  @ManyToMany(() => Style, (style) => style.paintings)
  @JoinTable()
  styles!: Style[];

  @ManyToOne(() => Artist, (artist) => artist.paintings, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn()
  artist!: Artist;
}
