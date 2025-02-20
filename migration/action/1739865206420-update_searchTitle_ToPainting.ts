import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateSearchTitleToPainting1739865206420 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "painting" SET "searchTitle" = UPPER("title") WHERE title IS NOT NULL;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 원래 상태로 되돌리는 기능을 구현할 수 없음 (단방향 변경)
    console.warn(
      'This migration is not reversible because the original searchTitle values are lost.',
    );
  }
}
