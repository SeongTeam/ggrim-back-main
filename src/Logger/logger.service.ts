import { Injectable, Logger } from "@nestjs/common";
import * as assert from "assert";
import { ClsService } from "nestjs-cls";
import { TYPE_DEFAULT_VALUE } from "../_common/const/default.value";
import { NODE_ENV } from "../_common/const/envKeys.const";

const isProduction = process.env[NODE_ENV] === "production";

export interface ILogContext {
	className: string;
	traceId?: string;
}

@Injectable()
export class LoggerService {
	static KEY = {
		traceReq: "traceId",
	};

	private _traceId: string = TYPE_DEFAULT_VALUE.string;
	constructor(
		private readonly logger: Logger,
		private readonly clsService: ClsService,
	) {}

	debug(message: any, context: ILogContext) {
		return this.logger.debug(message, this.getFullContext(context));
	}
	log(message: any, context: ILogContext) {
		return this.logger.log(message, this.getFullContext(context));
	}
	error(message: any, stack: string, context: ILogContext) {
		return this.logger.error(message, stack, this.getFullContext(context));
	}

	fatal(message: any, stack: string, context: ILogContext) {
		return this.logger.fatal(message, stack, this.getFullContext(context));
	}
	verbose(message: any, context: ILogContext) {
		return this.logger.verbose(message, this.getFullContext(context));
	}
	warn(message: any, context: ILogContext) {
		return this.logger.warn(message, this.getFullContext(context));
	}

	logUnknownError(message: string, error: unknown, context: ILogContext) {
		if (error instanceof Error) {
			this.logger.error(
				`${message}, error : ${error.message}`,
				error.stack,
				this.getFullContext(context),
			);
		} else {
			try {
				const serialized = JSON.stringify(error, null, 2);
				this.logger.error(
					`${message}, unknown error : ${serialized}`,
					undefined,
					this.getFullContext(context),
				);
			} catch (josnErr) {
				this.logger.error(
					`${message}, unserializable error.`,
					undefined,
					this.getFullContext(context),
				);
			}
		}
	}

	assertOrLog(condition: boolean, message?: string): void {
		if (!isProduction) {
			assert(condition, message);
			return;
		}

		if (!condition) {
			const stack = new Error().stack;
			const callerInfo = stack?.split("\n")[2]?.trim();
			const formattedMessage = `[ASSERTION ERROR] ${message || "Assertion Failed"}`;
			this.logger.error(
				formattedMessage,
				callerInfo,
				this.getFullContext({ className: LoggerService.name }),
			);
		}
	}

	private getFullContext(ctx: ILogContext) {
		const reqInfo = this.clsService.get(LoggerService.KEY.traceReq) || ctx.traceId;
		return `${ctx.className} , req{${reqInfo}}`;
	}
}
