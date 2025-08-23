import { MigrationInterface, QueryRunner } from "typeorm";

export class DeleteWikiArtPaintingTable1755939546696 implements MigrationInterface {
	name = "DeleteWikiArtPaintingTable1755939546696";
	public async up(queryRunner: QueryRunner): Promise<void> {
		console.log("hello");
		await queryRunner.query(
			`ALTER TABLE "painting" DROP CONSTRAINT "FK_8a6c1fa27e5649966020a14d3fc"`,
		);
		await queryRunner.query(
			`ALTER TABLE "painting" DROP CONSTRAINT "REL_5e1493c3ed88ab7685bfdad081"`,
		);
		await queryRunner.query(`ALTER TABLE "painting" DROP COLUMN "wikiArtPaintingWikiArtId"`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "painting" ADD "wikiArtPaintingWikiArtId" character varying`,
		);
		await queryRunner.query(
			`ALTER TABLE "painting" ADD CONSTRAINT "REL_5e1493c3ed88ab7685bfdad081" UNIQUE ("wikiArtPaintingWikiArtId")`,
		);
		await queryRunner.query(
			`ALTER TABLE "painting" ADD CONSTRAINT "FK_8a6c1fa27e5649966020a14d3fc" FOREIGN KEY ("wikiArtPaintingWikiArtId") REFERENCES "wiki_art_painting"("wikiArtId") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
	}
}
