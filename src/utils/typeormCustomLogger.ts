import { AbstractLogger, LogLevel, LogMessage } from "typeorm";
import * as winston from "winston";
import "winston-daily-rotate-file";

/*TODO 
- typeorm 로그 로테이트
    - 파일 크기 기반
    - 날짜 기반 
- 
*/
export class TypeORMCustomLogger extends AbstractLogger {
	logger: winston.Logger = createLogger();

	protected writeLog(
		level: LogLevel,
		logMessage: string | number | LogMessage | (string | number | LogMessage)[],
		//queryRunner?: QueryRunner | undefined,
	): void {
		const messages = this.prepareLogMessages(logMessage, {
			highlightSql: false,
			addColonToPrefix: false,
		});

		const strings: string[] = [];

		for (const message of messages) {
			switch (message.type ?? level) {
				case "log":
					strings.push(`[LOG]: ${message.message}`);
					break;

				case "schema-build":
				case "migration":
					strings.push(String(message.message));
					break;

				case "info":
					strings.push(`[INFO]: ${message.message}`);
					break;

				case "query":
					strings.push(`[QUERY]: ${message.message}`);
					break;

				case "warn":
					strings.push(`[WARN]: ${message.message}`);
					break;

				case "query-slow":
					if (message.prefix === "execution time") {
						continue;
					}

					this.write(
						`[SLOW QUERY: ${message.additionalInfo?.time} ms]: ${message.message}`,
					);
					break;

				case "error":
				case "query-error":
					if (message.prefix === "query failed") {
						strings.push(`[FAILED QUERY]: ${message.message}`);
					} else if (message.type === "query-error") {
						strings.push(`[QUERY ERROR]: ${message.message}`);
					} else {
						strings.push(`[ERROR]: ${message.message}`);
					}
					break;
			}
			this.write(strings);
		}
	}

	/*TODO
  - winston logger를 더욱 활용할 수 있는 방법이 있는가? 
  */

	protected write(strings: string | string[]) {
		const output: string[] = Array.isArray(strings) ? strings : [strings];
		this.logger.info(output.join("\n"));
	}
}

function createLogger() {
	return winston.createLogger({
		level: "info", // 로그 레벨 설정
		format: winston.format.combine(
			winston.format.timestamp(),
			winston.format.printf(({ timestamp, message }) => {
				// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
				return `[${timestamp}] ${message}`;
			}),
		),

		transports: [
			// 파일 저장 전용 트랜스포트
			new winston.transports.DailyRotateFile({
				dirname: "logs/typeorm", // 로그 파일 저장 디렉토리
				filename: "%DATE%.typeorm.log", // 파일 이름 형식
				datePattern: "YYYY-MM-DD", // 날짜 패턴
				zippedArchive: true,
				maxSize: "20m", // 파일 최대 크기
				maxFiles: "14d", // 최대 보존 기간 (14일)
			}),
		],
	});
}
