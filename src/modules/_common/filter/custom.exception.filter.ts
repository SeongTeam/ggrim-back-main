import { ArgumentsHost, ExceptionFilter, HttpStatus, Inject } from "@nestjs/common";
import { Response } from "express";
import { LoggerService } from "../../logger/logger.service";
import { BaseException } from "./exception/baseException";
import { BaseExceptionSchema } from "./exception/openapi/schema";

interface CauseInfo {
	msg: string;
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

	catch(exception: BaseException, host: ArgumentsHost): void {
		if (host.getType() == "http") {
			const ctx = host.switchToHttp();
			const res = ctx.getResponse<Response>();

			this.handleHttpException(res, exception);
			return;
		}

		this.logger.error(
			`unsupported host type[${host.getType()}] access\n`,
			exception.stack || "",
			{
				className: this.className,
				traceId: exception.traceId,
			},
		);
	}

	private logBaseException(exception: BaseException) {
		const info: ExceptionInfo = {
			timestamp: exception.timestamp,
			path: exception.path,
			message: exception.getResponse(),
			cause: this.getCauseInfo(exception),
		};
		const SERVER_ERROR: number = HttpStatus.INTERNAL_SERVER_ERROR;
		if (exception.getStatus() >= SERVER_ERROR) {
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

	// notifySeriousError(msg: string) {
	// 	//심각한 에러 발생시 알려주는 용도?
	// }

	private getCauseInfo(e: BaseException) {
		const innerError = e.cause;
		if (!innerError) {
			return;
		}
		const ret: CauseInfo = {
			msg: JSON.stringify(innerError),
			stack: "",
		};

		if (innerError instanceof Error) {
			ret.msg = JSON.stringify({ name: innerError.name, message: innerError.message });
			ret.stack = innerError.stack || "";
		}

		return ret;
	}

	private handleHttpException(response: Response, exception: BaseException) {
		this.logBaseException(exception);
		const baseHttpException: BaseExceptionSchema = {
			errorCode: exception.errorCode,
			statusCode: exception.getStatus(),
			timestamp: exception.timestamp,
			path: exception.path,
			message: exception.message,
		};
		response.status(exception.getStatus()).json(baseHttpException);
	}
}
