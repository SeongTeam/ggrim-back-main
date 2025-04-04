import { Crud, CrudController, Override } from '@dataui/crud';
import {
  Body,
  Controller,
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Param,
  Put,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { isEmail } from 'class-validator';
import { QueryRunner } from 'typeorm';
import { ServiceException } from '../_common/filter/exception/service/service-exception';
import { AuthService } from '../auth/auth.service';
import { TokenAuthGuard } from '../auth/guard/token-auth.guard';
import { DBQueryRunner } from '../db/query-runner/decorator/query-runner.decorator';
import { QueryRunnerInterceptor } from '../db/query-runner/query-runner.interceptor';
import { CreateUserDTO } from './dto/create-user.dto';
import { ReplacePassWordDTO } from './dto/replace-pw.dto';
import { ReplaceUsernameDTO } from './dto/replace-username.dto';
import { User } from './entity/user.entity';
import { UserService } from './user.service';

@Crud({
  model: {
    type: User,
  },
  routes: {
    only: ['getOneBase', 'createOneBase', 'deleteOneBase', 'recoverOneBase'],
  },
  params: {
    id: {
      field: 'id',
      type: 'uuid',
      primary: true,
    },
  },
  query: {
    allow: ['email', 'username', 'oauth_provider_id'],
    softDelete: true,
  },
  dto: {
    create: CreateUserDTO,
  },
})
@Controller('user')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class UserController implements CrudController<User> {
  constructor(
    public service: UserService,
    @Inject(forwardRef(() => AuthService)) private readonly authService: AuthService,
  ) {}

  // TODO: UserController 기능 추가
  // - [x] 사용자 생성시, Authentication 로직 추가
  //  -> 이메일 인증 등을 사용하여 인증된 사용자 확인하기
  // - [x] 사용자 생성시, 비밀번호 암호화 기능 추가
  // - [x] 비밀번호 변경, 유저이름 변경 등에 사용자 권한 확인 로직 추가
  // ! 주의: <경고할 사항>
  // ? 질문: <의문점 또는 개선 방향>
  // * 참고: <관련 정보나 링크>

  @Override(`createOneBase`)
  @UseInterceptors(QueryRunnerInterceptor)
  async signUp(@DBQueryRunner() qr: QueryRunner, @Body() dto: CreateUserDTO) {
    const { email, username } = dto;
    const sameUsers = await this.service.find({ where: [{ email }, { username }] });

    sameUsers.forEach((user) => {
      if (user.email == email) {
        throw new HttpException(`${email} are already exist`, HttpStatus.BAD_REQUEST);
      }

      if (user.username == username) {
        throw new HttpException(`${username} are already exist`, HttpStatus.BAD_REQUEST);
      }
    });

    const encryptedPW = await this.authService.hash(dto.password);
    const encryptedDTO: CreateUserDTO = { ...dto, password: encryptedPW };
    return await this.service.createUser(qr, encryptedDTO);
  }

  @Put(':email/password')
  @UseInterceptors(QueryRunnerInterceptor)
  @UseGuards(TokenAuthGuard)
  async replacePassword(
    @DBQueryRunner() qr: QueryRunner,
    @Param('email') email: string,
    @Body() dto: ReplacePassWordDTO,
  ) {
    if (!isEmail(email)) {
      throw new HttpException(`${email} is not valid`, HttpStatus.BAD_REQUEST);
    }
    const user = await this.service.findUserByEmail(email);
    if (!user) {
      throw new HttpException(`${user} is not exist`, HttpStatus.BAD_REQUEST);
    }
    const encryptedPW = await this.authService.hash(dto.password);
    await this.service.updatePassword(qr, user.id, encryptedPW);
    return;
  }

  @Put(':email/username')
  @UseInterceptors(QueryRunnerInterceptor)
  @UseGuards(TokenAuthGuard)
  async replaceUsername(
    @DBQueryRunner() qr: QueryRunner,
    @Param('email') email: string,
    @Body() dto: ReplaceUsernameDTO,
  ) {
    if (!isEmail(email)) {
      throw new HttpException(`${email} is not valid`, HttpStatus.BAD_REQUEST);
    }
    const { username } = dto;
    const users = await this.service.find({ where: [{ email }, { username }] });
    let targetId: string | undefined;

    users.forEach((user) => {
      if (user.username === username) {
        throw new HttpException(`${username} is already exist`, HttpStatus.BAD_REQUEST);
      }

      if (user.email === email) {
        if (!targetId) {
          targetId = user.id;
        } else if (targetId !== user.id) {
          throw new ServiceException(
            'SERVICE_RUN_ERROR',
            'INTERNAL_SERVER_ERROR',
            `User Email mush be unique. ${user.email}`,
          );
        }
      }
    });

    if (!targetId) {
      throw new HttpException(`${email} is not exist`, HttpStatus.BAD_REQUEST);
    }

    await this.service.updateUsername(qr, targetId, dto.username);
    return;
  }
}
