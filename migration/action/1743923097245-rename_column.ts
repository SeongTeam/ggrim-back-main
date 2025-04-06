import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameColumn1743923097245 implements MigrationInterface {
  name = 'RenameColumn1743923097245';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" RENAME COLUMN "last_login_at" TO "last_login_date"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "last_login_date" TYPE TIMESTAMP(6) WITH TIME ZONE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "last_login_date" TYPE TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" RENAME COLUMN "last_login_date" TO "last_login_at"`,
    );
  }
}
