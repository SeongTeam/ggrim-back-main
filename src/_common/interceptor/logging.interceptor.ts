import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { Request, Response } from "express";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { LoggerService } from "../../Logger/logger.service";
import { NODE_ENV } from "../const/envKeys.const";

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
			tap({
				next: (val: any): void => {
					const info = this.logNext(val, context);
					this.logDebug(info);
				},
				error: (err: any): void => {
					this.logError(err, context);
				},
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

		return { request, response, body: val } as HttpInfo;
	}
	logDebug(v: HttpInfo) {
		//For Debuging
		const { body } = v.request;
		const email = this.getUserAuthInfo(v.request);

		this.logger.debug(
			`----Develop log---\n` +
				`user: "${email}"\n` +
				`[REQUEST] \n` +
				`Body: ${JSON.stringify(body, null, 2)}\n` +
				`[RESPONSE]\n` +
				`body :${JSON.stringify(v.body, null, 2)}`,
			{
				className: this.className,
			},
		);
	}

	logError(error: any, ctx: ExecutionContext) {
		const request = ctx.switchToHttp().getRequest<Request>();

		const { method, originalUrl: url, params, query, body, headers, ip } = request;
		const handlerkey = ctx.getHandler().name;
		const email = this.getUserAuthInfo(request);

		const httpStatus = error.status;

		const format =
			`accessing ${handlerkey} handler\n` +
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
			this.logger.error(format, error.stack, {
				className: this.className,
			});
		}
	}

	getUserAuthInfo(req: Request) {
		/*TODO
    - Add logic extract user identifier info from request to debug problem where request has problem.
    */
		let ret = "userinfo";

		// const rawToken = req.get('authorization');
		// if (rawToken == undefined) {
		//   return ret;
		// }

		// const [type, token] = rawToken.split(' ');

		// if (type != 'bearer') {
		//   return ret;
		// }

		return ret;
	}
}
