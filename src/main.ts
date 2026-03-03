import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module";
import { winstonLogger } from "./utils/winston.config";
import { configNestApp, configSwagger } from "./app.config";

async function bootstrap() {
	const app = await NestFactory.create<NestExpressApplication>(AppModule, {
		bufferLogs: true,
		logger: winstonLogger,
	});

	configNestApp(app);
	configSwagger(app);

	//Shutdown Hook is not supported to Window platform
	//ref : https://docs.nestjs.com/fundamentals/lifecycle-events#application-shutdown
	app.enableShutdownHooks();

	await app.listen(3000);
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
