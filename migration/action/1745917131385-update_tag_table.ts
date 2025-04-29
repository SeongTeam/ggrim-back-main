import { isEmpty } from 'class-validator';
import { MigrationInterface, QueryRunner } from 'typeorm';
import { Tag } from '../../src/tag/entities/tag.entity';

export class UpdateTagTable1745917131385 implements MigrationInterface {
  name = 'UpdateTagTable1745917131385';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tag" ADD "search_name" character varying`);

    const tags: Tag[] = await queryRunner.manager.find(Tag, { withDeleted: true });

    for (const tag of tags) {
      const { id, name } = tag;
      const search_name = name.trim().split(/\s+/).join('_').toUpperCase();
      if (isEmpty(search_name)) {
        throw new Error('search_name is empty.' + `${id} , ${name}`);
      }
      await queryRunner.manager.update(Tag, id, { search_name });
    }

    await queryRunner.query(`ALTER TABLE "tag" ALTER COLUMN "search_name" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "tag" ALTER COLUMN "name" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "tag" DROP CONSTRAINT "UQ_6a9775008add570dc3e5a0bab7b"`);
    await queryRunner.query(
      `ALTER TABLE "tag" ADD CONSTRAINT "UQ_a11074d21d264b5a66c0e90fd19" UNIQUE ("name", "search_name")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tag" DROP CONSTRAINT "UQ_a11074d21d264b5a66c0e90fd19"`);
    await queryRunner.query(
      `ALTER TABLE "tag" ADD CONSTRAINT "UQ_6a9775008add570dc3e5a0bab7b" UNIQUE ("name")`,
    );
    await queryRunner.query(`ALTER TABLE "tag" DROP COLUMN "search_name"`);
  }
}
