import { Logger, Module } from "@nestjs/common";
import { LoggerService } from "./logger.service";

@Module({
	providers: [LoggerService, Logger],
	exports: [LoggerService],
})
export class LoggerModule {}
