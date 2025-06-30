import { HttpExceptionOptions, HttpStatus } from "@nestjs/common";
import { BaseException, HttpStatusType } from "../baseException";
import { ServiceExceptionEnum } from "./serviceExceptionEnum";

type ServiceExceptionEnumType = keyof typeof ServiceExceptionEnum;

export class ServiceException extends BaseException {
	constructor(
		ExceptionEnum: ServiceExceptionEnumType,
		statusEnum: HttpStatusType,
		response?: Record<string, any> | string,
		options?: HttpExceptionOptions,
	) {
		const code = ServiceExceptionEnum[ExceptionEnum];
		const status = HttpStatus[statusEnum];
		super(code, status, response || {}, options);
	}
}
