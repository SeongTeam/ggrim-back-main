import { MigrationInterface, QueryRunner } from 'typeorm';

export class SetDefaultQuizOnwer1745294597919 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `        UPDATE quiz
              SET owner_id = u.id
              FROM "user" u
              WHERE u.username = $1`,
      ['coldplay'],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
