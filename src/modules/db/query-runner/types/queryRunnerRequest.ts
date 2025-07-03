import { Request } from "express";
import { QueryRunner } from "typeorm";

export interface QueryRunnerRequest extends Request {
	queryRunner: QueryRunner;
}
