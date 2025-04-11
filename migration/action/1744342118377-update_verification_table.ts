import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateVerificationTable1744342118377 implements MigrationInterface {
  name = 'UpdateVerificationTable1744342118377';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "verification" DROP COLUMN "is_verified"`);
    await queryRunner.query(`ALTER TABLE "verification" ADD "verification_success_date" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "verification" ADD "last_verified_date" TIMESTAMP`);
    await queryRunner.query(
      `ALTER TABLE "verification" DROP CONSTRAINT "UQ_f553f5313c43fdf919c0627eb7b"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "verification" ADD CONSTRAINT "UQ_f553f5313c43fdf919c0627eb7b" UNIQUE ("email")`,
    );
    await queryRunner.query(`ALTER TABLE "verification" DROP COLUMN "last_verified_date"`);
    await queryRunner.query(`ALTER TABLE "verification" DROP COLUMN "verification_success_date"`);
    await queryRunner.query(
      `ALTER TABLE "verification" ADD "is_verified" boolean NOT NULL DEFAULT false`,
    );
  }
}
