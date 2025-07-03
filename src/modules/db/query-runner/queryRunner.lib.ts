import { EntityTarget, ObjectLiteral, QueryRunner } from "typeorm";

export function createTransactionQueryBuilder<T extends EntityTarget<ObjectLiteral>>(
	queryRunner: QueryRunner,
	entity: T,
) {
	return queryRunner.manager.getRepository(entity).createQueryBuilder();
}
