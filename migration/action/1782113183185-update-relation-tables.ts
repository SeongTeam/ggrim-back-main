import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateRelationTables1782113183185 implements MigrationInterface {
	name = "UpdateRelationTables1782113183185";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "quiz" DROP CONSTRAINT "fk_owner_id"`);
		await queryRunner.query(
			`ALTER TABLE "painting_styles_style" DROP CONSTRAINT "fk_painting_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "painting_styles_style" DROP CONSTRAINT "fk_style_id"`,
		);
		await queryRunner.query(`ALTER TABLE "painting_tags_tag" DROP CONSTRAINT "fk_painting_id"`);
		await queryRunner.query(`ALTER TABLE "painting_tags_tag" DROP CONSTRAINT "fk_tag_id"`);
		await queryRunner.query(
			`ALTER TABLE "quiz_distractor_paintings_painting" DROP CONSTRAINT "fk_painting_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "quiz_distractor_paintings_painting" DROP CONSTRAINT "fk_quiz_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "quiz_answer_paintings_painting" DROP CONSTRAINT "fk_painting_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "quiz_answer_paintings_painting" DROP CONSTRAINT "fk_quiz_id"`,
		);
		await queryRunner.query(`ALTER TABLE "quiz_artists_artist" DROP CONSTRAINT "fk_artist_id"`);
		await queryRunner.query(`ALTER TABLE "quiz_artists_artist" DROP CONSTRAINT "fk_quiz_id"`);
		await queryRunner.query(`ALTER TABLE "quiz_tags_tag" DROP CONSTRAINT "fk_quiz_id"`);
		await queryRunner.query(`ALTER TABLE "quiz_tags_tag" DROP CONSTRAINT "fk_tag_id"`);
		await queryRunner.query(`ALTER TABLE "quiz_styles_style" DROP CONSTRAINT "fk_quiz_id"`);
		await queryRunner.query(`ALTER TABLE "quiz_styles_style" DROP CONSTRAINT "fk_style_id"`);
		await queryRunner.query(
			`ALTER TABLE "painting_styles_style" ADD CONSTRAINT "PK_f715a0cff0e21bf843c6dc8c43d" PRIMARY KEY ("style_id", "painting_id")`,
		);
		await queryRunner.query(
			`ALTER TABLE "painting_tags_tag" ADD CONSTRAINT "PK_0a27c12167145effe9a600c3f5e" PRIMARY KEY ("tag_id", "painting_id")`,
		);
		await queryRunner.query(
			`ALTER TABLE "quiz_distractor_paintings_painting" ADD CONSTRAINT "PK_e98cbfa16298a88715395c1ade2" PRIMARY KEY ("quiz_id", "painting_id")`,
		);
		await queryRunner.query(
			`ALTER TABLE "quiz_answer_paintings_painting" ADD CONSTRAINT "PK_772319ce19c8b9f6a1a2e7a9024" PRIMARY KEY ("quiz_id", "painting_id")`,
		);
		await queryRunner.query(
			`ALTER TABLE "quiz_artists_artist" ADD CONSTRAINT "PK_2e5f91b5ac9b7db6ee5b6eaa5bb" PRIMARY KEY ("quiz_id", "artist_id")`,
		);
		await queryRunner.query(
			`ALTER TABLE "quiz_tags_tag" ADD CONSTRAINT "PK_7ab37526c82617888d168e22247" PRIMARY KEY ("quiz_id", "tag_id")`,
		);
		await queryRunner.query(
			`ALTER TABLE "quiz_styles_style" ADD CONSTRAINT "PK_bc9197301514315cda3693a1a27" PRIMARY KEY ("quiz_id", "style_id")`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_302c110a5ab08f47af33a616bd" ON "painting_styles_style" ("style_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_52d9bac47cdfb1c336d4cfeec0" ON "painting_styles_style" ("painting_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_e9195d20909ac98a16a47afc11" ON "painting_tags_tag" ("tag_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_f61e932b8f7e70a5d180d3022f" ON "painting_tags_tag" ("painting_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_4f2746f527ba3f16d320d51015" ON "quiz_distractor_paintings_painting" ("quiz_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_be96e94e5132f0dda05072e475" ON "quiz_distractor_paintings_painting" ("painting_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_aa8e660e2643955aaa1765d0a2" ON "quiz_answer_paintings_painting" ("quiz_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_c422cec2c78dda74884ecb759c" ON "quiz_answer_paintings_painting" ("painting_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_43bc70deced8210a0d68ee681b" ON "quiz_artists_artist" ("quiz_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_0220e07b41ec83e5d6935fd16a" ON "quiz_artists_artist" ("artist_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_1c4651f0355c5b1bcd86175237" ON "quiz_tags_tag" ("quiz_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_75808f039141101793c41d2717" ON "quiz_tags_tag" ("tag_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_b1f116359c3b51c3f795f41a10" ON "quiz_styles_style" ("quiz_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_e5e1e7374055ec3f3b76bc4bc6" ON "quiz_styles_style" ("style_id") `,
		);
		await queryRunner.query(
			`ALTER TABLE "quiz" ADD CONSTRAINT "pk_user_id" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "painting_styles_style" ADD CONSTRAINT "fk_style_id" FOREIGN KEY ("style_id") REFERENCES "style"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
		);
		await queryRunner.query(
			`ALTER TABLE "painting_styles_style" ADD CONSTRAINT "fk_painting_id" FOREIGN KEY ("painting_id") REFERENCES "painting"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
		);
		await queryRunner.query(
			`ALTER TABLE "painting_tags_tag" ADD CONSTRAINT "fk_tag_id" FOREIGN KEY ("tag_id") REFERENCES "tag"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
		);
		await queryRunner.query(
			`ALTER TABLE "painting_tags_tag" ADD CONSTRAINT "fk_painting_id" FOREIGN KEY ("painting_id") REFERENCES "painting"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
		);
		await queryRunner.query(
			`ALTER TABLE "quiz_distractor_paintings_painting" ADD CONSTRAINT "fk_quiz_id" FOREIGN KEY ("quiz_id") REFERENCES "quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
		);
		await queryRunner.query(
			`ALTER TABLE "quiz_distractor_paintings_painting" ADD CONSTRAINT "fk_painting_id" FOREIGN KEY ("painting_id") REFERENCES "painting"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
		);
		await queryRunner.query(
			`ALTER TABLE "quiz_answer_paintings_painting" ADD CONSTRAINT "fk_quiz_id" FOREIGN KEY ("quiz_id") REFERENCES "quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
		);
		await queryRunner.query(
			`ALTER TABLE "quiz_answer_paintings_painting" ADD CONSTRAINT "fk_painting_id" FOREIGN KEY ("painting_id") REFERENCES "painting"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
		);
		await queryRunner.query(
			`ALTER TABLE "quiz_artists_artist" ADD CONSTRAINT "fk_quiz_id" FOREIGN KEY ("quiz_id") REFERENCES "quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
		);
		await queryRunner.query(
			`ALTER TABLE "quiz_artists_artist" ADD CONSTRAINT "fk_artist_id" FOREIGN KEY ("artist_id") REFERENCES "artist"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
		);
		await queryRunner.query(
			`ALTER TABLE "quiz_tags_tag" ADD CONSTRAINT "fk_quiz_id" FOREIGN KEY ("quiz_id") REFERENCES "quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
		);
		await queryRunner.query(
			`ALTER TABLE "quiz_tags_tag" ADD CONSTRAINT "fk_tag_id" FOREIGN KEY ("tag_id") REFERENCES "tag"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
		);
		await queryRunner.query(
			`ALTER TABLE "quiz_styles_style" ADD CONSTRAINT "fk_quiz_id" FOREIGN KEY ("quiz_id") REFERENCES "quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
		);
		await queryRunner.query(
			`ALTER TABLE "quiz_styles_style" ADD CONSTRAINT "fk_style_id" FOREIGN KEY ("style_id") REFERENCES "style"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "quiz_styles_style" DROP CONSTRAINT "fk_style_id"`);
		await queryRunner.query(`ALTER TABLE "quiz_styles_style" DROP CONSTRAINT "fk_quiz_id"`);
		await queryRunner.query(`ALTER TABLE "quiz_tags_tag" DROP CONSTRAINT "fk_tag_id"`);
		await queryRunner.query(`ALTER TABLE "quiz_tags_tag" DROP CONSTRAINT "fk_quiz_id"`);
		await queryRunner.query(`ALTER TABLE "quiz_artists_artist" DROP CONSTRAINT "fk_artist_id"`);
		await queryRunner.query(`ALTER TABLE "quiz_artists_artist" DROP CONSTRAINT "fk_quiz_id"`);
		await queryRunner.query(
			`ALTER TABLE "quiz_answer_paintings_painting" DROP CONSTRAINT "fk_painting_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "quiz_answer_paintings_painting" DROP CONSTRAINT "fk_quiz_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "quiz_distractor_paintings_painting" DROP CONSTRAINT "fk_painting_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "quiz_distractor_paintings_painting" DROP CONSTRAINT "fk_quiz_id"`,
		);
		await queryRunner.query(`ALTER TABLE "painting_tags_tag" DROP CONSTRAINT "fk_painting_id"`);
		await queryRunner.query(`ALTER TABLE "painting_tags_tag" DROP CONSTRAINT "fk_tag_id"`);
		await queryRunner.query(
			`ALTER TABLE "painting_styles_style" DROP CONSTRAINT "fk_painting_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "painting_styles_style" DROP CONSTRAINT "fk_style_id"`,
		);
		await queryRunner.query(`ALTER TABLE "quiz" DROP CONSTRAINT "pk_user_id"`);
		await queryRunner.query(`DROP INDEX "core"."IDX_e5e1e7374055ec3f3b76bc4bc6"`);
		await queryRunner.query(`DROP INDEX "core"."IDX_b1f116359c3b51c3f795f41a10"`);
		await queryRunner.query(`DROP INDEX "core"."IDX_75808f039141101793c41d2717"`);
		await queryRunner.query(`DROP INDEX "core"."IDX_1c4651f0355c5b1bcd86175237"`);
		await queryRunner.query(`DROP INDEX "core"."IDX_0220e07b41ec83e5d6935fd16a"`);
		await queryRunner.query(`DROP INDEX "core"."IDX_43bc70deced8210a0d68ee681b"`);
		await queryRunner.query(`DROP INDEX "core"."IDX_c422cec2c78dda74884ecb759c"`);
		await queryRunner.query(`DROP INDEX "core"."IDX_aa8e660e2643955aaa1765d0a2"`);
		await queryRunner.query(`DROP INDEX "core"."IDX_be96e94e5132f0dda05072e475"`);
		await queryRunner.query(`DROP INDEX "core"."IDX_4f2746f527ba3f16d320d51015"`);
		await queryRunner.query(`DROP INDEX "core"."IDX_f61e932b8f7e70a5d180d3022f"`);
		await queryRunner.query(`DROP INDEX "core"."IDX_e9195d20909ac98a16a47afc11"`);
		await queryRunner.query(`DROP INDEX "core"."IDX_52d9bac47cdfb1c336d4cfeec0"`);
		await queryRunner.query(`DROP INDEX "core"."IDX_302c110a5ab08f47af33a616bd"`);
		await queryRunner.query(
			`ALTER TABLE "quiz_styles_style" DROP CONSTRAINT "PK_bc9197301514315cda3693a1a27"`,
		);
		await queryRunner.query(
			`ALTER TABLE "quiz_tags_tag" DROP CONSTRAINT "PK_7ab37526c82617888d168e22247"`,
		);
		await queryRunner.query(
			`ALTER TABLE "quiz_artists_artist" DROP CONSTRAINT "PK_2e5f91b5ac9b7db6ee5b6eaa5bb"`,
		);
		await queryRunner.query(
			`ALTER TABLE "quiz_answer_paintings_painting" DROP CONSTRAINT "PK_772319ce19c8b9f6a1a2e7a9024"`,
		);
		await queryRunner.query(
			`ALTER TABLE "quiz_distractor_paintings_painting" DROP CONSTRAINT "PK_e98cbfa16298a88715395c1ade2"`,
		);
		await queryRunner.query(
			`ALTER TABLE "painting_tags_tag" DROP CONSTRAINT "PK_0a27c12167145effe9a600c3f5e"`,
		);
		await queryRunner.query(
			`ALTER TABLE "painting_styles_style" DROP CONSTRAINT "PK_f715a0cff0e21bf843c6dc8c43d"`,
		);
		await queryRunner.query(
			`ALTER TABLE "quiz_styles_style" ADD CONSTRAINT "fk_style_id" FOREIGN KEY ("style_id", "style_id") REFERENCES "style"("id","id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "quiz_styles_style" ADD CONSTRAINT "fk_quiz_id" FOREIGN KEY ("quiz_id", "quiz_id", "quiz_id", "quiz_id", "quiz_id", "quiz_id", "quiz_id") REFERENCES "quiz"("id","id","id","id","id","id","id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "quiz_tags_tag" ADD CONSTRAINT "fk_tag_id" FOREIGN KEY ("tag_id", "tag_id") REFERENCES "tag"("id","id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "quiz_tags_tag" ADD CONSTRAINT "fk_quiz_id" FOREIGN KEY ("quiz_id", "quiz_id", "quiz_id", "quiz_id", "quiz_id", "quiz_id", "quiz_id") REFERENCES "quiz"("id","id","id","id","id","id","id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "quiz_artists_artist" ADD CONSTRAINT "fk_quiz_id" FOREIGN KEY ("quiz_id", "quiz_id", "quiz_id", "quiz_id", "quiz_id", "quiz_id", "quiz_id") REFERENCES "quiz"("id","id","id","id","id","id","id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "quiz_artists_artist" ADD CONSTRAINT "fk_artist_id" FOREIGN KEY ("artist_id", "artist_id") REFERENCES "artist"("id","id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "quiz_answer_paintings_painting" ADD CONSTRAINT "fk_quiz_id" FOREIGN KEY ("quiz_id", "quiz_id", "quiz_id", "quiz_id", "quiz_id", "quiz_id", "quiz_id") REFERENCES "quiz"("id","id","id","id","id","id","id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "quiz_answer_paintings_painting" ADD CONSTRAINT "fk_painting_id" FOREIGN KEY ("painting_id", "painting_id", "painting_id", "painting_id") REFERENCES "painting"("id","id","id","id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "quiz_distractor_paintings_painting" ADD CONSTRAINT "fk_quiz_id" FOREIGN KEY ("quiz_id", "quiz_id", "quiz_id", "quiz_id", "quiz_id", "quiz_id", "quiz_id") REFERENCES "quiz"("id","id","id","id","id","id","id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "quiz_distractor_paintings_painting" ADD CONSTRAINT "fk_painting_id" FOREIGN KEY ("painting_id", "painting_id", "painting_id", "painting_id") REFERENCES "painting"("id","id","id","id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "painting_tags_tag" ADD CONSTRAINT "fk_tag_id" FOREIGN KEY ("tag_id", "tag_id") REFERENCES "tag"("id","id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "painting_tags_tag" ADD CONSTRAINT "fk_painting_id" FOREIGN KEY ("painting_id", "painting_id", "painting_id", "painting_id") REFERENCES "painting"("id","id","id","id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "painting_styles_style" ADD CONSTRAINT "fk_style_id" FOREIGN KEY ("style_id", "style_id") REFERENCES "style"("id","id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "painting_styles_style" ADD CONSTRAINT "fk_painting_id" FOREIGN KEY ("painting_id", "painting_id", "painting_id", "painting_id") REFERENCES "painting"("id","id","id","id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "quiz" ADD CONSTRAINT "fk_owner_id" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
	}
}
