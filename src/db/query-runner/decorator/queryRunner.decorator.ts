import { ExecutionContext, createParamDecorator } from "@nestjs/common";
import { QueryRunner } from "typeorm";
import { ServiceException } from "../../../_common/filter/exception/service/serviceException";
import { QueryRunnerRequest } from "../types/queryRunnerRequest";

export const DBQueryRunner = createParamDecorator(
	(data, context: ExecutionContext): QueryRunner => {
		const req = context.switchToHttp().getRequest<QueryRunnerRequest>();

		if (!req.queryRunner) {
			throw new ServiceException(
				"SERVICE_RUN_ERROR",
				"INTERNAL_SERVER_ERROR",
				`QueryRunner Decorator를 사용하려면 TransactionInterceptor를 적용해야 합니다.`,
			);
		}

		return req.queryRunner;
	},
);
