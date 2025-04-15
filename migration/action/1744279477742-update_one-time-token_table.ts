import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateOneTimeTokenTable1744279477742 implements MigrationInterface {
  name = 'UpdateOneTimeTokenTable1744279477742';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "one_time_token" DROP CONSTRAINT "FK_8b28059f6bee21e69d42224bbb1"`,
    );
    await queryRunner.query(`ALTER TABLE "one_time_token" ALTER COLUMN "user_id" SET NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "one_time_token" ADD CONSTRAINT "FK_8b28059f6bee21e69d42224bbb1" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "one_time_token" DROP CONSTRAINT "FK_8b28059f6bee21e69d42224bbb1"`,
    );
    await queryRunner.query(`ALTER TABLE "one_time_token" ALTER COLUMN "user_id" DROP NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "one_time_token" ADD CONSTRAINT "FK_8b28059f6bee21e69d42224bbb1" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
