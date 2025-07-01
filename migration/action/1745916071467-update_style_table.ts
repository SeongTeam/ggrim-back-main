import { MigrationInterface, QueryRunner } from "typeorm";
import { Style } from "../../src/modules/style/entities/style.entity";

export class UpdateStyleTable1745916071467 implements MigrationInterface {
	name = "UpdateStyleTable1745916071467";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "style" ADD "search_name" character varying`);

		const styles: Style[] = await queryRunner.manager.find(Style);

		for (const style of styles) {
			const { id, name } = style;
			const search_name = name.trim().split(/\s+/).join("_").toUpperCase();
			await queryRunner.manager.update(Style, id, { search_name });
		}

		await queryRunner.query(`ALTER TABLE style ALTER COLUMN "search_name" SET NOT NULL`);
		await queryRunner.query(
			`ALTER TABLE "style" DROP CONSTRAINT "UQ_94e29b400febaa2e72ab6fbdf59"`,
		);
		await queryRunner.query(
			`ALTER TABLE "style" ADD CONSTRAINT "UQ_900413e0d2d9e5b93c1ac00106b" UNIQUE ("name", "search_name")`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "style" DROP CONSTRAINT "UQ_900413e0d2d9e5b93c1ac00106b"`,
		);
		await queryRunner.query(
			`ALTER TABLE "style" ADD CONSTRAINT "UQ_94e29b400febaa2e72ab6fbdf59" UNIQUE ("name")`,
		);
		await queryRunner.query(`ALTER TABLE "style" DROP COLUMN "search_name"`);
	}
}
