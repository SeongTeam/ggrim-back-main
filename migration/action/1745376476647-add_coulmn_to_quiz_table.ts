import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCoulmnToQuizTable1745376476647 implements MigrationInterface {
  name = 'AddCoulmnToQuizTable1745376476647';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "quiz" ADD "view_count" integer NOT NULL DEFAULT '0'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "quiz" DROP COLUMN "view_count"`);
  }
}
