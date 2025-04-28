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
  id!: string;

  @Column()
  title!: string;

  @Column()
  searchTitle!: string;

  @OneToOne(() => WikiArtPainting, {
    cascade: ['update', 'insert'],
  })
  @JoinColumn()
  wikiArtPainting!: WikiArtPainting;

  @Column({
    nullable: true,
  })
  image_url!: string;

  @Column({ type: 'text', default: '' })
  description!: string; // painting description, default: ""

  @Column({ nullable: true })
  completition_year!: number; // painting completition year, default: null

  @Column({ nullable: true })
  width!: number;

  @Column({ nullable: true })
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
