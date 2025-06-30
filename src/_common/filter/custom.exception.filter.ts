import { ArgumentsHost, ExceptionFilter, HttpStatus, Inject } from "@nestjs/common";
import { Request, Response } from "express";
import { TypeORMError } from "typeorm";
import { LoggerService } from "../../Logger/logger.service";
import { BaseException } from "./exception/baseException";

interface CauseInfo {
	innerError: unknown;
	stack: string;
}

/*TODO
- client request에 대해 exception 발생시, exception에 대한 정보 응답에 넣기
  - HTTP warning 레벨과 error 레벨에 대해 다르게 정보를 구성해야하는가?
*/
interface ExceptionInfo extends Pick<BaseException, "timestamp" | "path"> {
	message: string | object;
	cause?: CauseInfo;
	error?: unknown;
}

export class CustomExceptionFilter implements ExceptionFilter {
	static cnt = 0;
	className: string;
	@Inject(LoggerService)
	logger!: LoggerService;
	constructor(className: string) {
		this.className = className;
	}

	catch(exception: any, host: ArgumentsHost): void {
		if (host.getType() == "http") {
			const ctx = host.switchToHttp();
			const req = ctx.getRequest<Request>();
			const res = ctx.getResponse<Response>();

			this.handleHttpException(req, res, exception);
			return;
		}

		this.logger.error(`unsupported host type[${host.getType()}] access`, exception.stack, {
			className: this.className,
			traceId: exception.traceId,
		});
	}

	private logBaseException(exception: BaseException) {
		const info: ExceptionInfo = {
			timestamp: exception.timestamp,
			path: exception.path,
			message: exception.getResponse(),
			cause: this.getCauseInfo(exception),
		};

		if (exception.getStatus() >= HttpStatus.INTERNAL_SERVER_ERROR) {
			this.logger.error(JSON.stringify(info, null, 2), exception.stack || "", {
				className: this.className,
				traceId: exception.traceId,
			});
		} else {
			this.logger.warn(JSON.stringify(info, null, 2), {
				className: this.className,
				traceId: exception.traceId,
			});
		}
	}

	private logUnknownException(e: any) {
		const info: ExceptionInfo = {
			timestamp: e.timeStamp,
			path: e.path,
			message: e,
			cause: this.getCauseInfo(e),
		};

		this.logger.error(
			`Unknown Exception ${e.name} occurs ` + `${JSON.stringify(info, null, 2)}`,
			e.stack,
			{
				className: this.className,
				traceId: e.traceId,
			},
		);
	}

	notifySeriousError(msg: string) {
		//심각한 에러 발생시 알려주는 용도?
	}

	getCauseInfo(e: any) {
		const innerError = e.cause;
		if (!innerError) {
			return;
		}

		const ret: CauseInfo = {
			innerError: innerError,
			stack: innerError.stack,
		};

		return ret;
	}

	handleHttpException(request: Request, response: Response, exception: any) {
		exception.timestamp = new Date().toLocaleTimeString("kr");
		exception.path = request.url;

		if (exception instanceof BaseException) {
			this.logBaseException(exception);
			response.status(exception.getStatus()).json({
				errorCode: exception.errorCode,
				statusCode: exception.getStatus(),
				timeStamp: exception.timestamp,
				path: exception.path,
				message: exception.message,
			});

			return;
		}

		if (exception instanceof TypeORMError) {
		}

		this.logUnknownException(exception);
		response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
			statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
			timeStamp: exception.timestamp,
			path: exception.path,
			message: exception.message,
		});
	}
}
