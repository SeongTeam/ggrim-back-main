import { MigrationInterface, QueryRunner } from 'typeorm';
import { Artist } from '../../src/artist/entities/artist.entity';

export class UpdateArtistTableSerachNameCoulumn1745904453892 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const artists: Artist[] = await queryRunner.manager.find(Artist);
    for (const artist of artists) {
      const { id, name } = artist;
      await queryRunner.manager.update(Artist, id, {
        search_name: name.trim().split(/\s+/).join('_').toUpperCase(),
      });
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
