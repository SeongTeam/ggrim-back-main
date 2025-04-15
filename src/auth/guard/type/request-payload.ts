import { User } from '../../../user/entity/user.entity';
import { JWTDecode } from '../../auth.service';

export const ENUM_AUTH_CONTEXT_KEY = {
  USER: 'AuthUserPayload',
  SECURITY_TOKEN: 'SecurityTokenPayload',
  ACCESS_TOKEN: 'AccessTokenPayload',
  TEMP_USER: 'TempUser',
};

export interface AuthUserPayload {
  user: User;
}

export interface OneTimeTokenPayload {
  oneTimeTokenID: string;
  oneTimeToken: string;
}

export type SecurityTokenPayload = OneTimeTokenPayload;

export interface AccessTokenPayload {
  userId: string;
  decodedToken: JWTDecode;
}

export interface TempUserPayload extends OneTimeTokenPayload {
  email: string;
}
