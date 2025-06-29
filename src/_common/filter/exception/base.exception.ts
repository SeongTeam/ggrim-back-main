import { HttpStatus } from "@nestjs/common";
import { HttpException, HttpExceptionOptions } from "@nestjs/common/exceptions";
import { TYPE_DEFAULT_VALUE } from "../../const/default.value";

interface BaseExceptionInterface {
	errorCode: number;
	timestamp: string;
	path: string;
}

export type HttpStatusType = keyof typeof HttpStatus;

export class BaseException extends HttpException implements BaseExceptionInterface {
	traceId: string = TYPE_DEFAULT_VALUE.string;
	constructor(
		errorCode: number,
		status: number,
		response: Record<string, any> | string,
		options?: HttpExceptionOptions,
	) {
		let responseBody = typeof response === "string" ? { message: response } : response;
		super(responseBody, status, options);
		this.errorCode = errorCode;
	}

	errorCode: number;

	timestamp: string = TYPE_DEFAULT_VALUE.string;

	path: string = TYPE_DEFAULT_VALUE.string;
}
