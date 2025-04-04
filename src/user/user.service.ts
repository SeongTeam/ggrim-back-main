import { TypeOrmCrudService } from '@dataui/crud-typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryRunner, Repository } from 'typeorm';
import { ServiceException } from '../_common/filter/exception/service/service-exception';
import { createTransactionQueryBuilder } from '../db/query-runner/query-Runner.lib';
import { CreateUserDTO } from './dto/create-user.dto';
import { User } from './entity/user.entity';

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
}
