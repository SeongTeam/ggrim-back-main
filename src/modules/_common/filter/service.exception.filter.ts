import { ArgumentsHost, Catch } from "@nestjs/common";
import { CustomExceptionFilter } from "./custom.exception.filter";
import { ServiceException } from "./exception/service/serviceException";
import { SERVICE_EXCEPTION_STATUS } from "./exception/service/const";

@Catch(ServiceException)
export class ServiceExceptionFilter extends CustomExceptionFilter {
	constructor() {
		super("ServiceExceptionFilter");
	}

	catch(exception: ServiceException, host: ArgumentsHost): void {
		super.catch(exception, host);

		const { errorCode } = exception;

		if (errorCode == SERVICE_EXCEPTION_STATUS.DB_INCONSISTENCY) {
			// notify to Developer.
			this.logger.error("DB has inconsistency", exception.stack || "", {
				className: this.className,
				traceId: exception.traceId,
			});
		}
	}
}
