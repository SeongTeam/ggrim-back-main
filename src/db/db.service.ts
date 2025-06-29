import { Injectable, Logger } from "@nestjs/common";
import { DataSource, ObjectLiteral, Repository } from "typeorm";

export interface IEntity {
	name: string;
	tableName: string;
}

@Injectable()
export class DatabaseService {
	constructor(private readonly dataSource: DataSource) {
		Logger.log(`[${DatabaseService.name}] init`);
	}
	public async getRepository<T extends ObjectLiteral>(entity: any): Promise<Repository<T>> {
		return this.dataSource.getRepository(entity);
	}

	public async isConnected(): Promise<boolean> {
		return this.dataSource.isInitialized;
	}

	public async close(): Promise<void> {
		if (await this.isConnected()) {
			this.dataSource.destroy();
		}
	}

	public async getEntities() {
		const entities: IEntity[] = [];
		this.dataSource.entityMetadatas.forEach((x) =>
			entities.push({ name: x.name, tableName: x.tableName }),
		);

		return entities;
	}
}
