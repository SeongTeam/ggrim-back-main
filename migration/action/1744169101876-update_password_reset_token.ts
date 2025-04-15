import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdatePasswordResetToken1744169101876 implements MigrationInterface {
  name = 'UpdatePasswordResetToken1744169101876';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "password_reset_token" ADD "created_date" TIMESTAMP(6) WITH TIME ZONE NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone`,
    );
    await queryRunner.query(
      `ALTER TABLE "password_reset_token" ADD "updated_date" TIMESTAMP(6) WITH TIME ZONE DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "password_reset_token" ADD "deleted_date" TIMESTAMP(6) WITH TIME ZONE`,
    );
    await queryRunner.query(`ALTER TABLE "password_reset_token" ADD "version" integer`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "password_reset_token" DROP COLUMN "version"`);
    await queryRunner.query(`ALTER TABLE "password_reset_token" DROP COLUMN "deleted_date"`);
    await queryRunner.query(`ALTER TABLE "password_reset_token" DROP COLUMN "updated_date"`);
    await queryRunner.query(`ALTER TABLE "password_reset_token" DROP COLUMN "created_date"`);
  }
}
