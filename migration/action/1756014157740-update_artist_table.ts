import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateArtistTable1756014157740 implements MigrationInterface {
	name = "UpdateArtistTable1756014157740";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "artist" DROP COLUMN "birth_date"`);
		await queryRunner.query(`ALTER TABLE "artist" ADD "birth_date" date`);
		await queryRunner.query(`ALTER TABLE "artist" DROP COLUMN "death_date"`);
		await queryRunner.query(`ALTER TABLE "artist" ADD "death_date" date`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "artist" DROP COLUMN "death_date"`);
		await queryRunner.query(`ALTER TABLE "artist" ADD "death_date" TIME`);
		await queryRunner.query(`ALTER TABLE "artist" DROP COLUMN "birth_date"`);
		await queryRunner.query(`ALTER TABLE "artist" ADD "birth_date" TIME`);
	}
}
