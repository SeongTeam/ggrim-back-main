import {
	INestApplication,
	ValidationPipe,
	ClassSerializerInterceptor,
	HttpStatus,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { ShowArtistResponse } from "./modules/artist/dto/response/showArtist.response";
import { ShowOneTimeTokenResponse } from "./modules/auth/dto/response/showOneTimeToken.response";
import { ShowVerificationResponse } from "./modules/auth/dto/response/showVerfication.response";
import { ShowPaintingResponse } from "./modules/painting/dto/response/showPainting.response";
import { DetailQuizResponse } from "./modules/quiz/dto/response/detailQuiz.response";
import { ShowQuizResponse } from "./modules/quiz/dto/response/showQuiz.response";
import { ShowStyleResponse } from "./modules/style/dto/response/showStyle.response";
import { ShowTagResponse } from "./modules/tag/dto/response/showTag.response";
import { ShowUserResponse } from "./modules/user/dto/request/response/showUser.response";
import { ServiceException } from "./modules/_common/filter/exception/service/serviceException";
import { ExpressAdapter, NestExpressApplication } from "@nestjs/platform-express";

export function configNestApp<T extends INestApplication>(app: T): void {
	app.useGlobalPipes(
		new ValidationPipe({
			transform: true,
			whitelist: true,
			forbidNonWhitelisted: true,
			exceptionFactory: (errors) => {
				debugger;
				console.log("validator error", errors);

				const messages = errors.map((e) => JSON.stringify(e.constraints));

				const serviceException = new ServiceException(
					"BASE",
					"BAD_REQUEST",
					`ValidationError.\n` + messages.join("\n"),
				);
				return serviceException;
			},
		}),
	);
	app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

	if (isExpressApp(app)) {
		app.set("query parser", "extended");
	}
}

export function configSwagger<T extends INestApplication>(app: T): void {
	const rootOptions = new DocumentBuilder()
		.setTitle("GGrim API Specification")
		.setDescription("Description for multiple")
		.setVersion("1.0")
		.addBasicAuth()
		.addBearerAuth()
		.addGlobalResponse({
			status: HttpStatus.BAD_REQUEST,
			description: "when invalid path(route) or url query or dto body",
		})
		.addGlobalResponse({
			status: HttpStatus.INTERNAL_SERVER_ERROR,
			description: "when server logic throw unexpected exception",
		})
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

function isExpressApp(app: INestApplication): app is NestExpressApplication {
	return app.getHttpAdapter() instanceof ExpressAdapter;
}

// function isFastifyApp(app: any): app is NestFastifyApplication {
// 	return app.getHttpAdapter() instanceof FastifyAdapter;
// }
