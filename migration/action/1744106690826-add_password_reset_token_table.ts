import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPasswordResetTokenTable1744106690826 implements MigrationInterface {
  name = 'AddPasswordResetTokenTable1744106690826';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "password_reset_token" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "token" character varying NOT NULL, "is_used" boolean NOT NULL DEFAULT false, "expired_date" TIMESTAMP NOT NULL, CONSTRAINT "PK_838af121380dfe3a6330e04f5bb" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "password_reset_token"`);
  }
}
