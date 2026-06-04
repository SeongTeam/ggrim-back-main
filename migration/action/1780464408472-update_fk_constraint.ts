import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateFkConstraint1780464408472 implements MigrationInterface {
	//제약 조건 변경
	//quiz_like fk_owner_id -> fk_user_id로 이름 변경
	//quiz_dislike fk_owner_id -> fk_user_id로 이름 변경
	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE core.quiz_like RENAME CONSTRAINT fk_owner_id TO fk_user_id`,
		);
		await queryRunner.query(
			`ALTER TABLE core.quiz_dislike RENAME CONSTRAINT fk_owner_id TO fk_user_id`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {}
}
