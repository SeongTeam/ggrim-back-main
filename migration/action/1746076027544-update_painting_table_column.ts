import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdatePaintingTableColumn1746076027544 implements MigrationInterface {
    name = 'UpdatePaintingTableColumn1746076027544'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "painting" ALTER COLUMN "searchTitle" DROP DEFAULT`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "painting" ALTER COLUMN "searchTitle" SET DEFAULT ''`);
    }

}
