import { MigrationInterface, QueryRunner } from 'typeorm';
import { Artist } from '../../src/artist/entities/artist.entity';

export class UpdateArtistTable1745901458599 implements MigrationInterface {
  name = 'UpdateArtistTable1745901458599';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "artist" ADD "search_name" character varying`);

    const artists: Artist[] = await queryRunner.manager.find(Artist);
    for (const artist of artists) {
      await this.updateColumns(queryRunner, artist);
    }

    await queryRunner.query(`ALTER TABLE "artist" ALTER COLUMN "search_name" SET NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "artist" ADD CONSTRAINT "UQ_e2575ad12e4284eb040cf5b55c0" UNIQUE ("name", "search_name")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "artist" DROP CONSTRAINT "UQ_e2575ad12e4284eb040cf5b55c0"`,
    );

    await queryRunner.query(`ALTER TABLE "artist" DROP COLUMN "search_name"`);
  }

  async updateColumns(queryRunner: QueryRunner, artist: Artist) {
    const delimiter = ' ';
    const searchNameDelimiter = '_';
    const { id, name } = artist;
    const parsed = name.trim().split(/\s+/);
    const firstName = parsed.pop();
    const newName = parsed.length > 0 ? firstName + delimiter + parsed.join(delimiter) : firstName;
    await queryRunner.manager.update(Artist, id, {
      name: newName,
      search_name: newName!.split(/\s+/).join(searchNameDelimiter),
    });
  }
}
