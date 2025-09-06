import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../src/modules/db/db.service";
import { AuthService } from "../../src/modules/auth/auth.service";
import { UserService } from "../../src/modules/user/user.service";
import { UserDummy } from "./stub/user.stub";
import { QuizDummy } from "./stub/quiz.stub";
import { User } from "../../src/modules/user/entity/user.entity";
import { OneTimeTokenPurpose } from "../../src/modules/auth/types/oneTimeToken";
import { OneTimeToken } from "../../src/modules/auth/entity/oneTimeToken.entity";
import { TagDummy } from "./stub/tag.stub";
import { Tag } from "../../src/modules/tag/entities/tag.entity";
import { ArtistDummy } from "./stub/artist.stub";
import { Artist } from "../../src/modules/artist/entities/artist.entity";
import { StyleDummy } from "./stub/style.stub";
import { Style } from "../../src/modules/style/entities/style.entity";
import { PaintingDummy } from "./stub/painting.stub";
import { Painting } from "../../src/modules/painting/entities/painting.entity";

@Injectable()
export class TestService {
	constructor(
		private readonly dbService: DatabaseService,
		private readonly authService: AuthService,
		private readonly userService: UserService,
	) {
		if (process.env.NODE_ENV !== "test") {
			throw new Error("ERROR-TEST-UTILS-ONLY-FOR-TESTS");
		}
	}

	getBearerAuthCredential(user: User): string {
		const token = this.authService.signToken({
			email: user.email,
			role: user.role,
			username: user.username,
			purpose: "access",
			type: "ACCESS",
		});

		return "Bearer " + token;
	}

	getBasicAuthCredential(email: string, password: string) {
		const credential = Buffer.from(`${email}:${password}`, "utf-8").toString("base64");

		return `Basic ${credential}`;
	}

	async createSignUpOneTimeToken(email: string): Promise<OneTimeToken> {
		return await this.authService.signOneTimeJWTWithoutUser(
			this.dbService.getQueryRunner(),
			email,
			"sign-up",
		);
	}

	async createOneTimeToken(user: User, purpose: OneTimeTokenPurpose): Promise<OneTimeToken> {
		return await this.authService.signOneTimeJWTWithUser(
			this.dbService.getQueryRunner(),
			user.email,
			purpose,
			user,
		);
	}

	async useOneTimeToken(oneTimeToken: OneTimeToken): Promise<OneTimeToken> {
		await this.authService.markOneTimeJWT(this.dbService.getQueryRunner(), oneTimeToken.id);
		return oneTimeToken;
	}

	//insert stub data
	async insertStubUser(
		userStub: UserDummy,
		quizzes?: QuizDummy[],
		oneTimeTokens?: OneTimeToken[],
	): Promise<User> {
		const hashedPassword = await this.authService.hash(userStub.password);
		const result = await this.userService.createUser(this.dbService.getQueryRunner(), {
			quizzes,
			...userStub,
			password: hashedPassword,
			oneTimeTokens,
		});

		return result;
	}

	async insertTagStub(tagStub: TagDummy) {
		const result = await this.dbService.getManager().insert(Tag, {
			...tagStub,
		});

		const id = (result.generatedMaps[0] as Tag).id;

		const tag = this.dbService.getManager().findOneOrFail(Tag, {
			where: {
				id,
			},
		});

		return tag;
	}
	async insertArtistStub(artistStub: ArtistDummy) {
		const result = await this.dbService.getManager().insert(Artist, {
			...artistStub,
		});
		const id = (result.generatedMaps[0] as Artist).id;

		const artist = await this.dbService.getManager().findOneOrFail(Artist, {
			where: {
				id,
			},
		});

		return artist;
	}
	async insertStyleStub(styleStub: StyleDummy) {
		const result = await this.dbService.getManager().insert(Style, {
			...styleStub,
		});
		const id = (result.generatedMaps[0] as Style).id;

		const style = await this.dbService.getManager().findOneOrFail(Style, {
			where: {
				id,
			},
		});

		return style;
	}
	async insertPaintingStub(
		paintingStub: PaintingDummy,
		artist: Artist,
		tags: Tag[],
		styles: Style[],
	) {
		const manager = this.dbService.getManager();
		const result = await manager.insert(Painting, {
			...paintingStub,
		});
		const painting = result.generatedMaps[0] as Painting;

		await manager.createQueryBuilder().relation(Painting, "artist").of(painting).set(artist);
		await manager.createQueryBuilder().relation(Painting, "tags").of(painting).add(tags);
		await manager.createQueryBuilder().relation(Painting, "styles").of(painting).add(styles);

		const paintingWithRelation = await manager.findOneOrFail(Painting, {
			where: {
				id: painting.id,
			},
			relations: {
				artist: true,
				tags: true,
				styles: true,
			},
		});

		return paintingWithRelation;
	}
}
