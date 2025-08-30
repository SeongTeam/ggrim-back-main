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
		if (process.env.VSCODE_INSPECTOR_OPTIONS) {
			jest.setTimeout(60 * 1000 * 10); // 10 minutes
		}
	}

	getAccessToken(user: User): string {
		return this.authService.signToken({
			email: user.email,
			role: user.role,
			username: user.username,
			purpose: "access",
			type: "ACCESS",
		});
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

	async insertTagStub(tagStub: TagDummy, paintings?: Painting[]) {
		const tag = this.dbService.getManager().create(Tag, {
			...tagStub,
			paintings,
		});
		await this.dbService.getManager().save(tag);

		return tag;
	}
	async insertArtistStub(artistStub: ArtistDummy, paintings?: Painting[]) {
		const artist = this.dbService.getManager().create(Artist, {
			...artistStub,
			paintings,
		});
		await this.dbService.getManager().save(artist);

		return artist;
	}
	async insertStyleStub(styleStub: StyleDummy, paintings?: Painting[]) {
		const style = this.dbService.getManager().create(Style, {
			...styleStub,
			paintings,
		});
		await this.dbService.getManager().save(style);

		return style;
	}
	async insertPaintingStub(
		paintingStub: PaintingDummy,
		artist: Artist,
		tags: Tag[],
		styles: Style[],
	) {
		const p = this.dbService.getManager().create(Painting, {
			...paintingStub,
			artist,
			tags,
			styles,
		});
		await this.dbService.getManager().save(p);

		return p;
	}
}
