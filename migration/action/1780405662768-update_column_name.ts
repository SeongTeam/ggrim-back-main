import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateColumnName1780405662768 implements MigrationInterface {
	name = "UpdateColumnName1780405662768";

	targets = [
		{
			table: "painting",
			beforeColumn: ["artistId"],
			afterColumn: ["artist_id"],
		},
		{
			table: "quiz",
			beforeColumn: ["examplePaintingId", "owner_id"],
			afterColumn: ["example_painting_id", "user_id"],
		},
		{
			table: "painting_styles_style",
			beforeColumn: ["paintingId", "styleId"],
			afterColumn: ["painting_id", "style_id"],
		},
		{
			table: "painting_tags_tag",
			beforeColumn: ["paintingId", "tagId"],
			afterColumn: ["painting_id", "tag_id"],
		},
		{
			table: "quiz_distractor_paintings_painting",
			beforeColumn: ["paintingId", "quizId"],
			afterColumn: ["painting_id", "quiz_id"],
		},
		{
			table: "quiz_answer_paintings_painting",
			beforeColumn: ["paintingId", "quizId"],
			afterColumn: ["painting_id", "quiz_id"],
		},
		{
			table: "quiz_artists_artist",
			beforeColumn: ["artistId", "quizId"],
			afterColumn: ["artist_id", "quiz_id"],
		},
		{
			table: "quiz_tags_tag",
			beforeColumn: ["tagId", "quizId"],
			afterColumn: ["tag_id", "quiz_id"],
		},
		{
			table: "quiz_styles_style",
			beforeColumn: ["styleId", "quizId"],
			afterColumn: ["style_id", "quiz_id"],
		},
	];

	public async up(queryRunner: QueryRunner): Promise<void> {
		for (const { table, beforeColumn, afterColumn } of this.targets) {
			if (beforeColumn.length !== afterColumn.length) {
				throw new Error(`${table} column is not match`);
			}

			for (let i = 0; i < beforeColumn.length; i++) {
				await queryRunner.query(
					`ALTER TABLE core.${table} RENAME COLUMN "${beforeColumn[i]}" TO ${afterColumn[i]}`,
				);
			}
		}
	}

	public async down(queryRunner: QueryRunner): Promise<void> {}
}
