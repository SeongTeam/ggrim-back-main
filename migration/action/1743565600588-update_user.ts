import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateUser1743565600588 implements MigrationInterface {
  name = 'UpdateUser1743565600588';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD "active" character varying NOT NULL DEFAULT 'active'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "active"`);
  }
}
