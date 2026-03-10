import { HttpExceptionOptions, HttpStatus } from "@nestjs/common";
import { BaseException, HttpStatusType } from "../baseException";
import { SERVICE_EXCEPTION_STATUS, ServiceExceptionCodeKey } from "./const";

export class ServiceException extends BaseException {
	constructor(
		ExceptionEnum: ServiceExceptionCodeKey,
		statusEnum: HttpStatusType,
		response?: Record<string, any> | string,
		options?: HttpExceptionOptions,
	) {
		const code = SERVICE_EXCEPTION_STATUS[ExceptionEnum];
		const status = HttpStatus[statusEnum];
		super(code, status, response || {}, options);
	}
}
