import { TypeOrmCrudService } from '@dataui/crud-typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryRunner, Repository } from 'typeorm';
import { ServiceException } from '../_common/filter/exception/service/service-exception';
import { createTransactionQueryBuilder } from '../db/query-runner/query-Runner.lib';
import { CreateUserDTO } from './dto/create-user.dto';
import { User, UserRole } from './entity/user.entity';

@Injectable()
export class UserService extends TypeOrmCrudService<User> {
  constructor(@InjectRepository(User) repo: Repository<User>) {
    super(repo);
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return await this.findOne({ where: { email } });
  }

  async updatePassword(queryRunner: QueryRunner, id: string, newPassword: string): Promise<void> {
    try {
      const result = await createTransactionQueryBuilder(queryRunner, User)
        .update()
        .set({
          password: newPassword,
        })
        .where('id = :id', { id })
        .execute();
      return;
    } catch (error) {
      throw new ServiceException(
        'EXTERNAL_SERVICE_FAILED',
        'INTERNAL_SERVER_ERROR',
        `Can't update password`,
        { cause: error },
      );
    }
  }

  async updateUsername(
    queryRunner: QueryRunner,
    id: string,
    newUniqueUsername: string,
  ): Promise<void> {
    try {
      const result = await createTransactionQueryBuilder(queryRunner, User)
        .update()
        .set({
          username: newUniqueUsername,
        })
        .where('id = :id', { id })
        .execute();
    } catch (error) {
      throw new ServiceException(
        'EXTERNAL_SERVICE_FAILED',
        'INTERNAL_SERVER_ERROR',
        `Can't update username`,
        { cause: error },
      );
    }
  }

  async updateRole(queryRunner: QueryRunner, id: string, role: UserRole): Promise<void> {
    try {
      const result = await createTransactionQueryBuilder(queryRunner, User)
        .update()
        .set({
          role,
        })
        .where('id = :id', { id })
        .execute();
    } catch (error) {
      throw new ServiceException(
        'EXTERNAL_SERVICE_FAILED',
        'INTERNAL_SERVER_ERROR',
        `Can't update username`,
        { cause: error },
      );
    }
  }
  //TODO typeorm 로직 개선
  // [ ] : returning() 메소드를 사용하여 생성 후 반환되는 열들의 값 명시하기
  //  -> insertResult.generateMaps[0]은 직접삽입한 값은 포함되지 않기 때문에 returning() 적용필요.

  async createUser(queryRunner: QueryRunner, dto: CreateUserDTO): Promise<User> {
    try {
      const result = await createTransactionQueryBuilder(queryRunner, User)
        .insert()
        .into(User)
        .values([
          {
            ...dto,
          },
        ])
        .execute();
      return result.generatedMaps[0] as User;
    } catch (error) {
      throw new ServiceException(
        'EXTERNAL_SERVICE_FAILED',
        'INTERNAL_SERVER_ERROR',
        `Can't create User`,
        { cause: error },
      );
    }
  }

  async softDeleteUser(queryRunner: QueryRunner, id: string): Promise<void> {
    try {
      const result = await createTransactionQueryBuilder(queryRunner, User)
        .softDelete()
        .where('id = :id', { id })
        .execute();
      return;
    } catch (error) {
      throw new ServiceException(
        'EXTERNAL_SERVICE_FAILED',
        'INTERNAL_SERVER_ERROR',
        `Can't delete User`,
        { cause: error },
      );
    }
  }

  async recoverUser(queryRunner: QueryRunner, id: string): Promise<void> {
    try {
      const result = await createTransactionQueryBuilder(queryRunner, User)
        .restore()
        .where('id = :id', { id })
        .execute();

      return;
    } catch (error) {
      throw new ServiceException(
        'EXTERNAL_SERVICE_FAILED',
        'INTERNAL_SERVER_ERROR',
        `Can't restore User`,
        { cause: error },
      );
    }
  }

  async findDeletedUserByEmail(email: string): Promise<User | null> {
    try {
      const deletedUser = await this.repo.findOne({ where: { email }, withDeleted: true });
      return deletedUser;
    } catch (error) {
      throw new ServiceException(
        'EXTERNAL_SERVICE_FAILED',
        'INTERNAL_SERVER_ERROR',
        `Can't restore User`,
        { cause: error },
      );
    }
  }
}
