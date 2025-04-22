import { MigrationInterface, QueryRunner } from 'typeorm';

export class RelateQuizUser1745294479866 implements MigrationInterface {
  name = 'RelateQuizUser1745294479866';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "quiz" ADD "owner_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "quiz" ADD CONSTRAINT "FK_be83e259b70f9b1d2eb25bd049c" FOREIGN KEY ("owner_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "quiz" DROP CONSTRAINT "FK_be83e259b70f9b1d2eb25bd049c"`);
    await queryRunner.query(`ALTER TABLE "quiz" DROP COLUMN "owner_id"`);
  }
}
