import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { ServiceException } from "../_common/filter/exception/service/serviceException";
import { User } from "./entity/user.entity";
import { isNumber } from "class-validator";
import { InjectRepository } from "@nestjs/typeorm";

@Injectable()
export class DeletedUserService {
	constructor(@InjectRepository(User) readonly repo: Repository<User>) {}

	async findDeletedUserById(rawId: number | string): Promise<User | null> {
		const id = Number(rawId);
		if (!isNumber(id)) {
			throw new ServiceException("BASE", "BAD_REQUEST", `not type int. ${rawId}`);
		}

		try {
			const queryBuilder = this.repo.createQueryBuilder("user");
			const deletedUser = await queryBuilder
				.select()
				.withDeleted()
				.where("user.id= :id", { id })
				.andWhere("user.deleted_date IS NOT NULL")
				.getOne();

			return deletedUser;
		} catch (error) {
			throw new ServiceException(
				"EXTERNAL_SERVICE_FAILED",
				"INTERNAL_SERVER_ERROR",
				`Can't find deleted User(${id})`,
				{ cause: error },
			);
		}
	}

	async isOwner(resourceId: number, userId: number): Promise<boolean> {
		const user = await this.findDeletedUserById(resourceId);
		if (!user) {
			throw new ServiceException(
				"ENTITY_NOT_FOUND",
				"BAD_REQUEST",
				`can't find resource ${resourceId}`,
			);
		}
		return user.id === userId;
	}
}
