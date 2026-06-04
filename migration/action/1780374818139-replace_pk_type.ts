import { MigrationInterface, QueryRunner } from "typeorm";

export class ReplacePkType1780374818139 implements MigrationInterface {
	name = "ReplacePkType1780374818139";
	tableDependencies = [
		{
			table: "artist",
			pkConstraint: "PK_55b76e71568b5db4d01d3e394ed",
			children: [
				{
					table: "quiz_artists_artist",
					fKey: "artistId",
					constraint: "FK_046249625db687f330d0530b3fc",
					isNull: false,
					newFkConstraint: "fk_artist_id",
				},
				{
					table: "painting",
					fKey: "artistId",
					constraint: "FK_68effaf7fce95617a345e22996d",
					isNull: true,
					newFkConstraint: "fk_artist_id",
				},
			],
		},
		{
			table: "one_time_token",
			pkConstraint: "PK_838af121380dfe3a6330e04f5bb",
			children: [],
		},
		{
			table: "painting",
			pkConstraint: "PK_e365c0ac3bda89f26307b3f745e",
			children: [
				{
					table: "quiz_answer_paintings_painting",
					fKey: "paintingId",
					constraint: "FK_8db6addfed02f52039f22b50e87",
					isNull: false,
					newFkConstraint: "fk_painting_id",
				},
				{
					table: "quiz",
					fKey: "examplePaintingId",
					constraint: "FK_97d502acbe3a6de581d9cb9f55e",
					isNull: true,
					newFkConstraint: "fk_example_painting_id",
				},
				{
					table: "painting_tags_tag",
					fKey: "paintingId",
					constraint: "FK_b7cd92ff4d9f06b600b1f536654",
					isNull: false,
					newFkConstraint: "fk_painting_id",
				},
				{
					table: "painting_styles_style",
					fKey: "paintingId",
					constraint: "FK_f68dcd14047488ff8518b93c45f",
					isNull: false,
					newFkConstraint: "fk_painting_id",
				},
				{
					table: "quiz_distractor_paintings_painting",
					fKey: "paintingId",
					constraint: "FK_ff2378a286cb752def60f991ddc",
					isNull: false,
					newFkConstraint: "fk_painting_id",
				},
			],
		},
		{
			table: "quiz",
			pkConstraint: "PK_422d974e7217414e029b3e641d0",
			children: [
				{
					table: "quiz_artists_artist",
					fKey: "quizId",
					constraint: "FK_0720641bd6fcc3c398838174810",
					isNull: false,
					newFkConstraint: "fk_quiz_id",
				},
				{
					table: "quiz_styles_style",
					constraint: "FK_2af58da5e7b5f28a0c4da9249f9",
					fKey: "quizId",
					isNull: false,
					newFkConstraint: "fk_quiz_id",
				},
				{
					table: "quiz_distractor_paintings_painting",
					constraint: "FK_47eaa587a32ffa4db0222ded6b1",
					fKey: "quizId",
					isNull: false,
					newFkConstraint: "fk_quiz_id",
				},
				{
					table: "quiz_answer_paintings_painting",
					constraint: "FK_5131ed94f07d784d233242b8572",
					fKey: "quizId",
					isNull: false,
					newFkConstraint: "fk_quiz_id",
				},
				{
					table: "quiz_tags_tag",
					constraint: "FK_967a66c52a31d3fdef7d8600a49",
					fKey: "quizId",
					isNull: false,
					newFkConstraint: "fk_quiz_id",
				},
				{
					table: "quiz_like",
					constraint: "FK_b20157f369a60709991535f5a8d",
					fKey: "quiz_id",
					isNull: false,
					newFkConstraint: "fk_quiz_id",
				},
				{
					table: "quiz_dislike",
					constraint: "FK_b8033f0c77659c32e8903d4d8b5",
					fKey: "quiz_id",
					isNull: false,
					newFkConstraint: "fk_quiz_id",
				},
			],
		},
		{
			table: "quiz_dislike",
			pkConstraint: "PK_54f98d5f852e75d52e8a51825ed",
			uniqueConstraint: {
				constraint: "UQ_11a3a7152b5e23a0ec3f67983d6",
				columns: ["user_id", "quiz_id"],
				newConstraint: "uq_user_quiz_dislike",
			},
			children: [],
		},
		{
			table: "quiz_like",
			pkConstraint: "PK_79e0a89273bcd881c1dfa854a73",
			uniqueConstraint: {
				constraint: "UQ_8da3653df7f06fcfa481ed5a2ff",
				columns: ["user_id", "quiz_id"],
				newConstraint: "uq_user_quiz_like",
			},
			children: [],
		},
		{
			table: "style",
			pkConstraint: "PK_12a3ba7fe23b5386181ac6b0ac0",
			children: [
				{
					table: "quiz_styles_style",
					constraint: "FK_39c768de870e475e8a039e80c80",
					fKey: "styleId",
					isNull: false,
					newFkConstraint: "fk_style_id",
				},
				{
					table: "painting_styles_style",
					constraint: "FK_5233496e672504a201cf48fcef3",
					fKey: "styleId",
					isNull: false,
					newFkConstraint: "fk_style_id",
				},
			],
		},
		{
			table: "tag",
			pkConstraint: "PK_8e4052373c579afc1471f526760",
			children: [
				{
					table: "quiz_tags_tag",
					constraint: "FK_39656912e32038fc8ec251f24a3",
					fKey: "tagId",
					isNull: false,
					newFkConstraint: "fk_tag_id",
				},
				{
					table: "painting_tags_tag",
					constraint: "FK_4076e14c81becbc117fc6b16be4",
					fKey: "tagId",
					isNull: false,
					newFkConstraint: "fk_tag_id",
				},
			],
		},
		{
			table: "user",
			pkConstraint: "PK_cace4a159ff9f2512dd42373760",
			children: [
				{
					table: "one_time_token",
					constraint: "FK_8b28059f6bee21e69d42224bbb1",
					fKey: "user_id",
					isNull: true,
					newFkConstraint: "fk_user_id",
				},
				{
					table: "quiz",
					constraint: "FK_be83e259b70f9b1d2eb25bd049c",
					fKey: "owner_id",
					isNull: false,
					newFkConstraint: "fk_owner_id",
				},
				{
					table: "quiz_like",
					constraint: "FK_c63aedb8a9f324e9bd4d0fa4657",
					fKey: "user_id",
					isNull: false,
					newFkConstraint: "fk_owner_id",
				},
				{
					table: "quiz_dislike",
					constraint: "FK_e55f1c2fa9fc10e5c48311e425c",
					fKey: "user_id",
					isNull: false,
					newFkConstraint: "fk_owner_id",
				},
			],
		},
		{
			table: "verification",
			pkConstraint: "PK_f7e3a90ca384e71d6e2e93bb340",
			children: [],
		},
	];

