import { HttpStatus } from "@nestjs/common";
import { ApiSchema, ApiProperty } from "@nestjs/swagger";
import { SERVICE_EXCEPTION_STATUS, ServiceErrorCode } from "../service/const";

@ApiSchema({ name: "HttpException" })
export class HttpExceptionSchema {
	@ApiProperty()
	statusCode!: HttpStatus;

	@ApiProperty()
	message!: string;

	@ApiProperty({ required: false })
	error?: string;
}

@ApiSchema({ name: "BaseException" })
export class BaseExceptionSchema extends HttpExceptionSchema {
	@ApiProperty()
	timestamp!: string;

	// this property is needed on client to identify BaseException
	@ApiProperty()
	errorCode!: string;

	@ApiProperty()
	path!: string;
}
@ApiSchema({ name: "ServiceException" })
export class ServiceExceptionSchema extends BaseExceptionSchema {
	@ApiProperty({ enum: Object.keys(SERVICE_EXCEPTION_STATUS) })
	errorCode!: ServiceErrorCode;
}
