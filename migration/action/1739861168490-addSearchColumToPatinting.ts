import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSearchColumToPainting1739861168490 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "painting" ADD "searchTitle" text NOT NULL DEFAULT ''`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "painting" DROP COLUMN "searchTitle"`);
  }
}
