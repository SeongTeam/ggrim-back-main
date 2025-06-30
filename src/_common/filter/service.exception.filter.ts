import { ArgumentsHost, Catch } from "@nestjs/common";
import { CustomExceptionFilter } from "./custom.exception.filter";
import { BaseException } from "./exception/baseException";
import { ServiceException } from "./exception/service/serviceException";
import { ServiceExceptionEnum } from "./exception/service/serviceExceptionEnum";

interface IExceptionInfo extends Pick<BaseException, "timestamp" | "path"> {
	message: string | object;
	cause?: unknown;
}

@Catch(ServiceException)
export class ServiceExceptionFilter extends CustomExceptionFilter {
	constructor() {
		super("ServiceExceptionFilter");
	}

	catch(exception: ServiceException, host: ArgumentsHost): void {
		super.catch(exception, host);

		const code = exception.errorCode;

		if (code == ServiceExceptionEnum.DB_INCONSISTENCY) {
			// notfiy to Developer.
			this.logger.error("DB has inconsistency", exception.stack || "", {
				className: this.className,
				traceId: exception.traceId,
			});
		}
	}
}
