import { MigrationInterface, QueryRunner } from "typeorm";
import { Painting } from "../../src/modules/painting/entities/painting.entity";

export class UpdatePaintingTableSearchTitleColumn1746076488959 implements MigrationInterface {
	public async up(queryRunner: QueryRunner): Promise<void> {
		const paintings: Painting[] = await queryRunner.manager.find(Painting);
		for (const painting of paintings) {
			const { id, title } = painting;
			await queryRunner.manager.update(Painting, id, {
				searchTitle: title.trim().split(/\s+/).join("_").toUpperCase(),
			});
		}
	}

	public async down(queryRunner: QueryRunner): Promise<void> {}
}
