import { Injectable, Logger } from "@nestjs/common";
import { DataSource, EntityTarget, ObjectLiteral, Repository } from "typeorm";

export interface IEntity {
	name: string;
	tableName: string;
}

@Injectable()
export class DatabaseService {
	constructor(private readonly dataSource: DataSource) {
		Logger.log(`[${DatabaseService.name}] init`);
	}
	public getRepository<T extends ObjectLiteral>(entity: EntityTarget<T>): Repository<T> {
		return this.dataSource.getRepository(entity);
	}

	public isConnected(): boolean {
		return this.dataSource.isInitialized;
	}

	public async close(): Promise<void> {
		if (this.isConnected()) {
			await this.dataSource.destroy();
		}
	}

	public getEntities() {
		const entities: IEntity[] = [];
		this.dataSource.entityMetadatas.forEach((x) =>
			entities.push({ name: x.name, tableName: x.tableName }),
		);

		return entities;
	}
}
