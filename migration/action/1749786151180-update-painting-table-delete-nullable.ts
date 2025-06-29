import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdatePaintingTableDeleteNullable1749786151180 implements MigrationInterface {
    name = 'UpdatePaintingTableDeleteNullable1749786151180'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "painting" ALTER COLUMN "image_url" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "painting" ALTER COLUMN "width" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "painting" ALTER COLUMN "height" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "painting" ALTER COLUMN "image_s3_key" SET NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "painting" ALTER COLUMN "image_s3_key" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "painting" ALTER COLUMN "height" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "painting" ALTER COLUMN "width" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "painting" ALTER COLUMN "image_url" DROP NOT NULL`);
    }

}
