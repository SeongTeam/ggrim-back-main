import { Injectable, Logger } from "@nestjs/common";
import { DatabaseService, IEntity } from "../../src/db/db.service";

import * as fs from "fs";
import * as Path from "path";
import { ServiceException } from "../../src/_common/filter/exception/service/serviceException";

@Injectable()
export class TestService {
	constructor(private readonly databaseService: DatabaseService) {
		if (process.env.NODE_ENV !== "test") {
			throw new Error("ERROR-TEST-UTILS-ONLY-FOR-TESTS");
		}
		this.databaseService = databaseService;
	}

	public async initTest() {
		console.log(`init test`);
		await this.reloadFixtures();
		console.log(`init test done`);
	}

	public async closeTest() {
		console.log(`close test`);
		await this.closeDbConnection();
		console.log(`close test done`);
	}
	public async cleanAll() {
		console.log(`clean All`);
		const entities = await this.getEntities();
		await this.cleanEntity(entities);
		console.log(`clean All done`);
	}

	private async closeDbConnection() {
		await this.databaseService.close();
	}

	private async getEntities() {
		return this.databaseService.getEntities();
	}
	private async reloadFixtures() {
		try {
			const entities = await this.getEntities();
			await this.cleanEntity(entities);
			await this.loadEntity(entities);
		} catch (err) {
			throw new ServiceException(
				"SERVICE_RUN_ERROR",
				"INTERNAL_SERVER_ERROR",
				`${JSON.stringify(err)}`,
				{ cause: err },
			);
		}
	}

	private async cleanEntity(entities: IEntity[]) {
		try {
			for (const entity of entities) {
				try {
					const repository = await this.databaseService.getRepository(entity.name);
					await repository.query(`truncate  table  ${entity.tableName} CASCADE`);
				} catch (err) {
					Logger.error(
						`entity : ` + JSON.stringify(entity) + JSON.stringify(err),
						(err as Error).stack,
					);
					throw new ServiceException(
						"EXTERNAL_SERVICE_FAILED",
						"INTERNAL_SERVER_ERROR",
						JSON.stringify(err),
						{ cause: err },
					);
				}
			}
		} catch (error) {
			Logger.error(JSON.stringify(error, null, 2));
			throw new ServiceException(
				"SERVICE_RUN_ERROR",
				"INTERNAL_SERVER_ERROR",
				`ERROR: Cleaning test db: ${error}`,
			);
		}
	}

	private async loadEntity(entities: IEntity[]) {
		try {
			for (const entity of entities) {
				const repository = await this.databaseService.getRepository(entity.name);
				const fixtureFile = Path.join(
					__dirname,
					`/test/_shared/entity/${entity.name}.json`,
				);
				if (fs.existsSync(fixtureFile)) {
					const items = JSON.parse(fs.readFileSync(fixtureFile, "utf8"));
					await repository
						.createQueryBuilder(entity.name)
						.insert()
						.values(items)
						.execute();
				}
			}
		} catch (error) {
			throw new ServiceException(
				"SERVICE_RUN_ERROR",
				"INTERNAL_SERVER_ERROR",
				`ERROR [TestUtils.loadAll()]: Loading fixtures on test db: ${JSON.stringify(error, null, 2)}`,
			);
		}
	}
}
