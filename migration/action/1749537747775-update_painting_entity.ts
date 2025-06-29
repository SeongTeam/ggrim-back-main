import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdatePaintingEntity1749537747775 implements MigrationInterface {
    name = 'UpdatePaintingEntity1749537747775'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "painting" ADD "image_s3_key" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "painting" DROP COLUMN "image_s3_key"`);
    }

}
