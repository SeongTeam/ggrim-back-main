import { Module } from "@nestjs/common";
import { APP_FILTER, APP_INTERCEPTOR } from "@nestjs/core";
import { LoggerModule } from "../logger/logger.module";
import { ServiceExceptionFilter } from "./filter/service.exception.filter";
import { HttpLoggingInterceptor } from "./interceptor/logging.interceptor";
import { TraceInterceptor } from "./interceptor/trace.interceptor";

@Module({
	imports: [LoggerModule],
	providers: [
		{
			provide: APP_INTERCEPTOR,
			useClass: TraceInterceptor,
		},
		{
			provide: APP_INTERCEPTOR,
			useClass: HttpLoggingInterceptor,
		},
		{
			provide: APP_FILTER,
			useClass: ServiceExceptionFilter,
		},
	],
})
export class CommonModule {}
