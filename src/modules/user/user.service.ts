import { TypeOrmCrudService } from "@dataui/crud-typeorm";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DeepPartial, QueryRunner, Repository } from "typeorm";
import { ServiceException } from "../_common/filter/exception/service/serviceException";
import { createTransactionQueryBuilder } from "../db/query-runner/queryRunner.lib";
import { User } from "./entity/user.entity";

@Injectable()
export class UserService extends TypeOrmCrudService<User> {
	constructor(@InjectRepository(User) repo: Repository<User>) {
		super(repo);
	}

	async findUserById(id: string): Promise<User | null> {
		return await this.findOne({ where: { id } });
	}
	async findUserByEmail(email: string) {
		return await this.findOne({ where: { email } });
	}

	async updateUser(queryRunner: QueryRunner, id: string, dto: DeepPartial<User>): Promise<void> {
		try {
			await createTransactionQueryBuilder(queryRunner, User)
				.update()
				.set({
					...dto,
				})
				.where("id = :id", { id })
				.execute();
			return;
		} catch (error) {
			throw new ServiceException(
				"EXTERNAL_SERVICE_FAILED",
				"INTERNAL_SERVER_ERROR",
				`Can't update user.`,
				{ cause: error },
			);
		}
	}

	//TODO typeorm 로직 개선
	// [x] : returning() 메소드를 사용하여 생성 후 반환되는 열들의 값 명시하기
	//  -> insertResult.generateMaps[0]은 직접삽입한 값은 포함되지 않기 때문에 returning() 적용필요.

	async createUser(queryRunner: QueryRunner, dto: DeepPartial<User>): Promise<User> {
		try {
			const result = await createTransactionQueryBuilder(queryRunner, User)
				.insert()
				.into(User)
				.values([
					{
						...dto,
					},
				])
				.returning("*")
				.execute();
			return result.generatedMaps[0] as User;
		} catch (error) {
			throw new ServiceException(
				"EXTERNAL_SERVICE_FAILED",
				"INTERNAL_SERVER_ERROR",
				`Can't create User`,
				{ cause: error },
			);
		}
	}

	async softDeleteUser(queryRunner: QueryRunner, id: string): Promise<void> {
		try {
			await createTransactionQueryBuilder(queryRunner, User)
				.softDelete()
				.where("id = :id", { id })
				.execute();
			return;
		} catch (error) {
			throw new ServiceException(
				"EXTERNAL_SERVICE_FAILED",
				"INTERNAL_SERVER_ERROR",
				`Can't delete User`,
				{ cause: error },
			);
		}
	}

	async recoverUser(queryRunner: QueryRunner, id: string): Promise<void> {
		try {
			await createTransactionQueryBuilder(queryRunner, User)
				.restore()
				.where("id = :id", { id })
				.execute();

			return;
		} catch (error) {
			throw new ServiceException(
				"EXTERNAL_SERVICE_FAILED",
				"INTERNAL_SERVER_ERROR",
				`Can't restore User`,
				{ cause: error },
			);
		}
	}

	async findDeletedUserById(id: string): Promise<User | null> {
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
				`Can't restore User`,
				{ cause: error },
			);
		}
	}
}
