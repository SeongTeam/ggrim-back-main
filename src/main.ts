import { ClassSerializerInterceptor, INestApplication } from "@nestjs/common";
import { NestFactory, Reflector } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module";
import { winstonLogger } from "./utils/winston.config";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

async function bootstrap() {
	const app = await NestFactory.create<NestExpressApplication>(AppModule, {
		bufferLogs: true,
		logger: winstonLogger,
	});

	// config app
	setNestApp(app);
	setSwagger(app);

	//Shutdown Hook is not supported to Window platform
	//ref : https://docs.nestjs.com/fundamentals/lifecycle-events#application-shutdown
	app.enableShutdownHooks();

	await app.listen(3000);
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();

export function setNestApp<T extends INestApplication>(app: T): void {
	app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
}

export function setSwagger<T extends INestApplication>(app: T): void {
	const rootOptions = new DocumentBuilder()
		.setTitle("GGrim API Specification")
		.setDescription("Description for multiple")
		.setVersion("1.0")
		.build();

	const document = SwaggerModule.createDocument(app, rootOptions);

	SwaggerModule.setup("api", app, document);
}
