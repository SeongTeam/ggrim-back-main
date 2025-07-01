import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from "@nestjs/common";
import { Observable, catchError, from, mergeMap } from "rxjs";
import { DataSource, QueryRunner } from "typeorm";
import { ServiceException } from "../../_common/filter/exception/service/serviceException";
import { QueryRunnerRequest } from "./types/queryRunnerRequest";

@Injectable()
export class QueryRunnerInterceptor implements NestInterceptor {
	constructor(private readonly dataSource: DataSource) {}

	async intercept(context: ExecutionContext, next: CallHandler<any>): Promise<Observable<any>> {
		// 트랜잭션과 관련된 모든 쿼리를 담당할
		// 쿼리 러너를 생성한다.
		const qr = this.dataSource.createQueryRunner();

		// 쿼리 러너에 연결한다.
		await qr.connect();
		// 쿼리 러너에서 트랜잭션을 시작한다.
		// 이 시점부터 같은 쿼리 러너를 사용하면
		// 트랜잭션 안에서 데이터베이스 액션을 실행 할 수 있다.
		await qr.startTransaction();

		const request = this.getRequest(context);

		request.queryRunner = qr;

		return next.handle().pipe(
			mergeMap((result) => from(this.commitAndRelease(qr, result))),
			catchError((error) => from(this.rollbackAndRelease(qr, error))),
		);
	}

	private getRequest(context: ExecutionContext) {
		if (context.getType() === "http") {
			return context.switchToHttp().getRequest<QueryRunnerRequest>();
		}

		throw new ServiceException(
			"NOT_IMPLEMENTED",
			"NOT_IMPLEMENTED",
			`${context.getType()} is not implemented`,
		);
	}

	private async commitAndRelease(queryRunner: QueryRunner, result: any): Promise<any> {
		Logger.debug("[QueryRunnerInterceptor] Commit transaction");
		await queryRunner.commitTransaction();
		await queryRunner.release();
		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		return result;
	}

	private async rollbackAndRelease(queryRunner: QueryRunner, error: unknown): Promise<never> {
		Logger.error("[QueryRunnerInterceptor] Rollback transaction");
		await queryRunner.rollbackTransaction();
		await queryRunner.release();
		throw error;
	}
}
