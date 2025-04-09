import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateOneTimeTokenTables1744175855749 implements MigrationInterface {
  name = 'UpdateOneTimeTokenTables1744175855749';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "one_time_token" DROP COLUMN "is_used"`);
    await queryRunner.query(`ALTER TABLE "one_time_token" ADD "used_date" TIMESTAMP`);
    await queryRunner.query(
      `ALTER TABLE "one_time_token" ADD "purpose" character varying NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "one_time_token" ADD "user_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "one_time_token" ADD CONSTRAINT "FK_8b28059f6bee21e69d42224bbb1" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "one_time_token" DROP CONSTRAINT "FK_8b28059f6bee21e69d42224bbb1"`,
    );
    await queryRunner.query(`ALTER TABLE "one_time_token" DROP COLUMN "user_id"`);
    await queryRunner.query(`ALTER TABLE "one_time_token" DROP COLUMN "purpose"`);
    await queryRunner.query(`ALTER TABLE "one_time_token" DROP COLUMN "used_date"`);
    await queryRunner.query(
      `ALTER TABLE "one_time_token" ADD "is_used" boolean NOT NULL DEFAULT false`,
    );
  }
}
