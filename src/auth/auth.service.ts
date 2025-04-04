import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import {
  ENV_HASH_ROUNDS_KEY,
  ENV_JWT_SECRET_KEY,
  NODE_ENV,
} from 'src/_common/const/env-keys.const';
import { ServiceException } from '../_common/filter/exception/service/service-exception';
import { UserRole } from '../user/entity/user.entity';

export type TokenType = 'REFRESH' | 'ACCESS';

export const ENUM_JWT_ERROR_NAME = {
  TOKEN_EXPIRED: 'TokenExpiredError',
  TOKEN_INVALID: 'JsonWebTokenError',
  NOT_BEFORE: 'NotBeforeError',
};

// ref : https://github.com/auth0/node-jsonwebtoken?tab=readme-ov-file#jwtsignpayload-secretorprivatekey-options-callback
export interface JWTDecode extends JWTPayload {
  iat: Date;
  exp: Date;
  // nbf?: Date;
  // aud? : object;
  // iss? : object;
}
export interface JWTPayload {
  email: string;
  username: string;
  role: UserRole;
  type: TokenType;
}

export type AUTHORIZATION_TYPE = 'Bearer' | 'Basic';

@Injectable()
export class AuthService {
  private ACCESS_TOKEN_TTL_SECOND = 600;
  private REFRESH_TOKEN_TTL_SECOND = 3600;

  constructor(
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(ConfigService) private readonly configService: ConfigService,
  ) {
    const envKeys = [ENV_HASH_ROUNDS_KEY, ENV_JWT_SECRET_KEY];
    const envFile = this.configService.get(NODE_ENV)
      ? `.env.` + this.configService.get(NODE_ENV)
      : `.env`;
    for (const key of envKeys) {
      if (!this.configService.get(key)) {
        throw new Error(`${key} is not exist on ${envFile}`);
      }
    }
  }

  extractAuthorizationField(header: string, type: AUTHORIZATION_TYPE): string {
    const splitHeader = header.split(' ');

    if (splitHeader.length !== 2 || splitHeader[0] !== type) {
      throw new UnauthorizedException('invalid Header field');
    }

    return splitHeader[1];
  }

  verifyToken(token: string): JWTDecode {
    try {
      const decoded = this.jwtService.verify(token, {
        secret: this.configService.get<string>(ENV_JWT_SECRET_KEY),
      });
      return decoded as JWTDecode;
    } catch (e: unknown) {
      if (e instanceof Error && e.name) {
        throw new HttpException(e.name, HttpStatus['BAD_REQUEST'], { cause: e });
      }
      throw new ServiceException(
        'EXTERNAL_SERVICE_FAILED',
        'INTERNAL_SERVER_ERROR',
        `can't verify token`,
        { cause: e },
      );
    }
  }

  refreshToken(token: string): string {
    const decoded: JWTDecode = this.verifyToken(token);
    // const payload: JWTPayload = {
    //   email: decoded.email,
    //   username: decoded.username,
    //   role: decoded.role,
    //   type: decoded.type,
    // };
    const newToken: string = this.signToken(decoded);

    return newToken;
  }

  signToken(payload: JWTPayload): string {
    const newToken: string = this.jwtService.sign(payload, {
      secret: this.configService.get<string>(ENV_JWT_SECRET_KEY),
      // seconds
      expiresIn:
        payload.type == 'REFRESH' ? this.REFRESH_TOKEN_TTL_SECOND : this.ACCESS_TOKEN_TTL_SECOND,
    });

    return newToken;
  }

  async isHashMatched(target: string, hash: string) {
    const passOk = await bcrypt.compare(target, hash);

    return passOk;
  }

  async hash(src: string): Promise<string> {
    const round = parseInt(this.configService.get<string>(ENV_HASH_ROUNDS_KEY, '10'));
    const salt = await bcrypt.genSalt(round);
    const hash = await bcrypt.hash(src, salt);

    return hash;
  }
}
