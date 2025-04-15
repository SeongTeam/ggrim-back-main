import { Crud, CrudController, Override } from '@dataui/crud';
import {
  Body,
  Controller,
  Delete,
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Put,
  Request,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { isEmail, isEmpty, isNotEmpty } from 'class-validator';
import { QueryRunner } from 'typeorm';
import { ServiceException } from '../_common/filter/exception/service/service-exception';
import { AuthService } from '../auth/auth.service';
import { CheckOwner } from '../auth/decorator/owner';
import { PurposeOneTimeToken } from '../auth/decorator/purpose-one-time-token';
import { SecurityTokenGuardOptions } from '../auth/decorator/security-token.guard.options';
import { SecurityTokenGuard } from '../auth/guard/authentication/security-token.guard';
import { TempUserGuard } from '../auth/guard/authentication/temp-user.guard';
import { TokenAuthGuard } from '../auth/guard/authentication/token-auth.guard';
import { OwnerGuard } from '../auth/guard/authorization/owner.guard';
import { RolesGuard } from '../auth/guard/authorization/roles.guard';
import {
  AuthUserPayload,
  ENUM_AUTH_CONTEXT_KEY,
  SecurityTokenPayload,
  TempUserPayload,
} from '../auth/guard/type/request-payload';
import { DBQueryRunner } from '../db/query-runner/decorator/query-runner.decorator';
import { QueryRunnerInterceptor } from '../db/query-runner/query-runner.interceptor';
import { Roles } from './decorator/role';
import { CreateUserDTO } from './dto/create-user.dto';
import { ReplacePassWordDTO } from './dto/replace-pw.dto';
import { ReplaceRoleDTO } from './dto/replace-role.dto';
import { ReplaceUsernameDTO } from './dto/replace-username.dto';
import { User } from './entity/user.entity';
import { UserService } from './user.service';

@Crud({
  model: {
    type: User,
  },
  routes: {
    only: ['getOneBase', 'createOneBase'],
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
  // - [x] 사용자 삭제시, 본인 인증 및 권한 확인 로직 추가
  // ! 주의: <경고할 사항>
  // ? 질문: <의문점 또는 개선 방향>
  // * 참고: <관련 정보나 링크>

  @Override(`createOneBase`)
  @UseInterceptors(QueryRunnerInterceptor)
  @PurposeOneTimeToken('email-verification')
  @UseGuards(TempUserGuard)
  async signUp(
    @DBQueryRunner() qr: QueryRunner,
    @Request() request: any,
    @Body() dto: CreateUserDTO,
  ) {
    const { email, username } = dto;
    const sameUsers = await this.service.find({ where: [{ email }, { username }] });
    const tempUserPayload: TempUserPayload = request[ENUM_AUTH_CONTEXT_KEY.TEMP_USER];
    const { oneTimeTokenID, email: TokenEmail } = tempUserPayload;

    if (email !== TokenEmail) {
      throw new ServiceException(
        'BASE',
        'FORBIDDEN',
        `can't create user by using other's email.
        TokenEmail is different to bodyEmail`,
      );
    }

    sameUsers.forEach((user) => {
      if (user.email == email) {
        throw new HttpException(`${email} are already exist`, HttpStatus.BAD_REQUEST);
      }

      if (user.username == username) {
        throw new HttpException(`${username} are already exist`, HttpStatus.BAD_REQUEST);
      }
    });

    this.authService.markOneTimeJWT(qr, oneTimeTokenID);

    const encryptedPW = await this.authService.hash(dto.password);
    const encryptedDTO: CreateUserDTO = { ...dto, password: encryptedPW };
    return await this.service.createUser(qr, encryptedDTO);
  }

  // TODO: 사용자 정보 변경 로직 개선하기
  // - [x] 사용자 본인만 개인 정보변경할 수 있도록 수정하기
  // - [x] User Entity 필드 1개 수정할 수 있는 서비스 로직 추가하여 재사용성 높이기
  // - [x] 메일 인증 로직 추가하기
  // - [x] Role 필드 기반 API 접근 권한 로직 추가하기
  // - [ ] 사용자 암호 초기화 로직 추가하기
  //  -> 현재는 암호 소실 사용자에게 PW 업데이트 권한을 임시로 제공하므로, 당장 필요치 않음.
  // ! 주의: <경고할 사항>
  // ? 질문: <의문점 또는 개선 방향>
  // * 참고: <관련 정보나 링크>

  @Put(':email/password')
  @CheckOwner({
    serviceClass: UserService,
    idParam: 'email',
    serviceMethod: 'findUserByEmail',
    ownerField: 'id',
  })
  @PurposeOneTimeToken('update-password')
  @UseGuards(SecurityTokenGuard, OwnerGuard)
  @UseInterceptors(QueryRunnerInterceptor)
  async replacePassword(
    @DBQueryRunner() qr: QueryRunner,
    @Request() request: any,
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
    await this.service.updateUser(qr, user.id, { password: encryptedPW });

    const SecurityTokenGuardResult: SecurityTokenPayload =
      request[ENUM_AUTH_CONTEXT_KEY.SECURITY_TOKEN];
    await this.authService.markOneTimeJWT(qr, SecurityTokenGuardResult.oneTimeTokenID);

    return;
  }

  @Put(':email/username')
  @UseInterceptors(QueryRunnerInterceptor)
  @CheckOwner({
    serviceClass: UserService,
    idParam: 'email',
    serviceMethod: 'findUserByEmail',
    ownerField: 'id',
  })
  @UseGuards(TokenAuthGuard, OwnerGuard)
  async replaceUsername(
    @DBQueryRunner() qr: QueryRunner,
    @Request() request: any,
    @Param('email') email: string,
    @Body() dto: ReplaceUsernameDTO,
  ) {
    if (!isEmail(email)) {
      throw new HttpException(`${email} is not valid`, HttpStatus.BAD_REQUEST);
    }
    const { username } = dto;
    const authUserPayload: AuthUserPayload = request[ENUM_AUTH_CONTEXT_KEY.USER];
    const { user } = authUserPayload;
    const sameUserName = await this.service.findOne({ where: { username } });

    if (isNotEmpty(sameUserName)) {
      throw new ServiceException('BASE', 'FORBIDDEN', `${username} already exist`);
    }

    await this.service.updateUser(qr, user.id, dto);
    return;
  }

  @Put(':email/role')
  @UseInterceptors(QueryRunnerInterceptor)
  @Roles('admin')
  @UseGuards(TokenAuthGuard, RolesGuard)
  async replaceRole(
    @DBQueryRunner() qr: QueryRunner,
    @Param('email') email: string,
    @Body() dto: ReplaceRoleDTO,
  ) {
    if (!isEmail(email)) {
      throw new HttpException(`${email} is not valid`, HttpStatus.BAD_REQUEST);
    }
    const user = await this.service.findOne({ where: { email } });
    if (!user) {
      throw new HttpException(`${email} is not exist`, HttpStatus.BAD_REQUEST);
    }

    await this.service.updateUser(qr, user.id, dto);
  }

  @Delete(':email')
  @CheckOwner({
    serviceClass: UserService,
    idParam: 'email',
    serviceMethod: 'findUserByEmail',
    ownerField: 'id',
  })
  @PurposeOneTimeToken('delete-account')
  @UseGuards(SecurityTokenGuard, OwnerGuard)
  @UseInterceptors(QueryRunnerInterceptor)
  async deleteUser(
    @DBQueryRunner() qr: QueryRunner,
    @Request() request: any,
    @Param('email') email: string,
  ) {
    if (!isEmail(email)) {
      throw new HttpException(`${email} is not valid`, HttpStatus.BAD_REQUEST);
    }
    const user = await this.service.findOne({ where: { email } });
    if (!user) {
      throw new HttpException(`${email} is not exist`, HttpStatus.BAD_REQUEST);
    }

    await this.service.softDeleteUser(qr, user.id);

    const SecurityTokenGuardResult: SecurityTokenPayload =
      request[ENUM_AUTH_CONTEXT_KEY.SECURITY_TOKEN];
    await this.authService.markOneTimeJWT(qr, SecurityTokenGuardResult.oneTimeTokenID);
  }

  @Patch('recover/:email')
  @CheckOwner({
    serviceClass: UserService,
    idParam: 'email',
    serviceMethod: 'findDeletedUserByEmail',
    ownerField: 'id',
  })
  @PurposeOneTimeToken('recover-account')
  @SecurityTokenGuardOptions({ withDeleted: true })
  @UseGuards(SecurityTokenGuard, OwnerGuard)
  @UseInterceptors(QueryRunnerInterceptor)
  async recoverUser(
    @DBQueryRunner() qr: QueryRunner,
    @Request() request: any,
    @Param('email') email: string,
  ) {
    const deletedUser = await this.service.findOne({ where: { email }, withDeleted: true });
    if (!deletedUser) {
      throw new HttpException(`${email} is not exist`, HttpStatus.BAD_REQUEST);
    }
    if (isEmpty(deletedUser.deleted_date)) {
      throw new ServiceException(
        'ENTITY_RESTORE_FAILED',
        'FORBIDDEN',
        `can't recover non-deleted user`,
      );
    }

    await this.service.recoverUser(qr, deletedUser.id);

    const securityToken: SecurityTokenPayload = request[ENUM_AUTH_CONTEXT_KEY.SECURITY_TOKEN];
    await this.authService.markOneTimeJWT(qr, securityToken.oneTimeTokenID);
  }
}