	public async up(queryRunner: QueryRunner): Promise<void> {
		//0. 테이블에서 기존 UQ 제약 조건 삭제
		for (const dep of this.tableDependencies) {
			const { table: parentTable, uniqueConstraint } = dep;

			if (uniqueConstraint) {
				const { constraint } = uniqueConstraint;
				console.log(`${parentTable} 테이블에서 기존 UQ 제약 조건 삭제`);
				await queryRunner.query(
					`ALTER TABLE core.${parentTable} DROP CONSTRAINT "${constraint}"`,
				);
			}
		}

		for (const dep of this.tableDependencies) {
			const { table: parentTable, pkConstraint, children } = dep;
			const newPKey = "new_pk_id";
			//1. 부모 및 자식 테이블에 새로운 INT 컬럼 추가
			console.log(`${parentTable} 테이블에 새로운 INT 컬럼 추가`);
			await queryRunner.query(`ALTER TABLE core.${parentTable} ADD COLUMN ${newPKey} INT`);

			await queryRunner.query(`UPDATE core.${parentTable}
					SET ${newPKey} = sub.seq
					FROM ( 
						SELECT id, row_number() over (ORDER BY created_date ASC) as seq
						FROM core.${parentTable}
					) sub
					WHERE core.${parentTable}.id = sub.id`);

			await queryRunner.query(
				`ALTER TABLE core.${parentTable} ALTER COLUMN ${newPKey} SET NOT NULL`,
			);

			await queryRunner.query(
				`ALTER TABLE core.${parentTable} ALTER COLUMN ${newPKey} ADD GENERATED ALWAYS AS IDENTITY`,
			);
			await queryRunner.query(
				`SELECT setval(pg_get_serial_sequence('core.${parentTable}', '${newPKey}'), COALESCE(MAX(${newPKey}), 0) + 1, false) FROM core.${parentTable}`,
			);

			for (const { table: childTable, fKey, isNull, constraint } of children) {
				const newFKey = `"new_${fKey}"`;
				//2. 자식 테이블의 새로운 FK 컬럼에 부모의 자식 INT값 매핑
				console.log(`${childTable} 테이블에 새로운 INT 컬럼 추가`);
				await queryRunner.query(`ALTER TABLE core.${childTable} ADD COLUMN ${newFKey} INT`);

				await queryRunner.query(`
						UPDATE core.${childTable} c 
						SET ${newFKey} = p.${newPKey} 
						FROM core.${parentTable} p 
						WHERE c."${fKey}" = p.id
					`);

				//3. 자식 테이블의 새 FK 컬럼을 NOT NULL로 변경(선택)
				console.log(`${childTable} 테이블에 새로운 FK NOT NULL 제약조건 추가`);
				if (!isNull) {
					await queryRunner.query(
						`ALTER TABLE core.${childTable} ALTER COLUMN ${newFKey} SET NOT NULL`,
					);
				}

				//4. 자식 테이블에서 FK 제약 조건과 컬럼 삭제
				console.log(`${childTable} 테이블에 기존 FK 제약조건 및 컬럼 삭제`);
				await queryRunner.query(
					`ALTER TABLE core.${childTable} DROP CONSTRAINT "${constraint}"`,
				);
				await queryRunner.query(`ALTER TABLE core.${childTable} DROP COLUMN "${fKey}"`);
			}
			//5. 부모 테이블에서 PK 제약 조건 및 컬럼 삭제
			console.log(`${parentTable} 테이블에 기존 PK 제약조건 및 컬럼 삭제`);
			await queryRunner.query(
				`ALTER TABLE core.${parentTable} DROP CONSTRAINT "${pkConstraint}"`,
			);
			await queryRunner.query(`ALTER TABLE core.${parentTable} DROP COLUMN id`);

			//6. 부모 테이블에 새로운 컬럼을 PK로 지정
			const newPKConstraint = `pk_${parentTable}`;
			console.log(`${parentTable} 테이블에 ${newPKConstraint} 제약조건 설정`);
			await queryRunner.query(
				`ALTER TABLE core.${parentTable} RENAME COLUMN ${newPKey} TO id`,
			);
			await queryRunner.query(
				`ALTER TABLE core.${parentTable} ADD CONSTRAINT ${newPKConstraint} PRIMARY KEY (id)`,
			);

			//7. 자식 테이블에 새로운 컬럼을 FK로 지정
			for (const { table: childTable, fKey, newFkConstraint } of children) {
				const newFKey = `"new_${fKey}"`;
				console.log(`${childTable} 테이블에 ${newFkConstraint} 제약조건 설정`);
				await queryRunner.query(
					`ALTER TABLE core.${childTable} RENAME COLUMN ${newFKey} TO "${fKey}"`,
				);
				await queryRunner.query(
					`ALTER TABLE core.${childTable} ADD CONSTRAINT ${newFkConstraint}
						FOREIGN KEY ("${fKey}") REFERENCES core.${parentTable}(id)
						`,
				);
			}
		}

		//8. 테이블에서 기존 UQ 조건 재설정
		for (const dep of this.tableDependencies) {
			const { table: parentTable, uniqueConstraint } = dep;
			if (uniqueConstraint) {
				console.log(
					`${parentTable} 테이블에 ${uniqueConstraint?.newConstraint} 제약조건 설정`,
				);
				const { newConstraint, columns } = uniqueConstraint;
				const targetColumnArg = columns.map((c) => `"${c}"`).join(",");
				await queryRunner.query(
					`ALTER TABLE core.${parentTable} ADD CONSTRAINT ${newConstraint} UNIQUE (${targetColumnArg})`,
				);
			}
		}
	}

	public async down(): Promise<void> {}
}
