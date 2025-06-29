import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { isArray } from "class-validator";
import { Repository } from "typeorm";
import { ServiceException } from "../../_common/filter/exception/service/service-exception";
import { isNotFalsy, isStringArray } from "../../utils/validator";
import { WikiArtPainting } from "../entities/wikiArt-painting.entity";

export type WikiArtPaintingColumnType = WikiArtPainting[keyof WikiArtPainting];
@Injectable()
export class WikiArtPaintingService {
	private TABLE_NAME = "wiki_art_painting";
	private mapColumnsValueSet = new Map<keyof WikiArtPainting, Set<WikiArtPaintingColumnType>>();

	constructor(
		@InjectRepository(WikiArtPainting) private readonly repo: Repository<WikiArtPainting>,
	) {
		const keys = repo.metadata.columns.map((col) => col.propertyName);
		Logger.debug(
			`[WikiArtPaintingService] start init!!` + `key list : ${JSON.stringify(keys, null, 2)}`,
		);
		keys.forEach((key) => {
			const entityKey = key as keyof WikiArtPainting;
			if (!this.mapColumnsValueSet.has(entityKey)) {
				this.mapColumnsValueSet.set(
					entityKey,
					new Set<WikiArtPainting[typeof entityKey]>(),
				);
			}
		});
	}

	private async loadColumnValues(columnName: keyof WikiArtPainting) {
		const rows = await this.repo.query(`SELECT DISTINCT "${columnName}"
        FROM ${this.TABLE_NAME}
        ORDER BY "${columnName}" ASC`);

		return rows as Pick<WikiArtPainting, typeof columnName>[];
	}

	private async saveArrayColumnValues(columnName: keyof WikiArtPainting) {
		const rows = await this.loadColumnValues(columnName);

		if (rows.length == 0) {
			return this.getColumValueSet(columnName).values();
		}

		const firstRow = rows.at(0);
		if (!isNotFalsy(firstRow)) {
			throw new ServiceException(
				"SERVICE_RUN_ERROR",
				"INTERNAL_SERVER_ERROR",
				`columnName : ${columnName}\n` + ` rows : ${JSON.stringify(rows, null, 2)}`,
			);
		}

		if (isStringArray(firstRow[columnName])) {
			rows.forEach((row) => {
				const property = row[columnName] as string[];
				property.forEach((e) => this.getColumValueSet(columnName).add(e));
			});
			return this.getColumValueSet(columnName).values();
		}

		if (!isArray(firstRow[columnName])) {
			rows.forEach((row) => {
				const property = row[columnName];
				this.getColumValueSet(columnName).add(property);
			});
			return this.getColumValueSet(columnName).values();
		}

		return this.getColumValueSet(columnName).values();
	}

	private getColumValueSet(columnName: keyof WikiArtPainting): Set<WikiArtPaintingColumnType> {
		return this.mapColumnsValueSet.get(columnName) as Set<WikiArtPaintingColumnType>;
	}

	public async getColumnValues(
		columnName: keyof WikiArtPainting,
	): Promise<WikiArtPaintingColumnType[]> {
		await this.saveArrayColumnValues(columnName);
		const set = this.getColumValueSet(columnName);
		const ret = [] as WikiArtPaintingColumnType[];
		for (const value of set.values()) {
			ret.push(value);
		}

		return ret;
	}
}
