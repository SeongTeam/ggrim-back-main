import { ClassSerializerInterceptor, INestApplication, ValidationPipe } from "@nestjs/common";
import { NestFactory, Reflector } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module";
import { winstonLogger } from "./utils/winston.config";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { ShowTagResponse } from "./modules/tag/dto/response/showTag.response";
import { ShowArtistResponse } from "./modules/artist/dto/response/showArtist.response";
import { ShowStyleResponse } from "./modules/style/dto/response/showStyle.response";
import { ShowUserResponse } from "./modules/user/dto/request/response/showUser.response";
import { ShowQuizResponse } from "./modules/quiz/dto/response/showQuiz.response";
import { DetailQuizResponse } from "./modules/quiz/dto/response/detailQuiz.response";
import { ShowPaintingResponse } from "./modules/painting/dto/response/showPainting.response";
import { ShowOneTimeTokenResponse } from "./modules/auth/dto/response/showOneTimeToken.response";
import { ShowVerificationResponse } from "./modules/auth/dto/response/showVerfication.response";

async function bootstrap() {
	const app = await NestFactory.create<NestExpressApplication>(AppModule, {
		bufferLogs: true,
		logger: winstonLogger,
	});
	app.useGlobalPipes(
		new ValidationPipe({
			transform: true,
			transformOptions: {
				enableImplicitConversion: true,
			},
			whitelist: true,
			forbidNonWhitelisted: true,
		}),
	);

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
		.addBasicAuth()
		.addBearerAuth()
		.build();

	const document = SwaggerModule.createDocument(app, rootOptions, {
		extraModels: [
			ShowTagResponse,
			ShowArtistResponse,
			ShowStyleResponse,
			ShowUserResponse,
			ShowQuizResponse,
			DetailQuizResponse,
			ShowPaintingResponse,
			ShowOneTimeTokenResponse,
			ShowVerificationResponse,
		],
	});

	SwaggerModule.setup("api", app, document);
}
