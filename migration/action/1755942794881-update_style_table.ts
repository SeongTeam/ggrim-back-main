import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateStyleTable1755942794881 implements MigrationInterface {
	name = "UpdateStyleTable1755942794881";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "style" DROP CONSTRAINT "UQ_900413e0d2d9e5b93c1ac00106b"`,
		);
		await queryRunner.query(`ALTER TABLE "style" ALTER COLUMN "name" SET NOT NULL`);
		await queryRunner.query(
			`ALTER TABLE "style" ADD CONSTRAINT "UQ_900413e0d2d9e5b93c1ac00106b" UNIQUE ("name", "search_name")`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "style" DROP CONSTRAINT "UQ_900413e0d2d9e5b93c1ac00106b"`,
		);
		await queryRunner.query(`ALTER TABLE "style" ALTER COLUMN "name" DROP NOT NULL`);
		await queryRunner.query(
			`ALTER TABLE "style" ADD CONSTRAINT "UQ_900413e0d2d9e5b93c1ac00106b" UNIQUE ("name", "search_name")`,
		);
	}
}
