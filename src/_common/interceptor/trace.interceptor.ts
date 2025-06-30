import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Request } from "express";
import { ClsService } from "nestjs-cls";
import { Observable, catchError } from "rxjs";
import { v4 as uuidv4 } from "uuid";
import { LoggerService } from "../../logger/logger.service";
@Injectable()
export class TraceInterceptor implements NestInterceptor {
	className = `TraceInterceptor`;
	constructor(
		private readonly clsService: ClsService,
		private readonly logger: LoggerService,
	) {}

	intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
		if (ctx.getType() == "http") {
			const req = ctx.switchToHttp().getRequest<Request>();
			const traceId = req.headers["x-request-id"] || uuidv4();
			this.clsService.set(LoggerService.KEY.traceReq, traceId);

			return next.handle().pipe(
				catchError((err) => {
					//   if (!(err instanceof BaseException))
					//     this.logger.warn(`Unknown Exception Occur by request-${traceId} `, {
					//       className: this.className,
					//     });

					err.traceId = traceId;
					throw err;
				}),
			);
		} else {
			this.logger.warn("Undefined communicate Approach", { className: this.className });
			return next.handle();
		}
	}
}
