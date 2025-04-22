import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateQuizTable1745295464065 implements MigrationInterface {
  name = 'UpdateQuizTable1745295464065';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "quiz" DROP CONSTRAINT "FK_be83e259b70f9b1d2eb25bd049c"`);
    await queryRunner.query(`ALTER TABLE "quiz" ALTER COLUMN "owner_id" SET NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "quiz" ADD CONSTRAINT "FK_be83e259b70f9b1d2eb25bd049c" FOREIGN KEY ("owner_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "quiz" DROP CONSTRAINT "FK_be83e259b70f9b1d2eb25bd049c"`);
    await queryRunner.query(`ALTER TABLE "quiz" ALTER COLUMN "owner_id" DROP NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "quiz" ADD CONSTRAINT "FK_be83e259b70f9b1d2eb25bd049c" FOREIGN KEY ("owner_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
