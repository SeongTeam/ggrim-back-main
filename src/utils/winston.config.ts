import { utilities as nestWinstonModuleUtilities, WinstonModule } from "nest-winston";
import * as winston from "winston";
import * as winstonDaily from "winston-daily-rotate-file";
import { APP_NAME_KEY, NODE_ENV } from "../modules/_common/const/envKeys";

//ref : https://pypystory.tistory.com/80

const isProduction = process.env[NODE_ENV] === "production";

const dailyOptions = (level: string) => {
	return {
		level,
		datePattern: "YYYY-MM-DD",
		dirname: `logs/app`,
		filename: `%DATE%.${level}.log`,
		zippedArchive: true,
		maxSize: "20m",
		maxFiles: "14d",
	};
};

/* Use replacing the Nest logger to winston logger ( also for bootstrapping)
#ref : https://www.npmjs.com/package/nest-winston#replacing-the-nest-logger-also-for-bootstrapping


# level     - Logger function
  error: 0, - Logger.error()
  warn: 1,  - Logger.warn()
  info: 2,  - Logger.log() ** becareful with this level*
  http: 3,  -  Not used
  verbose: 4, - Logger.verbose()
  debug: 5,   - Logger.debug()
  silly: 6
};
*/

const appName = process.env[APP_NAME_KEY] || "App_NAME_UNDEFINED";

export const winstonLogger = WinstonModule.createLogger({
	format: winston.format.combine(
		winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
		winston.format.printf(
			(info) =>
				// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
				`[${info.label}] ${info.timestamp} ${info.level} [${info.context}] ${info.message}`,
		),
	),
	transports: [
		new winston.transports.Console({
			level: isProduction ? "info" : "debug",
			format: winston.format.combine(
				winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
				winston.format.ms(),
				winston.format.json(),
				nestWinstonModuleUtilities.format.nestLike(appName, {
					colors: true,
					prettyPrint: true,
					processId: true,
					appName: true,
				}),
			),
		}),

		new winstonDaily(dailyOptions("info")),
		// new winstonDaily(dailyOptions('warn')),
		// new winstonDaily(dailyOptions('error')),
	],
});
