import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVerificationTable1743925246181 implements MigrationInterface {
  name = 'AddVerificationTable1743925246181';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "verification" ("created_date" TIMESTAMP(6) WITH TIME ZONE NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "updated_date" TIMESTAMP(6) WITH TIME ZONE DEFAULT now(), "deleted_date" TIMESTAMP(6) WITH TIME ZONE, "version" integer, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "is_verified" boolean NOT NULL DEFAULT false, "pin_code" character varying NOT NULL, "pin_code_expired_date" TIMESTAMP(6) WITH TIME ZONE NOT NULL, CONSTRAINT "UQ_f553f5313c43fdf919c0627eb7b" UNIQUE ("email"), CONSTRAINT "PK_f7e3a90ca384e71d6e2e93bb340" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "verification"`);
  }
}
