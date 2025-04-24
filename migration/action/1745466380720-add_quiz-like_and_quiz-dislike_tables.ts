import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddQuizLikeAndQuizDislikeTables1745466380720 implements MigrationInterface {
  name = 'AddQuizLikeAndQuizDislikeTables1745466380720';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "quiz_like" ("created_date" TIMESTAMP(6) WITH TIME ZONE NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "updated_date" TIMESTAMP(6) WITH TIME ZONE DEFAULT now(), "deleted_date" TIMESTAMP(6) WITH TIME ZONE, "version" integer, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "quiz_id" uuid NOT NULL, CONSTRAINT "UQ_8da3653df7f06fcfa481ed5a2ff" UNIQUE ("user_id", "quiz_id"), CONSTRAINT "PK_79e0a89273bcd881c1dfa854a73" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "quiz_dislike" ("created_date" TIMESTAMP(6) WITH TIME ZONE NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "updated_date" TIMESTAMP(6) WITH TIME ZONE DEFAULT now(), "deleted_date" TIMESTAMP(6) WITH TIME ZONE, "version" integer, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "quiz_id" uuid NOT NULL, CONSTRAINT "UQ_11a3a7152b5e23a0ec3f67983d6" UNIQUE ("user_id", "quiz_id"), CONSTRAINT "PK_54f98d5f852e75d52e8a51825ed" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_like" ADD CONSTRAINT "FK_c63aedb8a9f324e9bd4d0fa4657" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_like" ADD CONSTRAINT "FK_b20157f369a60709991535f5a8d" FOREIGN KEY ("quiz_id") REFERENCES "quiz"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_dislike" ADD CONSTRAINT "FK_e55f1c2fa9fc10e5c48311e425c" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_dislike" ADD CONSTRAINT "FK_b8033f0c77659c32e8903d4d8b5" FOREIGN KEY ("quiz_id") REFERENCES "quiz"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "quiz_dislike" DROP CONSTRAINT "FK_b8033f0c77659c32e8903d4d8b5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_dislike" DROP CONSTRAINT "FK_e55f1c2fa9fc10e5c48311e425c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_like" DROP CONSTRAINT "FK_b20157f369a60709991535f5a8d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_like" DROP CONSTRAINT "FK_c63aedb8a9f324e9bd4d0fa4657"`,
    );
    await queryRunner.query(`DROP TABLE "quiz_dislike"`);
    await queryRunner.query(`DROP TABLE "quiz_like"`);
  }
}
