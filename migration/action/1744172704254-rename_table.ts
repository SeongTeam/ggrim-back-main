import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameTable1744172704254 implements MigrationInterface {
  name = 'RenameTable1744172704254';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "password_reset_token" RENAME TO "one_time_token"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "one_time_token" RENAME TO "password_reset_token"`);
  }
}
