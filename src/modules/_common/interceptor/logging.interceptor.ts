import {
	CallHandler,
	ExecutionContext,
	HttpStatus,
	Injectable,
	NestInterceptor,
} from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { Request, Response } from "express";
import { Observable } from "rxjs";
import { catchError, tap } from "rxjs/operators";
import { LoggerService } from "../../logger/logger.service";
import { NODE_ENV } from "../const/envKeys.const";
import { BaseException } from "../filter/exception/baseException";

interface HttpInfo {
	request: Request;
	response: Response;
	body: any;
}
@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
	className = "HttpLoggingInterceptor";

	isProduction = !process.env[NODE_ENV];
	constructor(
		private readonly logger: LoggerService,
		private moduleRef: ModuleRef,
	) {}
	intercept(context: ExecutionContext, call$: CallHandler): Observable<any> {
		const hostType = context.getType();

		if (hostType != "http") {
			return call$.handle();
		}

		return call$.handle().pipe(
			tap((val: any): void => {
				const info = this.logNext(val, context);
				this.logDebug(info);
			}),
			catchError((err) => {
				this.logError(err, context);
				throw err;
			}),
		);
	}

	logNext(val: any, ctx: ExecutionContext) {
		const response = ctx.switchToHttp().getResponse<Response>();
		const request = ctx.switchToHttp().getRequest<Request>();
		const handlerKey = ctx.getHandler().name;
		const status = response.statusCode;
		const { method, originalUrl: url, ip, query, params, headers } = request;
		this.logger.log(
			`accessing [${handlerKey}()] ${method}::${url} from ${ip}\n` +
				`status : ${status} \n` +
				`header : ${JSON.stringify(headers, null, 2)}` +
				`Params: ${JSON.stringify(params)}` +
				`Query: ${JSON.stringify(query)}`,
			{
				className: this.className,
			},
		);

		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		return { request, response, body: val } as HttpInfo;
	}
	logDebug(info: HttpInfo) {
		//For Debuging
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const { body } = info.request;
		const email = this.getUserAuthInfo(info.request);

		this.logger.debug(
			`----Develop log---\n` +
				`user: "${email}"\n` +
				`[REQUEST] \n` +
				`Body: ${JSON.stringify(body, null, 2)}\n` +
				`[RESPONSE]\n` +
				`body :${JSON.stringify(info.body, null, 2)}`,
			{
				className: this.className,
			},
		);
	}

	logError(error: unknown, ctx: ExecutionContext) {
		const request = ctx.switchToHttp().getRequest<Request>();

		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const { method, originalUrl: url, params, query, body, headers, ip } = request;
		const handlerKey = ctx.getHandler().name;
		const email = this.getUserAuthInfo(request);

		const httpStatus: number =
			error instanceof BaseException ? error.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

		const format =
			`accessing ${handlerKey} handler\n` +
			`${method}::${url} from ${ip}\n` +
			`Status : ${httpStatus} \n` +
			`User: ${email} \n` +
			`[REQUEST] \n` +
			`Params: ${JSON.stringify(params)} \n` +
			`Query: ${JSON.stringify(query)} \n` +
			`Body: ${JSON.stringify(body, null, 2)}\n` +
			`Headers: ${JSON.stringify(headers, null, 2)}\n`;

		/*TODO
        - Pipe 또는 Validation 경고 문장 로그로 출력하기
      */
		if (httpStatus < 500) {
			this.logger.warn(format, {
				className: this.className,
			});
		} else {
			this.logger.logUnknownError(format, error, {
				className: this.className,
			});
		}
	}

	getUserAuthInfo(req: Request) {
		/*TODO
    - Add logic extract user identifier info from request to debug problem where request has problem.
    */
		const ret = "userinfo";

		const rawToken = req.get("authorization");
		if (rawToken == undefined) {
			return ret;
		}

		const [type] = rawToken.split(" ");

		if (type != "bearer") {
			return ret;
		}

		return ret;
	}
}
