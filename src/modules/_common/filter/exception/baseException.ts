import { HttpStatus } from "@nestjs/common";
import { HttpException, HttpExceptionOptions } from "@nestjs/common/exceptions";
import { TYPE_DEFAULT_VALUE } from "../../const/defaultValue";

export type HttpStatusType = keyof typeof HttpStatus;

export class BaseException extends HttpException {
	traceId: string = TYPE_DEFAULT_VALUE.string;
	constructor(
		errorCode: string,
		status: number,
		response: Record<string, any> | string,
		options?: HttpExceptionOptions,
	) {
		const responseBody = typeof response === "string" ? { message: response } : response;
		super(responseBody, status, options);
		this.errorCode = errorCode;
	}

	errorCode: string;

	timestamp: string = TYPE_DEFAULT_VALUE.string;

	path: string = TYPE_DEFAULT_VALUE.string;
}
