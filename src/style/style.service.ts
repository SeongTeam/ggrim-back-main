import { TypeOrmCrudService } from "@dataui/crud-typeorm";
import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { isArrayEmpty } from "../utils/validator";
import { Style } from "./entities/style.entity";

@Injectable()
export class StyleService extends TypeOrmCrudService<Style> {
	constructor(@InjectRepository(Style) readonly repo: Repository<Style>) {
		super(repo);
	}

	async findManyByName(names: string[]): Promise<Style[]> {
		if (isArrayEmpty(names)) {
			return [];
		}

		const styles = await this.repo
			.createQueryBuilder("style")
			.where("style.name IN (:...names)", { names })
			.getMany();

		return styles;
	}

	async getStylesRelatedToPainting() {
		const query = this.repo
			.createQueryBuilder("style")
			.innerJoin("style.paintings", "painting")
			.select(["style.name", "style.id"]);

		Logger.debug(query.getSql());

		return await query.getMany();
	}
}
